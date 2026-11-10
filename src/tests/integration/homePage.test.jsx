import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  recordActivity,
  setLastActivity,
} from '@/features/activity/store/activitySlice';
import { logout } from '@/features/auth/store/authSlice';
import HomePage from '@/features/home/pages/HomePage';
import {
  discardSession,
  startPractice,
} from '@/features/practice/store/practiceSlice';
import { fetchMe } from '@/features/user/store/userSlice';
import { selectContinueItem } from '@/store/selectors/activitySelectors';
import { store } from '@/store';
import { loadExamData } from '../utils/examData';
import { finishPracticeForTest } from '../utils/practice';
import { renderWithRealStore } from '../utils/renderWithRealStore';
import { addStudySession } from '../utils/study';

// Web port of mobile homeDashboard + continueLearning tests, plus the three cards that exist
// only on the web (today's plan, study time, streak).
const SLOW = { timeout: 5000 };
const routes = [
  { path: '/', element: <HomePage /> },
  { path: '*', element: <p>elsewhere</p> },
];
const renderHome = async () => {
  const view = renderWithRealStore(null, { routes, entries: ['/'] });
  await screen.findByText(/Prepare Smarter/, {}, SLOW);
  return view;
};
const where = router =>
  router.state.location.pathname + router.state.location.search;
const href = name => screen.getByRole('link', { name }).getAttribute('href');

