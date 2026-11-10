import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect } from 'react';
import { logout } from '@/features/auth/store/authSlice';
import MaterialViewerPage from '@/features/material/pages/MaterialViewerPage';
import { setProgress } from '@/features/material/store/materialSlice';
import { PATTERNS } from '@/routes/routePaths';
import { store } from '@/store';
import { loadExamData } from '../utils/examData';
import { renderWithRealStore } from '../utils/renderWithRealStore';

// jsdom cannot draw PDF canvases, so pdf.js is replaced by a stand-in with the same props:
// <Document> reports its page count (or an error), <Page> draws a labelled box.
const pdf = vi.hoisted(() => ({ numPages: 14, fail: false, files: [] }));
vi.mock('react-pdf', () => ({
  pdfjs: { GlobalWorkerOptions: {} },
  Document: ({ file, onLoadSuccess, onLoadError, children }) => {
    useEffect(() => {
      pdf.files.push(file);
      if (pdf.fail) onLoadError(new Error('offline'));
      else onLoadSuccess({ numPages: pdf.numPages });
      // once per file: the viewer passes new callbacks on every render, and re-reporting
      // each time would loop forever (the real <Document> reports once per load)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [file]);
    return <div data-testid="pdf-document">{children}</div>;
  },
  Page: ({ pageNumber }) => <div>pdf page {pageNumber}</div>,
}));

const progressOf = id => store.getState().material.progress[id];
const SLOW = { timeout: 4000 };
const routes = [
  { path: PATTERNS.material, element: <MaterialViewerPage /> },
  { path: '*', element: <p>somewhere else</p> },
];
const open = (itemId, extra = {}) =>
  renderWithRealStore(null, {
    routes,
    entries: [`/material/${itemId}`],
    ...extra,
  });

describe('Material viewer page', () => {
  beforeAll(loadExamData);
  beforeEach(() => {
    pdf.fail = false;
    pdf.numPages = 14;
    pdf.files.length = 0;
  });

  it('opens notes in the PDF reader', async () => {
    open('m1');
    expect(
      await screen.findByTestId('pdf-document', {}, SLOW),
    ).toBeInTheDocument();
    expect(pdf.files[0]).toMatch(/\.pdf$/);
    expect(
      screen.getByText('Number System – Complete Notes'),
    ).toBeInTheDocument();
    expect(await screen.findByLabelText('Page 1 of 14')).toHaveTextContent(
      '1 / 14',
    );
  });

  it('draws every page and tracks how far the student scrolled', async () => {
    open('m1');
    expect(
      await screen.findByText('pdf page 14', {}, SLOW),
    ).toBeInTheDocument();

    // jsdom has no layout: say where the pages are (500 px each, view 800 px tall)
    const area = screen.getByTestId('pdf-scroll');
    Object.defineProperty(area, 'clientHeight', {
      value: 800,
      configurable: true,
    });
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
      function () {
        const page = this.dataset?.page;
        const scrolled = area.scrollTop;
        const top = page ? (Number(page) - 1) * 500 - scrolled : 0;
        return {
          top,
          bottom: top + 500,
          left: 0,
          right: 0,
          width: 0,
          height: 500,
        };
      },
    );

    area.scrollTop = 3000; // middle of the view = 3400 px = page 7
    area.dispatchEvent(new Event('scroll'));
    await waitFor(() => expect(progressOf('m1')).toBe(50));
    expect(screen.getByLabelText('Page 7 of 14')).toBeInTheDocument();
    vi.restoreAllMocks();
  });

  it('reopens the PDF at the page the student stopped on', async () => {
    store.dispatch(setProgress({ id: 'm1', percent: 50 }));
    open('m1');
    expect(
      await screen.findByLabelText('Page 7 of 14', {}, SLOW),
    ).toBeInTheDocument();
  });

  it('zooms in and out, stopping at the limits', async () => {
    open('m1');
    const zoomOut = await screen.findByRole(
      'button',
      { name: 'Zoom out' },
      SLOW,
    );
    await userEvent.click(zoomOut); // 100% -> 75%
    expect(zoomOut).toBeDisabled();
    const zoomIn = screen.getByRole('button', { name: 'Zoom in' });
    for (let i = 0; i < 4; i += 1) await userEvent.click(zoomIn);
    expect(zoomIn).toBeDisabled();
  });

  it('opens practice sets and PYQs as PDFs too', async () => {
    open('m3');
    expect(
      await screen.findByTestId('pdf-document', {}, SLOW),
    ).toBeInTheDocument();
  });

  it('offers a retry when the PDF cannot be loaded', async () => {
    pdf.fail = true;
    open('m5');
    expect(
      await screen.findByText("Couldn't open this PDF", {}, SLOW),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('pdf-document')).not.toBeInTheDocument();

    pdf.fail = false;
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByTestId('pdf-document')).toBeInTheDocument();
  });

  it('says so when the material does not exist', async () => {
    open('nope');
    expect(
      await screen.findByText('This material is no longer available', {}, SLOW),
    ).toBeInTheDocument();
  });

  it('opens rich-text articles in the reader and resizes the text', async () => {
    open('m12');
    expect(
      await screen.findByText('Prime and composite', {}, SLOW),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('pdf-document')).not.toBeInTheDocument();

    expect(store.getState().material.fontSize).toBe(16);
    await userEvent.click(screen.getByRole('button', { name: 'Larger text' }));
    await userEvent.click(screen.getByRole('button', { name: 'Larger text' }));
    expect(store.getState().material.fontSize).toBe(20);
    expect(document.querySelector('.material-html')).toHaveStyle({
      fontSize: '20px',
    });
    await userEvent.click(screen.getByRole('button', { name: 'Smaller text' }));
    expect(store.getState().material.fontSize).toBe(18);
  });

  it('bookmarks and un-bookmarks the open material', async () => {
    open('m1');
    await userEvent.click(
      await screen.findByRole('button', { name: 'Bookmark' }, SLOW),
    );
    expect(store.getState().material.bookmarks.m1).toBe(true);
    await userEvent.click(
      screen.getByRole('button', { name: 'Remove bookmark' }),
    );
    expect(store.getState().material.bookmarks.m1).toBeUndefined();
  });

  it('back goes one step, or to the topic when opened from a link', async () => {
    const { router } = open('m1', {
      entries: ['/topics/t-number-types', '/material/m1'],
      index: 1,
    });
    await userEvent.click(
      await screen.findByRole('button', { name: 'Go back' }, SLOW),
    );
    expect(router.state.location.pathname).toBe('/topics/t-number-types');
  });

  it('back from a direct link goes to the topic the material belongs to', async () => {
    const { router } = open('m1');
    await userEvent.click(
      await screen.findByRole('button', { name: 'Go back' }, SLOW),
    );
    expect(router.state.location.pathname).toBe('/topics/t-number-types');
  });

  it('a link to a material opened with nothing loaded loads it first (web only)', async () => {
    await new Promise(resolve => setTimeout(resolve, 1200)); // let earlier loads finish
    store.dispatch(logout());
    const { chooseExam } = await import('@/features/user/store/userSlice');
    await store.dispatch(chooseExam({ examIds: ['pet'] }));

    open('m12');
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
    expect(
      await screen.findByText('Prime and composite', {}, SLOW),
    ).toBeInTheDocument();
  });
});

