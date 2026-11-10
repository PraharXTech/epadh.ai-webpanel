import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ScreenHeader from '@/components/common/ScreenHeader';
import ScreenLoader from '@/components/common/ScreenLoader';
import ErrorState from '@/components/feedback/ErrorState';
import usePaywall from '@/hooks/usePaywall';
import { examFromParam, PATHS } from '@/routes/routePaths';
import { selectSubjectById } from '@/store/selectors/syllabusSelectors';
import { NumberBadge } from '../components/Badges';
import SyllabusRow from '../components/SyllabusRow';
import useSyllabus from '../hooks/useSyllabus';

export default function ChapterListPage() {
  const { subjectId, examId: examParam } = useParams();
  const examId = examFromParam(examParam);
  const { hasData, status, error, refresh } = useSyllabus();
  const subject = useSelector(state =>
    selectSubjectById(state, subjectId, examId),
  );
  const { openPaywall } = usePaywall();

  let body;
  if (subject) {
    body = (
      <ul className="grid gap-2 md:grid-cols-2">
        {subject.chapters.map((chapter, index) => (
          <li key={chapter.id}>
            <SyllabusRow
              leading={<NumberBadge n={index + 1} locked={chapter.locked} />}
              title={chapter.name}
              subtitle={`${chapter.topicCount} topics · ${chapter.completedCount} completed`}
              percent={chapter.percent}
              locked={chapter.locked}
              to={PATHS.chapter(examId, subjectId, chapter.id)}
              onPress={() => openPaywall('fullSyllabus')}
            />
          </li>
        ))}
      </ul>
    );
  } else if (!hasData && status === 'failed') {
    body = <ErrorState message={error} retryLabel="Retry" onRetry={refresh} />;
  } else if (!hasData) {
    body = <ScreenLoader />;
  } else {
    body = (
      <p className="pt-16 text-center text-sm text-slate-500">
        This subject is no longer available.
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-4xl pb-6">
      <ScreenHeader
        title={subject?.name ?? 'Chapters'}
        subtitle={subject ? `${subject.percent}% complete` : undefined}
      />
      <div className="px-4">{body}</div>
    </div>
  );
}
