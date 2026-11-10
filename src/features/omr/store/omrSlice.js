import { createSlice } from '@reduxjs/toolkit';
import { logout } from '@/features/auth/store/authSlice';

const HISTORY_LIMIT = 50;

const initialState = {
  // One short summary per scanned sheet, newest first. The full graded sheet and the
  // leaderboard stay on the server and are fetched by `scanId` when a row is opened.
  history: [],
};

const omrSlice = createSlice({
  name: 'omr',
  initialState,
  reducers: {
    // Opening the same result twice must not list it twice, so a known scan only
    // refreshes its rank (which can move as more students are scored).
    recordScan: (state, action) => {
      const summary = action.payload;
      const existing = state.history.find(h => h.scanId === summary.scanId);
      if (existing) {
        existing.rank = summary.rank;
        existing.participants = summary.participants;
        return;
      }
      state.history = [summary, ...state.history].slice(0, HISTORY_LIMIT);
    },
    removeScan: (state, action) => {
      state.history = state.history.filter(h => h.scanId !== action.payload);
    },
  },
  extraReducers: builder => {
    builder.addCase(logout, () => initialState);
  },
});

export const { recordScan, removeScan } = omrSlice.actions;

export default omrSlice.reducer;