describe('video player', () => {
  beforeAll(loadExamData);

  // jsdom does not play media: give the element the properties a real one has.
  const prepare = video => {
    const state = { currentTime: 0 };
    Object.defineProperty(video, 'duration', {
      value: 100,
      configurable: true,
    });
    Object.defineProperty(video, 'currentTime', {
      get: () => state.currentTime,
      set: value => {
        state.currentTime = value;
      },
      configurable: true,
    });
    return state;
  };

  it('plays with controls, resumes from saved progress and records watching', async () => {
    open('m2'); // seeded at 75%
    const video = await screen
      .findByTestId('video', {}, SLOW)
      .catch(() => null);
    const element = video ?? document.querySelector('video');
    expect(element.getAttribute('src')).toMatch(/\.mp4$/);
    expect(element.controls).toBe(true);
    expect(screen.getByText('Video • 42 min')).toBeInTheDocument();

    const clock = prepare(element);
    act(() => element.dispatchEvent(new Event('loadedmetadata')));
    expect(clock.currentTime).toBe(75);

    clock.currentTime = 80;
    act(() => element.dispatchEvent(new Event('timeupdate')));
    expect(progressOf('m2')).toBe(80);

    act(() => element.dispatchEvent(new Event('ended')));
    expect(progressOf('m2')).toBe(100);
  });

  it('offers a retry when the video cannot be played', async () => {
    open('m2');
    const element = await waitFor(() => {
      const found = document.querySelector('video');
      expect(found).not.toBeNull();
      return found;
    }, SLOW);
    act(() => element.dispatchEvent(new Event('error')));
    expect(
      await screen.findByText("Couldn't play this video"),
    ).toBeInTheDocument();
    expect(document.querySelector('video')).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(document.querySelector('video')).not.toBeNull();
  });

  it('shows the spinner until the video is ready', async () => {
    open('m2');
    await waitFor(
      () => expect(document.querySelector('video')).not.toBeNull(),
      SLOW,
    );
    expect(
      screen.getByRole('status', { name: 'Loading video' }),
    ).toBeInTheDocument();
    act(() =>
      document.querySelector('video').dispatchEvent(new Event('canplay')),
    );
    expect(
      screen.queryByRole('status', { name: 'Loading video' }),
    ).not.toBeInTheDocument();
  });
});

