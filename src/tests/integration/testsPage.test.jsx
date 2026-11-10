import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toaster } from 'react-hot-toast';
import { Outlet } from 'react-router-dom';
import AlertHost from '@/app/AlertHost';
import { logout } from '@/features/auth/store/authSlice';
import { startMock } from '@/features/mock/store/mockSlice';
import { startPractice } from '@/features/practice/store/practiceSlice';
import TestsPage from '@/features/tests/pages/TestsPage';
import { PATHS } from '@/routes/routePaths';
import { store } from '@/store';
import { loadExamData } from '../utils/examData';
import { finishPracticeForTest } from '../utils/practice';
import { renderWithRealStore } from '../utils/renderWithRealStore';

// Web port of mobile testsScreen.test.jsx: the Tests hub (stats, categories, search, sort,
// recommended, what opens where, resume cards).
const SLOW = { timeout: 5000 };

const routes = [
  {
    // showAlert() needs the AlertHost the real app mounts above the router
    element: (
      <>
        <AlertHost />
        <Toaster />
        <Outlet />
      </>
    ),
    children: [
      { path: PATHS.tests, element: <TestsPage /> },
      { path: '*', element: <p>somewhere else</p> },
    ],
  },
];
const open = async () => {
  const view = renderWithRealStore(null, { routes, entries: ['/tests'] });
  await screen.findByText('Recommended for You', {}, SLOW);
  return view;
};
const where = router =>
  router.state.location.pathname + router.state.location.search;
// the "All Tests" rows are buttons whose name contains the title
const rowButton = title =>
  screen.getByRole('button', { name: new RegExp(title) });
const rowsText = () =>
  screen
    .getAllByRole('listitem')
    .map(li => li.textContent)
    .join('|');

