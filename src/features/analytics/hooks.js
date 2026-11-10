import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectPracticeHistory } from '@/store/selectors/practiceSelectors';
import { selectMockHistory } from '@/store/selectors/mockSelectors';
import { selectStudySessions } from '@/store/selectors/studySelectors';
import { RANGES, buildPerformance } from './utils/performance';

// Performance numbers for a time range ('7d' | '30d' | 'all'), from the saved histories.
export default function usePerformance(rangeId = 'all') {
  const practice = useSelector(selectPracticeHistory);
  const mock = useSelector(selectMockHistory);
  const sessions = useSelector(selectStudySessions);
  return useMemo(
    () =>
      buildPerformance({
        practice,
        mock,
        sessions,
        days: RANGES.find(r => r.id === rangeId)?.days ?? null,
      }),
    [practice, mock, sessions, rangeId],
  );
}
