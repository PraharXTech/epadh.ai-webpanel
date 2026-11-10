import { createSelector } from '@reduxjs/toolkit';
import { selectMaterialItems } from './materialSelectors';
import { selectSyllabusTree } from './syllabusSelectors';
import { selectSelectedExamIds } from './userSelectors';

export const selectLastActivity = state => state.activity.last;

const VERB = {
  topic: 'Topic',
  material: 'Study Material',
  practice: 'Practice',
};

// The last activity resolved against the current syllabus, or null when there is
// nothing sensible to continue (no activity, an exam the student dropped, topic gone
// or locked).
export const selectContinueItem = createSelector(
  [
    selectLastActivity,
    selectSyllabusTree,
    selectSelectedExamIds,
    selectMaterialItems,
  ],
  (last, tree, examIds, materialItems) => {
    if (!last || !examIds.includes(last.examId)) {
      return null;
    }
    for (const subject of tree) {
      for (const chapter of subject.chapters) {
        const topic = chapter.topics.find(t => t.id === last.topicId);
        if (topic) {
          if (topic.locked || chapter.locked) {
            return null;
          }
          // A saved file that no longer exists falls back to the topic page.
          const mode =
            last.mode === 'material' &&
            !materialItems.some(i => i.id === last.itemId)
              ? 'topic'
              : last.mode;
          return {
            id: `${last.type}-${topic.id}`,
            type: last.type,
            mode,
            itemId: last.itemId,
            topicId: topic.id,
            title: topic.name,
            breadcrumb: `${subject.name} → ${topic.name} → ${VERB[mode]}`,
            subtitle: `${subject.name} › ${chapter.name}`,
            typeLabel: VERB[mode],
            percent: chapter.percent,
            completedCount: chapter.completedCount,
            topicCount: chapter.topicCount,
            color: subject.color,
            iconBg: subject.bg,
            icon: last.type === 'practice' ? 'file-text' : 'book-open',
          };
        }
      }
    }
    return null;
  },
);
