import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import AppIcon from '@/components/common/AppIcon';
import ScreenLoader from '@/components/common/ScreenLoader';
import ErrorState from '@/components/feedback/ErrorState';
import BottomSheet from '@/features/material/components/BottomSheet';
import SelectorPill from '@/features/material/components/SelectorPill';
import RecommendedCard from '@/features/mock/components/RecommendedCard';
import { fetchMockTests } from '@/features/mock/services/mockService';
import useSyllabus from '@/features/syllabus/hooks/useSyllabus';
import usePaywall from '@/hooks/usePaywall';
import { PATHS } from '@/routes/routePaths';
import { showAlert } from '@/services/alerts/alertStore';
import {
  selectSelectedExamLabel,
  selectSoleExamName,
} from '@/store/selectors/examSelectors';
import {
  selectMockHistory,
  selectMockSession,
} from '@/store/selectors/mockSelectors';
import {
  selectPracticeHistory,
  selectPracticeSession,
} from '@/store/selectors/practiceSelectors';
import CategoryChips from '../components/CategoryChips';
import TestRow from '../components/TestRow';
import TestsStatsRow from '../components/TestsStatsRow';
import {
  CATEGORIES,
  SORTS,
  buildCatalog,
  computeCatalogStats,
  filterCatalog,
  pickRecommended,
  sortCatalog,
} from '../utils/catalog';

const ABOUT_MESSAGE =
  'Mock Tests are full, timed papers modelled on the real exam. ' +
  'Practice Tests are quick, topic-wise sets with instant results. ' +
  'Chapter and Subject Tests cover a wider slice of the syllabus.';

