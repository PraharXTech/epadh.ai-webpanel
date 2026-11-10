import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectProfile } from '@/store/selectors/userSelectors';
import {
  fetchOmrLeaderboard,
  fetchOmrResult,
} from '../services/omrResultService';
import { recordScan } from '../store/omrSlice';
import { summarizeResult } from '../utils/omrResult';

// Loads the graded sheet and its leaderboard, and files the scan in the history list.
// The result is what the student came for, so a leaderboard that fails to load only
// blanks that tab instead of the whole screen.
export default function useOmrResult(scanId) {
  const dispatch = useDispatch();
  const studentName = useSelector(selectProfile)?.name;
  const [state, setState] = useState({
    status: 'loading', // loading | ready | error
    result: null,
    leaderboard: null,
    leaderboardFailed: false,
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState(prev => ({ ...prev, status: 'loading' }));

    Promise.allSettled([
      fetchOmrResult({ scanId, studentName }),
      fetchOmrLeaderboard({ scanId, studentName }),
    ]).then(([result, leaderboard]) => {
      if (cancelled) {
        return;
      }
      if (result.status === 'rejected') {
        setState({
          status: 'error',
          result: null,
          leaderboard: null,
          leaderboardFailed: false,
        });
        return;
      }
      dispatch(recordScan(summarizeResult(result.value)));
      setState({
        status: 'ready',
        result: result.value,
        leaderboard: leaderboard.status === 'fulfilled' ? leaderboard.value : null,
        leaderboardFailed: leaderboard.status === 'rejected',
      });
    });

    return () => {
      cancelled = true;
    };
  }, [scanId, studentName, attempt, dispatch]);

  const reload = useCallback(() => setAttempt(n => n + 1), []);
  return { ...state, reload };
}
