import { createSelector } from '@reduxjs/toolkit';
import {
  aggregateStatus,
  firstError,
  mergeMaterial,
} from '@/features/exams/utils/examContent';
import { matchesType } from '@/features/material/utils/format';
import { selectSelectedExamIds } from './userSelectors';

export const selectMaterialState = state => state.material;
const selectByExam = state => state.material.byExam;

// Loading state of the exams the student prepares for, as one status / error.
export const selectMaterialStatus = createSelector(
  [state => state.material.statuses, selectSelectedExamIds],
  aggregateStatus,
);
export const selectMaterialError = createSelector(
  [state => state.material.errors, selectSelectedExamIds],
  firstError,
);
// Exams whose material is in the store (kept from the last run, or just loaded).
export const selectLoadedMaterialExamIds = createSelector(
  [selectByExam],
  byExam => Object.keys(byExam),
);
export const selectMaterialFilters = state => state.material.filters;

// The exam the list is narrowed to; a choice that is no longer one of the student's
// exams counts as "all".
export const selectMaterialExamFilter = createSelector(
  [state => state.material.filters.examId, selectSelectedExamIds],
  (examId, examIds) => (examIds.includes(examId) ? examId : null),
);

// Subjects and items of all the student's exams in one list; anything shared by
// several exams appears once, tagged with the `examIds` it belongs to.
const selectMerged = createSelector(
  [selectByExam, selectSelectedExamIds],
  (byExam, examIds) =>
    mergeMaterial(
      examIds
        .filter(id => byExam[id])
        .map(id => ({ examId: id, ...byExam[id] })),
    ),
);
export const selectMaterialSubjects = createSelector(
  [selectMerged],
  merged => merged.subjects,
);
export const selectBookmarks = state => state.material.bookmarks;
export const selectDownloads = state => state.material.downloads;
export const selectMaterialFontSize = state => state.material.fontSize;

// Items with the student's own progress laid over the server's.
export const selectMaterialItems = createSelector(
  [state => selectMerged(state).items, state => state.material.progress],
  (items, progress) =>
    items.map(item => ({
      ...item,
      progress: progress[item.id] ?? item.progress,
    })),
);

export const selectMaterialItemById = (state, id) =>
  selectMaterialItems(state).find(item => item.id === id);

// Items after type / subject / search filters, grouped by subject.
// Subjects with nothing left after filtering are dropped.
export const selectMaterialSections = createSelector(
  [
    selectMaterialSubjects,
    selectMaterialItems,
    selectMaterialFilters,
    selectMaterialExamFilter,
  ],
  (subjects, allItems, { type, subjectId, query }, examId) => {
    const q = query.trim().toLowerCase();
    const items = examId
      ? allItems.filter(item => item.examIds.includes(examId))
      : allItems;
    return subjects
      .filter(subject => !subjectId || subject.id === subjectId)
      .map(subject => ({
        subject,
        items: items.filter(
          item =>
            item.subjectId === subject.id &&
            matchesType(item, type) &&
            (!q || item.title.toLowerCase().includes(q)),
        ),
      }))
      .filter(section => section.items.length > 0);
  },
);
