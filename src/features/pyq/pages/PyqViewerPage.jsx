import { lazy, Suspense, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import AppIcon from '@/components/common/AppIcon';
import ScreenLoader from '@/components/common/ScreenLoader';
import ViewerMessage from '@/features/material/components/ViewerMessage';
import useStudySession from '@/features/study/hooks/useStudySession';
import useGoBack from '@/hooks/useGoBack';
import usePaywall from '@/hooks/usePaywall';
import { PATHS } from '@/routes/routePaths';
import {
  selectPyqPaperById,
  selectSavedPapers,
} from '@/store/selectors/pyqSelectors';
import { markPaperViewed, toggleSavedPaper } from '../store/pyqSlice';
import { PYQ_FEATURE, paperLabel } from '../utils/pyq';

// The PDF viewer pulls in pdf.js: load it only when a paper is opened.
const PdfViewer = lazy(() => import('@/features/material/components/PdfViewer'));

const DOCS = [
  { id: 'paper', label: 'Question paper', urlOf: p => p.url },
  { id: 'key', label: 'Answer key', urlOf: p => p.answerKeyUrl },
];

// Opens one uploaded paper as a PDF, with its answer key one click away and, when the same
// paper exists as a mock test, a shortcut to attempt it.
export default function PyqViewerPage() {
  const dispatch = useDispatch();
  const { paperId } = useParams();
  const paper = useSelector(state => selectPyqPaperById(state, paperId));
  const saved = Boolean(useSelector(selectSavedPapers)[paperId]);
  const { canUse, openPaywall } = usePaywall();
  const [docId, setDocId] = useState('paper');
  const goBack = useGoBack(PATHS.pyq);

  const locked = Boolean(paper?.premium) && !canUse(PYQ_FEATURE);
  const readable = Boolean(paper) && !locked;

  // Reading time counts toward study time; page turns count as activity.
  const { touchProps, touch } = useStudySession({
    type: 'study',
    refId: readable ? paperId : null,
  });

  useEffect(() => {
    if (readable) {
      dispatch(markPaperViewed(paperId));
    }
  }, [dispatch, paperId, readable]);

  const docs = paper ? DOCS.filter(d => d.urlOf(paper)) : [];
  const current = docs.find(d => d.id === docId) ?? docs[0];

  let body;
  if (!paper) {
    body = <ViewerMessage title="This paper is no longer available" />;
  } else if (locked) {
    body = (
      <ViewerMessage
        title="This paper is for Pro members"
        detail="Upgrade to read every previous year paper."
        actionLabel="See Pro plans"
        onAction={() => openPaywall(PYQ_FEATURE)}
      />
    );
  } else if (!current) {
    body = <ViewerMessage title="No file attached to this paper yet" />;
  } else {
    body = (
      <Suspense fallback={<ScreenLoader />}>
        <PdfViewer
          key={current.id}
          url={current.urlOf(paper)}
          onProgress={touch}
        />
      </Suspense>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-white" {...touchProps}>
      <header className="flex items-center border-b border-slate-100 px-4 py-2">
        <button
          type="button"
          onClick={() => goBack()}
          aria-label="Go back"
          className="rounded-full p-2 hover:bg-slate-100">
          <AppIcon name="arrow-left" color="#0f172a" size={22} />
        </button>
        <div className="ml-3 min-w-0 flex-1">
          <h1 className="truncate text-base font-bold text-slate-900">
            {paper ? paperLabel(paper) : 'Previous Year Paper'}
          </h1>
          {paper ? (
            <p className="truncate text-[11px] text-slate-500">{paper.title}</p>
          ) : null}
        </div>
        {paper ? (
          <button
            type="button"
            onClick={() => dispatch(toggleSavedPaper(paperId))}
            aria-label={saved ? 'Remove from saved' : 'Save paper'}
            aria-pressed={saved}
            className="ml-3 rounded-full p-2 hover:bg-slate-100">
            <AppIcon
              name="bookmark"
              color={saved ? '#2563eb' : '#334155'}
              fill={saved ? '#2563eb' : 'none'}
              size={22}
            />
          </button>
        ) : null}
      </header>

      {readable && docs.length > 1 ? (
        <div
          role="group"
          aria-label="Document"
          className="flex shrink-0 border-b border-slate-100 bg-white px-4 py-2">
          {docs.map(d => {
            const active = d.id === current?.id;
            return (
              <button
                key={d.id}
                type="button"
                aria-pressed={active}
                onClick={() => setDocId(d.id)}
                className={`mr-2 rounded-full px-4 py-1.5 text-xs font-bold ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}>
                {d.label}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col">{body}</div>

      {readable && paper.mockId ? (
        <Link
          to={PATHS.mockInstructions(paper.mockId)}
          className="mx-4 my-2 flex h-12 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white hover:bg-blue-700 sm:mx-auto sm:w-80">
          <AppIcon name="clipboard-check" size={18} color="#ffffff" />
          <span className="ml-2">Attempt this paper as a test</span>
        </Link>
      ) : null}
    </div>
  );
}
