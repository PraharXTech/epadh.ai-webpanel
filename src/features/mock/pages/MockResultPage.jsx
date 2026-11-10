import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AppIcon from '@/components/common/AppIcon';
import ScreenHeader from '@/components/common/ScreenHeader';
import ScreenLoader from '@/components/common/ScreenLoader';
import Button from '@/components/ui/Button';
import Chip from '@/components/ui/Chip';
import AskAiQuestionButton from '@/features/aiTutor/components/AskAiQuestionButton';
import useGoBack from '@/hooks/useGoBack';
import { PATHS } from '@/routes/routePaths';
import {
  selectMockResult,
  selectMockSubmitStatus,
} from '@/store/selectors/mockSelectors';
import { clearResult, syncPendingRank } from '../store/mockSlice';
import { MIN_PARTICIPANTS, formatDuration } from '../utils/scoring';

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'wrong', label: 'Wrong' },
  { id: 'unattempted', label: 'Unattempted' },
  { id: 'marked', label: 'Marked' },
];

const verdictOf = item => {
  if (item.chosen === null) {
    return { label: 'Unattempted', text: 'text-slate-500', bg: 'bg-slate-100' };
  }
  return item.correct
    ? { label: 'Correct', text: 'text-green-700', bg: 'bg-green-100' }
    : { label: 'Wrong', text: 'text-red-700', bg: 'bg-red-100' };
};

const Stat = ({ label, value, tint }) => (
  <li className="flex-1 rounded-xl bg-white py-3 text-center">
    <p className={`text-lg font-extrabold ${tint}`}>{value}</p>
    <p className="mt-0.5 text-[11px] text-slate-500">{label}</p>
  </li>
);

// Score with negative marking, section breakdown, rank / percentile, and a filterable
// question-by-question review: the mock equivalent of the practice result, with the plan's
// "Solutions" folded in so there is one page to build and test.
export default function MockResultPage() {
  const dispatch = useDispatch();
  const result = useSelector(selectMockResult);
  const submitting = useSelector(selectMockSubmitStatus) === 'submitting';
  const [filter, setFilter] = useState('all');
  const rankPending = Boolean(result?.rankPending);
  const goBack = useGoBack(PATHS.tests);

  // An attempt submitted offline gets its rank as soon as a request goes through.
  useEffect(() => {
    if (rankPending) {
      dispatch(syncPendingRank());
    }
  }, [rankPending, dispatch]);

  // Done: one step back (the list the test was started from), or the Tests hub when this page
  // was opened directly.
  const done = () => {
    dispatch(clearResult());
    goBack();
  };

  if (!result) {
    return submitting ? (
      <ScreenLoader />
    ) : (
      <div className="mx-auto max-w-3xl">
        <ScreenHeader title="Result" />
        <p className="px-8 pt-16 text-center text-sm text-slate-500">
          There is no result to show.
        </p>
      </div>
    );
  }

  const items = result.review.filter(item => {
    if (filter === 'wrong') {
      return item.chosen !== null && !item.correct;
    }
    if (filter === 'unattempted') {
      return item.chosen === null;
    }
    if (filter === 'marked') {
      return item.marked;
    }
    return true;
  });

  return (
    <div className="mx-auto max-w-3xl pb-8">
      <ScreenHeader title="Result" subtitle={result.testName} onBack={done} />

      <section
        aria-label="Score"
        className="mx-4 flex flex-col items-center rounded-2xl bg-blue-600 px-4 py-6">
        <AppIcon name="trophy" size={28} color="#fde68a" />
        <p className="mt-2 text-4xl font-extrabold text-white">
          {`${result.score}/${result.maxScore}`}
        </p>
        <p className="mt-1 text-sm text-blue-100">
          {`Accuracy ${result.accuracy}% · ${formatDuration(result.timeSpentSec)}`}
        </p>
        {result.negativeApplied > 0 ? (
          <p className="mt-1 text-xs text-blue-100">
            {`Includes −${result.negativeApplied} for wrong answers`}
          </p>
        ) : null}
      </section>

      <ul className="mx-4 mt-3 flex gap-2">
        <Stat label="Correct" value={result.correct} tint="text-green-600" />
        <Stat label="Wrong" value={result.wrong} tint="text-red-600" />
        <Stat
          label="Unattempted"
          value={result.unattempted}
          tint="text-slate-500"
        />
      </ul>

      <section
        aria-label="Rank"
        className="mx-4 mt-3 flex items-center rounded-2xl bg-white px-4 py-3 shadow-sm">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100">
          <AppIcon name="medal" size={18} color="#7c3aed" />
        </span>
        <div className="ml-3 flex-1" aria-live="polite">
          {rankPending ? (
            <>
              <p className="text-sm font-bold text-slate-900">
                Rank on its way
              </p>
              <p className="text-xs text-slate-500">
                Your score is saved. The rank appears once you are back online.
              </p>
            </>
          ) : result.participants < MIN_PARTICIPANTS ? (
            <>
              <p className="text-sm font-bold text-slate-900">
                Not enough participants yet
              </p>
              <p className="text-xs text-slate-500">
                {`Rank is shown once ${MIN_PARTICIPANTS} students have taken this test.`}
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-bold text-slate-900">
                Rank {result.rank} of {result.participants}
              </p>
              <p className="text-xs text-slate-500">
                {result.percentile}th percentile
              </p>
            </>
          )}
        </div>
      </section>
      <p className="mx-4 mt-2 text-[11px] leading-4 text-slate-400">
        Ranking is among epadh.ai's own participants, not an official national
        rank.
      </p>

      {result.sectionStats.length > 1 ? (
        <>
          <h2 className="mx-4 mt-4 mb-2 text-sm font-bold text-slate-700">
            Section-wise
          </h2>
          <ul className="mx-4 rounded-2xl bg-white px-4 shadow-sm">
            {result.sectionStats.map((s, index) => (
              <li
                key={s.subjectId}
                className={`flex items-center justify-between py-3 ${
                  index > 0 ? 'border-t border-slate-100' : ''
                }`}>
                <span className="text-sm text-slate-700">{s.subjectName}</span>
                <span className="text-xs text-slate-500">
                  {s.correct}/{s.total} correct ·{' '}
                  {Math.round(s.marks * 100) / 100} marks
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <h2 className="mx-4 mt-5 mb-2 text-sm font-bold text-slate-700">
        Solutions
      </h2>
      <div
        role="group"
        aria-label="Filter solutions"
        className="mx-4 mb-3 flex flex-wrap gap-2">
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
          Nothing here.
        </p>
      ) : (
        <ul>
          {items.map(item => {
            const verdict = verdictOf(item);
            return (
              <li
                key={item.id}
                className="mx-4 mb-3 rounded-2xl bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${verdict.bg} ${verdict.text}`}>
                    {verdict.label}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {item.subjectName}
                  </span>
                </div>
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
                <AskAiQuestionButton item={item} />
              </li>
            );
          })}
        </ul>
      )}

      <div className="mx-4 mt-4">
        <Button fullWidth size="lg" onClick={done}>
          Done
        </Button>
      </div>
    </div>
  );
}
