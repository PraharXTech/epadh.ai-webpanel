import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Outlet } from 'react-router-dom';
import AlertHost from '@/app/AlertHost';
import { logout } from '@/features/auth/store/authSlice';
import MockInstructionsPage from '@/features/mock/pages/MockInstructionsPage';
import MockResultPage from '@/features/mock/pages/MockResultPage';
import MockSessionPage from '@/features/mock/pages/MockSessionPage';
import MockTestsPage from '@/features/mock/pages/MockTestsPage';
import {
  clearResult,
  goToQuestion,
  selectOption,
  startMock,
  submitMock,
  syncAnswers,
} from '@/features/mock/store/mockSlice';
import { fetchMe } from '@/features/user/store/userSlice';
import { PATHS, PATTERNS } from '@/routes/routePaths';
import { store } from '@/store';
import { loadExamData } from '../utils/examData';
import { renderWithRealStore } from '../utils/renderWithRealStore';

// Web port of mobile mockTestFlow.test.jsx, plus the list page, the leave and tab-close
// guards, the keyboard, the palette, the autosave, the countdown and the rank states.
const SLOW = { timeout: 5000 };

const routes = [
  {
    // showAlert() needs the AlertHost the real app mounts above the router
    element: (
      <>
        <AlertHost />
        <Outlet />
      </>
    ),
    children: [
      { path: PATHS.mocks, element: <MockTestsPage /> },
      { path: PATHS.mockSession, element: <MockSessionPage /> },
      { path: PATHS.mockResult, element: <MockResultPage /> },
      { path: PATTERNS.mockInstructions, element: <MockInstructionsPage /> },
      { path: PATHS.tests, element: <p>tests page</p> },
      { path: '/membership', element: <p>membership page</p> },
      { path: '*', element: <p>somewhere else</p> },
    ],
  },
];
const at = (...entries) =>
  renderWithRealStore(null, { routes, entries, index: entries.length - 1 });
const where = router => router.state.location.pathname;
const search = router => router.state.location.search;

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

const mock = () => store.getState().mock;
const begin = testId => store.dispatch(startMock(testId));
// answers every question of the running attempt with the right option
const answerAll = () =>
  act(() => {
    mock().session.questions.forEach((q, i) => {
      store.dispatch(goToQuestion(i));
      store.dispatch(selectOption(q.answer));
    });
    store.dispatch(goToQuestion(0));
  });

