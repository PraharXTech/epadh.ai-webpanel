import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import useGoBack from '@/hooks/useGoBack';
import AppIcon from '@/components/common/AppIcon';
import BrandLogo from '@/components/common/BrandLogo';
import ScreenLoader from '@/components/common/ScreenLoader';
import ErrorState from '@/components/feedback/ErrorState';
import TextField from '@/components/forms/TextField';
import Button from '@/components/ui/Button';
import { confirmLogout } from '@/features/auth/utils/confirmLogout';
import { chooseExam } from '@/features/user/store/userSlice';
import {
  selectExams,
  selectExamsError,
  selectExamsStatus,
} from '@/store/selectors/examSelectors';
import {
  selectExamStatus,
  selectSelectedExamIds,
  selectUserError,
} from '@/store/selectors/userSelectors';
import ExamCard from '../components/ExamCard';
import { loadExams } from '../store/examSlice';

// First run (`/onboarding/exam`): the only page until at least one exam is picked, with a
// way to log out in case the wrong account was used.
// Later (`/exams/select`, from Profile or the sidebar): "Your exams", with a back button.
// A student can prepare for any number of exams; the order they pick them in is kept, and
// the first one is their primary exam.
export default function ExamSelectionPage({ changing = false }) {
  const dispatch = useDispatch();
  const goBack = useGoBack();
  const exams = useSelector(selectExams);
  const examsStatus = useSelector(selectExamsStatus);
  const examsError = useSelector(selectExamsError);
  const currentIds = useSelector(selectSelectedExamIds);
  const saveStatus = useSelector(selectExamStatus);
  const saveError = useSelector(selectUserError);

  const [query, setQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState(currentIds);

  const saving = saveStatus === 'loading';
  const canContinue = selectedIds.length > 0;

  useEffect(() => {
    dispatch(loadExams());
  }, [dispatch]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? exams.filter(e => e.name.toLowerCase().includes(q)) : exams;
  }, [exams, query]);

  const toggle = exam =>
    setSelectedIds(ids =>
      ids.includes(exam.id)
        ? ids.filter(id => id !== exam.id)
        : [...ids, exam.id],
    );

  const handleContinue = async () => {
    const result = await dispatch(chooseExam({ examIds: selectedIds }));
    // First run: the route guard sends the student Home by itself once an exam is set.
    if (chooseExam.fulfilled.match(result) && changing) {
      goBack();
    }
  };

  const buttonLabel = changing ? 'Save' : 'Continue';
  const firstLoad = examsStatus === 'loading' && exams.length === 0;
  const failed = examsStatus === 'failed' && exams.length === 0;

  return (
    <div className="flex min-h-dvh flex-col bg-sky-50">
      <div className="mx-auto w-full max-w-3xl flex-1 px-5 pt-4">
        <div className="mb-3 flex items-center justify-between">
          {changing ? (
            <button
              type="button"
              onClick={() => goBack()}
              aria-label="Back"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white hover:bg-slate-100">
              <AppIcon name="arrow-left" color="#0f172a" size={20} />
            </button>
          ) : (
            <>
              <BrandLogo size={26} />
              <button
                type="button"
                onClick={() => confirmLogout(dispatch)}
                className="text-sm font-semibold text-slate-600 hover:text-slate-900">
                Log out
              </button>
            </>
          )}
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900">
          {changing ? 'Your exams' : 'Choose your exams'}
        </h1>
        <p className="mt-1 mb-4 text-sm text-slate-500">
          Pick every exam you are preparing for. We&apos;ll personalise your
          syllabus, practice and mock tests for all of them.
        </p>
        <TextField
          label="Search exams"
          hideLabel
          icon="search"
          placeholder="Search exams"
          value={query}
          onChange={event => setQuery(event.target.value)}
        />

        {firstLoad ? (
          <ScreenLoader />
        ) : failed ? (
          <ErrorState
            message={examsError}
            retryLabel="Retry"
            onRetry={() => dispatch(loadExams())}
          />
        ) : (
          <ul className="mt-4 grid gap-3 pb-6 md:grid-cols-2">
            {filtered.map(exam => (
              <li key={exam.id}>
                <ExamCard
                  exam={exam}
                  selected={selectedIds.includes(exam.id)}
                  onPress={toggle}
                />
              </li>
            ))}
            {filtered.length === 0 ? (
              <li className="col-span-full mt-2 text-center text-sm text-slate-500">
                No exams match &quot;{query}&quot;.
              </li>
            ) : null}
          </ul>
        )}
      </div>

      <div className="sticky bottom-0 border-t border-slate-200 bg-white px-5 pt-3 pb-4">
        <div className="mx-auto max-w-3xl">
          {saveError ? (
            <p role="alert" className="mb-2 text-center text-sm text-red-500">
              {saveError}
            </p>
          ) : null}
          <Button
            size="lg"
            fullWidth
            loading={saving}
            disabled={!canContinue}
            onClick={handleContinue}>
            {canContinue
              ? `${buttonLabel} (${selectedIds.length} selected)`
              : 'Select at least one exam'}
            {canContinue ? (
              <AppIcon name="arrow-right" color="currentColor" size={20} />
            ) : null}
          </Button>
        </div>
      </div>
    </div>
  );
}
