import { createSelector } from '@reduxjs/toolkit';

export const selectProfile = state => state.user.profile;

// Every exam the student prepares for, in the order they chose them. A copy saved by an
// older version of the app only has the single `selectedExamId`, so fall back to it.
export const selectSelectedExamIds = createSelector(
  [state => state.user.selectedExamIds, state => state.user.selectedExamId],
  (ids, legacyId) => {
    if (ids?.length) {
      return ids;
    }
    return legacyId ? [legacyId] : [];
  },
);

// The first (primary) exam, for the few places that need exactly one: the navigator
// choosing between onboarding and the tabs, the AI tutor's default, ...
export const selectSelectedExamId = state =>
  selectSelectedExamIds(state)[0] ?? null;

export const selectEntitlements = state => state.user.entitlements;
export const selectExamStatus = state => state.user.examStatus;
export const selectProfileStatus = state => state.user.profileStatus;
export const selectDeleteStatus = state => state.user.deleteStatus;
export const selectUserError = state => state.user.error;
