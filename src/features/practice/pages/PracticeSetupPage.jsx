import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import AppIcon from '@/components/common/AppIcon';
import ScreenHeader from '@/components/common/ScreenHeader';
import ScreenLoader from '@/components/common/ScreenLoader';
import Button from '@/components/ui/Button';
import useSyllabus from '@/features/syllabus/hooks/useSyllabus';
import usePaywall from '@/hooks/usePaywall';
import { PATHS } from '@/routes/routePaths';
import { ensureOnline } from '@/services/network/ensureOnline';
import {
  selectMcqDailyLimit,
  selectMcqUsedToday,
  selectPracticeError,
  selectPracticeHistory,
  selectPracticeSession,
  selectPracticeStartStatus,
} from '@/store/selectors/practiceSelectors';
import { selectTopicById } from '@/store/selectors/syllabusSelectors';
import { startPractice } from '../store/practiceSlice';
import {
  COUNT_OPTIONS,
  MODES,
  SECONDS_PER_QUESTION,
  formatClock,
} from '../utils/scoring';

const SOURCES = [
  { id: 'bank', label: 'Question bank', icon: 'book-open' },
  { id: 'ai', label: 'AI-generated', icon: 'bot' },
];

// A row of pill-shaped choices that behaves as a radio group (arrow keys move the choice).
function Choices({ label, options, value, onChange, render }) {
  const move = (event, index) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[
      event.key
    ];
    if (!step) {
      return;
    }
    event.preventDefault();
    const next = options[(index + step + options.length) % options.length];
    onChange(next.id);
    event.currentTarget.parentElement
      .querySelector(`[data-choice="${next.id}"]`)
      ?.focus();
  };
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="mx-4 flex flex-wrap gap-2">
      {options.map((option, index) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            data-choice={option.id}
            onClick={() => onChange(option.id)}
            onKeyDown={event => move(event, index)}
            className={`flex min-h-10 items-center rounded-full px-5 text-sm font-semibold transition-colors ${
              active
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-50'
            }`}>
            {render(option, active)}
          </button>
        );
      })}
    </div>
  );
}

