import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, useBlocker, useNavigate } from 'react-router-dom';
import AppIcon from '@/components/common/AppIcon';
import ScreenLoader from '@/components/common/ScreenLoader';
import Chip from '@/components/ui/Chip';
import BottomSheet from '@/features/material/components/BottomSheet';
import QuestionPalette from '@/features/practice/components/QuestionPalette';
import useStudySession from '@/features/study/hooks/useStudySession';
import useGoBack from '@/hooks/useGoBack';
import { PATHS } from '@/routes/routePaths';
import { showAlert } from '@/services/alerts/alertStore';
import { subscribePageVisibility } from '@/services/page/visibility';
import {
  selectMockSession,
  selectMockSync,
} from '@/store/selectors/mockSelectors';
import {
  clearAnswer,
  goToQuestion,
  selectOption,
  submitMock,
  syncAnswers,
  toggleMarked,
} from '../store/mockSlice';
import {
  countAnswered,
  countMarked,
  formatClock,
  serverNow,
} from '../utils/scoring';

const AUTOSAVE_MS = 5000;
const LETTERS = ['A', 'B', 'C', 'D', 'E'];

// On the server's clock, so changing the computer's time does not stretch the test.
const secondsLeft = session =>
  Math.ceil((session.endsAt - serverNow(session)) / 1000);

const isTyping = target =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

