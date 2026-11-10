import { createSelector } from '@reduxjs/toolkit';

export const selectMockSession = state => state.mock.session;
export const selectMockResult = state => state.mock.result;
export const selectMockStartStatus = state => state.mock.startStatus;
export const selectMockSubmitStatus = state => state.mock.submitStatus;
export const selectMockError = state => state.mock.error;
export const selectMockSavedIds = state =>
  state.mock.savedResults.map(r => r.id);
export const selectMockSync = state => state.mock.sync;
export const selectMockHistory = state => state.mock.history;

// The most recent finished attempt per test (history is newest first), for the
// "last attempt" progress ring on the Mock Tests list.
// Web change: memoized. It builds a Map, and a selector that returns a new object on every call
// makes React Redux warn and re-render the page on every store update.
export const selectLastMockAttemptByTest = createSelector(
  [selectMockHistory],
  history => {
    const map = new Map();
    history.forEach(h => {
      if (!map.has(h.testId)) {
        map.set(h.testId, h);
      }
    });
    return map;
  },
);

export const selectMockTotalAttempted = state => state.mock.history.length;
