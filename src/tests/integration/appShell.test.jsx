import { act, renderHook, screen, waitFor } from '@testing-library/react';
import { logout } from '@/features/auth/store/authSlice';
import useToday from '@/hooks/useToday';
import AppLayout from '@/layouts/AppLayout';
import { __setOnlineForTests } from '@/services/network/network';
import { store } from '@/store';
import { renderWithRealStore } from '../utils/renderWithRealStore';
import { addStudySession } from '../utils/study';

// What the logged-in shell does on its own: the bell badge, sending queued data when the
// connection returns, and the date rolling over at midnight.
const shell = () =>
  renderWithRealStore(null, {
    routes: [
      {
        path: '/',
        element: <AppLayout />,
        children: [{ index: true, element: <p>page body</p> }],
      },
    ],
  });

describe('app shell', () => {
  beforeEach(() => {
    store.dispatch(logout());
    __setOnlineForTests(true);
  });

  it('shows how many notifications are unread on the bell', async () => {
    shell();
    const bell = await screen.findByRole(
      'link',
      { name: /Notifications, \d+ unread/ },
      { timeout: 4000 },
    );
    expect(bell).toHaveAttribute('href', '/notifications');
    expect(bell.textContent).toMatch(/^\d\+?$|^9\+$/);
  });

  it('the bell has a plain name when nothing is unread', async () => {
    store.dispatch({ type: 'notifications/fetch/fulfilled', payload: [] });
    shell();
    expect(
      await screen.findByRole('link', { name: 'Notifications' }),
    ).toBeInTheDocument();
  });

  describe('coming back online', () => {
    it('sends the study sessions that were queued while offline', async () => {
      const id = addStudySession({ seconds: 600 });
      expect(
        store.getState().study.sessions.find(s => s.id === id).synced,
      ).toBe(false);
      shell();
      await screen.findByText('page body');

      act(() => __setOnlineForTests(false));
      expect(
        store.getState().study.sessions.find(s => s.id === id).synced,
      ).toBe(false);
      act(() => __setOnlineForTests(true));
      await waitFor(() =>
        expect(
          store.getState().study.sessions.find(s => s.id === id).synced,
        ).toBe(true),
      );
    });

    it('does nothing when the connection drops', async () => {
      const id = addStudySession({ seconds: 600 });
      shell();
      await screen.findByText('page body');
      act(() => __setOnlineForTests(false));
      await new Promise(resolve => setTimeout(resolve, 600)); // longer than the mock request
      expect(
        store.getState().study.sessions.find(s => s.id === id).synced,
      ).toBe(false);
    });
  });
});

describe('useToday', () => {
  afterEach(() => vi.useRealTimers());

  it('changes by itself at midnight while the page stays open', () => {
    vi.useFakeTimers({ now: new Date(2026, 8, 25, 23, 59, 50) });
    const { result } = renderHook(() => useToday());
    expect(result.current).toBe('2026-09-25');
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current).toBe('2026-09-25'); // not yet
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(result.current).toBe('2026-09-26');
  });

  it('keeps rolling over night after night', () => {
    vi.useFakeTimers({ now: new Date(2026, 8, 25, 23, 59, 59) });
    const { result } = renderHook(() => useToday());
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current).toBe('2026-09-26');
    act(() => {
      vi.advanceTimersByTime(24 * 60 * 60 * 1000);
    });
    expect(result.current).toBe('2026-09-27');
  });

  it('catches up when a hidden tab is shown again after a night', () => {
    vi.useFakeTimers({
      now: new Date(2026, 8, 25, 22, 0, 0),
      toFake: ['Date'],
    });
    const { result } = renderHook(() => useToday());
    expect(result.current).toBe('2026-09-25');
    vi.setSystemTime(new Date(2026, 8, 26, 8, 0, 0));
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(result.current).toBe('2026-09-26');
  });

  it('stops its timer when the page goes away', () => {
    vi.useFakeTimers({ now: new Date(2026, 8, 25, 23, 59, 50) });
    const { unmount } = renderHook(() => useToday());
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
