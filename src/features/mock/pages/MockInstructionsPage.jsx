import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AppIcon from '@/components/common/AppIcon';
import ScreenHeader from '@/components/common/ScreenHeader';
import ScreenLoader from '@/components/common/ScreenLoader';
import Button from '@/components/ui/Button';
import usePaywall from '@/hooks/usePaywall';
import { PATHS } from '@/routes/routePaths';
import { showAlert } from '@/services/alerts/alertStore';
import {
  selectMockError,
  selectMockSession,
  selectMockStartStatus,
} from '@/store/selectors/mockSelectors';
import { fetchMockTestById } from '../services/mockService';
import { startMock } from '../store/mockSlice';

const SUBJECT_NAMES = {
  quant: 'Quantitative Aptitude',
  reasoning: 'Reasoning',
  gk: 'General Awareness',
};

const RULES = [
  'The timer starts as soon as you begin and submits the test automatically when it runs out.',
  'Use "Save & Next" to move on, "Mark for Review" to come back later, and the question palette to jump anywhere.',
  'You can change an answer any time before submitting.',
  'Keyboard: 1–4 or A–D choose an answer, ← → move between questions, M marks for review.',
  'Do not close or reload this tab while the test is running. Your answers are saved as you go, but the timer keeps running.',
];

// Duration, marks, negative marking and rules before a mock test starts. "Start test"
// generates the paper and opens the session. Web additions: the keyboard and "keep the tab
// open" rules, and a warning before a different test in progress is replaced.
export default function MockInstructionsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { testId } = useParams();
  const [found, setFound] = useState({ id: null, test: null });

  const session = useSelector(selectMockSession);
  const startStatus = useSelector(selectMockStartStatus);
  const startError = useSelector(selectMockError);
  const starting = startStatus === 'loading';
  const inProgress = session?.testId === testId;
  const { canUse, openPaywall } = usePaywall();

  // `found.id` says which test `found.test` belongs to, so a stale answer for the previous
  // URL is never shown while the next one loads.
  useEffect(() => {
    let cancelled = false;
    fetchMockTestById(testId).then(test => {
      if (!cancelled) {
        setFound({ id: testId, test });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [testId]);
  const loaded = found.id === testId;
  const test = loaded ? found.test : null;
  const locked = Boolean(test?.premium) && !canUse('advancedMocks');

  const begin = async () => {
    const action = await dispatch(startMock(testId));
    if (startMock.fulfilled.match(action)) {
      navigate(PATHS.mockSession, { replace: true });
    }
  };

  // Starting a different test throws away the one in progress: say so first.
  const start = () => {
    if (session && !inProgress) {
      showAlert(
        'Replace the test in progress?',
        `Starting this test discards your attempt of "${session.testName}".`,
        [
          { text: 'Keep it', style: 'cancel' },
          { text: 'Start new test', style: 'destructive', onPress: begin },
        ],
        { tone: 'warning' },
      );
      return;
    }
    begin();
  };

  if (!loaded) {
    return <ScreenLoader />;
  }
  if (!test) {
    return (
      <div className="mx-auto max-w-3xl">
        <ScreenHeader title="Mock test" />
        <p className="px-8 pt-16 text-center text-sm text-slate-500">
          This test is no longer available.
        </p>
      </div>
    );
  }

  const negative = test.negativePerWrong
    ? `−${test.negativePerWrong * (test.marks / test.questions)} per wrong answer`
    : 'No negative marking';
  const facts = [
    ['file-text', `${test.questions} questions`],
    ['clock', `${test.minutes} minutes`],
    ['trophy', `${test.marks} marks`],
    ['circle-alert', negative],
  ];

  return (
    <div className="mx-auto max-w-3xl pb-8">
      <ScreenHeader title={test.name} subtitle={test.subtitle} />

      {inProgress ? (
        <Link
          to={PATHS.mockSession}
          replace
          className="mx-4 mb-4 block rounded-2xl bg-amber-100 p-4 hover:bg-amber-200">
          <span className="block text-sm font-bold text-amber-900">
            You have this test in progress
          </span>
          <span className="mt-0.5 block text-xs text-amber-800">
            {Object.keys(session.answers).length} of {session.questions.length}{' '}
            answered
          </span>
          <span className="mt-2 block text-sm font-semibold text-blue-700">
            Resume →
          </span>
        </Link>
      ) : null}

      <ul className="mx-4 grid grid-cols-2 gap-x-2 gap-y-3 rounded-2xl bg-white p-4 shadow-sm">
        {facts.map(([icon, label]) => (
          <li key={icon} className="flex items-center">
            <AppIcon name={icon} size={16} color="#2563eb" />
            <span className="ml-2 flex-1 text-xs font-semibold text-slate-700">
              {label}
            </span>
          </li>
        ))}
      </ul>

      <h2 className="mx-4 mt-5 mb-2 text-sm font-bold text-slate-700">
        Sections
      </h2>
      <ul className="mx-4 rounded-2xl bg-white px-4 shadow-sm">
        {test.subjects.map((subjectId, index) => (
          <li
            key={subjectId}
            className={`flex items-center justify-between py-3 ${
              index > 0 ? 'border-t border-slate-100' : ''
            }`}>
            <span className="text-sm text-slate-700">
              {SUBJECT_NAMES[subjectId]}
            </span>
            <span className="text-xs text-slate-500">
              {Math.round(test.questions / test.subjects.length)} Qs
            </span>
          </li>
        ))}
      </ul>

      <h2 className="mx-4 mt-5 mb-2 text-sm font-bold text-slate-700">
        Instructions
      </h2>
      <ul className="mx-4 rounded-2xl bg-white p-4 shadow-sm">
        {RULES.map(rule => (
          <li key={rule} className="mb-2 flex items-start last:mb-0">
            <span aria-hidden="true" className="mr-2 text-sm text-blue-600">
              •
            </span>
            <span className="flex-1 text-xs leading-5 text-slate-600">
              {rule}
            </span>
          </li>
        ))}
      </ul>

      <p className="mx-4 mt-4 text-[11px] leading-4 text-slate-400">
        Your rank and percentile after this test are among epadh.ai's own
        participants, not an official national rank.
      </p>

      {startError ? (
        <p role="alert" className="mx-4 mt-3 text-sm text-red-500">
          {startError}
        </p>
      ) : null}

      <div className="mx-4 mt-6">
        {locked ? (
          <Button
            fullWidth
            size="lg"
            icon="crown"
            className="!bg-amber-500 hover:!bg-amber-600"
            onClick={() => openPaywall('advancedMocks')}>
            Unlock with Pro
          </Button>
        ) : (
          <Button
            fullWidth
            size="lg"
            loading={starting}
            onClick={
              inProgress
                ? () => navigate(PATHS.mockSession, { replace: true })
                : start
            }>
            {inProgress ? 'Resume test' : 'Start test'}
          </Button>
        )}
      </div>
    </div>
  );
}
