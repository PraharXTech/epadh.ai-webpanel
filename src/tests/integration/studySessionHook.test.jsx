import { act, fireEvent, render, renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { logout } from '@/features/auth/store/authSlice';
import useStudySession from '@/features/study/hooks/useStudySession';
import useTimeOnScreen from '@/hooks/useTimeOnScreen';
import {
  isPageVisible,
  subscribePageVisibility,
} from '@/services/page/visibility';
import { store } from '@/store';

// Web port of mobile studySessionHook.test.jsx. Differences: "another screen on top" is gone
// (a page that is not shown is unmounted), and "app in the background" is the tab being
// hidden (Page Visibility API).
const setVisibility = state => {
  Object.defineProperty(document, 'visibilityState', {
    value: state,
    configurable: true,
  });
  document.dispatchEvent(new Event('visibilitychange'));
};

function Probe({ refId = 't-ratio', idleSec }) {
  const { touchProps } = useStudySession({ type: 'study', refId, idleSec });
  return <div data-testid="probe" {...touchProps} />;
}

const advance = ms => act(() => vi.advanceTimersByTimeAsync(ms));
const mount = props =>
  render(
    <Provider store={store}>
      <Probe {...props} />
    </Provider>,
  );

describe('page visibility service', () => {
  afterEach(() => setVisibility('visible'));

  it('reports the visibility state and notifies on change', () => {
    const seen = [];
    const off = subscribePageVisibility(visible => seen.push(visible));
    expect(isPageVisible()).toBe(true);
    setVisibility('hidden');
    expect(isPageVisible()).toBe(false);
    setVisibility('visible');
    off();
    setVisibility('hidden');
    expect(seen).toEqual([false, true]);
  });

  it('treats pagehide (tab closing) as going away', () => {
    const seen = [];
    const off = subscribePageVisibility(visible => seen.push(visible));
    window.dispatchEvent(new Event('pagehide'));
    off();
    expect(seen).toEqual([false]);
  });
});

describe('useStudySession', () => {
  beforeEach(() => {
    store.dispatch(logout());
    vi.useFakeTimers();
    setVisibility('visible');
  });
  afterEach(() => vi.useRealTimers());

  it('records the time a page was in use when it closes', async () => {
    const view = mount();
    expect(Object.keys(store.getState().study.active)).toHaveLength(1);
    for (let i = 0; i < 4; i += 1) {
      await advance(10000);
      fireEvent.pointerDown(view.getByTestId('probe')); // activity keeps it from going idle
    }
    view.unmount();

    const { sessions, active } = store.getState().study;
    expect(active).toEqual({});
    expect(sessions).toHaveLength(1);
    expect(sessions[0]).toMatchObject({ type: 'study', refId: 't-ratio' });
    expect(sessions[0].seconds).toBeGreaterThanOrEqual(39);
    expect(sessions[0].seconds).toBeLessThanOrEqual(41);
  });

  it('keyboard, wheel, scroll and pointer movement all count as activity', async () => {
    const view = mount();
    const area = view.getByTestId('probe');
    for (const fire of [
      () => fireEvent.keyDown(area, { key: 'ArrowDown' }),
      () => fireEvent.wheel(area),
      () => fireEvent.scroll(area),
      () => fireEvent.pointerMove(area),
    ]) {
      await advance(40000); // just under the 45 s idle limit each time
      act(fire);
    }
    view.unmount();
    expect(store.getState().study.sessions[0].seconds).toBeGreaterThanOrEqual(
      159,
    );
  });

  it('does not count time while the tab is hidden', async () => {
    const view = mount({ idleSec: null });
    await advance(20000);
    act(() => setVisibility('hidden'));
    await advance(120000);
    act(() => setVisibility('visible'));
    await advance(10000);
    view.unmount();

    const seconds = store.getState().study.sessions[0].seconds;
    expect(seconds).toBeGreaterThanOrEqual(29);
    expect(seconds).toBeLessThanOrEqual(31);
  });

  it('saves a checkpoint when the tab is hidden, in case it is never shown again', async () => {
    mount({ idleSec: null });
    await advance(12000);
    act(() => setVisibility('hidden'));
    const [session] = Object.values(store.getState().study.active);
    expect(session.seconds).toBeGreaterThanOrEqual(11);
    act(() => setVisibility('visible'));
  });

  it('starts paused when the page opens in a hidden tab', async () => {
    setVisibility('hidden');
    const view = mount({ idleSec: null });
    await advance(30000);
    act(() => setVisibility('visible'));
    await advance(5000);
    view.unmount();
    const seconds = store.getState().study.sessions[0].seconds;
    expect(seconds).toBeLessThanOrEqual(6);
  });

  it('stops counting when the student goes idle', async () => {
    const view = mount();
    await advance(300000); // 5 minutes with no activity
    view.unmount();
    const seconds = store.getState().study.sessions[0].seconds;
    expect(seconds).toBeGreaterThanOrEqual(44);
    expect(seconds).toBeLessThanOrEqual(46);
  });

  it('tracks nothing without a refId', async () => {
    const view = mount({ refId: null });
    await advance(20000);
    view.unmount();
    expect(store.getState().study.sessions).toEqual([]);
    expect(store.getState().study.active).toEqual({});
  });
});

describe('useTimeOnScreen', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setVisibility('visible');
  });
  afterEach(() => vi.useRealTimers());

  it('reports the seconds when the page is left', async () => {
    const onReport = vi.fn();
    const { unmount } = renderHook(() => useTimeOnScreen(onReport));
    await advance(7000);
    unmount();
    expect(onReport).toHaveBeenCalledTimes(1);
    expect(onReport.mock.calls[0][0]).toBeCloseTo(7, 0);
  });

  it('reports and pauses when the tab is hidden, then resumes', async () => {
    const onReport = vi.fn();
    const { unmount } = renderHook(() => useTimeOnScreen(onReport));
    await advance(5000);
    act(() => setVisibility('hidden'));
    expect(onReport).toHaveBeenCalledTimes(1); // saved before the tab may be killed
    await advance(60000); // hidden: not counted
    act(() => setVisibility('visible'));
    await advance(3000);
    unmount();
    expect(onReport).toHaveBeenCalledTimes(2);
    expect(onReport.mock.calls[1][0]).toBeCloseTo(3, 0);
  });

  it('reportNow sends the time so far and keeps counting', async () => {
    const onReport = vi.fn();
    const { result, unmount } = renderHook(() => useTimeOnScreen(onReport));
    await advance(4000);
    act(() => result.current());
    expect(onReport).toHaveBeenCalledTimes(1);
    expect(onReport.mock.calls[0][0]).toBeCloseTo(4, 0);
    await advance(2000);
    unmount();
    expect(onReport.mock.calls[1][0]).toBeCloseTo(2, 0);
  });

  it('ignores a visit shorter than a second', () => {
    const onReport = vi.fn();
    const { unmount } = renderHook(() => useTimeOnScreen(onReport));
    unmount();
    expect(onReport).not.toHaveBeenCalled();
  });
});
