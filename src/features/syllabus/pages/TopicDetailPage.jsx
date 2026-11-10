import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import AppIcon from '@/components/common/AppIcon';
import ScreenHeader from '@/components/common/ScreenHeader';
import ScreenLoader from '@/components/common/ScreenLoader';
import ErrorState from '@/components/feedback/ErrorState';
import Button from '@/components/ui/Button';
import Tabs, { TabPanel } from '@/components/ui/Tabs';
import { recordActivity } from '@/features/activity/store/activitySlice';
import ItemActionSheet from '@/features/material/components/ItemActionSheet';
import MaterialRow from '@/features/material/components/MaterialRow';
import useMaterial from '@/features/material/hooks/useMaterial';
import {
  markDownloaded,
  toggleBookmark,
} from '@/features/material/store/materialSlice';
import PracticeCard from '@/features/practice/components/PracticeCard';
import useStudySession from '@/features/study/hooks/useStudySession';
import usePaywall from '@/hooks/usePaywall';
import { PATHS } from '@/routes/routePaths';
import {
  selectBookmarks,
  selectDownloads,
  selectMaterialItems,
} from '@/store/selectors/materialSelectors';
import { selectTopicById } from '@/store/selectors/syllabusSelectors';
import { TopicStatusBadge } from '../components/Badges';
import SyllabusRow from '../components/SyllabusRow';
import useSyllabus from '../hooks/useSyllabus';
import { toggleTopicComplete } from '../store/syllabusSlice';

const TAB_ITEMS = [
  { id: 'material', label: 'Study Material' },
  { id: 'practice', label: 'Practice Test' },
  { id: 'ask', label: 'Ask epadh.ai' },
];

// The hub of one topic: mark it complete, read its material, practice, ask the tutor.
// The tab is kept in the URL (`?tab=practice`) so it can be linked and survives a reload.
// On desktop (1024 px+) a rail lists the other topics of the chapter.
export default function TopicDetailPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { topicId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') === 'practice' ? 'practice' : 'material';

  const syllabus = useSyllabus();
  const found = useSelector(state => selectTopicById(state, topicId));
  const { openPaywall } = usePaywall();

  const { hasData } = useMaterial(); // makes sure material is loaded for this exam
  const allItems = useSelector(selectMaterialItems);
  const bookmarks = useSelector(selectBookmarks);
  const downloads = useSelector(selectDownloads);
  const items = useMemo(
    () => allItems.filter(item => item.topicId === topicId),
    [allItems, topicId],
  );

  const [menuItem, setMenuItem] = useState(null);
  const topic = found?.topic;

  // Remember this topic so Home can offer Continue.
  const openable = Boolean(topic) && !topic.locked;
  useEffect(() => {
    if (openable) {
      dispatch(recordActivity({ type: 'study', mode: 'topic', topicId }));
    }
  }, [dispatch, openable, topicId]);

  const { touchProps } = useStudySession({
    type: 'study',
    refId: openable ? topicId : null,
  });

  const changeTab = id => {
    if (id === 'ask') {
      navigate(
        `${PATHS.ask}?topicId=${encodeURIComponent(topicId)}&topicName=${encodeURIComponent(topic.name)}`,
      );
    } else {
      setSearchParams({ tab: id }, { replace: true });
    }
  };

  let body;
  if (!topic) {
    if (!syllabus.hasData && syllabus.status === 'failed') {
      body = (
        <ErrorState
          message={syllabus.error}
          retryLabel="Retry"
          onRetry={syllabus.refresh}
        />
      );
    } else if (!syllabus.hasData) {
      body = <ScreenLoader />;
    } else {
      body = (
        <p className="px-8 pt-16 text-center text-sm text-slate-500">
          This topic is no longer available.
        </p>
      );
    }
  } else if (topic.locked) {
    body = (
      <div className="flex flex-col items-center px-8 pt-16">
        <AppIcon name="lock" color="#b45309" size={32} />
        <p className="mt-3 text-center text-base font-semibold text-slate-800">
          This topic is part of Pro
        </p>
        <Button className="mt-4" onClick={() => openPaywall('fullSyllabus')}>
          See Pro
        </Button>
      </div>
    );
  } else {
    body = (
      <>
        <div className="px-4">
          <button
            type="button"
            onClick={() => dispatch(toggleTopicComplete(topic.id))}
            aria-pressed={topic.completed}
            className={`mb-4 flex w-full items-center justify-center rounded-xl py-3 text-sm font-semibold text-white transition-colors ${
              topic.completed
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}>
            <AppIcon
              name={topic.completed ? 'circle-check' : 'check'}
              color="#ffffff"
              size={18}
            />
            <span className="ml-2">
              {topic.completed ? 'Completed' : 'Mark as complete'}
            </span>
          </button>
        </div>

        <Tabs
          id="topic"
          label="Topic sections"
          variant="pill"
          className="mx-4 mb-3"
          items={TAB_ITEMS}
          value={tab}
          onChange={changeTab}
        />

        <TabPanel tabsId="topic" id="material" value={tab}>
          {!hasData ? (
            <ScreenLoader />
          ) : items.length === 0 ? (
            <p className="px-8 pt-10 text-center text-sm text-slate-500">
              No material for this topic yet.
            </p>
          ) : (
            <ul className="mx-4 overflow-hidden rounded-2xl bg-white shadow-sm">
              {items.map((item, index) => (
                <MaterialRow
                  key={item.id}
                  item={item}
                  bookmarked={Boolean(bookmarks[item.id])}
                  downloaded={Boolean(downloads[item.id])}
                  showDivider={index < items.length - 1}
                  onPress={() => navigate(PATHS.material(item.id))}
                  onDownload={i => dispatch(markDownloaded(i.id))}
                  onMenu={setMenuItem}
                />
              ))}
            </ul>
          )}
        </TabPanel>
        <TabPanel tabsId="topic" id="practice" value={tab}>
          <PracticeCard
            topicId={topicId}
            onStart={() => navigate(PATHS.practiceSetup(topicId))}
          />
        </TabPanel>
      </>
    );
  }

  const siblings = found?.chapter.topics ?? [];

  return (
    <div className="mx-auto max-w-5xl pb-6" {...touchProps}>
      <ScreenHeader
        title={topic?.name ?? 'Topic'}
        subtitle={
          found ? `${found.subject.name} › ${found.chapter.name}` : undefined
        }
      />
      <div className="lg:grid lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-4 lg:px-4">
        {siblings.length > 1 ? (
          <nav
            aria-label={`Topics in ${found.chapter.name}`}
            className="sticky top-16 hidden max-h-[calc(100dvh-5rem)] self-start overflow-y-auto lg:block">
            <p className="mb-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">
              {found.chapter.name}
            </p>
            <ul className="grid gap-2">
              {siblings.map(sibling => (
                <li key={sibling.id}>
                  <SyllabusRow
                    leading={<TopicStatusBadge completed={sibling.completed} />}
                    title={sibling.name}
                    locked={sibling.locked}
                    current={sibling.id === topicId}
                    to={PATHS.topic(sibling.id)}
                    onPress={() => openPaywall('fullSyllabus')}
                  />
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
        <div className="min-w-0">{body}</div>
      </div>
      <ItemActionSheet
        item={menuItem}
        bookmarked={menuItem ? Boolean(bookmarks[menuItem.id]) : false}
        downloaded={menuItem ? Boolean(downloads[menuItem.id]) : false}
        onToggleBookmark={item => dispatch(toggleBookmark(item.id))}
        onDownload={item => dispatch(markDownloaded(item.id))}
        onClose={() => setMenuItem(null)}
      />
    </div>
  );
}
