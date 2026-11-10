import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { logout } from '@/features/auth/store/authSlice';
import ChapterListPage from '@/features/syllabus/pages/ChapterListPage';
import SubjectListPage from '@/features/syllabus/pages/SubjectListPage';
import TopicDetailPage from '@/features/syllabus/pages/TopicDetailPage';
import TopicListPage from '@/features/syllabus/pages/TopicListPage';
import { PATTERNS } from '@/routes/routePaths';
import { store } from '@/store';
import { loadExamData } from '../utils/examData';
import { renderWithRealStore } from '../utils/renderWithRealStore';

// Web port of mobile syllabusFlow.test.jsx. Same content, but "navigate was called with" is now
// "the router ended up at this URL", and the web-only behaviour is added at the end.
const routes = [
  { path: '/syllabus', element: <SubjectListPage /> },
  { path: PATTERNS.subject, element: <ChapterListPage /> },
  { path: PATTERNS.chapter, element: <TopicListPage /> },
  { path: PATTERNS.topic, element: <TopicDetailPage /> },
  { path: '*', element: <p>somewhere else</p> },
];
const at = url => renderWithRealStore(null, { routes, entries: [url] });
const where = router =>
  router.state.location.pathname + router.state.location.search;

describe('syllabus drill-down', () => {
  beforeAll(loadExamData);

  it('lists the subjects of the selected exam with overall progress', async () => {
    const { router } = at('/syllabus');
    expect(await screen.findByText('Syllabus completed')).toBeInTheDocument();
    expect(screen.getByText(/0 of 17 topics done/)).toBeInTheDocument();
    expect(screen.getByText('3 chapters · 8 topics')).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('link', { name: /Quantitative Aptitude/ }),
    );
    expect(where(router)).toBe('/syllabus/all/quant');
  });

  it('the exam pill opens the exam picker', async () => {
    const { router } = at('/syllabus');
    await userEvent.click(
      await screen.findByRole('button', { name: /UPSSSC PET/ }),
    );
    expect(where(router)).toBe('/exams/select');
  });

  it('lists chapters and sends locked ones to the paywall', async () => {
    const { router } = at('/syllabus/all/quant');
    expect(await screen.findByText('Number System')).toBeInTheDocument();
    expect(
      screen.getAllByText('3 topics · 0 completed').length,
    ).toBeGreaterThan(0);

    await userEvent.click(screen.getByRole('link', { name: /Number System/ }));
    expect(where(router)).toBe('/syllabus/all/quant/q-number');
  });

  it('a locked chapter is not a link: it opens the paywall', async () => {
    const { router } = at('/syllabus/all/quant');
    const locked = await screen.findByRole('button', {
      name: /Advanced Maths, locked/,
    });
    await userEvent.click(locked);
    expect(where(router)).toBe('/membership?feature=fullSyllabus');
  });

  it('lists topics, opens open ones and paywalls premium ones', async () => {
    const { router } = at('/syllabus/all/gk/g-current');
    await userEvent.click(
      await screen.findByRole('link', { name: /Monthly Current Affairs/ }),
    );
    expect(where(router)).toBe('/topics/t-monthly');
  });

  it('a premium topic opens the paywall', async () => {
    const { router } = at('/syllabus/all/gk/g-current');
    await userEvent.click(
      await screen.findByRole('button', { name: /Awards & Honours, locked/ }),
    );
    expect(where(router)).toBe('/membership?feature=fullSyllabus');
  });

  it('topic hub: material, mark complete, tabs and what they lead to', async () => {
    const { router } = at('/topics/t-number-types');
    expect(
      await screen.findByText('Quantitative Aptitude › Number System'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Number System – Complete Notes'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Types of Numbers – Quick Revision'),
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: /^Number System – Complete Notes/ }),
    );
    expect(where(router)).toBe('/material/m1');
  });

  it('marks a topic complete and back', async () => {
    at('/topics/t-number-types');
    const mark = await screen.findByRole('button', {
      name: /Mark as complete/,
    });
    await userEvent.click(mark);
    expect(store.getState().syllabus.completed['t-number-types']).toBe(true);
    expect(screen.getByRole('button', { name: /Completed/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await userEvent.click(screen.getByRole('button', { name: /Completed/ }));
    expect(store.getState().syllabus.completed['t-number-types']).toBeFalsy();
  });

  it('the Practice Test tab is kept in the URL and starts practice', async () => {
    const { router } = at('/topics/t-number-types');
    await userEvent.click(
      await screen.findByRole('tab', { name: 'Practice Test' }),
    );
    expect(where(router)).toBe('/topics/t-number-types?tab=practice');
    expect(
      screen.getByText(/Answer questions on this topic/),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Number System – Complete Notes'),
    ).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Start' }));
    expect(where(router)).toBe('/practice/t-number-types');
  });

  it('opens straight onto the Practice Test tab from a link, and back to material', async () => {
    at('/topics/t-number-types?tab=practice');
    expect(
      await screen.findByText(/Answer questions on this topic/),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: 'Study Material' }));
    expect(
      screen.getByText('Number System – Complete Notes'),
    ).toBeInTheDocument();
  });

  it('the Ask tab opens the tutor with this topic', async () => {
    const { router } = at('/topics/t-number-types');
    await userEvent.click(
      await screen.findByRole('tab', { name: 'Ask epadh.ai' }),
    );
    expect(where(router)).toBe(
      '/ask?topicId=t-number-types&topicName=Types%20of%20Numbers',
    );
  });

  it('says so when a topic has no material, and blocks locked topics', async () => {
    at('/topics/t-divisibility');
    expect(
      await screen.findByText('No material for this topic yet.'),
    ).toBeInTheDocument();
  });

  it('a locked topic shows the Pro prompt and no mark-complete button', async () => {
    const { router } = at('/topics/t-time-work');
    expect(
      await screen.findByText('This topic is part of Pro'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Mark as complete/ }),
    ).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'See Pro' }));
    expect(where(router)).toBe('/membership?feature=fullSyllabus');
  });

  it('says so when a topic does not exist', async () => {
    at('/topics/nope');
    expect(
      await screen.findByText('This topic is no longer available.'),
    ).toBeInTheDocument();
  });

  it('lists the other topics of the chapter in a rail, with this one marked', async () => {
    at('/topics/t-number-types');
    const rail = await screen.findByRole('navigation', {
      name: 'Topics in Number System',
    });
    expect(rail).toHaveTextContent('HCF & LCM');
    expect(rail.querySelector('[aria-current="page"]')).toHaveTextContent(
      'Types of Numbers',
    );
  });
});

describe('opening a page from a link with nothing loaded yet (web only)', () => {
  beforeAll(async () => {
    // Loads started by the tests above may still be in flight (mock delay 500 ms) and would
    // land AFTER the logout below, refilling the store: let them finish first.
    await new Promise(resolve => setTimeout(resolve, 1200));
    // a fresh session: exam chosen, but no syllabus or material cached
    store.dispatch(logout());
    const { chooseExam } = await import('@/features/user/store/userSlice');
    await store.dispatch(chooseExam({ examIds: ['pet'] }));
  });

  it('the topic page loads its own data instead of saying the topic is gone', async () => {
    at('/topics/t-number-types');
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
    expect(
      await screen.findByRole(
        'heading',
        { name: 'Types of Numbers' },
        { timeout: 4000 },
      ),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.getByText('Number System – Complete Notes'),
      ).toBeInTheDocument(),
    );
  });
});
