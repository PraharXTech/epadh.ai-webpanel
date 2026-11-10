import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getErrorMessage } from '@/api/client';
import { logout } from '@/features/auth/store/authSlice';
import { fetchExams } from '../services/examService';

export const loadExams = createAsyncThunk(
  'exams/load',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchExams();
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

const initialState = {
  items: [],
  status: 'idle', // idle | loading | succeeded | failed
  error: null,
};

const examSlice = createSlice({
  name: 'exams',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(logout, () => initialState)
      .addCase(loadExams.pending, state => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loadExams.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(loadExams.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? action.error.message;
      });
  },
});

export default examSlice.reducer;
