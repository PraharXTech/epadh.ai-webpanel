import { createSelector } from '@reduxjs/toolkit';
import { selectPracticeHistory } from './practiceSelectors';
import { selectMockHistory } from './mockSelectors';

// Correct/wrong counted across every finished practice test and mock attempt (both
// summaries carry `correct`/`wrong` in the same shape). `attempted` is correct+wrong
// on purpose — it excludes skipped/unattempted questions, same as the Home card's
// "Questions Attempted" is meant to read.
export const selectAttemptStats = createSelector(
  [selectPracticeHistory, selectMockHistory],
  (practiceHistory, mockHistory) => {
    const all = [...practiceHistory, ...mockHistory];
    const correct = all.reduce((sum, h) => sum + (h.correct ?? 0), 0);
    const wrong = all.reduce((sum, h) => sum + (h.wrong ?? 0), 0);
    return { attempted: correct + wrong, correct, wrong };
  },
);
