import { createSlice } from '@reduxjs/toolkit';
import { logout } from '@/features/auth/store/authSlice';

// Student preferences. Text size, read-aloud and the daily goal live with the feature
// they change (material, aiTutor, study); the rest are here.
const initialState = {
  notificationPermission: 'unknown', // unknown | granted | denied (what the phone says)
  language: 'en', // app language: en | hi
  reminders: {
    study: { enabled: false, hour: 19, minute: 0 }, // every day at hour:minute
    streak: { enabled: false }, // 8 pm, only when nothing was studied today
  },
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setNotificationPermission: (state, action) => {
      state.notificationPermission = action.payload;
    },
    setLanguage: (state, action) => {
      state.language = action.payload;
    },
    // Merges `{ enabled?, hour?, minute? }`.
    updateStudyReminder: (state, action) => {
      state.reminders.study = { ...state.reminders.study, ...action.payload };
    },
    setStreakReminder: (state, action) => {
      state.reminders.streak.enabled = action.payload;
    },
  },
  extraReducers: builder => {
    builder.addCase(logout, () => initialState);
  },
});

export const {
  setNotificationPermission,
  setLanguage,
  updateStudyReminder,
  setStreakReminder,
} = settingsSlice.actions;

export default settingsSlice.reducer;
