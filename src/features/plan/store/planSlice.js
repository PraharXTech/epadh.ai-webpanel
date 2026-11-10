import { createSlice } from '@reduxjs/toolkit';
import { logout } from '@/features/auth/store/authSlice';

// Today's plan, kept for the day so the tasks do not shuffle every time the screen
// opens. `version` is what "Regenerate" changes; `generatedBy` says which planner made it.
const initialState = {
  day: null, // "2026-10-01"
  tasks: [],
  generatedBy: 'rules', // rules (Free) | ai (Pro)
  version: 0,
};

const planSlice = createSlice({
  name: 'plan',
  initialState,
  reducers: {
    setPlan: (state, action) => {
      const { day, tasks, generatedBy, version } = action.payload;
      state.day = day;
      state.tasks = tasks;
      state.generatedBy = generatedBy;
      state.version = version;
    },
    regeneratePlan: state => {
      state.version += 1;
      state.day = null; // the screen rebuilds it with the new version
    },
  },
  extraReducers: builder => {
    builder.addCase(logout, () => initialState);
  },
});

export const { setPlan, regeneratePlan } = planSlice.actions;

export default planSlice.reducer;
