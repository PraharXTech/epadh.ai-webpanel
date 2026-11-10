import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectPyqError,
  selectPyqLoaded,
  selectPyqStatus,
} from '@/store/selectors/pyqSelectors';
import { loadPyqPapers } from '../store/pyqSlice';

// The uploaded previous-year papers. One request covers every exam; which ones show is
// decided by the exams the student prepares for. Saved copy shows while it refreshes.
export default function usePyqPapers() {
  const dispatch = useDispatch();
  const status = useSelector(selectPyqStatus);
  const error = useSelector(selectPyqError);
  const hasData = useSelector(selectPyqLoaded);
  const requested = useRef(false); // stops a failed load from retrying in a loop

  const refresh = useCallback(() => {
    requested.current = true;
    dispatch(loadPyqPapers());
  }, [dispatch]);

  useEffect(() => {
    if (!requested.current) {
      refresh();
    }
  }, [refresh]);

  return { status, error, refresh, hasData };
}
