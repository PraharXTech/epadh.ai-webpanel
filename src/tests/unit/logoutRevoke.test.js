import { apiClient } from '@/api/client';
import { logoutUser, sessionRestored } from '@/features/auth/store/authSlice';
import { loadTokens, saveTokens } from '@/services/storage/secureStorage';
import { store } from '@/store';

// With the real API on, logging out first asks the server to drop the session. It must
// never be able to block the logout itself.
const env = vi.hoisted(() => ({ USE_MOCK_API: false }));
vi.mock('@/config/env', async importOriginal => ({
  ...(await importOriginal()),
  get USE_MOCK_API() {
    return env.USE_MOCK_API;
  },
}));

const signIn = async () => {
  await saveTokens({ accessToken: 'a', refreshToken: 'r' });
  store.dispatch(sessionRestored({ id: 'u1', name: 'Asha' }));
};

describe('logout with the real API', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    env.USE_MOCK_API = false;
  });

  it('asks the server to revoke the session, then clears everything locally', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({});
    await signIn();
    await store.dispatch(logoutUser());

    expect(post).toHaveBeenCalledWith('/auth/logout');
    expect(store.getState().auth.isAuthenticated).toBe(false);
    expect(await loadTokens()).toBeNull();
  });

  it('still logs out when the server cannot be reached', async () => {
    vi.spyOn(apiClient, 'post').mockRejectedValue(new Error('Network Error'));
    await signIn();
    await store.dispatch(logoutUser());

    expect(store.getState().auth.isAuthenticated).toBe(false);
    expect(await loadTokens()).toBeNull();
  });

  it('does not call the server in mock mode', async () => {
    env.USE_MOCK_API = true;
    const post = vi.spyOn(apiClient, 'post');
    await signIn();
    await store.dispatch(logoutUser());

    expect(post).not.toHaveBeenCalled();
    expect(store.getState().auth.isAuthenticated).toBe(false);
  });
});
