import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getErrorMessage } from '@/api/client';
import { logout } from '@/features/auth/store/authSlice';
import { fetchSyllabus } from '../services/syllabusService';

export const loadSyllabus = createAsyncThunk(
  'syllabus/load',
  async (examId, { rejectWithValue }) => {
    try {
      const data = await fetchSyllabus(examId);
      return { examId, data };
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

const initialState = {
  // One tree per exam the student has loaded (Subject -> chapters -> topics). What they
  // see is the union of the trees of the exams they currently prepare for.
  trees: {}, // { [examId]: subjects[] }
  statuses: {}, // { [examId]: 'loading' | 'succeeded' | 'failed' }
  errors: {}, // { [examId]: message }
  // What the student marked, kept apart from the trees so a refetch never wipes it.
  // (Once the backend exists it returns completion itself: PUT /topics/:id/complete.)
  completed: {}, // { [topicId]: true }
};

const syllabusSlice = createSlice({
  name: 'syllabus',
  initialState,
  reducers: {
    toggleTopicComplete: (state, action) => {
      const id = action.payload;
      if (state.completed[id]) {
        delete state.completed[id];
      } else {
        state.completed[id] = true;
      }
    },
  },
  extraReducers: builder => {
    builder
      .addCase(logout, () => initialState)
      .addCase(loadSyllabus.pending, (state, action) => {
        const examId = action.meta.arg;
        state.statuses[examId] = 'loading';
        delete state.errors[examId];
      })
      .addCase(loadSyllabus.fulfilled, (state, action) => {
        const { examId, data } = action.payload;
        state.statuses[examId] = 'succeeded';
        state.trees[examId] = data.subjects;
      })
      .addCase(loadSyllabus.rejected, (state, action) => {
        const examId = action.meta.arg;
        state.statuses[examId] = 'failed';
        state.errors[examId] = action.payload ?? action.error.message;
      });
  },
});

export const { toggleTopicComplete } = syllabusSlice.actions;

export default syllabusSlice.reducer;
