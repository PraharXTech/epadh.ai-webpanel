import { hasFeature } from '@/features/membership/utils/entitlements';
import { dayKey } from '@/features/practice/utils/scoring';
import { selectEntitlements } from './userSelectors';

export const selectPracticeSession = state => state.practice.session;
export const selectPracticeResult = state => state.practice.result;
export const selectTotalAttempted = state => state.practice.totalAttempted;
export const selectPracticeHistory = state => state.practice.history;
export const selectPracticeStartStatus = state => state.practice.startStatus;
export const selectPracticeError = state => state.practice.error;
export const selectQuestionBookmarks = state => state.practice.bookmarks;
export const selectPracticeSavedIds = state =>
  state.practice.savedResults.map(r => r.id);
export const selectReportedQuestions = state => state.practice.reported;

// Questions attempted today (resets by itself when the day changes).
export const selectMcqUsedToday = state =>
  state.practice.daily.date === dayKey() ? state.practice.daily.count : 0;

// Free daily question limit, or null when the student has no limit (Pro / extended practice).
export const selectMcqDailyLimit = state => {
  const entitlements = selectEntitlements(state);
  if (hasFeature(entitlements, 'extendedPractice')) {
    return null;
  }
  return entitlements?.mcq?.dailyLimit ?? null;
};
