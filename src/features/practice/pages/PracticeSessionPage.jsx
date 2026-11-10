import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Navigate,
  useBlocker,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import AppIcon from '@/components/common/AppIcon';
import { recordActivity } from '@/features/activity/store/activitySlice';
import BottomSheet from '@/features/material/components/BottomSheet';
import useStudySession from '@/features/study/hooks/useStudySession';
import useTimeOnScreen from '@/hooks/useTimeOnScreen';
import { PATHS } from '@/routes/routePaths';
import { showAlert } from '@/services/alerts/alertStore';
import {
  selectPracticeSession,
  selectQuestionBookmarks,
} from '@/store/selectors/practiceSelectors';
import AiBadge from '../components/AiBadge';
import QuestionPalette from '../components/QuestionPalette';
import ReportQuestionButton from '../components/ReportQuestionButton';
import {
  addActiveTime,
  clearAnswer,
  goToQuestion,
  selectOption,
  submitSession,
  toggleMarked,
  toggleQuestionBookmark,
} from '../store/practiceSlice';
import { countAnswered, formatClock } from '../utils/scoring';

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

const secondsLeft = session =>
  Math.ceil(
    (session.startedAt + session.durationSec * 1000 - Date.now()) / 1000,
  );

const isTyping = target =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

// One question at a time. Practice mode shows the answer and explanation straight away;
// a timed test keeps them back until the result, and has a timer, a question palette and
// "mark for review".
//
// Web additions over mobile:
//   - keyboard: 1-4 or A-D choose, ← / P previous, → / N next, M mark (timed test)
//   - leaving (header arrow, browser back, a sidebar link) asks first; the answers are saved
//   - closing or reloading the tab during a TIMED test asks first (an untimed session is
//     saved and simply resumes, so it is not interrupted)
//   - desktop shows the palette beside the question; phones open it in a sheet
export default function PracticeSessionPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const session = useSelector(selectPracticeSession);
  const bookmarks = useSelector(selectQuestionBookmarks);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [remaining, setRemaining] = useState(() =>
    session?.durationSec ? secondsLeft(session) : null,
  );
  // True once the student chose to leave or submit. The state makes the page render nothing
  // meanwhile; the ref is what the navigation blocker reads at the moment of navigating.
  const [leaving, setLeaving] = useState(false);
  const leavingRef = useRef(false);

  const reportTime = useTimeOnScreen(seconds =>
    dispatch(addActiveTime(seconds)),
  );

  // Study session: a test keeps its own clock, this one only counts real activity.
  const { touchProps } = useStudySession({
    type: session?.mode === 'test' ? 'test' : 'practice',
    refId: session?.topicId,
  });

  const finish = useCallback(() => {
    leavingRef.current = true;
    setLeaving(true);
    reportTime(); // count the time on this page before grading
    dispatch(submitSession());
    navigate(PATHS.practiceResult, { replace: true });
  }, [dispatch, navigate, reportTime]);

  // Timed test: tick every second and submit when the time is up.
  const timed = Boolean(session?.durationSec);
  useEffect(() => {
    if (!timed) {
      return undefined;
    }
    const tick = () => {
      const left = secondsLeft(session);
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
    // Only the session identity matters, not each answer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timed, session?.id, finish]);

  // Remember this test so Home can offer Continue.
  const sessionId = session?.id;
  const sessionTopicId = session?.topicId;
  useEffect(() => {
    if (sessionId) {
      dispatch(
        recordActivity({
          type: 'practice',
          mode: 'practice',
          topicId: sessionTopicId,
        }),
      );
    }
  }, [dispatch, sessionId, sessionTopicId]);

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
      timed
        ? 'Your answers are saved, but the timer keeps running.'
        : 'Your answers are saved and you can resume later.',
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
  }, [blocker, timed]);

  // Closing or reloading the tab in the middle of a timed test.
  useEffect(() => {
    if (!timed || leaving) {
      return undefined;
    }
    const warn = event => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [timed, leaving]);

  const total = session?.questions.length ?? 0;
  const question = session?.questions[session.current];
  const chosen = question ? session.answers[question.id] : undefined;
  const answered = chosen !== undefined;
  const isPractice = session?.mode === 'practice';
  const revealed = isPractice && answered;
  const isLast = session ? session.current === total - 1 : false;
  const unanswered = session ? total - countAnswered(session) : 0;

  const confirmSubmit = () => {
    setPaletteOpen(false);
    if (unanswered === 0) {
      finish();
      return;
    }
    showAlert(
      isPractice ? 'Finish practice?' : 'Submit test?',
      `${unanswered} question${
        unanswered === 1 ? ' is' : 's are'
      } still unanswered.`,
      [
        { text: 'Keep going', style: 'cancel' },
        { text: isPractice ? 'Finish' : 'Submit', onPress: finish },
      ],
    );
  };

  const goBack = () =>
    location.key === 'default'
      ? navigate(PATHS.topic(session.topicId))
      : navigate(-1);

  // Keyboard shortcuts. The handler reads the latest state through a ref so the listener is
  // added only once.
  const latest = useRef(null);
  useEffect(() => {
    latest.current = { session, question, isPractice, isLast, paletteOpen };
  });
  useEffect(() => {
    const onKeyDown = event => {
      const state = latest.current;
      if (
        !state?.session ||
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        isTyping(event.target) ||
        document.querySelector('[role="dialog"], [role="alertdialog"]')
      ) {
        return;
      }
      const key = event.key.toLowerCase();
      const optionIndex = /^[1-5]$/.test(key)
        ? Number(key) - 1
        : 'abcde'.indexOf(key);
      if (optionIndex >= 0 && optionIndex < state.question.options.length) {
        event.preventDefault();
        dispatch(selectOption(optionIndex));
      } else if (key === 'arrowright' || key === 'n') {
        if (!state.isLast) {
          event.preventDefault();
          dispatch(goToQuestion(state.session.current + 1));
        }
      } else if (key === 'arrowleft' || key === 'p') {
        if (state.session.current > 0) {
          event.preventDefault();
          dispatch(goToQuestion(state.session.current - 1));
        }
      } else if (key === 'm' && !state.isPractice) {
        event.preventDefault();
        dispatch(toggleMarked());
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [dispatch]);

  // No session (finished elsewhere, or discarded): nothing to show here.
  if (!session) {
    return leaving ? null : <Navigate to={PATHS.tests} replace />;
  }

  const optionStyle = index => {
    if (revealed) {
      if (index === question.answer) {
        return 'border-green-500 bg-green-50';
      }
      if (index === chosen) {
        return 'border-red-500 bg-red-50';
      }
      return 'border-slate-200 bg-white';
    }
    return index === chosen
      ? 'border-blue-600 bg-blue-50'
      : 'border-slate-200 bg-white hover:bg-slate-50';
  };

  const bookmarked = Boolean(bookmarks[question.id]);
  const lowTime = remaining !== null && remaining <= 60;
  const jump = index => {
    dispatch(goToQuestion(index));
    setPaletteOpen(false);
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-sky-50" {...touchProps}>
      <header className="flex items-center px-4 pt-2 pb-3">
        <button
          type="button"
          onClick={goBack}
          aria-label="Leave test"
          className="mr-3 rounded-full p-2 hover:bg-slate-100">
          <AppIcon name="arrow-left" color="#0f172a" size={22} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-extrabold text-slate-900">
            {session.topicName}
          </h1>
          <p className="text-xs text-slate-500">
            {`Question ${session.current + 1} of ${total}`}
          </p>
        </div>
        {remaining !== null ? (
          <span
            role="timer"
            aria-label="Time left"
            className={`mr-3 flex items-center rounded-full px-3 py-1.5 ${
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
              {formatClock(remaining)}
            </span>
          </span>
        ) : null}
        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          aria-label="Question palette"
          className="rounded-full p-2 hover:bg-slate-100 lg:hidden">
          <AppIcon name="grid" color="#2563eb" size={22} />
        </button>
      </header>

      <div
        role="progressbar"
        aria-label="Progress through the test"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={session.current + 1}
        className="mx-4 mb-3 h-1.5 overflow-hidden rounded-full bg-sky-100">
        <div
          className="h-full rounded-full bg-blue-600 transition-[width]"
          style={{ width: `${((session.current + 1) / total) * 100}%` }}
        />
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1 overflow-y-auto pb-4">
          <div className="mx-auto max-w-3xl">
            <div className="mx-4 rounded-2xl bg-white p-4 shadow-sm">
              {question.ai ? <AiBadge /> : null}
              <div className="flex items-start">
                <p
                  id="question-text"
                  className="flex-1 text-base leading-6 font-semibold text-slate-900">
                  {question.text}
                </p>
                <button
                  type="button"
                  onClick={() => dispatch(toggleQuestionBookmark(question.id))}
                  aria-label="Bookmark question"
                  aria-pressed={bookmarked}
                  className="ml-3 rounded-full p-1 hover:bg-slate-100">
                  <AppIcon
                    name="bookmark"
                    size={20}
                    color={bookmarked ? '#2563eb' : '#94a3b8'}
                    fill={bookmarked ? '#2563eb' : 'none'}
                  />
                </button>
              </div>

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
                    className={`mb-2.5 flex w-full items-center rounded-xl border-2 px-3 py-3 text-left transition-colors ${optionStyle(
                      index,
                    )}`}>
                    <span className="mr-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                      {LETTERS[index]}
                    </span>
                    <span className="flex-1 text-sm text-slate-900">
                      {option}
                    </span>
                    {revealed && index === question.answer ? (
                      <>
                        <AppIcon
                          name="circle-check"
                          size={20}
                          color="#16a34a"
                        />
                        <span className="sr-only">Correct answer</span>
                      </>
                    ) : null}
                    {revealed &&
                    index === chosen &&
                    index !== question.answer ? (
                      <>
                        <AppIcon name="circle-x" size={20} color="#dc2626" />
                        <span className="sr-only">Your answer, wrong</span>
                      </>
                    ) : null}
                  </button>
                ))}
              </div>

              <div aria-live="polite">
                {revealed ? (
                  <div className="mt-1 rounded-xl bg-sky-50 p-3">
                    <p className="text-xs font-bold text-blue-700">
                      {chosen === question.answer ? 'Correct!' : 'Not quite'}
                    </p>
                    <p className="mt-1 text-sm leading-5 text-slate-700">
                      {question.explanation}
                    </p>
                  </div>
                ) : null}
              </div>
              {revealed && question.ai ? (
                <ReportQuestionButton questionId={question.id} />
              ) : null}
            </div>

            {!isPractice ? (
              <div className="mx-4 mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => dispatch(toggleMarked())}
                  aria-pressed={Boolean(session.marked[question.id])}
                  className="flex flex-1 items-center justify-center rounded-xl bg-white py-2.5 hover:bg-slate-50">
                  <AppIcon
                    name="flag"
                    size={16}
                    color={session.marked[question.id] ? '#d97706' : '#475569'}
                    fill={session.marked[question.id] ? '#fbbf24' : 'none'}
                  />
                  <span className="ml-2 text-xs font-semibold text-slate-700">
                    {session.marked[question.id] ? 'Marked' : 'Mark for review'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => dispatch(clearAnswer())}
                  disabled={!answered}
                  className="flex-1 rounded-xl bg-white py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40">
                  Clear answer
                </button>
              </div>
            ) : null}

            <p className="mx-4 mt-3 hidden text-xs text-slate-400 lg:block">
              Keyboard: 1–{question.options.length} or A–
              {LETTERS[question.options.length - 1]} to choose, ← → to move
              {!isPractice ? ', M to mark for review' : ''}.
            </p>
          </div>
        </div>

        <aside
          aria-label="Question palette"
          className="hidden w-72 shrink-0 overflow-y-auto border-l border-slate-200 bg-white p-4 lg:block">
          <QuestionPalette
            session={session}
            isPractice={isPractice}
            onJump={jump}
            onSubmit={confirmSubmit}
          />
        </aside>
      </div>

      <footer className="flex border-t border-slate-200 bg-white px-4 pt-3 pb-4">
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
            {isPractice ? 'Finish' : 'Submit'}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => dispatch(goToQuestion(session.current + 1))}
            className="ml-2 flex flex-1 items-center justify-center rounded-xl bg-blue-600 py-3 hover:bg-blue-700">
            <span className="mr-1 text-sm font-bold text-white">
              {isPractice && !answered ? 'Skip' : 'Next'}
            </span>
            <AppIcon name="chevron-right" size={18} color="#ffffff" />
          </button>
        )}
      </footer>

      <BottomSheet
        visible={paletteOpen}
        title="Questions"
        onClose={() => setPaletteOpen(false)}>
        <QuestionPalette
          session={session}
          isPractice={isPractice}
          onJump={jump}
          onSubmit={confirmSubmit}
        />
      </BottomSheet>
    </div>
  );
}
