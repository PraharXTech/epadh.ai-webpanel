import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MaterialPage from '@/features/material/pages/MaterialPage';
import {
  setExamFilter,
  setQuery,
  setSubjectFilter,
  setTypeFilter,
} from '@/features/material/store/materialSlice';
import { chooseExam } from '@/features/user/store/userSlice';
import { store } from '@/store';
import { renderWithRealStore } from '../utils/renderWithRealStore';

// Web port of mobile materialScreen.test.jsx plus the filters, the sheets and the keyboard.
const SLOW = { timeout: 4000 };
const open = () =>
  renderWithRealStore(<MaterialPage />, { entries: ['/study-material'] });
const where = router => router.state.location.pathname;

describe('Study Material page', () => {
  beforeAll(async () => {
    await store.dispatch(chooseExam({ examIds: ['pet'] }));
  });

  // the filters live in the (shared) store: start every test from a clean list
  beforeEach(() => {
    store.dispatch(setSubjectFilter(null));
    store.dispatch(setTypeFilter('all'));
    store.dispatch(setExamFilter(null));
    store.dispatch(setQuery(''));
  });

  it('renders the design: pills, filters, subject sections and item rows', async () => {
    open();
    expect(
      await screen.findByText('Number System – Complete Notes', {}, SLOW),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('heading', { name: 'Study Material', level: 1 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /All Subjects/ }),
    ).toBeInTheDocument();
    const filters = screen.getByRole('group', { name: 'Filter by type' });
    ['All', 'Notes', 'Videos', 'PYQs'].forEach(label =>
      expect(
        within(filters).getByRole('button', { name: label }),
      ).toBeInTheDocument(),
    );
    expect(
      screen.getByRole('heading', { name: 'Quantitative Aptitude' }),
    ).toBeInTheDocument();
    expect(screen.getByText('PDF • 3.2 MB • 45 Pages')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument(); // the video's watched progress
    expect(screen.queryByText('Mock Test')).not.toBeInTheDocument();
  });

  it('opens a material in the viewer when its row is clicked', async () => {
    const { router } = open();
    await userEvent.click(
      await screen.findByRole(
        'button',
        { name: /^Number System – Complete Notes/ },
        SLOW,
      ),
    );
    expect(where(router)).toBe('/material/m1');
  });

  it('the Videos filter keeps only videos and marks itself pressed', async () => {
    open();
    await screen.findByText('Number System – Complete Notes', {}, SLOW);
    const videos = screen.getByRole('button', { name: 'Videos' });
    await userEvent.click(videos);
    expect(videos).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByText('Percentage – Concept & Questions'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Number System – Complete Notes'),
    ).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'All' }));
    expect(
      screen.getByText('Number System – Complete Notes'),
    ).toBeInTheDocument();
  });

  it('picks a subject from the sheet, and the sheet closes', async () => {
    open();
    await screen.findByText('Number System – Complete Notes', {}, SLOW);
    await userEvent.click(screen.getByRole('button', { name: /All Subjects/ }));

    const sheet = await screen.findByRole('dialog', { name: 'Select subject' });
    await userEvent.click(
      within(sheet).getByRole('radio', { name: 'Reasoning' }),
    );
    expect(
      screen.queryByRole('dialog', { name: 'Select subject' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Reasoning' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Number System – Complete Notes'),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/Blood Relation/)).toBeInTheDocument();

    // put it back for the next tests
    await userEvent.click(screen.getByRole('button', { name: 'Reasoning' }));
    await userEvent.click(
      within(await screen.findByRole('dialog')).getByRole('radio', {
        name: 'All Subjects',
      }),
    );
  });

  it('"View All" narrows to one subject', async () => {
    open();
    await userEvent.click(
      await screen.findByRole(
        'button',
        { name: 'View all General Awareness' },
        SLOW,
      ),
    );
    expect(
      screen.queryByRole('heading', { name: 'Quantitative Aptitude' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Static GK – Complete Notes')).toBeInTheDocument();
    // no "View All" left once narrowed
    expect(
      screen.queryByRole('button', { name: /^View all/ }),
    ).not.toBeInTheDocument();
  });

  it('bookmarks from the row menu and the sheet closes', async () => {
    open();
    await userEvent.click(
      await screen.findByRole(
        'button',
        { name: /More options for Static GK/ },
        SLOW,
      ),
    );
    const sheet = await screen.findByRole('dialog', {
      name: 'Static GK – Complete Notes',
    });
    await userEvent.click(
      within(sheet).getByRole('button', { name: 'Bookmark' }),
    );
    expect(store.getState().material.bookmarks.m5).toBe(true);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Bookmarked' })).toBeInTheDocument();
  });

  it('downloading from the row marks it as saved offline', async () => {
    open();
    await userEvent.click(
      await screen.findByRole(
        'button',
        { name: 'Download Current Affairs (Monthly PDFs) for offline' },
        SLOW,
      ),
    );
    expect(Object.keys(store.getState().material.downloads)).toContain('m7');
    expect(
      screen.getAllByRole('img', { name: 'Saved for offline' }).length,
    ).toBeGreaterThan(0);
  });

  it('searches, and shows an empty state when nothing matches', async () => {
    open();
    await screen.findByText('Number System – Complete Notes', {}, SLOW);
    await userEvent.click(
      screen.getByRole('button', { name: 'Search material' }),
    );
    await userEvent.type(
      screen.getByLabelText('Search material'),
      'zzz-no-match',
    );
    expect(
      screen.getByText('Nothing matches your filters'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Number System – Complete Notes'),
    ).not.toBeInTheDocument();

    // closing search clears the query
    await userEvent.click(screen.getByRole('button', { name: 'Close search' }));
    expect(store.getState().material.filters.query).toBe('');
    expect(
      screen.getByText('Number System – Complete Notes'),
    ).toBeInTheDocument();
  });

  it('the empty state names the filters when they cause it', async () => {
    store.dispatch(setQuery('zzz-no-match'));
    open();
    expect(
      await screen.findByText('Nothing matches your filters', {}, SLOW),
    ).toBeInTheDocument();
    store.dispatch(setQuery(''));
  });
});