describe('article reader scrolling', () => {
  beforeAll(loadExamData);
  afterEach(() => vi.restoreAllMocks());

  // jsdom has no layout: pretend the article is 1000 px tall in a 500 px window.
  const longArticle = () => {
    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(
      1000,
    );
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(500);
  };

  it('reports how far down the student has read', async () => {
    longArticle();
    open('m12');
    const area = await screen.findByTestId('html-scroll', {}, SLOW);
    area.scrollTop = 250; // halfway down the scrollable 500 px
    area.dispatchEvent(new Event('scroll'));
    await waitFor(() => expect(progressOf('m12')).toBe(50));
  });

  it('resumes where the student stopped', async () => {
    longArticle();
    store.dispatch(setProgress({ id: 'm12', percent: 40 }));
    open('m12');
    const area = await screen.findByTestId('html-scroll', {}, SLOW);
    expect(area.scrollTop).toBe(200); // 40% of the scrollable 500 px
  });

  it('counts a short article that fits on one screen as read', async () => {
    store.dispatch(setProgress({ id: 'm12', percent: 0 }));
    open('m12'); // no layout mock: nothing to scroll
    await screen.findByTestId('html-scroll', {}, SLOW);
    expect(progressOf('m12')).toBe(100);
  });
});

describe('article safety', () => {
  beforeAll(loadExamData);

  it('strips scripts, event handlers and javascript: links from article HTML', async () => {
    const { default: HtmlViewer } =
      await import('@/features/material/components/HtmlViewer');
    const { render } = await import('@testing-library/react');
    window.__pwned = false;
    render(
      <HtmlViewer
        html={
          '<h2>Safe</h2><script>window.__pwned = true</script>' +
          '<img src="x" onerror="window.__pwned = true">' +
          '<a href="javascript:window.__pwned = true">bad</a>' +
          '<a href="https://example.com">good</a>'
        }
      />,
    );
    const root = document.querySelector('.material-html');
    expect(root.querySelector('script')).toBeNull();
    expect(root.querySelector('img')?.getAttribute('onerror')).toBeNull();
    expect(root.querySelector('a[href^="javascript"]')).toBeNull();
    const good = within(root).getByText('good');
    expect(good).toHaveAttribute('target', '_blank');
    expect(good).toHaveAttribute('rel', 'noopener noreferrer');
    expect(window.__pwned).toBe(false);
  });
});

describe('time spent', () => {
  beforeAll(loadExamData);
  afterEach(() => vi.useRealTimers());

  it('reports the seconds on a material when the student leaves it', async () => {
    const { unmount } = open('m3');
    await screen.findByTestId('pdf-document', {}, SLOW);
    vi.useFakeTimers({ toFake: ['Date'] }); // only the clock; timers stay real
    vi.setSystemTime(Date.now() + 5000);
    unmount();
    expect(store.getState().material.timeSpent.m3).toBeGreaterThanOrEqual(5);
  });
});
