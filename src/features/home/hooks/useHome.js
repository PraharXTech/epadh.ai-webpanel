import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { subscribePageVisibility } from '@/services/page/visibility';
import {
  selectHomeData,
  selectHomeError,
  selectHomeStatus,
  selectHomeUpdatedAt,
} from '@/store/selectors/homeSelectors';
import { loadHome } from '../store/homeSlice';

const STALE_AFTER_MS = 2 * 60 * 1000;

// Home data: saved copy first, refreshed in the background. `refresh` is the Refresh button
// (shows the spinner); arriving at Home, or showing a hidden tab again, refreshes quietly when
// the data is more than two minutes old (or was never loaded).
// Web port: mobile refreshed on the screen's `focus` event. A web page is mounted when it is
// shown, so the same check runs on mount and when a hidden tab becomes visible.
export default function useHome() {
  const dispatch = useDispatch();
  const data = useSelector(selectHomeData);
  const status = useSelector(selectHomeStatus);
  const error = useSelector(selectHomeError);
  const updatedAt = useSelector(selectHomeUpdatedAt);

  const refresh = useCallback(() => dispatch(loadHome()), [dispatch]);

  // The check reads the latest values through a ref, so there is ONE place that decides to
  // load (two effects deciding separately sent the first request twice).
  const latest = useRef({ data, status, updatedAt });
  useEffect(() => {
    latest.current = { data, status, updatedAt };
  });

  const refreshIfNeeded = useCallback(() => {
    const { data: saved, status: current, updatedAt: at } = latest.current;
    if (current === 'loading' || current === 'refreshing') {
      return;
    }
    const stale = !at || Date.now() - at > STALE_AFTER_MS;
    if (current === 'idle' || stale) {
      dispatch(loadHome({ silent: Boolean(saved) }));
    }
  }, [dispatch]);

  useEffect(() => {
    refreshIfNeeded(); // arriving at Home
    return subscribePageVisibility(visible => {
      if (visible) {
        refreshIfNeeded();
      }
    });
  }, [refreshIfNeeded]);

  return { data, status, error, refresh };
}
