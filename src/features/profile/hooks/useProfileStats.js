import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import usePerformance from '@/features/analytics/hooks';
import { selectMockHistory } from '@/store/selectors/mockSelectors';
import { selectPracticeHistory } from '@/store/selectors/practiceSelectors';
import { selectStudySessions } from '@/store/selectors/studySelectors';
import { activeDayKeys, computeStreak } from '../utils/profile';

// The numbers on the Profile screen, from the saved practice, mock and study histories.
export default function useProfileStats() {
  const performance = usePerformance('all');
  const sessions = useSelector(selectStudySessions);
  const practice = useSelector(selectPracticeHistory);
  const mock = useSelector(selectMockHistory);

  const streak = useMemo(
    () => computeStreak(activeDayKeys({ sessions, practice, mock })),
    [sessions, practice, mock],
  );

  return { performance, streak };
}
