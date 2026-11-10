import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { logout } from '@/features/auth/store/authSlice';
import { fetchHomeData } from '../services/homeService';

// `silent: true` refreshes in the background: no pull-to-refresh spinner, used when
// saved data is already on screen (app start, coming back to Home).
export const loadHome = createAsyncThunk('home/load', () => fetchHomeData());

const initialState = {
  data: null,
  updatedAt: null, // when `data` was last fetched (ms)
  status: 'idle', // idle | loading | refreshing | succeeded | failed
  error: null,
};

const homeSlice = createSlice({
  name: 'home',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(logout, () => initialState)
      .addCase(loadHome.pending, (state, action) => {
        state.status = action.meta.arg?.silent ? 'refreshing' : 'loading';
        state.error = null;
      })
      .addCase(loadHome.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data = action.payload;
        state.updatedAt = Date.now();
      })
      .addCase(loadHome.rejected, (state, action) => {
        // Saved data (if any) stays; the screen shows a banner over it.
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export default homeSlice.reducer;
