import { dayKey } from '@/utils/date';

export const selectStudySessions = state => state.study.sessions;
export const selectStudyTargetMinutes = state => state.study.targetMinutes;

// Seconds studied today: finished sessions that ended today plus what the sessions
// still open have saved so far. A number, so it never causes a needless re-render.
export const selectTodayStudySeconds = state => {
  const today = dayKey();
  const done = state.study.sessions.reduce(
    (sum, s) => (dayKey(new Date(s.end)) === today ? sum + s.seconds : sum),
    0,
  );
  const open = Object.values(state.study.active).reduce(
    (sum, s) => (dayKey(new Date(s.at)) === today ? sum + s.seconds : sum),
    0,
  );
  return done + open;
};

export const selectTodayStudyMinutes = state =>
  Math.floor(selectTodayStudySeconds(state) / 60);

// Lifetime total: every finished session plus whatever any still-open session has
// saved so far (its next checkpoint, not a guess).
export const selectTotalStudySeconds = state => {
  const done = state.study.sessions.reduce((sum, s) => sum + s.seconds, 0);
  const open = Object.values(state.study.active).reduce(
    (sum, s) => sum + s.seconds,
    0,
  );
  return done + open;
};

export const selectTotalStudyHours = state =>
  Math.round((selectTotalStudySeconds(state) / 3600) * 10) / 10;
