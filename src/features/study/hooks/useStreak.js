import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import useToday from '@/hooks/useToday';
import { selectDayTotals } from '@/store/selectors/streakSelectors';
import {
  selectStudySessions,
  selectStudyTargetMinutes,
} from '@/store/selectors/studySelectors';
import {
  computeStreak,
  countedDays,
  minutesOf,
  STREAK_MIN_MINUTES,
  studyTotals,
} from '../utils/streak';

// Everything the streak card and the streak page show, recomputed when the student does
// something and when the date changes.
export default function useStreak() {
  const today = useToday();
  const days = useSelector(selectDayTotals);
  const sessions = useSelector(selectStudySessions);
  const targetMinutes = useSelector(selectStudyTargetMinutes);

  return useMemo(() => {
    const streak = computeStreak(countedDays(days), today);
    const todayMinutes = minutesOf(days[today]);
    return {
      today,
      days,
      sessions,
      ...streak,
      todayMinutes,
      targetMinutes,
      minutesToKeepStreak: Math.max(0, STREAK_MIN_MINUTES - todayMinutes),
      totals: studyTotals({ sessions, days }),
    };
  }, [today, days, sessions, targetMinutes]);
}
