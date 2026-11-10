import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import AppIcon from '@/components/common/AppIcon';
import ScreenLoader from '@/components/common/ScreenLoader';
import ErrorState from '@/components/feedback/ErrorState';
import TextField from '@/components/forms/TextField';
import ExamFilterChips from '@/features/exams/components/ExamFilterChips';
import { forExam } from '@/features/exams/utils/examContent';
import { PATHS } from '@/routes/routePaths';
import {
  selectSelectedExamLabel,
  selectSelectedExams,
} from '@/store/selectors/examSelectors';
import {
  selectBookmarks,
  selectDownloads,
  selectMaterialExamFilter,
  selectMaterialFilters,
  selectMaterialSections,
  selectMaterialSubjects,
} from '@/store/selectors/materialSelectors';
import ItemActionSheet from '../components/ItemActionSheet';
import MaterialBanner from '../components/MaterialBanner';
import SelectorPill from '../components/SelectorPill';
import SubjectPickerSheet from '../components/SubjectPickerSheet';
import SubjectSection from '../components/SubjectSection';
import TypeFilterBar from '../components/TypeFilterBar';
import useMaterial from '../hooks/useMaterial';
import {
  markDownloaded,
  setExamFilter,
  setQuery,
  setSubjectFilter,
  setTypeFilter,
  toggleBookmark,
} from '../store/materialSlice';

export default function MaterialPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error, refresh, hasData } = useMaterial();

  const examName = useSelector(selectSelectedExamLabel);
  const allSubjects = useSelector(selectMaterialSubjects);
  const exams = useSelector(selectSelectedExams);
  const examFilter = useSelector(selectMaterialExamFilter);
  const subjects = useMemo(
    () => (examFilter ? forExam(allSubjects, examFilter) : allSubjects),
    [allSubjects, examFilter],
  );
  const sections = useSelector(selectMaterialSections);
  const filters = useSelector(selectMaterialFilters);
  const bookmarks = useSelector(selectBookmarks);
  const downloads = useSelector(selectDownloads);

  const [searching, setSearching] = useState(false);
  const [subjectSheetOpen, setSubjectSheetOpen] = useState(false);
  const [menuItem, setMenuItem] = useState(null);

  const subjectName =
    subjects.find(s => s.id === filters.subjectId)?.name ?? 'All Subjects';
  const isFiltered =
    filters.type !== 'all' ||
    filters.subjectId ||
    examFilter ||
    filters.query.trim();
  const refreshing = status === 'loading' && hasData;

  const toggleSearch = () => {
    if (searching) {
      dispatch(setQuery(''));
    }
    setSearching(open => !open);
  };

  const openItem = item => navigate(PATHS.material(item.id));
  const handleDownload = item => dispatch(markDownloaded(item.id));

  let body;
  if (!hasData && status === 'failed') {
    body = <ErrorState message={error} retryLabel="Retry" onRetry={refresh} />;
  } else if (!hasData) {
    body = <ScreenLoader />;
  } else if (sections.length === 0) {
    body = (
      <div className="flex flex-col items-center px-8 pt-12 text-center">
        <AppIcon name="search" color="#94a3b8" size={36} />
        <p className="mt-3 text-base font-semibold text-slate-700">
          {isFiltered ? 'Nothing matches your filters' : 'No material yet'}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          {isFiltered
            ? 'Try a different type, subject or search.'
            : 'Study material for this exam will appear here.'}
        </p>
      </div>
    );
  } else {
    body = sections.map(({ subject, items }) => (
      <SubjectSection
        key={subject.id}
        subject={subject}
        items={items}
        bookmarks={bookmarks}
        downloads={downloads}
        onViewAll={
          filters.subjectId ? null : s => dispatch(setSubjectFilter(s.id))
        }
        onItemPress={openItem}
        onDownload={handleDownload}
        onMenu={setMenuItem}
      />
    ));
  }

  return (
    <div className="mx-auto max-w-3xl pb-6" aria-busy={refreshing}>
      <div className="flex items-center justify-between px-4 pt-2 pb-3">
        <h1 className="text-xl font-extrabold text-slate-900">
          Study Material
        </h1>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={refresh}
            aria-label="Refresh study material"
            className="rounded-full p-2 hover:bg-slate-100">
            <AppIcon
              name="repeat"
              color="#475569"
              size={20}
              className={refreshing ? 'animate-spin' : ''}
            />
          </button>
          <button
            type="button"
            onClick={toggleSearch}
            aria-label={searching ? 'Close search' : 'Search material'}
            className="rounded-full p-2 hover:bg-slate-100">
            <AppIcon
              name={searching ? 'close' : 'search'}
              color="#0f172a"
              size={22}
            />
          </button>
        </div>
      </div>

      {searching ? (
        <div className="px-4 pb-3">
          <TextField
            label="Search material"
            hideLabel
            icon="search"
            placeholder="Search notes, videos, PYQs"
            value={filters.query}
            onChange={event => dispatch(setQuery(event.target.value))}
            autoFocus
          />
        </div>
      ) : null}

      <div className="flex gap-2 px-4 pb-3">
        <SelectorPill
          icon="landmark"
          label={examName}
          onPress={() => navigate(PATHS.examSelect)}
        />
        <SelectorPill
          icon="book-open"
          label={subjectName}
          onPress={() => setSubjectSheetOpen(true)}
        />
      </div>

      <ExamFilterChips
        exams={exams}
        value={examFilter}
        onChange={id => dispatch(setExamFilter(id))}
      />
      <MaterialBanner />
      <TypeFilterBar
        value={filters.type}
        onChange={type => dispatch(setTypeFilter(type))}
      />

      {body}

      <SubjectPickerSheet
        visible={subjectSheetOpen}
        subjects={subjects}
        selectedId={filters.subjectId}
        onSelect={id => {
          dispatch(setSubjectFilter(id));
          setSubjectSheetOpen(false);
        }}
        onClose={() => setSubjectSheetOpen(false)}
      />
      <ItemActionSheet
        item={menuItem}
        bookmarked={menuItem ? Boolean(bookmarks[menuItem.id]) : false}
        downloaded={menuItem ? Boolean(downloads[menuItem.id]) : false}
        onToggleBookmark={item => dispatch(toggleBookmark(item.id))}
        onDownload={handleDownload}
        onClose={() => setMenuItem(null)}
      />
    </div>
  );
}
