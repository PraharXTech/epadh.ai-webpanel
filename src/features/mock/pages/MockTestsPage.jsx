import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import AppIcon from '@/components/common/AppIcon';
import ScreenHeader from '@/components/common/ScreenHeader';
import ScreenLoader from '@/components/common/ScreenLoader';
import ErrorState from '@/components/feedback/ErrorState';
import usePaywall from '@/hooks/usePaywall';
import CategoryChips from '@/features/tests/components/CategoryChips';
import { PATHS } from '@/routes/routePaths';
import {
  selectSelectedExamLabel,
  selectSoleExamName,
} from '@/store/selectors/examSelectors';
import { selectLastMockAttemptByTest } from '@/store/selectors/mockSelectors';
import MockTestRow from '../components/MockTestRow';
import RecommendedCard from '../components/RecommendedCard';
import { fetchMockTests } from '../services/mockService';
import { syncPendingRank } from '../store/mockSlice';
import {
  CATEGORIES,
  SORTS,
  countByCategory,
  visibleTests,
} from '../utils/mockTests';

const HIGHLIGHTS = [
  {
    icon: 'clipboard-check',
    color: '#16a34a',
    bg: 'bg-green-100',
    label: 'Real exam pattern',
  },
  {
    icon: 'chart-column',
    color: '#2563eb',
    bg: 'bg-blue-100',
    label: 'Detailed analysis',
  },
  {
    icon: 'trophy',
    color: '#7c3aed',
    bg: 'bg-violet-100',
    label: 'Rank & performance',
  },
];

function SectionTitle({ children }) {
  return (
    <h2 className="mx-4 mt-5 mb-2 text-lg font-extrabold text-slate-900">
      {children}
    </h2>
  );
}

