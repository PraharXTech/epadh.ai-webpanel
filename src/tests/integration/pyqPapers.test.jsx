import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect } from 'react';
import { logout } from '@/features/auth/store/authSlice';
import PyqPapersPage from '@/features/pyq/pages/PyqPapersPage';
import PyqViewerPage from '@/features/pyq/pages/PyqViewerPage';
import { loadPyqPapers } from '@/features/pyq/store/pyqSlice';
import { fetchMe } from '@/features/user/store/userSlice';
import { PATHS, PATTERNS } from '@/routes/routePaths';
import { store } from '@/store';
import { loadExamData } from '../utils/examData';
import { renderWithRealStore } from '../utils/renderWithRealStore';

// Web port of mobile pyqPapers.test.jsx: the list (year chips, search, saved, Pro papers) and
// the viewer (question paper / answer key, viewed tick, attempt-as-test shortcut).
const SLOW = { timeout: 5000 };

// jsdom cannot draw PDF canvases: pdf.js is replaced by a stand-in with the same props
const pdf = vi.hoisted(() => ({ files: [] }));
const service = vi.hoisted(() => ({ fail: false }));
vi.mock('react-pdf', () => ({
  pdfjs: { GlobalWorkerOptions: {} },
  Document: ({ file, onLoadSuccess, children }) => {
    useEffect(() => {
      pdf.files.push(file);
      onLoadSuccess({ numPages: 3 });
      // once per file, like the real <Document>
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [file]);
    return <div data-testid="pdf-document">{children}</div>;
  },
  Page: ({ pageNumber }) => <div>pdf page {pageNumber}</div>,
}));

// the paper list can be made to fail, to see the retry
vi.mock('@/features/pyq/services/pyqService', async importOriginal => {
  const real = await importOriginal();
  return {
    ...real,
    fetchPyqPapers: (...args) =>
      service.fail
        ? Promise.reject(new Error('No connection'))
        : real.fetchPyqPapers(...args),
  };
});

const routes = [
  { path: PATHS.pyq, element: <PyqPapersPage /> },
  { path: PATTERNS.pyqViewer, element: <PyqViewerPage /> },
  { path: PATTERNS.mockInstructions, element: <p>instructions page</p> },
  { path: '/membership', element: <p>membership page</p> },
  { path: '*', element: <p>somewhere else</p> },
];
const at = (...entries) =>
  renderWithRealStore(null, { routes, entries, index: entries.length - 1 });
const where = router => router.state.location.pathname;

const setPlan = plan =>
  act(() => {
    store.dispatch({
      type: fetchMe.fulfilled.type,
      payload: {
        profile: { id: 'u1', name: 'Asha', mobile: '9876543210' },
        selectedExamId: 'pet',
        entitlements: {
          plan,
          validTill: plan === 'pro' ? '2099-01-31T00:00:00.000Z' : null,
          features: {},
        },
      },
    });
  });
const row = title =>
  screen.findByRole('button', { name: `Open ${title}` }, SLOW);

describe('previous year papers', () => {
  beforeEach(async () => {
    store.dispatch(logout());
    await loadExamData();
    setPlan('free');
    pdf.files.length = 0;
    service.fail = false;
  }, 15000);

  describe('list page', () => {
    it('lists every uploaded paper, newest year first, with the year chips', async () => {
      at('/pyq');
      expect(await row('UPSSSC PET 2024 – Shift 1')).toBeInTheDocument();
      expect(screen.getByText('8 papers · UPSSSC PET')).toBeInTheDocument();

      const chips = screen.getByRole('group', { name: 'Filter papers' });
      expect(
        within(chips)
          .getAllByRole('button')
          .map(b => b.textContent),
      ).toEqual([
        'All',
        'Saved',
        '2024',
        '2023',
        '2022',
        '2021',
        '2019',
        '2018',
      ]);

      const titles = screen
        .getAllByRole('button', { name: /^Open / })
        .map(b => b.getAttribute('aria-label'));
      expect(titles.indexOf('Open UPSSSC PET 2024 – Shift 1')).toBeLessThan(
        titles.indexOf('Open UPSSSC PET 2022 – Shift 1'),
      );
      expect(screen.getAllByText('Answer key included').length).toBeGreaterThan(
        0,
      );
      // one exam only: no exam name above each paper
      expect(screen.queryByText('SSC GD')).not.toBeInTheDocument();
    });

    it('filters by year chip and by search', async () => {
      at('/pyq');
      await row('UPSSSC PET 2024 – Shift 1');
      const chips = screen.getByRole('group', { name: 'Filter papers' });

      await userEvent.click(
        within(chips).getByRole('button', { name: '2022' }),
      );
      expect(screen.getAllByRole('button', { name: /^Open / })).toHaveLength(2);
      expect(
        screen.queryByRole('button', { name: /^Open .*2024/ }),
      ).not.toBeInTheDocument();

      await userEvent.click(within(chips).getByRole('button', { name: 'All' }));
      await userEvent.type(screen.getByLabelText('Search papers'), 'zzz');
      expect(
        screen.getByText('Nothing matches your search'),
      ).toBeInTheDocument();

      await userEvent.clear(screen.getByLabelText('Search papers'));
      await userEvent.type(screen.getByLabelText('Search papers'), 'shift 2');
      expect(screen.getAllByRole('button', { name: /^Open / })).toHaveLength(2);
    });

    it('saves a paper and shows it under Saved', async () => {
      at('/pyq');
      await row('UPSSSC PET 2024 – Shift 1');
      const chips = screen.getByRole('group', { name: 'Filter papers' });

      await userEvent.click(
        within(chips).getByRole('button', { name: 'Saved' }),
      );
      expect(screen.getByText('No saved papers')).toBeInTheDocument();
      await userEvent.click(within(chips).getByRole('button', { name: 'All' }));

      await userEvent.click(
        screen.getByRole('button', { name: 'Save UPSSSC PET 2024 – Shift 1' }),
      );
      expect(Object.keys(store.getState().pyq.saved)).toEqual(['pet-2024-s1']);
      expect(
        screen.getByRole('button', {
          name: 'Remove UPSSSC PET 2024 – Shift 1 from saved',
        }),
      ).toHaveAttribute('aria-pressed', 'true');

      await userEvent.click(
        within(chips).getByRole('button', { name: 'Saved' }),
      );
      expect(screen.getAllByRole('button', { name: /^Open / })).toHaveLength(1);
      expect(
        screen.getByRole('button', { name: 'Open UPSSSC PET 2024 – Shift 1' }),
      ).toBeInTheDocument();
    });

    it('opens a free paper in the viewer', async () => {
      const { router } = at('/pyq');
      await userEvent.click(await row('UPSSSC PET 2023'));
      expect(where(router)).toBe('/pyq/pet-2023');
    });

    it('sends a Free student to Membership for a Pro paper, a Pro student reads it', async () => {
      const { router } = at('/pyq');
      await userEvent.click(await row('UPSSSC PET 2019'));
      expect(where(router)).toBe('/membership');
      expect(router.state.location.search).toBe('?feature=advancedMocks');

      setPlan('pro');
      await act(async () => router.navigate('/pyq'));
      await userEvent.click(await row('UPSSSC PET 2019'));
      expect(where(router)).toBe('/pyq/pet-2019');
    });

    it('marks a Pro paper with a PRO badge and a Viewed tick once it was opened', async () => {
      at('/pyq');
      await row('UPSSSC PET 2019');
      expect(screen.getAllByText('PRO')).toHaveLength(2);
      expect(screen.queryByText('Viewed')).not.toBeInTheDocument();
      act(() => {
        store.dispatch({ type: 'pyq/markPaperViewed', payload: 'pet-2021' });
      });
      expect(screen.getByText('Viewed')).toBeInTheDocument();
    });

    it('shows the list saved from the last visit without waiting', async () => {
      await act(async () => {
        await store.dispatch(loadPyqPapers());
      });
      at('/pyq');
      expect(
        screen.getByRole('button', { name: 'Open UPSSSC PET 2024 – Shift 1' }),
      ).toBeInTheDocument();
    });

    it(
      'offers a retry when the papers cannot be loaded',
      { timeout: 15000 },
      async () => {
        // a load still in flight from the previous test would refill the list after logout
        await new Promise(resolve => setTimeout(resolve, 800));
        store.dispatch(logout());
        await loadExamData();
        setPlan('free');
        service.fail = true;
        try {
          at('/pyq');
          expect(
            await screen.findByText('No connection', {}, SLOW),
          ).toBeInTheDocument();
          service.fail = false;
          await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
          expect(await row('UPSSSC PET 2024 – Shift 1')).toBeInTheDocument();
        } finally {
          service.fail = false;
        }
      },
    );
  });

  describe('viewer page', () => {
    beforeEach(async () => {
      await act(async () => {
        await store.dispatch(loadPyqPapers());
      });
    });

    it('opens the question paper, switches to the answer key and marks it viewed', async () => {
      at('/pyq/pet-2024-s1');
      expect(await screen.findByText('2024 • Shift 1')).toBeInTheDocument();
      expect(screen.getByText('UPSSSC PET 2024 – Shift 1')).toBeInTheDocument();
      await screen.findByTestId('pdf-document', {}, SLOW);
      expect(store.getState().pyq.viewed['pet-2024-s1']).toBeDefined();

      const docs = screen.getByRole('group', { name: 'Document' });
      expect(
        within(docs).getByRole('button', { name: 'Question paper' }),
      ).toHaveAttribute('aria-pressed', 'true');
      await userEvent.click(
        within(docs).getByRole('button', { name: 'Answer key' }),
      );
      expect(
        within(docs).getByRole('button', { name: 'Answer key' }),
      ).toHaveAttribute('aria-pressed', 'true');
    });

    it('has no answer key tab when none was uploaded', async () => {
      at('/pyq/pet-2022-s2');
      await screen.findByTestId('pdf-document', {}, SLOW);
      expect(
        screen.queryByRole('group', { name: 'Document' }),
      ).not.toBeInTheDocument();
    });

    it('offers to attempt the paper as a test when it exists as a mock', async () => {
      const { router } = at('/pyq/pet-2023');
      await userEvent.click(
        await screen.findByRole('link', {
          name: 'Attempt this paper as a test',
        }),
      );
      expect(where(router)).toBe('/mocks/pyq-2023');
    });

    it('has no attempt shortcut for a paper without a mock', async () => {
      at('/pyq/pet-2021');
      await screen.findByTestId('pdf-document', {}, SLOW);
      expect(
        screen.queryByRole('link', { name: 'Attempt this paper as a test' }),
      ).not.toBeInTheDocument();
    });

    it('keeps a Pro paper locked for a Free student', async () => {
      const { router } = at('/pyq/pet-2019');
      expect(
        await screen.findByText('This paper is for Pro members'),
      ).toBeInTheDocument();
      expect(store.getState().pyq.viewed['pet-2019']).toBeUndefined();
      expect(screen.queryByTestId('pdf-document')).not.toBeInTheDocument();
      await userEvent.click(
        screen.getByRole('button', { name: 'See Pro plans' }),
      );
      expect(where(router)).toBe('/membership');
      expect(router.state.location.search).toBe('?feature=advancedMocks');
    });

    it('opens a Pro paper for a Pro student', async () => {
      setPlan('pro');
      at('/pyq/pet-2019');
      await screen.findByTestId('pdf-document', {}, SLOW);
      expect(store.getState().pyq.viewed['pet-2019']).toBeDefined();
    });

    it('says so when the paper is gone', async () => {
      at('/pyq/nope');
      expect(
        await screen.findByText('This paper is no longer available'),
      ).toBeInTheDocument();
    });

    it('saves from the header', async () => {
      at('/pyq/pet-2021');
      await userEvent.click(
        await screen.findByRole('button', { name: 'Save paper' }),
      );
      expect(store.getState().pyq.saved['pet-2021']).toBe(true);
      expect(
        screen.getByRole('button', { name: 'Remove from saved' }),
      ).toBeInTheDocument();
    });

    it('goes back to the list', async () => {
      const { router } = at('/pyq', '/pyq/pet-2021');
      await userEvent.click(
        await screen.findByRole('button', { name: 'Go back' }),
      );
      await waitFor(() => expect(where(router)).toBe('/pyq'));
    });

    it('goes to the list when opened directly (nothing behind it)', async () => {
      const { router } = at('/pyq/pet-2021');
      await userEvent.click(
        await screen.findByRole('button', { name: 'Go back' }),
      );
      await waitFor(() => expect(where(router)).toBe('/pyq'));
    });
  });
});
