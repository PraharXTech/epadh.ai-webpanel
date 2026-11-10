import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import DOMPurify from 'dompurify';

// Study articles are admin-authored HTML, but they still go through DOMPurify before they
// touch the page: a script or an `onerror=` that slipped into a note must never run in a
// student's browser (the mobile renderer had no scripting engine, a browser does).
// Links open in a new tab and cannot reach back into this one.
DOMPurify.addHook('afterSanitizeAttributes', node => {
  if (node.tagName === 'A' && node.getAttribute('href')) {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

const sanitize = html =>
  DOMPurify.sanitize(html ?? '', { ADD_ATTR: ['target'] });

const THROTTLE_MS = 250;

// Rich-text material. Text size is set by the reader, and reading progress is how far down
// the article the student has scrolled (0-100), resumed from `savedPercent`.
// Web port: the ScrollView became an inner scroll area (so progress and resume work the same
// way as on mobile), and react-native-render-html became sanitised HTML with the
// `.material-html` styles in styles/tokens.css.
export default function HtmlViewer({
  html,
  fontSize = 16,
  savedPercent = 0,
  onProgress,
}) {
  const scrollRef = useRef(null);
  const contentRef = useRef(null);
  const resumed = useRef(false);
  const timer = useRef(null);
  const onProgressRef = useRef(onProgress);
  useEffect(() => {
    onProgressRef.current = onProgress;
  });

  const clean = useMemo(() => sanitize(html), [html]);

  const report = () => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }
    const scrollable = el.scrollHeight - el.clientHeight;
    onProgressRef.current?.(
      scrollable > 0 ? Math.min(100, (el.scrollTop / scrollable) * 100) : 100,
    );
  };

  // Once the text is laid out: if it all fits it counts as read; otherwise jump back to
  // where the student stopped (once per open). Re-runs when the size changes (text size,
  // images loading) so the resume point is computed against the final height.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    const content = contentRef.current;
    if (!el || !content) {
      return undefined;
    }
    const settle = () => {
      const scrollable = el.scrollHeight - el.clientHeight;
      if (scrollable <= 0) {
        report(); // all on one screen: read
      } else if (!resumed.current && savedPercent > 0 && savedPercent < 100) {
        resumed.current = true;
        el.scrollTop = (savedPercent / 100) * scrollable;
      }
    };
    settle();
    const observer = new ResizeObserver(settle);
    observer.observe(content);
    return () => observer.disconnect();
    // `report` only reads refs; `savedPercent` is the value from when the page opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clean, fontSize]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const handleScroll = () => {
    if (timer.current) {
      return;
    }
    timer.current = setTimeout(() => {
      timer.current = null;
      report();
    }, THROTTLE_MS);
  };

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      data-testid="html-scroll"
      className="min-h-0 flex-1 overflow-y-auto bg-white">
      <div
        ref={contentRef}
        className="material-html mx-auto max-w-3xl p-4 text-slate-900"
        style={{ fontSize, lineHeight: 1.55 }}
        dangerouslySetInnerHTML={{ __html: clean }}
      />
    </div>
  );
}
