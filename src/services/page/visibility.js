// "Is the student looking at the app?" on the web. Replaces React Native's AppState: a hidden
// tab, a minimised window or a locked phone all count as "away" (document.visibilityState).
// `pagehide` also fires when the tab is closed or navigated away, where `visibilitychange`
// may not, so it is treated as "away" too: that is the last chance to save a checkpoint.
export const isPageVisible = () =>
  typeof document === 'undefined' || document.visibilityState !== 'hidden';

// Calls `listener(visible)` whenever that flips. Returns the unsubscribe function.
export const subscribePageVisibility = listener => {
  const onChange = () => listener(isPageVisible());
  const onHide = () => listener(false);
  const onShow = () => listener(isPageVisible());
  document.addEventListener('visibilitychange', onChange);
  window.addEventListener('pagehide', onHide);
  window.addEventListener('pageshow', onShow);
  return () => {
    document.removeEventListener('visibilitychange', onChange);
    window.removeEventListener('pagehide', onHide);
    window.removeEventListener('pageshow', onShow);
  };
};
