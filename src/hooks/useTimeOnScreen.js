import { useCallback, useEffect, useRef } from 'react';
import {
  isPageVisible,
  subscribePageVisibility,
} from '@/services/page/visibility';

// Counts the seconds a page is open with the tab visible and reports them through
// `onReport(seconds)`: when the student leaves the page and whenever the tab is hidden or
// closed (so closing the tab does not lose the time). Feeds the study time tracker.
// Returns `reportNow()`, which reports the time so far without leaving the page (used right
// before the page acts on the total, e.g. submitting a practice test).
// Web port: `AppState` became the Page Visibility API (services/page/visibility.js).
export default function useTimeOnScreen(onReport) {
  const reportRef = useRef(onReport);
  useEffect(() => {
    reportRef.current = onReport;
  });

  const reportNowRef = useRef(null);
  const reportNow = useCallback(() => reportNowRef.current?.(), []);

  useEffect(() => {
    let seconds = 0;
    let startedAt = isPageVisible() ? Date.now() : null;

    const pause = () => {
      if (startedAt !== null) {
        seconds += (Date.now() - startedAt) / 1000;
        startedAt = null;
      }
    };
    const flush = () => {
      pause();
      if (seconds >= 1) {
        reportRef.current?.(seconds);
        seconds = 0;
      }
    };

    reportNowRef.current = () => {
      flush();
      if (isPageVisible()) {
        startedAt = Date.now();
      }
    };

    const unsubscribe = subscribePageVisibility(visible => {
      if (visible) {
        startedAt = startedAt ?? Date.now();
      } else {
        flush();
      }
    });

    return () => {
      unsubscribe();
      flush();
    };
  }, []);

  return reportNow;
}
