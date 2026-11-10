import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import AppIcon from '@/components/common/AppIcon';
import ScreenHeader from '@/components/common/ScreenHeader';
import ScreenLoader from '@/components/common/ScreenLoader';
import ErrorState from '@/components/feedback/ErrorState';
import ExamFilterChips from '@/features/exams/components/ExamFilterChips';
import useExamFilter from '@/features/exams/hooks/useExamFilter';
import CategoryChips from '@/features/tests/components/CategoryChips';
import usePaywall from '@/hooks/usePaywall';
import { PATHS } from '@/routes/routePaths';
import { selectSelectedExamLabel } from '@/store/selectors/examSelectors';
import {
  selectPyqPapers,
  selectSavedPapers,
  selectViewedPapers,
} from '@/store/selectors/pyqSelectors';
import PaperRow from '../components/PaperRow';
import usePyqPapers from '../hooks/usePyqPapers';
import { toggleSavedPaper } from '../store/pyqSlice';
import { filterPapers, PYQ_FEATURE, paperYears } from '../utils/pyq';

// The previous-year papers uploaded for the student's exams: narrow to one exam, search,
// filter by year, keep favourites, open the question paper (and answer key) in the viewer.
export default function PyqPapersPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error, refresh, hasData } = usePyqPapers();
  const { canUse, openPaywall } = usePaywall();

  const allPapers = useSelector(selectPyqPapers);
  const { exams, value: examId, setValue: setExamId } = useExamFilter();
  const papers = useMemo(
    () => (examId ? allPapers.filter(p => p.examId === examId) : allPapers),
    [allPapers, examId],
  );
  const saved = useSelector(selectSavedPapers);
  const viewed = useSelector(selectViewedPapers);
  const examName = useSelector(selectSelectedExamLabel);

  const [filter, setFilter] = useState('all'); // all | saved | a year
  const [query, setQuery] = useState('');

  const chips = useMemo(
    () => [
      { id: 'all', label: 'All' },
      { id: 'saved', label: 'Saved' },
      ...paperYears(papers).map(year => ({
        id: String(year),
        label: String(year),
      })),
    ],
    [papers],
  );
  // The chosen year may disappear when the exam filter changes: fall back to All.
  const activeFilter = chips.some(c => c.id === filter) ? filter : 'all';
  const visible = useMemo(
    () => filterPapers(papers, { filter: activeFilter, query, saved }),
    [papers, activeFilter, query, saved],
  );

  const open = paper => {
    if (paper.premium && !canUse(PYQ_FEATURE)) {
      openPaywall(PYQ_FEATURE);
      return;
    }
    navigate(PATHS.pyqViewer(paper.id));
  };

  const filtered = activeFilter !== 'all' || query.trim().length > 0;
  const refreshing = hasData && status === 'loading';

  let body;
  if (!hasData && status === 'failed') {
    body = <ErrorState message={error} retryLabel="Retry" onRetry={refresh} />;
  } else if (!hasData) {
    body = <ScreenLoader />;
  } else if (visible.length === 0) {
    let title = 'No papers uploaded yet';
    let detail = 'Previous year papers for this exam will appear here.';
    if (activeFilter === 'saved' && !query.trim()) {
      title = 'No saved papers';
      detail = 'Tap the bookmark on a paper to keep it here.';
    } else if (filtered) {
      title = 'Nothing matches your search';
      detail = 'Try a different year or search word.';
    }
    body = (
      <div className="flex flex-col items-center px-8 pt-12 text-center">
        <AppIcon name="file-text" color="#94a3b8" size={36} />
        <p className="mt-3 text-base font-semibold text-slate-700">{title}</p>
        <p className="mt-1 text-sm text-slate-500">{detail}</p>
      </div>
    );
  } else {
    body = (
      <ul className="grid gap-2 px-4 md:grid-cols-2">
        {visible.map(paper => (
          <li key={paper.id}>
            <PaperRow
              paper={paper}
              locked={paper.premium && !canUse(PYQ_FEATURE)}
              saved={Boolean(saved[paper.id])}
              viewed={Boolean(viewed[paper.id])}
              showExam={exams.length > 1}
              onPress={open}
              onToggleSaved={id => dispatch(toggleSavedPaper(id))}
            />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="mx-auto max-w-4xl pb-8" aria-busy={refreshing}>
      <ScreenHeader
        title="Previous Year Papers"
        subtitle={
          hasData
            ? `${papers.length} paper${papers.length === 1 ? '' : 's'} · ${examName}`
            : examName
        }
        right={
          <button
            type="button"
            onClick={refresh}
            aria-label="Refresh papers"
            className="rounded-full p-2 hover:bg-slate-100">
            <AppIcon
              name="repeat"
              color="#475569"
              size={20}
              className={refreshing ? 'animate-spin' : ''}
            />
          </button>
        }
      />

      <div className="mx-4 mb-3 flex h-12 items-center rounded-2xl bg-white px-4 shadow-sm">
        <AppIcon name="search" size={18} color="#94a3b8" />
        <input
          type="search"
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Search by year or shift…"
          aria-label="Search papers"
          className="ml-2 min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
        />
      </div>
      <ExamFilterChips exams={exams} value={examId} onChange={setExamId} />
      <CategoryChips
        label="Filter papers"
        options={chips}
        value={activeFilter}
        onChange={setFilter}
      />

      <div className="mt-3">{body}</div>
    </div>
  );
}
