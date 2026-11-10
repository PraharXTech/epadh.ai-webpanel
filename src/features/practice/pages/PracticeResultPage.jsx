import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import useGoBack from '@/hooks/useGoBack';
import AppIcon from '@/components/common/AppIcon';
import ScreenHeader from '@/components/common/ScreenHeader';
import Button from '@/components/ui/Button';
import Chip from '@/components/ui/Chip';
import AskAiQuestionButton from '@/features/aiTutor/components/AskAiQuestionButton';
import { PATHS } from '@/routes/routePaths';
import { selectPracticeResult } from '@/store/selectors/practiceSelectors';
import AiBadge from '../components/AiBadge';
import ReportQuestionButton from '../components/ReportQuestionButton';
import { clearResult, retryMissed } from '../store/practiceSlice';
import { MODES, formatDuration } from '../utils/scoring';

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'wrong', label: 'Wrong' },
  { id: 'skipped', label: 'Skipped' },
];

const verdictOf = item => {
  if (item.chosen === null) {
    return { label: 'Skipped', text: 'text-slate-500', bg: 'bg-slate-100' };
  }
  return item.correct
    ? { label: 'Correct', text: 'text-green-700', bg: 'bg-green-100' }
    : { label: 'Wrong', text: 'text-red-700', bg: 'bg-red-100' };
};

const Stat = ({ label, value, tint }) => (
  <div className="flex-1 rounded-xl bg-white py-3 text-center">
    <p className={`text-xl font-extrabold ${tint}`}>{value}</p>
    <p className="mt-0.5 text-[11px] text-slate-500">{label}</p>
  </div>
);

// Score, accuracy, time and a question-by-question review of the test just finished.
export default function PracticeResultPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const result = useSelector(selectPracticeResult);
  const [filter, setFilter] = useState('all');

  // Done goes back to the topic: one step in history, or straight there when the page was
  // opened directly (a reload of the result page has no history).
  const goBack = useGoBack(PATHS.home);
  const leave = topicId => goBack(topicId ? PATHS.topic(topicId) : PATHS.home);

  const done = () => {
    const topicId = result?.topicId;
    dispatch(clearResult());
    leave(topicId);
  };

  if (!result) {
    return (
      <div className="mx-auto max-w-2xl">
        <ScreenHeader title="Result" />
        <p className="px-8 pt-16 text-center text-sm text-slate-500">
          There is no test result to show.
        </p>
      </div>
    );
  }

  const missed = result.wrong + result.skipped;
  const items = result.review.filter(item => {
    if (filter === 'wrong') {
      return item.chosen !== null && !item.correct;
    }
    if (filter === 'skipped') {
      return item.chosen === null;
    }
    return true;
  });

  const retry = () => {
    dispatch(retryMissed());
    navigate(PATHS.practiceSession, { replace: true });
  };

  return (
    <div className="mx-auto max-w-2xl pb-6">
      <ScreenHeader
        title="Result"
        subtitle={`${result.topicName} · ${MODES[result.mode].label}`}
        onBack={done}
      />

      <div className="mx-4 flex flex-col items-center rounded-2xl bg-blue-600 px-4 py-6">
        <AppIcon name="trophy" size={28} color="#fde68a" />
        <p className="mt-2 text-4xl font-extrabold text-white">
          {`${result.score}/${result.total}`}
        </p>
        <p className="mt-1 text-sm text-blue-100">
          {`Accuracy ${result.accuracy}% · ${formatDuration(result.timeSpentSec)}`}
        </p>
      </div>

      <div className="mx-4 mt-3 flex gap-2">
        <Stat label="Correct" value={result.correct} tint="text-green-600" />
        <Stat label="Wrong" value={result.wrong} tint="text-red-600" />
        <Stat label="Skipped" value={result.skipped} tint="text-slate-500" />
      </div>

      <div className="mx-4 mt-4 flex gap-2">
        {missed > 0 ? (
          <Button
            className="flex-1 bg-amber-500 hover:bg-amber-600"
            onClick={retry}>
            {`Retry ${missed} missed`}
          </Button>
        ) : null}
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => {
            const topicId = result.topicId;
            dispatch(clearResult());
            navigate(PATHS.practiceSetup(topicId), { replace: true });
          }}>
          New test
        </Button>
      </div>

      <h2 className="mx-4 mt-5 mb-2 text-sm font-bold text-slate-700">
        Review answers
      </h2>
      <div
        role="group"
        aria-label="Filter answers"
        className="mx-4 mb-3 flex gap-2">
        {FILTERS.map(f => (
          <Chip
            key={f.id}
            selected={f.id === filter}
            onClick={() => setFilter(f.id)}>
            {f.label}
          </Chip>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="px-8 pt-4 text-center text-sm text-slate-500">
          Nothing here. Well done!
        </p>
      ) : (
        <ul>
          {items.map(item => {
            const verdict = verdictOf(item);
            return (
              <li
                key={item.id}
                className="mx-4 mb-3 rounded-2xl bg-white p-4 shadow-sm">
                {item.ai ? <AiBadge /> : null}
                <p
                  className={`mb-2 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${verdict.bg} ${verdict.text}`}>
                  {verdict.label}
                </p>
                <p className="text-sm leading-5 font-semibold text-slate-900">
                  {item.text}
                </p>
                {item.chosen !== null && !item.correct ? (
                  <p className="mt-2 text-xs text-red-600">
                    Your answer: {LETTERS[item.chosen]}.{' '}
                    {item.options[item.chosen]}
                  </p>
                ) : null}
                <p className="mt-1 text-xs text-green-700">
                  Correct answer: {LETTERS[item.answer]}.{' '}
                  {item.options[item.answer]}
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-600">
                  {item.explanation}
                </p>
                <AskAiQuestionButton
                  item={item}
                  topicId={result.topicId}
                  topicName={result.topicName}
                />
                {item.ai ? <ReportQuestionButton questionId={item.id} /> : null}
              </li>
            );
          })}
        </ul>
      )}

      <div className="sticky bottom-[calc(3.5rem+env(safe-area-inset-bottom))] mt-4 border-t border-slate-200 bg-white px-4 pt-3 pb-4 lg:bottom-0">
        <Button size="lg" fullWidth onClick={done}>
          Done
        </Button>
      </div>
    </div>
  );
}
