import { beginSession, endSession } from '@/features/study/store/studySlice';
import { store } from '@/store';

let counter = 0;

// Records a finished study session `daysAgo` days back (0 = today) at `hour` o'clock, as if
// the student had really spent `seconds` on it. Goes through the real slice actions.
export const addStudySession = ({
  daysAgo = 0,
  seconds = 600,
  type = 'study',
  refId = 't-percentage',
  hour = 11,
} = {}) => {
  const end = new Date();
  end.setDate(end.getDate() - daysAgo);
  end.setHours(hour, 0, 0, 0);
  counter += 1;
  const id = `test-session-${counter}`;
  store.dispatch(
    beginSession({ id, type, refId, start: end.getTime() - seconds * 1000 }),
  );
  store.dispatch(endSession({ id, seconds, end: end.getTime() }));
  return id;
};
