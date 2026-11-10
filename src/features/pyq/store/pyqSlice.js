import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getErrorMessage } from '@/api/client';
import { logout } from '@/features/auth/store/authSlice';
import { fetchPyqPapers } from '../services/pyqService';

// The server serves every exam's papers in one list (each tagged with its exam); the
// app shows the ones of the exams the student prepares for (see pyqSelectors).
export const loadPyqPapers = createAsyncThunk(
  'pyq/load',
  async (_, { rejectWithValue }) => {
    try {
      const papers = await fetchPyqPapers();
      return { papers };
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

const initialState = {
  papers: [], // what the admin uploaded for every exam, as the server sent it
  status: 'idle', // idle | loading | succeeded | failed
  error: null,
  // What the student did, kept apart from `papers` so a refetch never wipes it.
  saved: {}, // { [paperId]: true } bookmarked papers
  viewed: {}, // { [paperId]: timestamp } last opened
};

const pyqSlice = createSlice({
  name: 'pyq',
  initialState,
  reducers: {
    toggleSavedPaper: (state, action) => {
      const id = action.payload;
      if (state.saved[id]) {
        delete state.saved[id];
      } else {
        state.saved[id] = true;
      }
    },
    markPaperViewed: (state, action) => {
      state.viewed[action.payload] = Date.now();
    },
  },
  extraReducers: builder => {
    builder
      .addCase(logout, () => initialState)
      .addCase(loadPyqPapers.pending, state => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loadPyqPapers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.papers = action.payload.papers;
      })
      .addCase(loadPyqPapers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? action.error.message;
      });
  },
});

export const { toggleSavedPaper, markPaperViewed } = pyqSlice.actions;

export default pyqSlice.reducer;
