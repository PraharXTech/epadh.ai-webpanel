import { lazy, Suspense, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import AppIcon from '@/components/common/AppIcon';
import ScreenLoader from '@/components/common/ScreenLoader';
import { recordActivity } from '@/features/activity/store/activitySlice';
import useStudySession from '@/features/study/hooks/useStudySession';
import useTimeOnScreen from '@/hooks/useTimeOnScreen';
import { PATHS } from '@/routes/routePaths';
import {
  selectBookmarks,
  selectMaterialFontSize,
  selectMaterialItemById,
  selectMaterialSubjects,
} from '@/store/selectors/materialSelectors';
import HtmlViewer from '../components/HtmlViewer';
import VideoPlayer from '../components/VideoPlayer';
import ViewerMessage from '../components/ViewerMessage';
import useMaterial from '../hooks/useMaterial';
import {
  addTimeSpent,
  setFontSize,
  setProgress,
  toggleBookmark,
} from '../store/materialSlice';
import { describeItem, isHtml, isVideo } from '../utils/format';

// pdf.js is large (about 1 MB with its worker): load it only when a PDF is opened.
const PdfViewer = lazy(() => import('../components/PdfViewer'));

const FONT_STEP = 2;

function HeaderButton({ onClick, label, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="ml-1 rounded-full p-2 hover:bg-slate-100">
      {children}
    </button>
  );
}

// Waits for the material list (a deep link or a reload may arrive before it is loaded), then
// shows the viewer. The viewer is a separate component so it mounts only once the item
// exists: it remembers where the student was when they opened it.
export default function MaterialViewerPage() {
  const { itemId } = useParams();
  const { hasData, status, error, refresh } = useMaterial();
  const item = useSelector(state => selectMaterialItemById(state, itemId));

  if (item) {
    return <Viewer key={itemId} itemId={itemId} item={item} />;
  }
  if (!hasData && status === 'failed') {
    return (
      <ViewerMessage
        title="Couldn't load this material"
        detail={error}
        actionLabel="Retry"
        onAction={refresh}
      />
    );
  }
  if (!hasData) {
    return <ScreenLoader />;
  }
  return <ViewerMessage title="This material is no longer available" />;
}

// Opens one study material: videos play in the player, rich-text articles open in the
// reader (with a text size control), everything else (notes, PYQs, practice sets) is a PDF.
function Viewer({ itemId, item }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const subject = useSelector(selectMaterialSubjects).find(
    s => s.id === item.subjectId,
  );
  const bookmarked = Boolean(useSelector(selectBookmarks)[itemId]);
  const fontSize = useSelector(selectMaterialFontSize);

  // Where the student was when they opened it; live progress must not move the
  // resume point while they are already reading / watching.
  const [savedPercent] = useState(() => item.progress ?? 0);

  // Study session: a video is watched without interacting, so it never goes idle. Reading
  // progress (page turns, scrolling) also counts as activity, e.g. inside the PDF.
  const { touchProps, touch } = useStudySession({
    type: 'study',
    refId: itemId,
    idleSec: isVideo(item) ? null : undefined,
  });

  const handleProgress = percent => {
    touch();
    dispatch(setProgress({ id: itemId, percent }));
  };

  useTimeOnScreen(seconds => dispatch(addTimeSpent({ id: itemId, seconds })));

  // Remember what they are reading so Home can offer Continue (needs a topic).
  const topicId = item.topicId;
  useEffect(() => {
    if (topicId) {
      dispatch(
        recordActivity({ type: 'study', mode: 'material', topicId, itemId }),
      );
    }
  }, [dispatch, topicId, itemId]);

  // Back goes one step; opened directly (no history) it goes to the topic, or the list.
  const goBack = () =>
    location.key === 'default'
      ? navigate(topicId ? PATHS.topic(topicId) : PATHS.studyMaterial)
      : navigate(-1);

  const html = isHtml(item);

  let body;
  if (!item.url && !item.body) {
    body = <ViewerMessage title="No file attached to this material yet" />;
  } else if (isVideo(item)) {
    body = (
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl">
          <VideoPlayer
            url={item.url}
            savedPercent={savedPercent}
            onProgress={handleProgress}
          />
          <div className="px-4 pt-4">
            <h1 className="text-lg font-bold text-slate-900">{item.title}</h1>
            <p className="mt-1 text-sm text-slate-500">{describeItem(item)}</p>
            {subject ? (
              <p className="mt-3 text-sm font-semibold text-slate-700">
                {subject.name}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    );
  } else if (html) {
    body = (
      <HtmlViewer
        html={item.body}
        fontSize={fontSize}
        savedPercent={savedPercent}
        onProgress={handleProgress}
      />
    );
  } else {
    body = (
      <Suspense fallback={<ScreenLoader />}>
        <PdfViewer
          url={item.url}
          savedPercent={savedPercent}
          onProgress={handleProgress}
        />
      </Suspense>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-white" {...touchProps}>
      <header className="flex items-center border-b border-slate-100 px-4 py-2">
        <button
          type="button"
          onClick={goBack}
          aria-label="Go back"
          className="rounded-full p-2 hover:bg-slate-100">
          <AppIcon name="arrow-left" color="#0f172a" size={22} />
        </button>
        <p className="ml-3 min-w-0 flex-1 truncate text-base font-bold text-slate-900">
          {item.title}
        </p>
        {html ? (
          <>
            <HeaderButton
              label="Smaller text"
              onClick={() => dispatch(setFontSize(fontSize - FONT_STEP))}>
              <span className="text-sm font-bold text-slate-700">A-</span>
            </HeaderButton>
            <HeaderButton
              label="Larger text"
              onClick={() => dispatch(setFontSize(fontSize + FONT_STEP))}>
              <span className="text-lg font-bold text-slate-700">A+</span>
            </HeaderButton>
          </>
        ) : null}
        <HeaderButton
          label={bookmarked ? 'Remove bookmark' : 'Bookmark'}
          onClick={() => dispatch(toggleBookmark(itemId))}>
          <AppIcon
            name="bookmark"
            color={bookmarked ? '#2563eb' : '#334155'}
            fill={bookmarked ? '#2563eb' : 'none'}
            size={22}
          />
        </HeaderButton>
      </header>
      {body}
    </div>
  );
}
