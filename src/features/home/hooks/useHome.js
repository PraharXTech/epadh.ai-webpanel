import { useCallback, useEffect } from 'react';
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
// (shows the spinner); coming back to Home refreshes quietly when the data is more than two
// minutes old.
// Web port: mobile refreshed on the screen's `focus` event. A web page is mounted when it is
// shown, so the same check runs on mount (arriving at Home) and when a hidden tab becomes
// visible again.
export default function useHome() {
  const dispatch = useDispatch();
  const data = useSelector(selectHomeData);
  const status = useSelector(selectHomeStatus);
  const error = useSelector(selectHomeError);
  const updatedAt = useSelector(selectHomeUpdatedAt);

  const refresh = useCallback(() => dispatch(loadHome()), [dispatch]);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(loadHome({ silent: Boolean(data) }));
    }
  }, [status, data, dispatch]);

  useEffect(() => {
    const refreshIfStale = () => {
      const stale = !updatedAt || Date.now() - updatedAt > STALE_AFTER_MS;
      if (stale && status !== 'loading' && status !== 'refreshing') {
        dispatch(loadHome({ silent: Boolean(data) }));
      }
    };
    refreshIfStale(); // arriving at Home
    return subscribePageVisibility(visible => {
      if (visible) {
        refreshIfStale();
      }
    });
    // Arriving only: not on every status change (that would loop on a failed load).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  return { data, status, error, refresh };
}
