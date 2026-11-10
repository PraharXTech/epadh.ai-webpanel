import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import AppIcon from '@/components/common/AppIcon';
import ProgressBar from '@/components/common/ProgressBar';
import ScreenLoader from '@/components/common/ScreenLoader';
import ErrorState from '@/components/feedback/ErrorState';
import ExamFilterChips from '@/features/exams/components/ExamFilterChips';
import useExamFilter from '@/features/exams/hooks/useExamFilter';
import SelectorPill from '@/features/material/components/SelectorPill';
import { PATHS } from '@/routes/routePaths';
import { selectSelectedExamLabel } from '@/store/selectors/examSelectors';
import {
  selectSyllabusProgress,
  selectSyllabusProgressByExam,
  selectSyllabusTreesByExam,
} from '@/store/selectors/syllabusSelectors';
import SubjectBadge from '../components/SubjectBadge';
import SyllabusRow from '../components/SyllabusRow';
import useSyllabus from '../hooks/useSyllabus';

// Syllabus tab: the syllabus of the exams the student prepares for as a list of subjects,
// with progress. With several exams it can be narrowed to one of them.
export default function SubjectListPage() {
  const navigate = useNavigate();
  const { tree: allTree, status, error, refresh, hasData } = useSyllabus();
  const allProgress = useSelector(selectSyllabusProgress);
  const treesByExam = useSelector(selectSyllabusTreesByExam);
  const progressByExam = useSelector(selectSyllabusProgressByExam);
  const { exams, value: examId, setValue: setExamId } = useExamFilter();

  const tree = examId ? (treesByExam[examId] ?? []) : allTree;
  const progress = examId
    ? (progressByExam[examId] ?? allProgress)
    : allProgress;

  const examName = useSelector(selectSelectedExamLabel);
  const refreshing = status === 'loading' && hasData;

  let body;
  if (!hasData && status === 'failed') {
    body = <ErrorState message={error} retryLabel="Retry" onRetry={refresh} />;
  } else if (!hasData) {
    body = <ScreenLoader />;
  } else if (tree.length === 0) {
    body = (
      <p className="px-8 pt-12 text-center text-sm text-slate-500">
        The syllabus for this exam will appear here.
      </p>
    );
  } else {
    body = (
      <div className="px-4">
        <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-end justify-between">
            <p className="text-sm font-semibold text-slate-700">
              Syllabus completed
            </p>
            <p className="text-lg font-extrabold text-blue-600">
              {progress.percent}%
            </p>
          </div>
          <ProgressBar
            percent={progress.percent}
            label="Syllabus completed"
            className="mt-2"
          />
          <p className="mt-2 text-xs text-slate-500">
            {`${progress.done} of ${progress.total} topics done · ${progress.pending} to go`}
          </p>
        </div>

        <ul className="grid gap-2 md:grid-cols-2">
          {tree.map(subject => (
            <li key={subject.id}>
              <SyllabusRow
                leading={<SubjectBadge subject={subject} />}
                title={subject.name}
                subtitle={`${subject.chapterCount} chapters · ${subject.topicCount} topics`}
                percent={subject.percent}
                to={PATHS.subject(examId, subject.id)}
              />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl pb-6" aria-busy={refreshing}>
      <div className="flex items-center justify-between px-4 pt-2 pb-3">
        <h1 className="text-xl font-extrabold text-slate-900">Syllabus</h1>
        <button
          type="button"
          onClick={refresh}
          aria-label="Refresh syllabus"
          className="rounded-full p-2 hover:bg-slate-100">
          <AppIcon
            name="repeat"
            color="#475569"
            size={20}
            className={refreshing ? 'animate-spin' : ''}
          />
        </button>
      </div>
      <div className="px-4 pb-3">
        <SelectorPill
          icon="landmark"
          label={examName}
          onPress={() => navigate(PATHS.examSelect)}
        />
      </div>
      <ExamFilterChips exams={exams} value={examId} onChange={setExamId} />
      {body}
    </div>
  );
}
