import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import AppIcon from '@/components/common/AppIcon';
import NoticeBanner from '@/components/common/NoticeBanner';
import ErrorState from '@/components/feedback/ErrorState';
import useContinueLearning from '@/features/activity/hooks/useContinueLearning';
import usePerformance from '@/features/analytics/hooks';
import usePlan from '@/features/plan/hooks';
import useStreak from '@/features/study/hooks/useStreak';
import useSyllabus from '@/features/syllabus/hooks/useSyllabus';
import usePaywall from '@/hooks/usePaywall';
import { PATHS } from '@/routes/routePaths';
import { selectAttemptStats } from '@/store/selectors/attemptStatsSelectors';
import { selectTotalStudyHours } from '@/store/selectors/studySelectors';
import { selectSyllabusProgress } from '@/store/selectors/syllabusSelectors';
import AskAiButton from '../components/AskAiButton';
import ContinueLearning from '../components/ContinueLearning';
import GreetingSection from '../components/GreetingSection';
import HeroBanner from '../components/HeroBanner';
import HomeSkeleton from '../components/HomeSkeleton';
import MotivationBanner from '../components/MotivationBanner';
import OmrScannerCard from '../components/OmrScannerCard';
import PopularExams from '../components/PopularExams';
import PreparationProgress from '../components/PreparationProgress';
import QuickActions from '../components/QuickActions';
import StreakCard from '../components/StreakCard';
import StudyPlanCard from '../components/StudyPlanCard';
import StudyTimeCard from '../components/StudyTimeCard';
import WeakTopicsCard from '../components/WeakTopicsCard';
import useHome from '../hooks/useHome';

// Where each quick-action tile goes.
const ACTION_PATH = {
  study: PATHS.studyMaterial,
  mcq: PATHS.tests,
  mock: PATHS.mocks,
  ask: PATHS.ask,
};

// The dashboard. Order (mobile plan.md 5.4): greeting, banner, shortcuts, preparation
// progress, today's plan, study time + streak, continue learning, weak topics, popular exams,
// motivation. One column on phones; from 1024 px the cards sit two to a row.
export default function HomePage() {
  const navigate = useNavigate();
  const { data, status, error, refresh } = useHome();
  const { hasData: syllabusReady } = useSyllabus();
  const syllabus = useSelector(selectSyllabusProgress);
  const attemptStats = useSelector(selectAttemptStats);
  const studyHours = useSelector(selectTotalStudyHours);
  const { item: continueItem, resume } = useContinueLearning();
  const { openPaywall } = usePaywall();
  const { weakTopics: localWeak } = usePerformance('all');
  const plan = usePlan();
  const streak = useStreak();

  if (!data) {
    // Nothing saved yet: placeholders while loading, a retry when it failed.
    return status === 'failed' ? (
      <ErrorState message={error} onRetry={refresh} />
    ) : (
      <HomeSkeleton />
    );
  }

  // Everything on the progress card comes from what the student actually did.
  const progressPercent = syllabusReady
    ? syllabus.percent
    : data.progress.percent;
  const progressStats = { ...attemptStats, studyHours };

  // The server's list once it sends one; until then the topics worked out on the device.
  const weakTopics = data.weakTopics?.length
    ? data.weakTopics
    : localWeak.slice(0, 3).map(t => ({
        id: t.id,
        name: t.name,
        accuracy: t.accuracy,
      }));

  const refreshing = status === 'loading' || status === 'refreshing';

  return (
    <div className="mx-auto max-w-6xl pb-28 lg:pb-10" aria-busy={refreshing}>
      {status === 'failed' ? (
        <NoticeBanner
          message="Couldn't refresh. Showing your saved data."
          actionLabel="Retry"
          onAction={refresh}
        />
      ) : null}

      <div className="flex items-center justify-between px-4 pt-3 pb-3">
        <GreetingSection name={data.user?.name} />
        <button
          type="button"
          onClick={refresh}
          aria-label="Refresh Home"
          className="rounded-full p-2 hover:bg-slate-100">
          <AppIcon
            name="repeat"
            color="#475569"
            size={20}
            className={refreshing ? 'animate-spin' : ''}
          />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 px-4 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <HeroBanner
            hero={data.hero}
            onStart={() => (continueItem ? resume() : navigate(PATHS.syllabus))}
          />
        </div>
        <div className="-mt-2 lg:col-span-2">
          <OmrScannerCard />
        </div>
        <div className="lg:col-span-2">
          <QuickActions
            actions={data.quickActions}
            toFor={action => ACTION_PATH[action.id] ?? PATHS.home}
          />
        </div>

        <PreparationProgress
          percent={progressPercent}
          message={data.progress.message}
          stats={progressStats}
          detailsTo={PATHS.syllabus}
        />
        <StudyPlanCard
          tasks={plan.tasks}
          doneCount={plan.doneCount}
          minutes={plan.minutes}
        />
        <div className="grid grid-cols-2 gap-3">
          <StudyTimeCard
            minutes={streak.todayMinutes}
            targetMinutes={streak.targetMinutes}
          />
          <StreakCard streak={streak} />
        </div>
        <ContinueLearning
          items={continueItem ? [continueItem] : []}
          onContinue={resume}
          onBrowse={() => navigate(PATHS.syllabus)}
        />
        <WeakTopicsCard
          topics={weakTopics}
          onUpgrade={() => openPaywall('weakTopics')}
        />
        <PopularExams exams={data.popularExams} />
        <div className="lg:col-span-2">
          <MotivationBanner message={data.motivation} />
        </div>
      </div>

      <AskAiButton />
    </div>
  );
}
