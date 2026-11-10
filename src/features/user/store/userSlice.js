import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getErrorMessage } from '@/api/client';
import {
  googleLogin,
  logout,
  logoutUser,
  verifyOtp,
} from '@/features/auth/store/authSlice';
import {
  resumePendingOrder,
  verifyCheckout,
} from '@/features/membership/store/membershipSlice';
import {
  FREE_ENTITLEMENTS,
  loadMe,
  removeAccount,
  saveAvatar,
  saveProfileDetails,
  saveSelectedExams,
} from '../services/userService';

export const fetchMe = createAsyncThunk(
  'user/fetchMe',
  async (_, { getState, rejectWithValue }) => {
    try {
      return await loadMe(getState().user.profile);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

// The exams the student is preparing for, in the order they chose them (the first is
// their "primary" exam). `examId` (one exam) is kept for callers that only know one.
export const chooseExam = createAsyncThunk(
  'user/chooseExam',
  async ({ examIds, examId }, { rejectWithValue }) => {
    const ids = [...new Set([].concat(examIds ?? examId ?? []).filter(Boolean))];
    if (ids.length === 0) {
      return rejectWithValue('Pick at least one exam.');
    }
    try {
      await saveSelectedExams({ examIds: ids });
      return { examIds: ids };
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

// Edit profile: name, email and exam date (email / date are null when cleared).
export const saveProfile = createAsyncThunk(
  'user/saveProfile',
  async (details, { rejectWithValue }) => {
    try {
      return await saveProfileDetails(details);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

// A new photo's local uri, or null to remove the current one.
export const changeAvatar = createAsyncThunk(
  'user/changeAvatar',
  async (uri, { rejectWithValue }) => {
    try {
      return await saveAvatar(uri);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

// Permanently deletes the account on the server, then signs out like Log out does (tokens
// and every saved slice are cleared). If the server call fails nothing is signed out.
export const deleteAccount = createAsyncThunk(
  'user/deleteAccount',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      await removeAccount();
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
    await dispatch(logoutUser());
    return true;
  },
);

const initialState = {
  profile: null,
  selectedExamIds: [], // every exam the student prepares for, in the order chosen
  selectedExamId: null, // the first of them, kept for code that needs just one exam
  entitlements: FREE_ENTITLEMENTS, // the single source for Free/Pro gating
  examStatus: 'idle', // status of saving the exam choice
  profileStatus: 'idle', // status of saving name / email / date / photo
  deleteStatus: 'idle', // idle | deleting | failed
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchMe.fulfilled, (state, action) => {
        const { profile, selectedExamIds, selectedExamId, entitlements } =
          action.payload;
        state.profile = profile;
        // Keep the locally saved exams if the (mock) server has none. An older server
        // (or an older saved copy) only knows a single exam.
        const ids = selectedExamIds ?? (selectedExamId ? [selectedExamId] : null);
        if (ids) {
          state.selectedExamIds = ids;
          state.selectedExamId = ids[0] ?? null;
        }
        state.entitlements = entitlements;
      })
      .addCase(chooseExam.pending, state => {
        state.examStatus = 'loading';
        state.error = null;
      })
      .addCase(chooseExam.fulfilled, (state, action) => {
        state.examStatus = 'succeeded';
        state.selectedExamIds = action.payload.examIds;
        state.selectedExamId = action.payload.examIds[0];
      })
      .addCase(chooseExam.rejected, (state, action) => {
        state.examStatus = 'failed';
        state.error = action.payload ?? action.error.message;
      });

    builder
      .addCase(saveProfile.pending, state => {
        state.profileStatus = 'loading';
      })
      .addCase(saveProfile.fulfilled, (state, action) => {
        state.profileStatus = 'succeeded';
        state.profile = { ...state.profile, ...action.payload };
      })
      .addCase(saveProfile.rejected, state => {
        state.profileStatus = 'failed';
      })
      .addCase(changeAvatar.pending, state => {
        state.profileStatus = 'loading';
      })
      .addCase(changeAvatar.fulfilled, (state, action) => {
        state.profileStatus = 'succeeded';
        state.profile = {
          ...state.profile,
          avatarUrl: action.payload.avatarUrl,
        };
      })
      .addCase(changeAvatar.rejected, state => {
        state.profileStatus = 'failed';
      });

    builder
      .addCase(deleteAccount.pending, state => {
        state.deleteStatus = 'deleting';
      })
      .addCase(deleteAccount.rejected, state => {
        state.deleteStatus = 'failed';
      });

    builder.addCase(logout, () => initialState);

    // A fresh login brings the profile with it.
    [verifyOtp, googleLogin].forEach(thunk => {
      builder.addCase(thunk.fulfilled, (state, action) => {
        state.profile = action.payload.user;
      });
    });

    // A successful payment (live or resumed after the app was killed mid-payment)
    // unlocks Pro immediately; the app only trusts what verification returned, same
    // as it would trust the server's response in the real flow.
    [verifyCheckout, resumePendingOrder].forEach(thunk => {
      builder.addCase(thunk.fulfilled, (state, action) => {
        state.entitlements = action.payload.entitlements;
      });
    });
  },
});

export default userSlice.reducer;
