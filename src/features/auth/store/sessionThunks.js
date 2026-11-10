import { clearTokens, loadTokens } from '@/services/storage/secureStorage';
import { fetchMe } from '@/features/user/store/userSlice';
import { bootstrapFinished, logout, sessionRestored } from './authSlice';

// Runs once at app launch: decides Auth vs. the app from what secure storage holds.
export const bootstrapSession = () => async (dispatch, getState) => {
  const tokens = await loadTokens();

  if (!tokens) {
    // Covers a stale persisted "logged in" flag with no tokens behind it.
    dispatch(logout());
    dispatch(bootstrapFinished());
    return;
  }

  const cachedProfile = getState().user.profile;
  const result = await dispatch(fetchMe());

  if (fetchMe.fulfilled.match(result)) {
    dispatch(sessionRestored(result.payload.profile));
  } else if (cachedProfile) {
    // Offline or server hiccup: trust the cached session and let the
    // API client's refresh logic handle a truly expired one.
    dispatch(sessionRestored(cachedProfile));
  } else {
    await clearTokens();
    dispatch(logout());
  }
  dispatch(bootstrapFinished());
};
