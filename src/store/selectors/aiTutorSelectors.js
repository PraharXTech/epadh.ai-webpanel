import { createSelector } from '@reduxjs/toolkit';
import { dayKey } from '@/utils/date';
import { selectEntitlements } from './userSelectors';

export const selectActiveConversationId = state => state.aiTutor.activeId;

export const selectActiveConversation = state =>
  state.aiTutor.conversations[state.aiTutor.activeId] ?? null;

// WEB CHANGE: memoized. It used to build a new array on every call, so every store update
// re-rendered the chat page (React Redux warns about it).
export const selectConversationList = createSelector(
  [state => state.aiTutor.order, state => state.aiTutor.conversations],
  (order, conversations) => order.map(id => conversations[id]).filter(Boolean),
);

export const selectSendStatus = state => state.aiTutor.sendStatus;
export const selectSendError = state => state.aiTutor.error;
export const selectTtsEnabled = state => state.aiTutor.ttsEnabled;

// Questions asked today (resets by itself when the day changes).
export const selectAiUsedToday = state =>
  state.aiTutor.daily.date === dayKey() ? state.aiTutor.daily.count : 0;

// Free daily AI question limit, or null when there is none (Pro's backend-configured limit).
export const selectAiDailyLimit = state =>
  selectEntitlements(state)?.ai?.dailyLimit ?? null;

// null means unlimited.
export const selectAiRemainingToday = state => {
  const limit = selectAiDailyLimit(state);
  return limit == null ? null : Math.max(0, limit - selectAiUsedToday(state));
};
