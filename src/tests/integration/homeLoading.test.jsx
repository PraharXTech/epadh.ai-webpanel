import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { logout } from '@/features/auth/store/authSlice';
import HomePage from '@/features/home/pages/HomePage';
import { fetchHomeData } from '@/features/home/services/homeService';
import { loadHome } from '@/features/home/store/homeSlice';
import { store } from '@/store';
import { renderWithRealStore } from '../utils/renderWithRealStore';

// Web port of mobile homeLoading.test.jsx. The Home service is replaced so each test decides
// when a request finishes or fails.
vi.mock('@/features/home/services/homeService', () => ({
  fetchHomeData: vi.fn(),
}));

const HOME = {
  user: { name: 'Abhishek' },
  hero: {
    badge: 'b',
    title: 'Prepare Smarter',
    brand: 'epadh.ai',
    subtitle: 's',
    cta: 'Start Learning',
  },
  quickActions: [],
  progress: { percent: 0, message: 'On track' },
  popularExams: [],
  motivation: 'Keep going',
  weakTopics: [],
};

// A request the test finishes by hand.
const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const renderHome = () => renderWithRealStore(<HomePage />, { entries: ['/'] });

describe('Home loading states', () => {
  beforeEach(() => {
    store.dispatch(logout());
    fetchHomeData.mockReset();
  });
  afterEach(() => vi.useRealTimers());

  it('shows placeholders on the very first load, then the content', async () => {
    const request = deferred();
    fetchHomeData.mockReturnValue(request.promise);
    renderHome();
    expect(screen.getByTestId('home-skeleton')).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Loading' })).toHaveAttribute(
      'aria-busy',
      'true',
    );

    await act(async () => request.resolve(HOME));
    expect(await screen.findByText(/Prepare Smarter/)).toBeInTheDocument();
    expect(screen.queryByTestId('home-skeleton')).not.toBeInTheDocument();
  });

  it('offers a retry when the first load fails and nothing is saved', async () => {
    fetchHomeData.mockRejectedValueOnce(new Error('No internet connection'));
    renderHome();
    expect(
      await screen.findByText('No internet connection'),
    ).toBeInTheDocument();

    fetchHomeData.mockResolvedValueOnce(HOME);
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText(/Prepare Smarter/)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Try again' }),
    ).not.toBeInTheDocument();
  });

  it('keeps showing saved data, with a banner, when a refresh fails', async () => {
    fetchHomeData.mockResolvedValueOnce(HOME);
    renderHome();
    await screen.findByText(/Prepare Smarter/);
    expect(screen.queryByText(/Couldn't refresh/)).not.toBeInTheDocument();

    fetchHomeData.mockRejectedValueOnce(new Error('offline'));
    await act(async () => {
      await store.dispatch(loadHome({ silent: true }));
    });
    expect(
      await screen.findByText("Couldn't refresh. Showing your saved data."),
    ).toBeInTheDocument();
    expect(screen.getByText(/Prepare Smarter/)).toBeInTheDocument(); // still there

    fetchHomeData.mockResolvedValueOnce({ ...HOME, motivation: 'Fresh' });
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Fresh')).toBeInTheDocument();
    expect(screen.queryByText(/Couldn't refresh/)).not.toBeInTheDocument();
  });

  it('a background refresh does not blank the screen or show the spinner', async () => {
    fetchHomeData.mockResolvedValueOnce(HOME);
    renderHome();
    await screen.findByText(/Prepare Smarter/);

    const request = deferred();
    fetchHomeData.mockReturnValueOnce(request.promise);
    act(() => {
      store.dispatch(loadHome({ silent: true }));
    });
    expect(store.getState().home.status).toBe('refreshing');
    expect(screen.getByText(/Prepare Smarter/)).toBeInTheDocument();
    expect(document.querySelector('[aria-busy="true"]')).toBeNull();
    await act(async () => request.resolve(HOME));
  });

  it('the Refresh button shows a spinner while it loads', async () => {
    fetchHomeData.mockResolvedValueOnce(HOME);
    renderHome();
    await screen.findByText(/Prepare Smarter/);

    const request = deferred();
    fetchHomeData.mockReturnValueOnce(request.promise);
    await userEvent.click(screen.getByRole('button', { name: 'Refresh Home' }));
    await waitFor(() =>
      expect(document.querySelector('[aria-busy="true"]')).not.toBeNull(),
    );
    await act(async () => request.resolve(HOME));
    await waitFor(() =>
      expect(document.querySelector('[aria-busy="true"]')).toBeNull(),
    );
  });

  describe('coming back to Home', () => {
    it('refreshes quietly after a while, not right after a load', async () => {
      fetchHomeData.mockResolvedValue(HOME);
      const first = renderHome();
      await screen.findByText(/Prepare Smarter/);
      expect(fetchHomeData).toHaveBeenCalledTimes(1);
      first.unmount();

      // back to Home straight away: the data is fresh
      const second = renderHome();
      await screen.findByText(/Prepare Smarter/);
      expect(fetchHomeData).toHaveBeenCalledTimes(1);
      second.unmount();

      // back after three minutes: stale, refreshed in the background (no blank screen)
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(Date.now() + 3 * 60 * 1000);
      renderHome();
      expect(screen.getByText(/Prepare Smarter/)).toBeInTheDocument();
      await waitFor(() => expect(fetchHomeData).toHaveBeenCalledTimes(2));
    });

    it('refreshes when a hidden tab is shown again after a while', async () => {
      fetchHomeData.mockResolvedValue(HOME);
      renderHome();
      await screen.findByText(/Prepare Smarter/);
      expect(fetchHomeData).toHaveBeenCalledTimes(1);

      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(Date.now() + 3 * 60 * 1000);
      act(() => {
        document.dispatchEvent(new Event('visibilitychange'));
      });
      await waitFor(() => expect(fetchHomeData).toHaveBeenCalledTimes(2));
    });

    it('does not refresh when the tab is shown again straight away', async () => {
      fetchHomeData.mockResolvedValue(HOME);
      renderHome();
      await screen.findByText(/Prepare Smarter/);
      act(() => {
        document.dispatchEvent(new Event('visibilitychange'));
      });
      expect(fetchHomeData).toHaveBeenCalledTimes(1);
    });
  });
});
