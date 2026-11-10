import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getErrorMessage } from '@/api/client';
import { logout } from '@/features/auth/store/authSlice';
import { fetchMaterial } from '../services/materialService';

export const loadMaterial = createAsyncThunk(
  'material/load',
  async (examId, { rejectWithValue }) => {
    try {
      const data = await fetchMaterial(examId);
      return { examId, data };
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

const initialState = {
  // What each loaded exam serves. The student sees the union of the exams they
  // currently prepare for (see materialSelectors).
  byExam: {}, // { [examId]: { subjects, items } }
  statuses: {}, // { [examId]: 'loading' | 'succeeded' | 'failed' }
  errors: {}, // { [examId]: message }
  // What the student marked, kept apart from `items` so a refetch never wipes it.
  bookmarks: {}, // { [itemId]: true }
  downloads: {}, // { [itemId]: true }
  progress: {}, // { [itemId]: 0-100 } watched / read so far, from the viewer
  timeSpent: {}, // { [itemId]: seconds } spent in the viewer
  fontSize: 16, // reader text size for rich-text material
  filters: { type: 'all', subjectId: null, query: '', examId: null },
};

const materialSlice = createSlice({
  name: 'material',
  initialState,
  reducers: {
    setTypeFilter: (state, action) => {
      state.filters.type = action.payload;
    },
    setSubjectFilter: (state, action) => {
      state.filters.subjectId = action.payload;
    },
    // One of the student's exams, or null for all of them. Clears a subject filter,
    // which may not exist in the exam just picked.
    setExamFilter: (state, action) => {
      state.filters.examId = action.payload;
      state.filters.subjectId = null;
    },
    setQuery: (state, action) => {
      state.filters.query = action.payload;
    },
    toggleBookmark: (state, action) => {
      const id = action.payload;
      if (state.bookmarks[id]) {
        delete state.bookmarks[id];
      } else {
        state.bookmarks[id] = true;
      }
    },
    setProgress: (state, action) => {
      const { id, percent } = action.payload;
      state.progress[id] = Math.max(0, Math.min(100, Math.round(percent)));
    },
    addTimeSpent: (state, action) => {
      const { id, seconds } = action.payload;
      state.timeSpent[id] = (state.timeSpent[id] ?? 0) + Math.round(seconds);
    },
    setFontSize: (state, action) => {
      state.fontSize = Math.max(12, Math.min(28, action.payload));
    },
    // Marks it saved offline. The real file download comes with the viewer.
    markDownloaded: (state, action) => {
      state.downloads[action.payload] = true;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(logout, () => initialState)
      .addCase(loadMaterial.pending, (state, action) => {
        const examId = action.meta.arg;
        state.statuses[examId] = 'loading';
        delete state.errors[examId];
      })
      .addCase(loadMaterial.fulfilled, (state, action) => {
        const { examId, data } = action.payload;
        state.statuses[examId] = 'succeeded';
        state.byExam[examId] = { subjects: data.subjects, items: data.items };
      })
      .addCase(loadMaterial.rejected, (state, action) => {
        const examId = action.meta.arg;
        state.statuses[examId] = 'failed';
        state.errors[examId] = action.payload ?? action.error.message;
      });
  },
});

export const {
  setTypeFilter,
  setSubjectFilter,
  setExamFilter,
  setQuery,
  toggleBookmark,
  markDownloaded,
  setProgress,
  addTimeSpent,
  setFontSize,
} = materialSlice.actions;

export default materialSlice.reducer;