describe('Home dashboard', () => {
  beforeAll(loadExamData, 15000);
  beforeEach(() => {
    // a clean student: nothing studied, nothing to continue, no test in progress
    store.dispatch(setLastActivity(null));
    store.dispatch(discardSession());
  });

  describe('layout', () => {
    it('shows the cards in the planned order', async () => {
      await renderHome();
      const order = [
        screen.getByRole('region', { name: 'Welcome' }),
        screen.getByRole('link', { name: 'Open OMR scanner' }),
        screen.getByRole('navigation', { name: 'Quick actions' }),
        screen.getByRole('region', { name: 'Your preparation progress' }),
        screen.getByRole('region', { name: "Today's study plan" }),
        screen.getByRole('link', { name: /Study Time/ }),
        screen.getByRole('link', { name: /Streak/ }),
        screen.getByRole('region', { name: 'Continue learning' }),
        screen.getByRole('region', { name: 'Weak topics' }),
        screen.getByRole('region', { name: 'Popular exams' }),
      ];
      for (let i = 1; i < order.length; i += 1) {
        expect(
          order[i - 1].compareDocumentPosition(order[i]) &
            Node.DOCUMENT_POSITION_FOLLOWING,
        ).toBeTruthy();
      }
    });

    it('greets the student by name', async () => {
      await renderHome();
      expect(screen.getByText('Abhishek')).toBeInTheDocument();
    });
  });

  describe('OMR scanner and quick actions', () => {
    it('shows the OMR scanner under the banner, free for every student', async () => {
      const { router } = await renderHome();
      const card = screen.getByRole('link', { name: 'Open OMR scanner' });
      expect(card).toHaveTextContent('AI OMR Scanner');
      expect(card).toHaveTextContent('FREE');
      // nothing on the card itself is locked or asks for an upgrade
      expect(card.textContent).not.toMatch(/Pro|Upgrade|Unlock/);
      await userEvent.click(card);
      expect(where(router)).toBe('/omr');
    });

    it('each quick action opens its page', async () => {
      await renderHome();
      expect(href(/Study Material/)).toBe('/study-material');
      expect(href(/Practice Tests/)).toBe('/tests');
      expect(href(/Mock Tests/)).toBe('/mocks');
      expect(
        within(screen.getByRole('navigation', { name: 'Quick actions' }))
          .getByRole('link', { name: 'Ask epadh.ai' })
          .getAttribute('href'),
      ).toBe('/ask');
    });

    it('has a floating Ask epadh.ai button', async () => {
      await renderHome();
      const links = screen.getAllByRole('link', { name: 'Ask epadh.ai' });
      expect(links.some(link => link.getAttribute('href') === '/ask')).toBe(
        true,
      );
    });
  });

  describe('weak topics', () => {
    afterEach(() => {
      store.dispatch({
        type: fetchMe.fulfilled.type,
        payload: {
          profile: { id: 'u1', name: 'Abhishek', mobile: null },
          selectedExamId: 'pet',
          entitlements: { plan: 'free', features: {} },
        },
      });
    });

    it('shows a locked preview to a Free student and opens the paywall', async () => {
      const { router } = await renderHome();
      expect(
        screen.getByText('Find the topics that cost you marks'),
      ).toBeInTheDocument();
      await userEvent.click(
        screen.getByRole('button', { name: /Unlock with Pro/ }),
      );
      expect(where(router)).toBe('/membership?feature=weakTopics');
    });

    it('shows the real weak topics area to a Pro student', async () => {
      act(() => {
        store.dispatch({
          type: fetchMe.fulfilled.type,
          payload: {
            profile: { id: 'u1', name: 'A', mobile: null },
            selectedExamId: 'pet',
            entitlements: { plan: 'pro', features: {} },
          },
        });
      });
      await renderHome();
      expect(screen.getByText(/Take a few practice tests/)).toBeInTheDocument();
      expect(screen.queryByText(/Unlock with Pro/)).not.toBeInTheDocument();
    });
  });

  describe("today's study plan", () => {
    it("lists the day's tasks with their minutes and links to the page they open", async () => {
      await renderHome();
      const plan = screen.getByRole('region', { name: "Today's study plan" });
      expect(
        await within(plan).findByText(/0 of 3 done · 70 min planned/),
      ).toBeInTheDocument();
      const links = within(plan).getAllByRole('link');
      expect(links.map(l => l.getAttribute('href'))).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/^\/topics\//),
          expect.stringMatching(/^\/practice\//),
          '/mocks',
        ]),
      );
      expect(
        within(plan).getByRole('link', { name: /View plan/ }),
      ).toHaveAttribute('href', '/plan');
    });

    it('ticks a task off by itself once the student has done it', async () => {
      await renderHome();
      const plan = screen.getByRole('region', { name: "Today's study plan" });
      await within(plan).findByText(/of 3 done/);
      const practiceRow = within(plan)
        .getByText(/Practice · 15 min/)
        .closest('a');
      const topicId = practiceRow.getAttribute('href').split('/').pop();
      expect(
        within(practiceRow).queryByRole('img', { name: 'Done' }),
      ).not.toBeInTheDocument();

      await act(async () => {
        await finishPracticeForTest(topicId);
      });
      expect(await within(plan).findByText(/1 of 3 done/)).toBeInTheDocument();
      expect(
        within(practiceRow).getByRole('img', { name: 'Done' }),
      ).toBeInTheDocument();
    });
  });

  describe('study time and streak', () => {
    // earlier tests finished practice sets and studied: start from a student who did nothing
    beforeEach(async () => {
      store.dispatch(logout());
      await loadExamData();
    }, 15000);

    it('start empty for a new student', async () => {
      await renderHome();
      expect(
        screen.getByRole('link', { name: /Study Time/ }),
      ).toHaveTextContent('0 / 60 min');
      const streak = screen.getByRole('link', { name: /Streak/ });
      expect(streak).toHaveTextContent('0 days');
      expect(streak).toHaveTextContent('Study 10 min today to start a streak');
    });

    it("count today's minutes and start a streak at ten", async () => {
      addStudySession({ seconds: 25 * 60 });
      await renderHome();
      expect(
        screen.getByRole('link', { name: /Study Time/ }),
      ).toHaveTextContent('25 / 60 min');
      const streak = screen.getByRole('link', { name: /Streak/ });
      expect(streak).toHaveTextContent('1 day');
      expect(streak).toHaveTextContent('Today counted');
      expect(
        screen.getByRole('progressbar', { name: 'Study time today' }),
      ).toHaveAttribute('aria-valuenow', '42');
    });

    it('say when the goal is reached', async () => {
      addStudySession({ seconds: 65 * 60, hour: 9 });
      await renderHome();
      expect(
        screen.getByRole('link', { name: /Study Time/ }),
      ).toHaveTextContent('65 / 60 min');
      expect(
        screen.getByRole('link', { name: /Study Time/ }),
      ).toHaveTextContent('Goal reached today!');
    });

    it('warn that a streak is at risk until today counts', async () => {
      store.dispatch(logout());
      await loadExamData();
      addStudySession({ daysAgo: 1, seconds: 15 * 60 });
      addStudySession({ daysAgo: 2, seconds: 15 * 60 });
      addStudySession({ seconds: 4 * 60 }); // today: 4 min, not enough
      await renderHome();
      const streak = screen.getByRole('link', { name: /Streak/ });
      expect(streak).toHaveTextContent('2 days');
      expect(streak).toHaveTextContent('Study 6 more min today to keep it');
    });

    it('both open the streak page', async () => {
      const { router } = await renderHome();
      await userEvent.click(screen.getByRole('link', { name: /Study Time/ }));
      expect(where(router)).toBe('/streak');
    });
  });

  describe('continue learning', () => {
    const record = activity =>
      act(() => store.dispatch(recordActivity(activity)));

    it('has nothing to continue for a new student and sends them to the syllabus', async () => {
      const { router } = await renderHome();
      expect(selectContinueItem(store.getState())).toBeNull();
      expect(screen.getByText('Nothing to continue yet')).toBeInTheDocument();

      await userEvent.click(
        screen.getByRole('button', { name: 'Pick your first topic' }),
      );
      expect(where(router)).toBe('/syllabus');
    });

    it('Start Learning opens the syllabus when there is nothing to resume', async () => {
      const { router } = await renderHome();
      await userEvent.click(
        screen.getByRole('button', { name: /Start Learning/ }),
      );
      expect(where(router)).toBe('/syllabus');
    });

    it('shows the last topic and reopens it from Continue and from Start Learning', async () => {
      record({ type: 'study', mode: 'topic', topicId: 't-percentage' });
      const { router } = await renderHome();
      const section = screen.getByRole('region', { name: 'Continue learning' });
      expect(section).toHaveTextContent('Topic');
      expect(section).toHaveTextContent('Percentage');
      expect(section).toHaveTextContent('Quantitative Aptitude › Arithmetic');

      await userEvent.click(
        within(section).getByRole('button', { name: /Continue/ }),
      );
      expect(where(router)).toBe('/topics/t-percentage');
    });

    it('Start Learning resumes the last activity too', async () => {
      record({ type: 'study', mode: 'topic', topicId: 't-percentage' });
      const { router } = await renderHome();
      await userEvent.click(
        screen.getByRole('button', { name: /Start Learning/ }),
      );
      expect(where(router)).toBe('/topics/t-percentage');
    });

    it('reopens the material file the student was on', async () => {
      record({
        type: 'study',
        mode: 'material',
        topicId: 't-number-types',
        itemId: 'm1',
      });
      const { router } = await renderHome();
      const section = screen.getByRole('region', { name: 'Continue learning' });
      expect(section).toHaveTextContent('Study Material');
      expect(section).toHaveTextContent(
        'Quantitative Aptitude › Number System',
      );
      await userEvent.click(
        within(section).getByRole('button', { name: /Continue/ }),
      );
      expect(where(router)).toBe('/material/m1');
    });

    it('goes to the practice test in progress, or to its setup once it is finished', async () => {
      await store.dispatch(
        startPractice({
          topicId: 't-hcf-lcm',
          topicName: 'HCF & LCM',
          subjectId: 'quant',
          subjectName: 'Quantitative Aptitude',
          count: 5,
          mode: 'practice',
        }),
      );
      record({ type: 'practice', mode: 'practice', topicId: 't-hcf-lcm' });
      const first = await renderHome();
      const section = screen.getByRole('region', { name: 'Continue learning' });
      expect(section).toHaveTextContent('HCF & LCM');
      await userEvent.click(
        within(section).getByRole('button', { name: /Continue/ }),
      );
      expect(where(first.router)).toBe('/practice/session');
      first.unmount();

      act(() => {
        store.dispatch(discardSession());
      });
      const second = await renderHome();
      await userEvent.click(
        within(
          screen.getByRole('region', { name: 'Continue learning' }),
        ).getByRole('button', { name: /Continue/ }),
      );
      expect(where(second.router)).toBe('/practice/t-hcf-lcm');
    });

    it('ignores locked topics, unknown topics and another exam', () => {
      record({ type: 'study', mode: 'topic', topicId: 't-time-work' }); // Pro chapter
      expect(selectContinueItem(store.getState())).toBeNull();
      record({ type: 'study', mode: 'topic', topicId: 't-nope' });
      expect(selectContinueItem(store.getState())).toBeNull();
      record({ type: 'study', mode: 'topic', topicId: 't-ratio' });
      expect(selectContinueItem(store.getState())).toMatchObject({
        topicId: 't-ratio',
      });
      act(() => {
        store.dispatch(
          setLastActivity({
            ...store.getState().activity.last,
            examId: 'police',
          }),
        );
      });
      expect(selectContinueItem(store.getState())).toBeNull();
    });

    it('falls back to the topic when the saved material no longer exists', () => {
      record({
        type: 'study',
        mode: 'material',
        topicId: 't-ratio',
        itemId: 'gone',
      });
      expect(selectContinueItem(store.getState())).toMatchObject({
        mode: 'topic',
      });
    });

    it('does not save the same activity twice in a row', () => {
      record({ type: 'study', mode: 'topic', topicId: 't-ratio' });
      const first = store.getState().activity.last.at;
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(Date.now() + 60000);
      record({ type: 'study', mode: 'topic', topicId: 't-ratio' });
      vi.useRealTimers();
      expect(store.getState().activity.last.at).toBe(first);
    });
  });
});