// A full timed mock attempt: timer, section tabs, question palette, mark for review, clear,
// save & next. Answers stay hidden until the result page, unlike practice.
//
// Web additions over mobile:
//   - keyboard: 1-5 or A-E choose, ← / P previous, → / N next, M mark for review
//   - the palette sits beside the question from 1024 px; phones open it in a sheet
//   - leaving (header arrow, browser back, a sidebar link) asks first, and closing or reloading
//     the tab asks too (the timer keeps running either way)
//   - optional full screen; leaving the tab is counted and shown, never punished
//   - submitting waits for the grading to finish before the result page opens
export default function MockSessionPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const session = useSelector(selectMockSession);
  const sync = useSelector(selectMockSync);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [remaining, setRemaining] = useState(() =>
    session ? secondsLeft(session) : null,
  );
  const [tabLeaves, setTabLeaves] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  // True once the student chose to leave or submit. The state makes the page render a spinner
  // meanwhile; the ref is what the navigation blocker reads at the moment of navigating.
  const [leaving, setLeaving] = useState(false);
  const leavingRef = useRef(false);
  const submittingRef = useRef(false);

  const { touchProps } = useStudySession({
    type: 'test',
    refId: session?.testId,
  });

  const finish = useCallback(async () => {
    if (submittingRef.current) {
      return; // the timer and a click can both ask, once
    }
    submittingRef.current = true;
    leavingRef.current = true;
    setLeaving(true);
    const action = await dispatch(submitMock());
    if (submitMock.rejected.match(action)) {
      submittingRef.current = false;
      leavingRef.current = false;
      setLeaving(false);
      showAlert(
        'Could not submit',
        action.payload ?? 'Please try again.',
        null,
        { tone: 'warning' },
      );
      return;
    }
    navigate(PATHS.mockResult, { replace: true });
  }, [dispatch, navigate]);

  // The timer, the autosave and the keyboard handler read the latest state through this ref,
  // so their intervals and listeners are set up once per attempt, not on every answer.
  const latest = useRef({ session, sync });
  useEffect(() => {
    latest.current = { session, sync };
  });

  // Tick every second and auto-submit when the clock runs out.
  const sessionId = session?.id;
  useEffect(() => {
    if (!sessionId) {
      return undefined;
    }
    const tick = () => {
      const { session: now } = latest.current;
      if (!now) {
        return;
      }
      const left = secondsLeft(now);
      setRemaining(Math.max(0, left));
      if (left <= 0) {
        showAlert('Time is up', 'Your test has been submitted.', null, {
          icon: 'clock',
        });
        finish();
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [sessionId, finish]);

  // Autosave: every few seconds, whenever an answer or a mark changed since the last save.
  // A failed save leaves the "Offline" note up and is retried with everything answered so far.
  const lastSaved = useRef(null);
  useEffect(() => {
    if (!sessionId) {
      return undefined;
    }
    const id = setInterval(() => {
      const { session: now, sync: state } = latest.current;
      if (!now || submittingRef.current) {
        return;
      }
      const snapshot = JSON.stringify([now.answers, now.marked]);
      if (snapshot !== lastSaved.current || state === 'offline') {
        lastSaved.current = snapshot;
        dispatch(syncAnswers());
      }
    }, AUTOSAVE_MS);
    return () => clearInterval(id);
  }, [sessionId, dispatch]);

  // Leaving the tab is only counted: a student may check a note, and a phone call must not
  // end a test. The count is shown so it is not a surprise.
  useEffect(() => {
    if (!sessionId) {
      return undefined;
    }
    return subscribePageVisibility(visible => {
      if (!visible) {
        setTabLeaves(n => n + 1);
      }
    });
  }, [sessionId]);

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);
  // Leave full screen when the test page goes away.
  useEffect(
    () => () => {
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      }
    },
    [],
  );
  const canFullscreen =
    typeof document !== 'undefined' && document.fullscreenEnabled === true;
  const toggleFullscreen = () => {
    const request = document.fullscreenElement
      ? document.exitFullscreen()
      : document.documentElement.requestFullscreen();
    request?.catch(() => {}); // refused (e.g. by the browser's policy): nothing to do
  };

  // Leaving by any route (header arrow, browser back, sidebar link) asks first.
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      !leavingRef.current &&
      Boolean(session) &&
      currentLocation.pathname !== nextLocation.pathname,
  );
  useEffect(() => {
    if (blocker.state !== 'blocked') {
      return;
    }
    showAlert(
      'Leave this test?',
      'Your answers are saved, but the timer keeps running.',
      [
        { text: 'Stay', style: 'cancel', onPress: () => blocker.reset() },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => {
            leavingRef.current = true;
            blocker.proceed();
          },
        },
      ],
      { tone: 'warning' },
    );
  }, [blocker]);

  // Closing or reloading the tab in the middle of the test.
  useEffect(() => {
    if (!sessionId || leaving) {
      return undefined;
    }
    const warn = event => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [sessionId, leaving]);

  const total = session?.questions.length ?? 0;
  const question = session?.questions[session.current];
  const isLast = session ? session.current === total - 1 : false;

  // Keyboard shortcuts, reading the latest state through the ref so the listener is added
  // once. Ignored while typing, or while a dialog is open.
  useEffect(() => {
    const onKeyDown = event => {
      const state = latest.current?.session;
      if (
        !state ||
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        isTyping(event.target) ||
        document.querySelector('[role="dialog"], [role="alertdialog"]')
      ) {
        return;
      }
      const current = state.questions[state.current];
      const key = event.key.toLowerCase();
      const optionIndex = /^[1-5]$/.test(key)
        ? Number(key) - 1
        : 'abcde'.indexOf(key);
      if (optionIndex >= 0 && optionIndex < current.options.length) {
        event.preventDefault();
        dispatch(selectOption(optionIndex));
      } else if (key === 'arrowright' || key === 'n') {
        if (state.current < state.questions.length - 1) {
          event.preventDefault();
          dispatch(goToQuestion(state.current + 1));
        }
      } else if (key === 'arrowleft' || key === 'p') {
        if (state.current > 0) {
          event.preventDefault();
          dispatch(goToQuestion(state.current - 1));
        }
      } else if (key === 'm') {
        event.preventDefault();
        dispatch(toggleMarked());
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [dispatch]);

  const back = useGoBack(PATHS.tests);

  // No session (finished elsewhere, or never started): nothing to show here. While the
  // attempt is being submitted the session is still there, then a spinner until the result.
  if (!session) {
    return leaving ? <ScreenLoader /> : <Navigate to={PATHS.mocks} replace />;
  }

  const chosen = session.answers[question.id];
  const answered = chosen !== undefined;
  const unanswered = total - countAnswered(session);
  const currentSection = session.sections.find(
    s => session.current >= s.start && session.current <= s.end,
  );
  const lowTime = remaining !== null && remaining <= 60;

  // Submit always goes through the summary (answered / not answered / marked).
  const confirmSubmit = () => {
    setPaletteOpen(false);
    setSummaryOpen(true);
  };
  const jump = index => {
    dispatch(goToQuestion(index));
    setPaletteOpen(false);
  };
  const marked = Boolean(session.marked[question.id]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-sky-50" {...touchProps}>
      <header className="flex items-center px-4 pt-2 pb-3">
        <button
          type="button"
          onClick={() => back()}
          aria-label="Leave test"
          className="mr-3 rounded-full p-2 hover:bg-slate-100">
          <AppIcon name="arrow-left" color="#0f172a" size={22} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-extrabold text-slate-900">
            {session.testName}
          </h1>
          <p className="truncate text-xs text-slate-500">
            {`Question ${session.current + 1} of ${total}`}
            {currentSection ? ` · ${currentSection.subjectName}` : ''}
            {sync === 'offline' ? ' · Offline, will sync' : ''}
          </p>
        </div>
        {tabLeaves > 0 ? (
          <span
            title="Times you left this tab. Only counted, never penalised."
            className="mr-2 hidden items-center rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800 sm:flex">
            {`Left tab ${tabLeaves}×`}
          </span>
        ) : null}
        {canFullscreen ? (
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-pressed={fullscreen}
            aria-label={fullscreen ? 'Exit full screen' : 'Full screen'}
            className="mr-1 hidden rounded-full p-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 sm:block">
            {fullscreen ? 'Exit full screen' : 'Full screen'}
          </button>
        ) : null}
        <span
          role="timer"
          aria-label="Time left"
          className={`mr-2 flex items-center rounded-full px-3 py-1.5 ${
            lowTime ? 'bg-red-100' : 'bg-white'
          }`}>
          <AppIcon
            name="clock"
            size={14}
            color={lowTime ? '#dc2626' : '#475569'}
          />
          <span
            className={`ml-1 text-sm font-bold ${
              lowTime ? 'text-red-600' : 'text-slate-800'
            }`}>
            {formatClock(remaining ?? 0)}
          </span>
        </span>
        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          aria-label="Question palette"
          className="rounded-full p-2 hover:bg-slate-100 lg:hidden">
          <AppIcon name="grid" color="#2563eb" size={22} />
        </button>
      </header>

      {session.sections.length > 1 ? (
        <div
          role="group"
          aria-label="Sections"
          className="mb-2 flex shrink-0 gap-2 overflow-x-auto px-4 pb-1">
          {session.sections.map(s => (
            <Chip
              key={s.subjectId}
              selected={s === currentSection}
              onClick={() => dispatch(goToQuestion(s.start))}>
              {s.subjectName}
            </Chip>
          ))}
        </div>
      ) : null}

      <div
        role="progressbar"
        aria-label="Progress through the test"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={session.current + 1}
        className="mx-4 mb-3 h-1.5 shrink-0 overflow-hidden rounded-full bg-sky-100">
        <div
          className="h-full rounded-full bg-blue-600 transition-[width]"
          style={{ width: `${((session.current + 1) / total) * 100}%` }}
        />
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1 overflow-y-auto pb-4">
          <div className="mx-auto max-w-3xl">
            <div className="mx-4 rounded-2xl bg-white p-4 shadow-sm">
              <p
                id="question-text"
                className="text-base leading-6 font-semibold text-slate-900">
                {question.text}
              </p>
              <div
                role="radiogroup"
                aria-labelledby="question-text"
                className="mt-4">
                {question.options.map((option, index) => (
                  <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={index === chosen}
                    onClick={() => dispatch(selectOption(index))}
                    className={`mb-2.5 flex w-full items-center rounded-xl border-2 px-3 py-3 text-left transition-colors ${
                      index === chosen
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}>
                    <span className="mr-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                      {LETTERS[index]}
                    </span>
                    <span className="flex-1 text-sm text-slate-900">
                      {option}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mx-4 mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => dispatch(toggleMarked())}
                aria-pressed={marked}
                className="flex flex-1 items-center justify-center rounded-xl bg-white py-2.5 hover:bg-slate-50">
                <AppIcon
                  name="flag"
                  size={16}
                  color={marked ? '#d97706' : '#475569'}
                  fill={marked ? '#fbbf24' : 'none'}
                />
                <span className="ml-2 text-xs font-semibold text-slate-700">
                  {marked ? 'Marked' : 'Mark for review'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => dispatch(clearAnswer())}
                disabled={!answered}
                className="flex-1 rounded-xl bg-white py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40">
                Clear response
              </button>
            </div>

            <p className="mx-4 mt-3 hidden text-xs text-slate-400 lg:block">
              Keyboard: 1–{question.options.length} or A–
              {LETTERS[question.options.length - 1]} to choose, ← → to move, M
              to mark for review.
            </p>
          </div>
        </div>

        <aside
          aria-label="Question palette"
          className="hidden w-72 shrink-0 overflow-y-auto border-l border-slate-200 bg-white p-4 lg:flex lg:flex-col">
          <QuestionPalette
            session={session}
            isPractice={false}
            onJump={jump}
            onSubmit={confirmSubmit}
          />
        </aside>
      </div>

      <footer className="flex shrink-0 border-t border-slate-200 bg-white px-4 pt-3 pb-4">
        <button
          type="button"
          onClick={() => dispatch(goToQuestion(session.current - 1))}
          disabled={session.current === 0}
          className="mr-2 flex flex-1 items-center justify-center rounded-xl border border-slate-300 py-3 hover:bg-slate-50 disabled:opacity-40">
          <AppIcon name="chevron-left" size={18} color="#334155" />
          <span className="ml-1 text-sm font-semibold text-slate-700">
            Previous
          </span>
        </button>
        {isLast ? (
          <button
            type="button"
            onClick={confirmSubmit}
            className="ml-2 flex-1 rounded-xl bg-green-600 py-3 text-sm font-bold text-white hover:bg-green-700">
            Submit
          </button>
        ) : (
          <button
            type="button"
            onClick={() => dispatch(goToQuestion(session.current + 1))}
            className="ml-2 flex flex-1 items-center justify-center rounded-xl bg-blue-600 py-3 hover:bg-blue-700">
            <span className="mr-1 text-sm font-bold text-white">
              Save &amp; Next
            </span>
            <AppIcon name="chevron-right" size={18} color="#ffffff" />
          </button>
        )}
      </footer>

      <BottomSheet
        visible={summaryOpen}
        title="Submit test?"
        onClose={() => setSummaryOpen(false)}>
        <ul className="flex gap-2">
          {[
            ['Answered', total - unanswered, 'text-green-600'],
            ['Not answered', unanswered, 'text-slate-600'],
            ['Marked', countMarked(session), 'text-amber-600'],
          ].map(([label, value, tint]) => (
            <li
              key={label}
              className="flex-1 rounded-xl bg-slate-50 py-3 text-center">
              <p className={`text-xl font-extrabold ${tint}`}>{value}</p>
              <p className="mt-0.5 text-[11px] text-slate-500">{label}</p>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs leading-4 text-slate-500">
          {`Time left: ${formatClock(remaining ?? 0)}. You can't change your answers after submitting.`}
        </p>
        {tabLeaves > 0 ? (
          <p className="mt-1 text-xs leading-4 text-amber-700">
            {`You left this tab ${tabLeaves} time${tabLeaves === 1 ? '' : 's'} during the test.`}
          </p>
        ) : null}
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setSummaryOpen(false)}
            className="flex-1 rounded-xl border border-slate-300 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Keep going
          </button>
          <button
            type="button"
            onClick={() => {
              setSummaryOpen(false);
              finish();
            }}
            className="flex-1 rounded-xl bg-green-600 py-3 text-sm font-bold text-white hover:bg-green-700">
            Confirm &amp; submit
          </button>
        </div>
      </BottomSheet>

      <BottomSheet
        visible={paletteOpen}
        title="Questions"
        onClose={() => setPaletteOpen(false)}>
        <QuestionPalette
          session={session}
          isPractice={false}
          onJump={jump}
          onSubmit={confirmSubmit}
        />
      </BottomSheet>
    </div>
  );
}