// Mock tests of the selected exam: filter by kind, the recommended ones, then the full list.
// Web changes: the category tiles and the list use the wider layout (a 2-column list from
// 768 px), and every "navigate" is a router link or `navigate()`.
export default function MockTestsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [tests, setTests] = useState(null);
  const [failed, setFailed] = useState(false);
  const [round, setRound] = useState(0); // bumped by Retry to load again
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('latest');

  const examName = useSelector(selectSelectedExamLabel);
  const soleExamName = useSelector(selectSoleExamName); // for titles; null with several exams
  const lastAttempt = useSelector(selectLastMockAttemptByTest);
  const { canUse, openPaywall } = usePaywall();

  useEffect(() => {
    let cancelled = false;
    fetchMockTests().then(
      found => {
        if (!cancelled) {
          setTests(found);
        }
      },
      () => {
        if (!cancelled) {
          setFailed(true);
        }
      },
    );
    // Ranks of attempts submitted offline are fetched once the list is opened.
    dispatch(syncPendingRank());
    return () => {
      cancelled = true;
    };
  }, [dispatch, round]);
  const retry = () => {
    setFailed(false);
    setRound(n => n + 1);
  };

  // A real attempt's accuracy replaces the seed `progress`; null (not attempted) until the
  // student has taken that test.
  const withProgress = useMemo(() => {
    if (!tests) {
      return null;
    }
    return tests.map(t => {
      const last = lastAttempt.get(t.id);
      return last ? { ...t, progress: last.accuracy } : t;
    });
  }, [tests, lastAttempt]);

  const list = useMemo(
    () => (withProgress ? visibleTests(withProgress, category, sort) : []),
    [withProgress, category, sort],
  );
  // Recommendations are full-length tests: the best liked and the newest.
  const popular = useMemo(
    () =>
      withProgress
        ? withProgress
            .filter(t => t.type === 'full')
            .sort((a, b) => b.popularity - a.popularity)[0]
        : null,
    [withProgress],
  );
  const latest = useMemo(
    () =>
      withProgress
        ? withProgress
            .filter(t => t.type === 'full')
            .sort((a, b) => b.order - a.order)[0]
        : null,
    [withProgress],
  );

  const isLocked = test => Boolean(test.premium) && !canUse('advancedMocks');
  const openTest = test =>
    isLocked(test)
      ? openPaywall('advancedMocks')
      : navigate(PATHS.mockInstructions(test.id));

  let body;
  if (failed) {
    body = (
      <ErrorState
        message="Could not load the mock tests."
        retryLabel="Retry"
        onRetry={retry}
      />
    );
  } else if (!tests) {
    body = <ScreenLoader />;
  } else {
    body = (
      <>
        <section className="mx-4 rounded-2xl bg-orange-50 p-3 sm:p-4">
          <p className="text-xs font-semibold text-orange-500">
            Test Your Preparation
          </p>
          <h2 className="text-lg leading-6 font-extrabold text-slate-900">
            Take Mock Tests. Improve Your Score.
          </h2>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
            {HIGHLIGHTS.map(h => (
              <li key={h.icon} className="flex items-center">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${h.bg}`}>
                  <AppIcon name={h.icon} size={16} color={h.color} />
                </span>
                <span className="ml-1.5 text-[11px] leading-3 text-slate-700">
                  {h.label}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <div
          role="group"
          aria-label="Test type"
          className="mx-4 mt-3 grid grid-cols-5 gap-2">
          {CATEGORIES.map(c => {
            const active = c.id === category;
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={active}
                onClick={() => setCategory(c.id)}
                className={`flex flex-col items-center rounded-xl px-1 py-2 transition-colors ${
                  active ? 'bg-blue-600' : 'bg-white hover:bg-slate-50'
                }`}>
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                    active ? 'bg-white' : c.bg
                  }`}>
                  <AppIcon name={c.icon} size={16} color={c.color} />
                </span>
                <span
                  className={`mt-1 w-full text-center text-[10px] leading-tight font-semibold sm:text-xs ${
                    active ? 'text-white' : 'text-slate-800'
                  }`}>
                  {c.label}
                </span>
                <span
                  className={`text-[10px] sm:text-xs ${
                    active ? 'text-blue-100' : 'text-slate-500'
                  }`}>
                  {countByCategory(tests, c.id)}
                </span>
              </button>
            );
          })}
        </div>

        {popular ? (
          <>
            <SectionTitle>Recommended Mock Tests</SectionTitle>
            <div className="flex gap-3 overflow-x-auto px-4 pb-1">
              <RecommendedCard
                kind="popular"
                examName={soleExamName}
                test={popular}
                onStart={openTest}
              />
              {latest ? (
                <RecommendedCard
                  kind="latest"
                  examName={soleExamName}
                  test={latest}
                  onStart={openTest}
                />
              ) : null}
            </div>
          </>
        ) : null}

        <SectionTitle>All Mock Tests</SectionTitle>
        <div className="mb-3">
          <CategoryChips
            label="Sort"
            options={SORTS}
            value={sort}
            onChange={setSort}
          />
        </div>
        {list.length === 0 ? (
          <p className="px-8 pt-4 text-center text-sm text-slate-500">
            No tests in this category yet.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-3 px-4 md:grid-cols-2">
            {list.map(t => (
              <li key={t.id}>
                <MockTestRow
                  examName={soleExamName}
                  test={t}
                  locked={isLocked(t)}
                  onPress={openTest}
                />
              </li>
            ))}
          </ul>
        )}
      </>
    );
  }

  return (
    <div className="mx-auto max-w-4xl pb-8">
      <ScreenHeader
        title="Mock Tests"
        subtitle="Practice like the real exam"
        right={
          <Link
            to={PATHS.examSelect}
            aria-label={`Exam: ${examName}. Change`}
            className="ml-2 flex h-11 max-w-44 items-center rounded-xl bg-white px-3 shadow-sm hover:bg-slate-50">
            <AppIcon name="landmark" color="#1e3a8a" size={18} />
            <span className="mx-2 min-w-0 truncate text-sm font-semibold text-slate-900">
              {examName}
            </span>
            <AppIcon name="chevron-down" color="#334155" size={16} />
          </Link>
        }
      />
      {body}
    </div>
  );
}
