import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getErrorMessage } from '@/api/client';
import { clearTokens, saveTokens } from '@/services/storage/secureStorage';
import {
  loginWithGoogle,
  revokeSession,
  sendOtp as sendOtpRequest,
  verifyOtp as verifyOtpRequest,
} from '../services/authService';

const toThunk = (type, request) =>
  createAsyncThunk(type, async (arg, { rejectWithValue }) => {
    try {
      return await request(arg);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  });

// Tokens go to secure storage; only the user profile enters Redux.
const toSessionThunk = (type, request) =>
  toThunk(type, async arg => {
    const { accessToken, refreshToken, user } = await request(arg);
    await saveTokens({ accessToken, refreshToken });
    return { user };
  });

export const sendOtp = toThunk('auth/sendOtp', sendOtpRequest);
export const verifyOtp = toSessionThunk('auth/verifyOtp', verifyOtpRequest);
export const googleLogin = toSessionThunk('auth/googleLogin', loginWithGoogle);

const initialState = {
  bootstrapped: false, // true once launch-time session check finished (not persisted)
  isAuthenticated: false,
  user: null,
  otpMobile: null, // number the OTP was sent to
  status: 'idle', // idle | loading | succeeded | failed
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // The root reducer resets every slice when this fires.
    logout: () => ({ ...initialState, bootstrapped: true }),
    bootstrapFinished: state => {
      state.bootstrapped = true;
    },
    sessionRestored: (state, action) => {
      state.isAuthenticated = true;
      state.user = action.payload ?? state.user;
    },
    clearAuthError: state => {
      state.error = null;
      state.status = 'idle';
    },
  },
  extraReducers: builder => {
    [sendOtp, verifyOtp, googleLogin].forEach(thunk => {
      builder
        .addCase(thunk.pending, state => {
          state.status = 'loading';
          state.error = null;
        })
        .addCase(thunk.rejected, (state, action) => {
          state.status = 'failed';
          state.error = action.payload ?? action.error.message;
        });
    });

    builder.addCase(sendOtp.fulfilled, (state, action) => {
      state.status = 'succeeded';
      state.otpMobile = action.payload.mobile;
    });

    [verifyOtp, googleLogin].forEach(thunk => {
      builder.addCase(thunk.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.otpMobile = null;
      });
    });
  },
});

export const { logout, sessionRestored, bootstrapFinished, clearAuthError } =
  authSlice.actions;

export const logoutUser = () => async dispatch => {
  await revokeSession(); // web: needs the token, so it goes before clearTokens
  await clearTokens();
  dispatch(logout());
};

export default authSlice.reducer;
