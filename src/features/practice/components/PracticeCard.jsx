import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import AppIcon from '@/components/common/AppIcon';
import Button from '@/components/ui/Button';
import {
  selectPracticeHistory,
  selectPracticeSession,
} from '@/store/selectors/practiceSelectors';
import { MODES } from '../utils/scoring';

// "Practice Test" tab of a topic: start a test, resume the one in progress, last scores.
// (Ported with W4 because the topic page needs it; the rest of practice is W5.)
export default function PracticeCard({ topicId, onStart }) {
  const session = useSelector(selectPracticeSession);
  const history = useSelector(selectPracticeHistory);
  const recent = useMemo(
    () => history.filter(h => h.topicId === topicId).slice(0, 3),
    [history, topicId],
  );
  const inProgress = session?.topicId === topicId;

  return (
    <div className="mx-4">
      <div className="flex flex-col items-center rounded-2xl bg-white px-5 py-6 shadow-sm">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <AppIcon name="clipboard-check" size={24} color="#16a34a" />
        </span>
        <h3 className="mt-3 text-base font-bold text-slate-900">
          Practice test
        </h3>
        <p className="mt-1 text-center text-sm text-slate-500">
          Answer questions on this topic with instant explanations, or take it
          as a timed test.
        </p>
        <Button className="mt-4 px-8" onClick={onStart}>
          {inProgress ? 'Resume test' : 'Start'}
        </Button>
      </div>

      {recent.length ? (
        <div className="mt-4">
          <h3 className="mb-2 text-sm font-bold text-slate-700">
            Recent attempts
          </h3>
          <ul>
            {recent.map(h => (
              <li
                key={h.id}
                className="mb-1.5 flex items-center justify-between rounded-xl bg-white px-4 py-3">
                <span className="text-sm text-slate-700">
                  {MODES[h.mode].label}
                </span>
                <span className="text-sm font-bold text-slate-900">
                  {h.score}/{h.total} · {h.accuracy}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
