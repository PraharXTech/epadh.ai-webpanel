import { store } from '@/store';
import {
  logoutUser,
  sendOtp,
  verifyOtp,
} from '@/features/auth/store/authSlice';
import { bootstrapSession } from '@/features/auth/store/sessionThunks';
import { chooseExam } from '@/features/user/store/userSlice';

const run = async thunk => {
  const promise = store.dispatch(thunk);
  await jest.advanceTimersByTimeAsync(2000);
  return promise;
};

describe('session flow', () => {
  beforeAll(() => jest.useFakeTimers());
  afterAll(() => jest.useRealTimers());

  it('starts logged out', () => {
    expect(store.getState().auth.isAuthenticated).toBe(false);
  });

  it('sendOtp remembers the number', async () => {
    await run(sendOtp({ mobile: '9876543210' }));
    expect(store.getState().auth.otpMobile).toBe('9876543210');
  });

  it('rejects a wrong OTP without logging in', async () => {
    await run(verifyOtp({ mobile: '9876543210', otp: '000000' }));
    const { auth } = store.getState();
    expect(auth.isAuthenticated).toBe(false);
    expect(auth.error).toMatch(/incorrect otp/i);
  });

  it('a correct OTP logs in, stores tokens securely and loads the profile', async () => {
    await run(verifyOtp({ mobile: '9876543210', otp: '123456' }));
    const state = store.getState();
    expect(state.auth.isAuthenticated).toBe(true);
    expect(state.user.profile.name).toBe('Abhishek');
    expect(window.localStorage.getItem('epadhai.refresh')).toBeTruthy();
    // Tokens must never enter Redux.
    expect(JSON.stringify(state)).not.toMatch(/mock-access-token/);
  });

  it('saves the chosen exam', async () => {
    await run(chooseExam({ examId: 'pet' }));
    expect(store.getState().user.selectedExamId).toBe('pet');
    expect(store.getState().user.selectedExamIds).toEqual(['pet']);
  });

  it('restores the session at launch when tokens exist', async () => {
    await run(bootstrapSession());
    const { auth, user } = store.getState();
    expect(auth.bootstrapped).toBe(true);
    expect(auth.isAuthenticated).toBe(true);
    expect(user.selectedExamId).toBe('pet');
  });

  it('logout clears tokens and resets every slice', async () => {
    await run(logoutUser());
    const state = store.getState();
    expect(window.localStorage.getItem('epadhai.refresh')).toBeNull();
    expect(state.auth.isAuthenticated).toBe(false);
    expect(state.user.profile).toBeNull();
    expect(state.user.selectedExamId).toBeNull();
    expect(state.auth.bootstrapped).toBe(true);
  });

  it('launch with no tokens ends on the login flow', async () => {
    await run(bootstrapSession());
    expect(store.getState().auth.isAuthenticated).toBe(false);
    expect(store.getState().auth.bootstrapped).toBe(true);
  });
});

