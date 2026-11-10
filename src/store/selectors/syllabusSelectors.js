import { createSelector } from '@reduxjs/toolkit';
import {
  aggregateStatus,
  firstError,
  mergeSyllabus,
} from '@/features/exams/utils/examContent';
import { hasFeature } from '@/features/membership/utils/entitlements';
import { selectEntitlements, selectSelectedExamIds } from './userSelectors';

const selectTrees = state => state.syllabus.trees;

// Loading state of the exams the student prepares for, as one status / error.
export const selectSyllabusStatus = createSelector(
  [state => state.syllabus.statuses, selectSelectedExamIds],
  aggregateStatus,
);
export const selectSyllabusError = createSelector(
  [state => state.syllabus.errors, selectSelectedExamIds],
  firstError,
);
// Exams whose syllabus is in the store (kept from the last run, or just loaded).
export const selectLoadedSyllabusExamIds = createSelector(
  [selectTrees],
  trees => Object.keys(trees),
);
export const selectCompletedTopics = state => state.syllabus.completed;

const percentOf = (done, total) =>
  total ? Math.round((done / total) * 100) : 0;

// What the student needs on screen for a list of subjects: completion per topic,
// counts and % per chapter / subject, and lock state. Percentages are computed here
// while the data is mocked; with the backend they come from GET /progress instead.
const decorate = (subjects, completed, fullAccess) =>
  subjects.map(subject => {
    const chapters = subject.chapters.map(chapter => {
      const topics = chapter.topics.map(topic => ({
        ...topic,
        chapterId: chapter.id,
        subjectId: subject.id,
        completed: Boolean(completed[topic.id]),
        locked: Boolean(chapter.premium || topic.premium) && !fullAccess,
      }));
      const completedCount = topics.filter(t => t.completed).length;
      return {
        ...chapter,
        subjectId: subject.id,
        topics,
        topicCount: topics.length,
        completedCount,
        percent: percentOf(completedCount, topics.length),
        locked: Boolean(chapter.premium) && !fullAccess,
      };
    });
    const topicCount = chapters.reduce((n, c) => n + c.topicCount, 0);
    const completedCount = chapters.reduce((n, c) => n + c.completedCount, 0);

    const { chapters: _raw, ...rest } = subject;
    return {
      ...rest,
      chapters,
      chapterCount: chapters.length,
      topicCount,
      completedCount,
      percent: percentOf(completedCount, topicCount),
    };
  });

// The syllabus trees of the exams the student prepares for, in the order they chose them.
const selectSelectedEntries = createSelector(
  [selectTrees, selectSelectedExamIds],
  (trees, examIds) =>
    examIds
      .filter(examId => trees[examId])
      .map(examId => ({ examId, subjects: trees[examId] })),
);

// All of the student's exams in one tree: a subject, chapter or topic shared by several
// exams appears once, tagged with the `examIds` it belongs to.
export const selectSyllabusTree = createSelector(
  [selectSelectedEntries, selectCompletedTopics, selectEntitlements],
  (entries, completed, entitlements) =>
    decorate(
      mergeSyllabus(entries),
      completed,
      hasFeature(entitlements, 'fullSyllabus'),
    ),
);

// One decorated tree per selected exam: { [examId]: subjects[] }, for the exam filter.
export const selectSyllabusTreesByExam = createSelector(
  [selectSelectedEntries, selectCompletedTopics, selectEntitlements],
  (entries, completed, entitlements) => {
    const fullAccess = hasFeature(entitlements, 'fullSyllabus');
    return Object.fromEntries(
      entries.map(({ examId, subjects }) => [
        examId,
        decorate(mergeSyllabus([{ examId, subjects }]), completed, fullAccess),
      ]),
    );
  },
);

const progressOf = tree => {
  const total = tree.reduce((n, s) => n + s.topicCount, 0);
  const done = tree.reduce((n, s) => n + s.completedCount, 0);
  return {
    total,
    done,
    pending: total - done,
    percent: percentOf(done, total),
    subjectCount: tree.length,
  };
};

export const selectSyllabusProgress = createSelector(
  [selectSyllabusTree],
  progressOf,
);

// { [examId]: progress } so the screen can show one exam at a time.
export const selectSyllabusProgressByExam = createSelector(
  [selectSyllabusTreesByExam],
  trees =>
    Object.fromEntries(
      Object.entries(trees).map(([examId, tree]) => [examId, progressOf(tree)]),
    ),
);

// Lookup by id with its parents. Built once per tree (trees are memoised, so the same
// tree always gives the same index) and the selectors return the tree's own nodes, so a
// subscriber is not re-rendered by a fresh object every call.
const indexes = new WeakMap();
const NO_TREE = [];

const indexOf = tree => {
  let index = indexes.get(tree);
  if (!index) {
    const subjects = new Map();
    const chapters = new Map();
    const topics = new Map();
    tree.forEach(subject => {
      subjects.set(subject.id, subject);
      subject.chapters.forEach(chapter => {
        chapters.set(chapter.id, { chapter, subject });
        chapter.topics.forEach(topic =>
          topics.set(topic.id, { topic, chapter, subject }),
        );
      });
    });
    index = { subjects, chapters, topics };
    indexes.set(tree, index);
  }
  return index;
};

// Looks inside all the student's exams, or only `examId`'s tree when one is given (a
// subject shared by two exams can have different chapters in each).
const selectIndex = (state, examId) =>
  indexOf(
    examId
      ? selectSyllabusTreesByExam(state)[examId] ?? NO_TREE
      : selectSyllabusTree(state),
  );

export const selectSubjectById = (state, id, examId = null) =>
  selectIndex(state, examId).subjects.get(id) ?? null;

// -> { chapter, subject } or null
export const selectChapterById = (state, id, examId = null) =>
  selectIndex(state, examId).chapters.get(id) ?? null;

// -> { topic, chapter, subject } or null
export const selectTopicById = (state, id, examId = null) =>
  selectIndex(state, examId).topics.get(id) ?? null;
