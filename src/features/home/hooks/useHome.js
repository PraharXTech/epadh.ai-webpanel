import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loadHome } from '../store/homeSlice';
import {
  selectHomeData,
  selectHomeError,
  selectHomeStatus,
  selectHomeUpdatedAt,
} from '../../../store/selectors/homeSelectors';

const STALE_AFTER_MS = 2 * 60 * 1000;

// Home data: saved copy first, refreshed in the background. `refresh` is the
// pull-to-refresh (shows the spinner); coming back to Home refreshes quietly when the
// data is more than two minutes old.
export default function useHome(navigation) {
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

  useEffect(
    () =>
      navigation?.addListener?.('focus', () => {
        const stale = !updatedAt || Date.now() - updatedAt > STALE_AFTER_MS;
        if (stale && status !== 'loading' && status !== 'refreshing') {
          dispatch(loadHome({ silent: Boolean(data) }));
        }
      }),
    [navigation, updatedAt, status, data, dispatch],
  );

  return { data, status, error, refresh };
}