// Choose how to practise one topic (practice or timed test, and how many questions),
// or pick up the test that is already in progress.
export default function PracticeSetupPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { topicId } = useParams();
  const syllabus = useSyllabus(); // a link opened cold has to load the topic first
  const found = useSelector(state => selectTopicById(state, topicId));
  const session = useSelector(selectPracticeSession);
  const status = useSelector(selectPracticeStartStatus);
  const error = useSelector(selectPracticeError);
  const history = useSelector(selectPracticeHistory);
  const limit = useSelector(selectMcqDailyLimit);
  const used = useSelector(selectMcqUsedToday);
  const { openPaywall } = usePaywall();

  const [mode, setMode] = useState('practice');
  const [count, setCount] = useState(10);
  const [source, setSource] = useState('bank');

  const recent = useMemo(
    () => history.filter(h => h.topicId === topicId).slice(0, 3),
    [history, topicId],
  );

  const remaining = limit === null ? null : Math.max(0, limit - used);
  const limitReached = remaining === 0;
  const loading = status === 'loading';
  const topic = found?.topic;

  const start = async () => {
    if (!found || loading) {
      return;
    }
    if (source === 'ai' && !ensureOnline('ai')) {
      return;
    }
    const action = await dispatch(
      startPractice({
        topicId,
        topicName: found.topic.name,
        subjectId: found.subject.id,
        subjectName: found.subject.name,
        count,
        mode,
        source,
      }),
    );
    if (startPractice.fulfilled.match(action)) {
      navigate(PATHS.practiceSession, { replace: true });
    }
  };

  if (!found && !syllabus.hasData) {
    return <ScreenLoader />;
  }

  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col">
      <ScreenHeader title="Practice test" subtitle={topic?.name} />
      <div className="flex-1 pb-6">
        {session ? (
          <Link
            to={PATHS.practiceSession}
            replace
            className="mx-4 mb-4 block rounded-2xl bg-amber-100 p-4 hover:bg-amber-200">
            <span className="block text-sm font-bold text-amber-900">
              You have a test in progress
            </span>
            <span className="mt-0.5 block text-xs text-amber-800">
              {session.topicName} · {Object.keys(session.answers).length} of{' '}
              {session.questions.length} answered
            </span>
            <span className="mt-2 block text-sm font-semibold text-blue-700">
              Resume →
            </span>
          </Link>
        ) : null}

        <h2 className="mx-4 mb-2 text-sm font-bold text-slate-700">Mode</h2>
        <div
          role="radiogroup"
          aria-label="Mode"
          className="grid gap-2 px-4 sm:grid-cols-2">
          {Object.values(MODES).map(m => {
            const active = m.id === mode;
            return (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setMode(m.id)}
                className={`flex items-center rounded-2xl border-2 bg-white p-4 text-left transition-colors ${
                  active
                    ? 'border-blue-600'
                    : 'border-transparent hover:bg-slate-50'
                }`}>
                <span
                  className={`mr-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    active ? 'bg-blue-100' : 'bg-slate-100'
                  }`}>
                  <AppIcon
                    name={m.icon}
                    size={20}
                    color={active ? '#2563eb' : '#475569'}
                  />
                </span>
                <span className="flex-1">
                  <span className="block text-base font-bold text-slate-900">
                    {m.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    {m.detail}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <h2 className="mx-4 mt-4 mb-2 text-sm font-bold text-slate-700">
          Questions from
        </h2>
        <Choices
          label="Questions from"
          options={SOURCES}
          value={source}
          onChange={setSource}
          render={(option, active) => (
            <>
              <AppIcon
                name={option.icon}
                size={14}
                color={active ? '#ffffff' : '#475569'}
              />
              <span className="ml-1.5">{option.label}</span>
            </>
          )}
        />
        {source === 'ai' ? (
          <p className="mx-4 mt-2 text-xs text-slate-500">
            Fresh questions written by the AI every time. If one looks wrong,
            report it.
          </p>
        ) : null}

        <h2 className="mx-4 mt-4 mb-2 text-sm font-bold text-slate-700">
          Number of questions
        </h2>
        <Choices
          label="Number of questions"
          options={COUNT_OPTIONS.map(n => ({ id: n, n }))}
          value={count}
          onChange={setCount}
          render={option => option.n}
        />
        {mode === 'test' ? (
          <p className="mx-4 mt-2 text-xs text-slate-500">
            {`Time allowed: ${formatClock(count * SECONDS_PER_QUESTION)} (${SECONDS_PER_QUESTION} s per question). The test submits itself when time is up.`}
          </p>
        ) : null}

        {remaining !== null ? (
          <p className="mx-4 mt-4 rounded-xl bg-white px-4 py-3 text-xs text-slate-600">
            Free questions left today:{' '}
            <b className="text-slate-900">{`${remaining} of ${limit}`}</b>
          </p>
        ) : null}

        {recent.length ? (
          <div className="mx-4 mt-4">
            <h2 className="mb-2 text-sm font-bold text-slate-700">
              Your recent attempts
            </h2>
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

        {error ? (
          <p role="alert" className="mx-4 mt-3 text-sm text-red-500">
            {error}
          </p>
        ) : null}
      </div>

      <div className="sticky bottom-0 border-t border-slate-200 bg-white px-4 pt-3 pb-4">
        {limitReached ? (
          <Button
            size="lg"
            fullWidth
            className="bg-amber-500 hover:bg-amber-600"
            onClick={() => openPaywall('extendedPractice')}>
            Daily limit reached · See Pro
          </Button>
        ) : (
          <Button
            size="lg"
            fullWidth
            loading={loading}
            disabled={!topic}
            onClick={start}>
            Start {mode === 'test' ? 'test' : 'practice'}
          </Button>
        )}
      </div>
    </div>
  );
}