// The Tests hub: every way to test yourself in one place. Mock papers (the Mock Tests feature),
// topic-wise practice (our own engine) and chapter / subject-wide tests built from the
// syllabus. See features/tests/utils/catalog.js for how the sources are combined.
// Web changes: the list is two columns from 768 px; the sort options open in a sheet that is a
// centred dialog on wide screens.
export default function TestsPage() {
  const navigate = useNavigate();
  const { tree, status, error, refresh, hasData } = useSyllabus();
  const { openPaywall } = usePaywall();
  const session = useSelector(selectPracticeSession);
  const history = useSelector(selectPracticeHistory);
  const mockSession = useSelector(selectMockSession);
  const mockHistory = useSelector(selectMockHistory);

  const examName = useSelector(selectSelectedExamLabel);
  const soleExamName = useSelector(selectSoleExamName); // for titles; null with several exams

  const [mockTests, setMockTests] = useState(null);
  const [mockFailed, setMockFailed] = useState(false);
  const [round, setRound] = useState(0); // bumped by Retry to load the mock tests again
  useEffect(() => {
    let cancelled = false;
    fetchMockTests().then(
      tests => {
        if (!cancelled) {
          setMockTests(tests);
        }
      },
      () => {
        if (!cancelled) {
          setMockFailed(true);
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [round]);

  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('default');
  const [sortOpen, setSortOpen] = useState(false);

  const catalog = useMemo(
    () =>
      hasData && mockTests
        ? buildCatalog({
            tree,
            mockTests,
            history,
            mockHistory,
            examName: soleExamName,
          })
        : [],
    [hasData, mockTests, tree, history, mockHistory, soleExamName],
  );
  const stats = useMemo(() => computeCatalogStats(catalog), [catalog]);
  const { popular, latest } = useMemo(
    () => pickRecommended(mockTests ?? []),
    [mockTests],
  );
  const visible = useMemo(
    () => sortCatalog(filterCatalog(catalog, { category, query }), sort),
    [catalog, category, query, sort],
  );

  const startMockTest = test => navigate(PATHS.mockInstructions(test.id));
  const openRow = row => {
    if (row.locked) {
      openPaywall('fullSyllabus');
    } else if (row.kind === 'mock' || row.kind === 'subject') {
      navigate(PATHS.mockInstructions(row.mockId));
    } else {
      navigate(PATHS.practiceSetup(row.topicId));
    }
  };

  const loading = !hasData || mockTests === null;

  let body;
  if (loading && (status === 'failed' || mockFailed)) {
    body = (
      <ErrorState
        message={error ?? 'Could not load the tests.'}
        retryLabel="Retry"
        onRetry={() => {
          if (mockFailed) {
            setMockFailed(false);
            setRound(n => n + 1);
          }
          if (status === 'failed') {
            refresh();
          }
        }}
      />
    );
  } else if (loading) {
    body = <ScreenLoader />;
  } else {
    body = (
      <>
        <TestsStatsRow
          stats={stats}
          onRankPress={() =>
            showAlert(
              'Rank in Batch',
              "Ranking arrives once timed mock tests can be submitted and scored, so it's not shown yet.",
              null,
              { icon: 'trophy' },
            )
          }
        />

        <div className="mt-4">
          <CategoryChips
            label="Test type"
            options={CATEGORIES}
            value={category}
            onChange={setCategory}
          />
        </div>

        <div className="mx-4 mt-3 flex gap-2">
          <div className="flex h-12 min-w-0 flex-1 items-center rounded-2xl bg-white px-4 shadow-sm">
            <AppIcon name="search" size={18} color="#94a3b8" />
            <input
              type="search"
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Search tests, exams or topics…"
              aria-label="Search tests"
              className="ml-2 min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
          </div>
          <button
            type="button"
            onClick={() => setSortOpen(true)}
            aria-label="Sort tests"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm hover:bg-slate-50">
            <AppIcon name="sliders-horizontal" size={18} color="#334155" />
          </button>
        </div>

        <div className="mx-4 mt-3 md:max-w-sm">
          <SelectorPill
            icon="landmark"
            label={examName}
            onPress={() => navigate(PATHS.examSelect)}
          />
        </div>

        <Link
          to={PATHS.pyq}
          aria-label="Previous year papers"
          className="mx-4 mt-3 flex items-center rounded-2xl bg-white px-4 py-3 shadow-sm hover:bg-slate-50">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
            <AppIcon name="file-text" size={20} color="#7c3aed" />
          </span>
          <span className="ml-3 flex-1">
            <span className="block text-sm font-bold text-slate-900">
              Previous Year Papers
            </span>
            <span className="block text-xs text-slate-500">
              Read every uploaded paper with its answer key
            </span>
          </span>
          <AppIcon name="chevron-right" size={18} color="#94a3b8" />
        </Link>

        {session ? (
          <Link
            to={PATHS.practiceSession}
            className="mx-4 mt-3 flex items-center rounded-2xl bg-blue-600 px-4 py-3 hover:bg-blue-700">
            <AppIcon name="clipboard-check" size={20} color="#ffffff" />
            <span className="ml-3 flex-1 text-sm font-semibold text-white">
              Resume your test in progress
            </span>
            <AppIcon name="chevron-right" size={18} color="#ffffff" />
          </Link>
        ) : null}

        {mockSession ? (
          <Link
            to={PATHS.mockSession}
            className="mx-4 mt-3 flex items-center rounded-2xl bg-blue-600 px-4 py-3 hover:bg-blue-700">
            <AppIcon name="file-text" size={20} color="#ffffff" />
            <span className="ml-3 flex-1 text-sm font-semibold text-white">
              Resume your mock test: {mockSession.testName}
            </span>
            <AppIcon name="chevron-right" size={18} color="#ffffff" />
          </Link>
        ) : null}

        {popular ? (
          <>
            <h2 className="mx-4 mt-5 mb-2 text-lg font-extrabold text-slate-900">
              Recommended for You
            </h2>
            <div className="flex gap-3 overflow-x-auto px-4 pb-1">
              <RecommendedCard
                kind="popular"
                examName={soleExamName}
                test={popular}
                onStart={startMockTest}
              />
              {latest ? (
                <RecommendedCard
                  kind="latest"
                  examName={soleExamName}
                  test={latest}
                  onStart={startMockTest}
                />
              ) : null}
            </div>
          </>
        ) : null}

        <div className="mx-4 mt-5 mb-2 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-slate-900">All Tests</h2>
          <button
            type="button"
            onClick={() => setSortOpen(true)}
            className="flex items-center rounded-lg px-2 py-1 hover:bg-blue-50">
            <span className="mr-1 text-xs font-semibold text-blue-600">
              Sort: {SORTS.find(s => s.id === sort).label}
            </span>
            <AppIcon name="sliders-horizontal" size={13} color="#2563eb" />
          </button>
        </div>
        {visible.length === 0 ? (
          <p className="px-4 pt-6 text-center text-sm text-slate-500">
            No tests match these filters.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-3 px-4 md:grid-cols-2">
            {visible.map(row => (
              <li key={row.id}>
                <TestRow row={row} onPress={openRow} />
              </li>
            ))}
          </ul>
        )}
      </>
    );
  }

  return (
    <div className="mx-auto max-w-4xl pb-8">
      <div className="flex items-start justify-between px-4 pt-2 pb-1">
        <div className="flex-1 pr-3">
          <h1 className="text-2xl font-extrabold text-slate-900">Tests</h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Practice with mock tests, topic tests and previous year questions.
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            showAlert('About Tests', ABOUT_MESSAGE, null, { icon: 'info' })
          }
          aria-label="About tests"
          className="mt-1 rounded-full p-2 hover:bg-slate-100">
          <AppIcon name="info" size={22} color="#334155" />
        </button>
      </div>
      {body}

      <BottomSheet
        visible={sortOpen}
        title="Sort tests"
        onClose={() => setSortOpen(false)}>
        <ul>
          {SORTS.map(s => (
            <li key={s.id}>
              <button
                type="button"
                aria-current={s.id === sort ? 'true' : undefined}
                onClick={() => {
                  setSort(s.id);
                  setSortOpen(false);
                }}
                className="flex w-full items-center justify-between rounded-lg px-1 py-3 hover:bg-slate-50">
                <span
                  className={`text-sm ${
                    s.id === sort ? 'font-bold text-blue-600' : 'text-slate-700'
                  }`}>
                  {s.label}
                </span>
                {s.id === sort ? (
                  <AppIcon name="check" size={18} color="#2563eb" />
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      </BottomSheet>
    </div>
  );
}
