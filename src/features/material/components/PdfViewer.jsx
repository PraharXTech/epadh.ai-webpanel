import { useCallback, useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import AppIcon from '@/components/common/AppIcon';
import ViewerMessage from './ViewerMessage';

// pdf.js does the parsing in a worker; Vite turns this URL into a separate hashed file.
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const A4_RATIO = 1.414; // placeholder height until the real page size is known
const MAX_WIDTH = 900;
const ZOOMS = [0.75, 1, 1.25, 1.5, 2];
const SCROLL_THROTTLE_MS = 150;

// One page. It only renders its canvas once it is near the viewport (a 200-page paper must
// not paint 200 canvases), and keeps it afterwards.
function LazyPage({ pageNumber, width, root }) {
  const holder = useRef(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const element = holder.current;
    if (!element || !root) {
      return undefined;
    }
    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { root, rootMargin: '900px 0px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [root]);

  return (
    <div
      ref={holder}
      data-page={pageNumber}
      style={{ width, height: near ? undefined : width * A4_RATIO }}
      className="mx-auto mb-2 bg-white shadow">
      {near ? (
        <Page
          pageNumber={pageNumber}
          width={width}
          renderAnnotationLayer={false}
          loading=""
        />
      ) : null}
    </div>
  );
}

// Scrollable PDF with zoom. Reports how far the student has read (0-100: the page in the
// middle of the view over the page count) and jumps back to where they stopped last time.
// Web port of the react-native-pdf version, same props. The PDF host must send CORS headers
// (Access-Control-Allow-Origin) for pdf.js to fetch it: see phases.md W4 notes.
export default function PdfViewer({ url, savedPercent = 0, onProgress }) {
  const scrollRef = useRef(null);
  const resumed = useRef(false);
  const timer = useRef(null);
  const onProgressRef = useRef(onProgress);
  useEffect(() => {
    onProgressRef.current = onProgress;
  });

  const [root, setRoot] = useState(null); // the scroll area, for the lazy pages
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [position, setPosition] = useState({ page: 1, pages: 0 });
  const [zoomIndex, setZoomIndex] = useState(1);
  const [areaWidth, setAreaWidth] = useState(0);

  const setScrollArea = useCallback(node => {
    scrollRef.current = node;
    setRoot(node);
  }, []);

  // Page width follows the available space (and the zoom).
  useEffect(() => {
    if (!root) {
      return undefined;
    }
    const measure = () => setAreaWidth(root.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => observer.disconnect();
  }, [root]);
  const pageWidth = Math.max(
    200,
    Math.min(areaWidth - 16, MAX_WIDTH) * ZOOMS[zoomIndex],
  );

  const currentPage = () => {
    const area = scrollRef.current;
    if (!area) {
      return 1;
    }
    const middle = area.getBoundingClientRect().top + area.clientHeight / 2;
    let found = 1;
    for (const element of area.querySelectorAll('[data-page]')) {
      if (element.getBoundingClientRect().top <= middle) {
        found = Number(element.dataset.page);
      } else {
        break;
      }
    }
    return found;
  };

  const handleScroll = () => {
    if (timer.current) {
      return;
    }
    timer.current = setTimeout(() => {
      timer.current = null;
      const page = currentPage();
      setPosition(p => {
        if (p.pages > 0) {
          onProgressRef.current?.((page / p.pages) * 100);
        }
        return { ...p, page };
      });
    }, SCROLL_THROTTLE_MS);
  };
  useEffect(() => () => clearTimeout(timer.current), []);

  const handleLoaded = ({ numPages }) => {
    setLoading(false);
    setPosition({ page: 1, pages: numPages });
  };

  // Resume once per open (not again after a retry or a zoom): scroll to the saved page.
  useEffect(() => {
    if (
      resumed.current ||
      position.pages === 0 ||
      !(savedPercent > 0 && savedPercent < 100)
    ) {
      return;
    }
    const area = scrollRef.current;
    const target = Math.max(
      1,
      Math.ceil((savedPercent / 100) * position.pages),
    );
    const element = area?.querySelector(`[data-page="${target}"]`);
    if (element) {
      resumed.current = true;
      area.scrollTop = element.offsetTop - area.offsetTop;
      setPosition(p => ({ ...p, page: target }));
    }
  }, [position.pages, savedPercent, pageWidth]);

  const retry = () => {
    setFailed(false);
    setLoading(true);
    setAttempt(n => n + 1);
  };

  if (failed) {
    return (
      <ViewerMessage
        title="Couldn't open this PDF"
        detail="Check your connection and try again."
        actionLabel="Retry"
        onAction={retry}
      />
    );
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-slate-200">
      <div
        ref={setScrollArea}
        onScroll={handleScroll}
        data-testid="pdf-scroll"
        className="min-h-0 flex-1 overflow-auto p-2">
        <Document
          key={attempt}
          file={url}
          loading=""
          onLoadSuccess={handleLoaded}
          onLoadError={() => setFailed(true)}
          onSourceError={() => setFailed(true)}>
          {Array.from({ length: position.pages }, (_, index) => (
            <LazyPage
              key={index + 1}
              pageNumber={index + 1}
              width={pageWidth}
              root={root}
            />
          ))}
        </Document>
      </div>

      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-200">
          <div
            role="status"
            aria-label="Loading PDF"
            className="h-9 w-9 animate-spin rounded-full border-[3px] border-blue-600 border-t-transparent"
          />
        </div>
      ) : null}

      {!loading && position.pages > 0 ? (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-slate-900/85 px-2 py-1 text-white">
          <button
            type="button"
            aria-label="Zoom out"
            disabled={zoomIndex === 0}
            onClick={() => setZoomIndex(i => i - 1)}
            className="rounded-full p-1 hover:bg-white/20 disabled:opacity-40">
            <AppIcon name="minus" color="currentColor" size={16} />
          </button>
          <span
            aria-label={`Page ${position.page} of ${position.pages}`}
            className="px-1 text-xs font-semibold">
            {`${position.page} / ${position.pages}`}
          </span>
          <button
            type="button"
            aria-label="Zoom in"
            disabled={zoomIndex === ZOOMS.length - 1}
            onClick={() => setZoomIndex(i => i + 1)}
            className="rounded-full p-1 hover:bg-white/20 disabled:opacity-40">
            <AppIcon name="plus" color="currentColor" size={16} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
