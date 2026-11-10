import { createSelector } from '@reduxjs/toolkit';
import { summarizeDays } from '@/features/study/utils/streak';
import { selectPracticeHistory } from './practiceSelectors';
import { selectStudySessions } from './studySelectors';

// Per-day totals (seconds studied, practice sets finished) from what the student did. The
// streak itself is worked out from this together with today's date (see useStreak), because a
// selector that depends on the date would never recompute at midnight.
export const selectDayTotals = createSelector(
  [selectStudySessions, state => state.study.active, selectPracticeHistory],
  (sessions, active, practiceHistory) =>
    summarizeDays({ sessions, active, practiceHistory }),
);
