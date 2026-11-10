import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ScreenHeader from '@/components/common/ScreenHeader';
import ScreenLoader from '@/components/common/ScreenLoader';
import ErrorState from '@/components/feedback/ErrorState';
import usePaywall from '@/hooks/usePaywall';
import { examFromParam, PATHS } from '@/routes/routePaths';
import { selectChapterById } from '@/store/selectors/syllabusSelectors';
import { TopicStatusBadge } from '../components/Badges';
import SyllabusRow from '../components/SyllabusRow';
import useSyllabus from '../hooks/useSyllabus';

export default function TopicListPage() {
  const { chapterId, examId: examParam } = useParams();
  const examId = examFromParam(examParam);
  const { hasData, status, error, refresh } = useSyllabus();
  const found = useSelector(state =>
    selectChapterById(state, chapterId, examId),
  );
  const { openPaywall } = usePaywall();
  const chapter = found?.chapter;

  let body;
  if (chapter) {
    body = (
      <ul className="grid gap-2 md:grid-cols-2">
        {chapter.topics.map(topic => (
          <li key={topic.id}>
            <SyllabusRow
              leading={<TopicStatusBadge completed={topic.completed} />}
              title={topic.name}
              subtitle={topic.completed ? 'Completed' : undefined}
              locked={topic.locked}
              to={PATHS.topic(topic.id)}
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
        This chapter is no longer available.
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-4xl pb-6">
      <ScreenHeader
        title={chapter?.name ?? 'Topics'}
        subtitle={
          chapter
            ? `${found.subject.name} · ${chapter.completedCount}/${chapter.topicCount} topics done`
            : undefined
        }
      />
      <div className="px-4">{body}</div>
    </div>
  );
}