describe('mock tests', () => {
  beforeAll(loadExamData, 15000);
  beforeEach(() => {
    store.dispatch(logout());
    return loadExamData().then(() => setPlan('free'));
  }, 15000);

  describe('list page', () => {
    it('shows the types, the recommended tests and every test with its status', async () => {
      at('/mocks');
      expect(
        await screen.findByRole(
          'heading',
          { name: 'Mock Tests', level: 1 },
          SLOW,
        ),
      ).toBeInTheDocument();
      const types = await screen.findByRole(
        'group',
        { name: 'Test type' },
        SLOW,
      );
      [
        'All Tests',
        'Full Length',
        'Subject Wise',
        'Previous Year',
        'Topic Wise',
      ].forEach(label =>
        expect(
          within(types).getByRole('button', { name: new RegExp(label) }),
        ).toBeInTheDocument(),
      );
      expect(
        screen.getByRole('article', { name: /Most Popular/ }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('article', { name: /Latest/ }),
      ).toBeInTheDocument();
      // a test with a past attempt shows its score ring, the others "Not attempted"
      expect(screen.getAllByText('60%').length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Not\s*attempted/).length).toBeGreaterThan(0);
      expect(screen.getByRole('link', { name: /Exam:/ })).toHaveAttribute(
        'href',
        '/exams/select',
      );
    });

    it('filters by type and sorts', async () => {
      at('/mocks');
      await screen.findByText('Previous Year Paper 2023', {}, SLOW);
      await userEvent.click(
        within(screen.getByRole('group', { name: 'Test type' })).getByRole(
          'button',
          { name: /Subject Wise/ },
        ),
      );
      expect(
        screen.getByText('Quantitative Aptitude Mock Test'),
      ).toBeInTheDocument();
      expect(
        screen.queryByText('Previous Year Paper 2023'),
      ).not.toBeInTheDocument();

      await userEvent.click(
        within(screen.getByRole('group', { name: 'Test type' })).getByRole(
          'button',
          { name: /All Tests/ },
        ),
      );
      const sorts = screen.getByRole('group', { name: 'Sort' });
      await userEvent.click(
        within(sorts).getByRole('button', { name: 'Popular' }),
      );
      expect(
        within(sorts).getByRole('button', { name: 'Popular' }),
      ).toHaveAttribute('aria-pressed', 'true');
      const titles = screen
        .getAllByRole('listitem')
        .map(li => li.textContent)
        .filter(text => /Full Mock Test|Percentage Topic/.test(text));
      expect(titles[0]).toMatch(/Full Mock Test 01/); // popularity 100 first
    });

    it('opens the instructions of a free test', async () => {
      const { router } = at('/mocks');
      await userEvent.click(
        await screen.findByRole(
          'button',
          { name: /Reasoning Mock Test/ },
          SLOW,
        ),
      );
      expect(where(router)).toBe('/mocks/subject-reasoning');
    });

    it('sends a Free student to Membership for a Pro test, a Pro student opens it', async () => {
      const { router } = at('/mocks');
      await userEvent.click(
        await screen.findByRole(
          'button',
          { name: /Previous Year Paper 2023/ },
          SLOW,
        ),
      );
      expect(where(router)).toBe('/membership');
      expect(search(router)).toBe('?feature=advancedMocks');

      setPlan('pro');
      await act(async () => router.navigate('/mocks'));
      await userEvent.click(
        await screen.findByRole(
          'button',
          { name: /Previous Year Paper 2023/ },
          SLOW,
        ),
      );
      expect(where(router)).toBe('/mocks/pyq-2023');
    });

    it('starts the recommended test from its card', async () => {
      const { router } = at('/mocks');
      await userEvent.click(
        await screen.findByRole(
          'button',
          { name: /^Start .*Full Mock Test 01/ },
          SLOW,
        ),
      );
      expect(where(router)).toBe('/mocks/full-01');
    });
  });

  describe('instructions page', () => {
    it('shows the paper details, the rank disclaimer and starts the attempt', async () => {
      const { router } = at('/mocks', '/mocks/subject-quant');
      expect(
        await screen.findByRole(
          'heading',
          { name: 'Quantitative Aptitude Mock Test' },
          SLOW,
        ),
      ).toBeInTheDocument();
      expect(screen.getByText('25 questions')).toBeInTheDocument();
      expect(screen.getByText('25 minutes')).toBeInTheDocument();
      expect(screen.getByText('50 marks')).toBeInTheDocument();
      expect(screen.getByText('−0.5 per wrong answer')).toBeInTheDocument();
      expect(
        screen.getByText(/not an official national rank/),
      ).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: 'Start test' }));
      await waitFor(() => expect(where(router)).toBe('/mocks/session'), SLOW);
      expect(mock().session.questions).toHaveLength(25);
      expect(mock().session.durationSec).toBe(25 * 60);
    });

    it('says so when a test has no negative marking, and for a missing test', async () => {
      at('/mocks/topic-percentage');
      expect(
        await screen.findByText('No negative marking', {}, SLOW),
      ).toBeInTheDocument();
    });

    it('says so when the test no longer exists', async () => {
      at('/mocks/nope');
      expect(
        await screen.findByText('This test is no longer available.', {}, SLOW),
      ).toBeInTheDocument();
    });

    it('offers to resume the attempt in progress', async () => {
      await begin('subject-quant');
      const { router } = at('/mocks/subject-quant');
      expect(
        await screen.findByText('You have this test in progress', {}, SLOW),
      ).toBeInTheDocument();
      expect(screen.getByText(/0 of 25 answered/)).toBeInTheDocument();
      await userEvent.click(
        screen.getByRole('button', { name: 'Resume test' }),
      );
      expect(where(router)).toBe('/mocks/session');
    });

    it('warns before a different test replaces the one in progress', async () => {
      await begin('subject-quant');
      const { router } = at('/mocks/subject-reasoning');
      await userEvent.click(
        await screen.findByRole('button', { name: 'Start test' }, SLOW),
      );
      const dialog = await screen.findByRole('dialog', {
        name: 'Replace the test in progress?',
      });
      await userEvent.click(
        within(dialog).getByRole('button', { name: 'Keep it' }),
      );
      expect(mock().session.testId).toBe('subject-quant');
      expect(where(router)).toBe('/mocks/subject-reasoning');

      await userEvent.click(screen.getByRole('button', { name: 'Start test' }));
      await userEvent.click(
        await screen.findByRole('button', { name: 'Start new test' }),
      );
      await waitFor(() => expect(where(router)).toBe('/mocks/session'), SLOW);
      expect(mock().session.testId).toBe('subject-reasoning');
    });

    it('offers Pro instead of Start for a Pro test', async () => {
      const { router } = at('/mocks/pyq-2023');
      await userEvent.click(
        await screen.findByRole('button', { name: 'Unlock with Pro' }, SLOW),
      );
      expect(where(router)).toBe('/membership');
      expect(search(router)).toBe('?feature=advancedMocks');
    });
  });

  describe('session page', () => {
    it('shows the timer and the question, and answers, marks and clears', async () => {
      await begin('subject-quant');
      at('/mocks/session');
      const { session } = mock();
      expect(await screen.findByRole('timer')).toHaveTextContent(/2[45]:\d\d/);
      expect(
        screen.getByText('Question 1 of 25 · Quantitative Aptitude'),
      ).toBeInTheDocument();
      expect(screen.getByText(session.questions[0].text)).toBeInTheDocument();
      // a mock never reveals the answer mid-test
      expect(screen.queryByText(/Correct!|Not quite/)).not.toBeInTheDocument();

      const radios = screen.getAllByRole('radio');
      await userEvent.click(radios[1]);
      expect(mock().session.answers[session.questions[0].id]).toBe(1);
      expect(screen.getAllByRole('radio')[1]).toHaveAttribute(
        'aria-checked',
        'true',
      );

      await userEvent.click(
        screen.getByRole('button', { name: 'Mark for review' }),
      );
      expect(mock().session.marked[session.questions[0].id]).toBe(true);
      expect(screen.getByRole('button', { name: 'Marked' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );

      await userEvent.click(
        screen.getByRole('button', { name: 'Clear response' }),
      );
      expect(mock().session.answers[session.questions[0].id]).toBeUndefined();
      expect(
        screen.getByRole('button', { name: 'Clear response' }),
      ).toBeDisabled();
    });

    it('moves with Save & Next and Previous, and Submit appears on the last question', async () => {
      await begin('subject-quant');
      at('/mocks/session');
      await userEvent.click(
        await screen.findByRole('button', { name: /Save & Next/ }),
      );
      expect(screen.getByText(/Question 2 of 25/)).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: /Previous/ }));
      expect(screen.getByText(/Question 1 of 25/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Previous/ })).toBeDisabled();

      act(() => store.dispatch(goToQuestion(24)));
      expect(
        screen.getByRole('button', { name: 'Submit' }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /Save & Next/ }),
      ).not.toBeInTheDocument();
    });

    it('has section tabs for a multi-subject paper and jumps to a section', async () => {
      await begin('full-01');
      at('/mocks/session');
      const sections = await screen.findByRole('group', { name: 'Sections' });
      ['Quantitative Aptitude', 'Reasoning', 'General Awareness'].forEach(
        name =>
          expect(
            within(sections).getByRole('button', { name }),
          ).toBeInTheDocument(),
      );
      await userEvent.click(
        within(sections).getByRole('button', { name: 'Reasoning' }),
      );
      const reasoning = mock().session.sections.find(
        s => s.subjectName === 'Reasoning',
      );
      expect(mock().session.current).toBe(reasoning.start);
      expect(
        within(sections).getByRole('button', { name: 'Reasoning' }),
      ).toHaveAttribute('aria-pressed', 'true');
    });

    it('does not show section tabs for a one-subject paper', async () => {
      await begin('subject-quant');
      at('/mocks/session');
      await screen.findByRole('timer');
      expect(
        screen.queryByRole('group', { name: 'Sections' }),
      ).not.toBeInTheDocument();
    });

    it('uses the palette to jump, showing answered and marked questions', async () => {
      await begin('subject-quant');
      at('/mocks/session');
      await screen.findByRole('timer');
      act(() => {
        store.dispatch(selectOption(0)); // question 1 answered
        store.dispatch(goToQuestion(1));
      });
      await userEvent.click(
        screen.getByRole('button', { name: 'Question palette' }),
      );
      const sheet = await screen.findByRole('dialog', { name: 'Questions' });
      expect(
        within(sheet).getByRole('button', { name: 'Question 1, answered' }),
      ).toBeInTheDocument();
      expect(
        within(sheet).getByRole('button', { name: 'Question 2, current' }),
      ).toBeInTheDocument();
      await userEvent.click(
        within(sheet).getByRole('button', { name: 'Question 7, not answered' }),
      );
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.getByText(/Question 7 of 25/)).toBeInTheDocument();
    });

    it('answers, moves and marks from the keyboard', async () => {
      await begin('subject-quant');
      at('/mocks/session');
      await screen.findByRole('timer');
      const id = () => mock().session.questions[mock().session.current].id;

      await userEvent.keyboard('c');
      expect(mock().session.answers[id()]).toBe(2);
      await userEvent.keyboard('{ArrowRight}');
      expect(mock().session.current).toBe(1);
      await userEvent.keyboard('1');
      expect(mock().session.answers[id()]).toBe(0);
      await userEvent.keyboard('m');
      expect(mock().session.marked[id()]).toBe(true);
      await userEvent.keyboard('{ArrowLeft}');
      expect(mock().session.current).toBe(0);
    });

    it('summarises before submitting, and Keep going changes nothing', async () => {
      await begin('subject-quant');
      at('/mocks/session');
      await screen.findByRole('timer');
      act(() => {
        store.dispatch(selectOption(0));
        store.dispatch(goToQuestion(24));
      });
      await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
      const dialog = await screen.findByRole('dialog', {
        name: 'Submit test?',
      });
      expect(
        within(dialog).getByText('Answered').previousSibling,
      ).toHaveTextContent('1');
      expect(
        within(dialog).getByText('Not answered').previousSibling,
      ).toHaveTextContent('24');
      await userEvent.click(
        within(dialog).getByRole('button', { name: 'Keep going' }),
      );
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(mock().session).not.toBeNull();
    });

    it('submits through the summary and opens the result', async () => {
      await begin('subject-quant');
      const { router } = at('/mocks/session');
      await screen.findByRole('timer');
      answerAll();
      act(() => store.dispatch(goToQuestion(24)));
      await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
      await userEvent.click(
        await screen.findByRole('button', { name: 'Confirm & submit' }),
      );
      await waitFor(() => expect(where(router)).toBe('/mocks/result'), SLOW);
      expect(mock().session).toBeNull();
      expect(mock().result.correct).toBe(25);
      expect(await screen.findByText('50/50')).toBeInTheDocument();
    });

    it('submits itself when the time is up', async () => {
      await begin('topic-percentage');
      const { router } = at('/mocks/session');
      await screen.findByRole('timer');
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(Date.now() + 16 * 60 * 1000);
      try {
        await waitFor(() => expect(where(router)).toBe('/mocks/result'), SLOW);
      } finally {
        vi.useRealTimers();
      }
      expect(mock().session).toBeNull();
      expect(mock().result.unattempted).toBe(15);
    });

    it('counts down from the server clock, not the device clock', async () => {
      await begin('subject-quant');
      // the device clock is an hour fast: the deadline must not move with it
      const { session } = mock();
      expect(session.endsAt - session.startedAt).toBe(25 * 60 * 1000);
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(Date.now() + 60 * 60 * 1000);
      try {
        at('/mocks/session');
        // offset 0 in the mock, so an hour of device time has run the test out
        await waitFor(() => expect(mock().result).not.toBeNull(), SLOW);
      } finally {
        vi.useRealTimers();
      }
    });

    it('saves answers every few seconds and notes when it is offline', async () => {
      await begin('subject-quant');
      at('/mocks/session');
      await screen.findByRole('timer');
      await userEvent.keyboard('a');
      await waitFor(() => expect(mock().sync).toBe('saved'), { timeout: 8000 });

      // a failed save shows the offline note
      act(() => {
        store.dispatch({ type: syncAnswers.rejected.type, payload: 'offline' });
      });
      expect(screen.getByText(/Offline, will sync/)).toBeInTheDocument();
    }, 15000);

    it('asks before leaving; Stay keeps the test open', async () => {
      await begin('subject-quant');
      const { router } = at('/mocks/subject-quant', '/mocks/session');
      await userEvent.click(
        await screen.findByRole('button', { name: 'Leave test' }),
      );
      const dialog = await screen.findByRole('dialog', {
        name: 'Leave this test?',
      });
      await userEvent.click(
        within(dialog).getByRole('button', { name: 'Stay' }),
      );
      expect(where(router)).toBe('/mocks/session');
      expect(mock().session).not.toBeNull();
    });

    it('Leave goes back and keeps the attempt for a later resume', async () => {
      await begin('subject-quant');
      const { router } = at('/mocks/subject-quant', '/mocks/session');
      await screen.findByRole('timer');
      await userEvent.keyboard('b');
      await userEvent.click(screen.getByRole('button', { name: 'Leave test' }));
      const dialog = await screen.findByRole('dialog', {
        name: 'Leave this test?',
      });
      await userEvent.click(
        within(dialog).getByRole('button', { name: 'Leave' }),
      );
      await waitFor(() => expect(where(router)).toBe('/mocks/subject-quant'));
      expect(Object.keys(mock().session.answers)).toHaveLength(1);
    });

    it('asks before closing or reloading the tab', async () => {
      await begin('subject-quant');
      at('/mocks/session');
      await screen.findByRole('timer');
      const event = new Event('beforeunload', { cancelable: true });
      window.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
    });

    it('keeps the attempt across a reload: a fresh render resumes it', async () => {
      await begin('subject-quant');
      act(() => store.dispatch(selectOption(3)));
      const first = at('/mocks/session');
      await screen.findByRole('timer');
      first.unmount();
      at('/mocks/session');
      expect(await screen.findByText(/Question 1 of 25/)).toBeInTheDocument();
      expect(screen.getAllByRole('radio')[3]).toHaveAttribute(
        'aria-checked',
        'true',
      );
    });

    it('counts leaving the tab, without ending the test', async () => {
      await begin('subject-quant');
      at('/mocks/session');
      await screen.findByRole('timer');
      const hide = state => {
        Object.defineProperty(document, 'visibilityState', {
          configurable: true,
          get: () => state,
        });
        document.dispatchEvent(new Event('visibilitychange'));
      };
      act(() => hide('hidden'));
      act(() => hide('visible'));
      expect(screen.getByText('Left tab 1×')).toBeInTheDocument();
      expect(mock().session).not.toBeNull();
    });

    it('goes to the mock list when there is no attempt', async () => {
      const { router } = at('/mocks/session');
      await waitFor(() => expect(where(router)).toBe('/mocks'));
    });
  });

  describe('result page', () => {
    const finish = async (answerRight = true) => {
      await begin('subject-quant');
      if (answerRight) {
        answerAll();
      }
      await act(async () => {
        await store.dispatch(submitMock());
      });
    };

    it('shows the score, rank, and a filterable review', async () => {
      await finish();
      at('/mocks/subject-quant', '/mocks/result');
      expect(await screen.findByText('50/50')).toBeInTheDocument();
      expect(screen.getByText(/Accuracy 100%/)).toBeInTheDocument();
      const { rank, participants, percentile } = mock().result;
      expect(
        screen.getByText(`Rank ${rank} of ${participants}`),
      ).toBeInTheDocument();
      expect(
        screen.getByText(`${percentile}th percentile`),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/not an official national rank/),
      ).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: 'Marked' }));
      expect(screen.getByText('Nothing here.')).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: 'All' }));
      expect(
        screen.getAllByText('Correct answer:', { exact: false }).length,
      ).toBe(25);
    });

    it('applies negative marking, and filters wrong and unattempted answers', async () => {
      await begin('subject-quant');
      act(() => {
        const { questions } = mock().session;
        // two right, one wrong, the rest left blank
        store.dispatch(goToQuestion(0));
        store.dispatch(selectOption(questions[0].answer));
        store.dispatch(goToQuestion(1));
        store.dispatch(selectOption(questions[1].answer));
        store.dispatch(goToQuestion(2));
        store.dispatch(selectOption((questions[2].answer + 1) % 4));
      });
      await act(async () => {
        await store.dispatch(submitMock());
      });
      at('/mocks/subject-quant', '/mocks/result');

      // 2 right × 2 marks − 1 wrong × 0.5 = 3.5
      expect(await screen.findByText('3.5/50')).toBeInTheDocument();
      expect(
        screen.getByText('Includes −0.5 for wrong answers'),
      ).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: 'Wrong' }));
      expect(
        screen.getAllByText('Your answer:', { exact: false }),
      ).toHaveLength(1);
      await userEvent.click(
        screen.getByRole('button', { name: 'Unattempted' }),
      );
      expect(
        screen.getAllByText('Correct answer:', { exact: false }),
      ).toHaveLength(22);
    });

    it('lists the marked questions under Marked', async () => {
      await begin('subject-quant');
      act(() => {
        store.dispatch(goToQuestion(4));
      });
      // mark question 5
      const { toggleMarked } = await import('@/features/mock/store/mockSlice');
      act(() => {
        store.dispatch(toggleMarked());
      });
      await act(async () => {
        await store.dispatch(submitMock());
      });
      at('/mocks/subject-quant', '/mocks/result');
      await userEvent.click(
        await screen.findByRole('button', { name: 'Marked' }),
      );
      expect(
        screen.getAllByText('Correct answer:', { exact: false }),
      ).toHaveLength(1);
    });

    it('shows a section breakdown for a multi-subject paper only', async () => {
      await finish();
      const single = at('/mocks/subject-quant', '/mocks/result');
      await screen.findByText('50/50');
      expect(screen.queryByText('Section-wise')).not.toBeInTheDocument();
      single.unmount();

      await begin('full-01');
      await act(async () => {
        await store.dispatch(submitMock());
      });
      at('/mocks/full-01', '/mocks/result');
      expect(await screen.findByText('Section-wise')).toBeInTheDocument();
      expect(
        screen.getAllByText(/30 correct|0\/30 correct/).length,
      ).toBeGreaterThan(0);
    });

    it('says there are not enough participants below 30', async () => {
      await finish();
      act(() => {
        store.dispatch({
          type: submitMock.fulfilled.type,
          payload: {
            ...mock().result,
            participants: 12,
            rank: 3,
            percentile: 75,
          },
        });
      });
      at('/mocks/subject-quant', '/mocks/result');
      expect(
        await screen.findByText('Not enough participants yet'),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/once 30 students have taken this test/),
      ).toBeInTheDocument();
    });

    it('queues the rank of an attempt submitted offline and fills it in when a request goes through', async () => {
      await finish();
      act(() => {
        store.dispatch({
          type: submitMock.fulfilled.type,
          payload: {
            ...mock().result,
            rank: null,
            participants: null,
            percentile: null,
            rankPending: true,
            scorePercent: 100,
          },
        });
      });
      expect(mock().pendingRank).not.toBeNull();
      at('/mocks/subject-quant', '/mocks/result');
      expect(
        await screen.findByText(/Rank \d+ of \d+/, {}, SLOW),
      ).toBeInTheDocument();
      expect(mock().pendingRank).toBeNull();
    });

    it('asks epadh.ai about a question', async () => {
      await finish();
      const { router } = at('/mocks/subject-quant', '/mocks/result');
      await userEvent.click(
        (await screen.findAllByRole('button', { name: /Ask epadh.ai/ }))[0],
      );
      expect(where(router)).toBe('/ask');
      expect(router.state.location.state.initialPrompt).toContain(
        mock().result.review[0].text,
      );
    });

    it('Done clears the result and goes back', async () => {
      await finish();
      const { router } = at('/mocks', '/mocks/result');
      await userEvent.click(
        await screen.findByRole('button', { name: 'Done' }),
      );
      await waitFor(() => expect(where(router)).toBe('/mocks'));
      expect(mock().result).toBeNull();
    });

    it('says so when there is no result, and Done is not needed', async () => {
      act(() => store.dispatch(clearResult()));
      at('/mocks/result');
      expect(
        await screen.findByText('There is no result to show.'),
      ).toBeInTheDocument();
    });
  });
});
