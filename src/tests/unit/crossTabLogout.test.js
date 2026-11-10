import { sessionRestored, logout } from '@/features/auth/store/authSlice';
import { loadTokens, saveTokens } from '@/services/storage/secureStorage';
import { store } from '@/store';

// Two tabs share localStorage; the browser fires a `storage` event in the OTHER tab only.
// A jsdom test has one window, so the event is dispatched by hand, as the browser would.
describe('cross-tab logout', () => {
  it('logging out here writes the signal other tabs listen for', () => {
    store.dispatch(logout());
    expect(window.localStorage.getItem('epadhai.logoutAt')).toBeTruthy();
  });

  it('a logout signal from another tab logs this one out and drops its tokens', async () => {
    await saveTokens({ accessToken: 'a', refreshToken: 'r' });
    store.dispatch(sessionRestored({ id: 'u1', name: 'Asha' }));
    expect(store.getState().auth.isAuthenticated).toBe(true);

    window.dispatchEvent(
      new StorageEvent('storage', { key: 'epadhai.logoutAt', newValue: '123' }),
    );

    await vi.waitFor(() =>
      expect(store.getState().auth.isAuthenticated).toBe(false),
    );
    expect(await loadTokens()).toBeNull();
  });

  it('does not echo a remote logout back to localStorage', async () => {
    store.dispatch(sessionRestored({ id: 'u1', name: 'Asha' }));
    window.localStorage.removeItem('epadhai.logoutAt');
    window.dispatchEvent(
      new StorageEvent('storage', { key: 'epadhai.logoutAt', newValue: '456' }),
    );
    await vi.waitFor(() =>
      expect(store.getState().auth.isAuthenticated).toBe(false),
    );
    expect(window.localStorage.getItem('epadhai.logoutAt')).toBeNull();
  });

  it('ignores unrelated storage events', () => {
    store.dispatch(sessionRestored({ id: 'u1', name: 'Asha' }));
    window.dispatchEvent(
      new StorageEvent('storage', { key: 'something.else', newValue: '1' }),
    );
    expect(store.getState().auth.isAuthenticated).toBe(true);
  });
});