describe('Tests hub page', () => {
  beforeEach(async () => {
    store.dispatch(logout());
    await loadExamData();
  }, 15000);

  it('shows the stats, exam pill and every category of test', async () => {
    await open();
    expect(
      screen.getByRole('heading', { name: 'Tests', level: 1 }),
    ).toBeInTheDocument();
    [
      'Available Tests',
      'Tests Attempted',
      'Average Score',
      'Rank in Batch',
    ].forEach(label => expect(screen.getByText(label)).toBeInTheDocument());
    expect(screen.getAllByText('—')).toHaveLength(2); // no score yet, and rank has no source
    expect(
      screen.getByRole('button', { name: 'UPSSSC PET' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Recommended for You')).toBeInTheDocument();
    expect(screen.getAllByText(/Full Mock Test 01/).length).toBeGreaterThan(0);
    expect(rowButton('Types of Numbers')).toBeInTheDocument(); // a practice (topic) row
    expect(rowButton('Number System – Mix Questions')).toBeInTheDocument(); // chapter
    expect(rowButton('Quantitative Aptitude Mock Test')).toBeInTheDocument(); // subject
  });

  it('the about button explains the test types without navigating', async () => {
    const { router } = await open();
    await userEvent.click(screen.getByRole('button', { name: 'About tests' }));
    expect(
      await screen.findByText(/Mock Tests are full, timed papers/),
    ).toBeInTheDocument();
    expect(where(router)).toBe('/tests');
  });

  it('explains the rank tile when pressed', async () => {
    const { router } = await open();
    await userEvent.click(
      screen.getByRole('button', { name: /Rank in Batch/ }),
    );
    expect(
      await screen.findByText(/Ranking arrives once timed mock tests/),
    ).toBeInTheDocument();
    expect(where(router)).toBe('/tests');
  });

  it('opens the previous year papers from its card', async () => {
    const { router } = await open();
    await userEvent.click(
      screen.getByRole('link', { name: 'Previous year papers' }),
    );
    expect(where(router)).toBe('/pyq');
  });

  it('opens a practice row on the practice setup page', async () => {
    const { router } = await open();
    await userEvent.click(rowButton('Types of Numbers'));
    expect(where(router)).toBe('/practice/t-number-types');
  });

  it('opens a chapter row the same way, using its first topic', async () => {
    const { router } = await open();
    await userEvent.click(rowButton('Number System – Mix Questions'));
    expect(where(router)).toBe('/practice/t-number-types');
  });

  it('sends a locked topic and a locked chapter to Membership instead', async () => {
    const { router } = await open();
    // "Advanced Maths" is a premium chapter in the mock syllabus
    await userEvent.click(rowButton('Advanced Maths – Mix Questions'));
    expect(where(router)).toBe('/membership?feature=fullSyllabus');
    await act(async () => router.navigate('/tests'));
    await screen.findByText('Recommended for You', {}, SLOW);
    await userEvent.click(rowButton('Awards & Honours'));
    expect(where(router)).toBe('/membership?feature=fullSyllabus');
  });

  it("opens mock and subject rows straight into that test's instructions", async () => {
    const { router } = await open();
    await userEvent.click(rowButton('Quantitative Aptitude Mock Test'));
    expect(where(router)).toBe('/mocks/subject-quant');
    await act(async () => router.navigate('/tests'));
    await screen.findByText('Recommended for You', {}, SLOW);
    const mockRow = screen
      .getAllByRole('button', { name: /Full Mock Test 01/ })
      .find(button => button.closest('li'));
    await userEvent.click(mockRow);
    expect(where(router)).toBe('/mocks/full-01');
  });

  it('the recommended card for the top mock test starts it', async () => {
    const { router } = await open();
    const card = screen.getByRole('article', { name: /Most Popular/ });
    expect(card).toHaveTextContent('Full Mock Test 01'); // the most popular full test
    await userEvent.click(within(card).getByRole('button', { name: /Start/ }));
    expect(where(router)).toBe('/mocks/full-01');
  });

  it('filters the list down to one category', async () => {
    await open();
    const types = screen.getByRole('group', { name: 'Test type' });
    await userEvent.click(
      within(types).getByRole('button', { name: 'Chapter Tests' }),
    );
    expect(rowButton('Number System – Mix Questions')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Types of Numbers/ }),
    ).not.toBeInTheDocument();
    // the PYQ paper only ever appears in the All Tests list, so its absence proves the filter
    expect(
      screen.queryByRole('button', { name: /Previous Year Paper 2023/ }),
    ).not.toBeInTheDocument();
  });

  it('filters by search text across the whole catalog', async () => {
    await open();
    await userEvent.type(screen.getByLabelText('Search tests'), 'hcf');
    expect(rowButton('HCF & LCM')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Types of Numbers/ }),
    ).not.toBeInTheDocument();
    await userEvent.clear(screen.getByLabelText('Search tests'));
    await userEvent.type(screen.getByLabelText('Search tests'), 'zzzz');
    expect(
      screen.getByText('No tests match these filters.'),
    ).toBeInTheDocument();
  });

  it('sorts the list A to Z instead of the default kind-first order', async () => {
    await open();
    const subjectTitle = 'Quantitative Aptitude Mock Test'; // kind: subject
    const chapterTitle = 'Advanced Maths – Mix Questions'; // kind: chapter
    const before = rowsText();
    // default groups by kind first, and subject sorts ahead of chapter
    expect(before.indexOf(subjectTitle)).toBeLessThan(
      before.indexOf(chapterTitle),
    );

    await userEvent.click(screen.getByRole('button', { name: 'Sort tests' }));
    const sheet = await screen.findByRole('dialog', { name: 'Sort tests' });
    expect(
      within(sheet).getByRole('button', { name: 'Recommended' }),
    ).toHaveAttribute('aria-current', 'true');
    await userEvent.click(within(sheet).getByRole('button', { name: 'A–Z' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    const after = rowsText();
    expect(after.indexOf(chapterTitle)).toBeLessThan(
      after.indexOf(subjectTitle),
    );
    expect(screen.getByText('Sort: A–Z')).toBeInTheDocument();
  });

  it('the exam pill opens exam selection', async () => {
    const { router } = await open();
    await userEvent.click(screen.getByRole('button', { name: 'UPSSSC PET' }));
    expect(where(router)).toBe('/exams/select');
  });

  it('offers to resume a practice test in progress and opens it', async () => {
    await store.dispatch(
      startPractice({
        topicId: 't-ratio',
        topicName: 'Ratio & Proportion',
        subjectId: 'quant',
        subjectName: 'Quantitative Aptitude',
        count: 5,
        mode: 'practice',
      }),
    );
    const { router } = await open();
    await userEvent.click(
      screen.getByRole('link', { name: /Resume your test in progress/ }),
    );
    expect(where(router)).toBe('/practice/session');
  });

  it('offers to resume a mock test in progress and opens it', async () => {
    await store.dispatch(startMock('subject-quant'));
    const { router } = await open();
    await userEvent.click(
      screen.getByRole('link', {
        name: /Resume your mock test: Quantitative Aptitude Mock Test/,
      }),
    );
    expect(where(router)).toBe('/mocks/session');
  });

  it('counts a finished practice test toward the stats', async () => {
    const first = await open();
    expect(
      screen.getByText('Tests Attempted').previousSibling,
    ).toHaveTextContent('0');
    first.unmount();

    await act(async () => finishPracticeForTest('t-number-types'));
    await open();
    await waitFor(() =>
      expect(
        screen.getByText('Tests Attempted').previousSibling,
      ).toHaveTextContent('1'),
    );
    expect(screen.getByText(/Last score:/)).toBeInTheDocument();
  });
});
