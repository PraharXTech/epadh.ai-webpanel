import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Outlet } from 'react-router-dom';
import AlertHost from '@/app/AlertHost';
import PracticeResultPage from '@/features/practice/pages/PracticeResultPage';
import PracticeSessionPage from '@/features/practice/pages/PracticeSessionPage';
import PracticeSetupPage from '@/features/practice/pages/PracticeSetupPage';
import {
  clearResult,
  discardSession,
  goToQuestion,
  selectOption,
  startPractice,
  submitSession,
} from '@/features/practice/store/practiceSlice';
import {
  selectMcqDailyLimit,
  selectMcqUsedToday,
} from '@/store/selectors/practiceSelectors';
import { PATHS, PATTERNS } from '@/routes/routePaths';
import { store } from '@/store';
import { loadExamData } from '../utils/examData';
import { renderWithRealStore } from '../utils/renderWithRealStore';

// Web port of mobile practiceFlow.test.jsx, plus the web additions: keyboard, palette, the
// leave guard, the tab-close guard and the router instead of `navigation`.
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
      { path: PATTERNS.practiceSetup, element: <PracticeSetupPage /> },
      { path: PATHS.practiceSession, element: <PracticeSessionPage /> },
      { path: PATHS.practiceResult, element: <PracticeResultPage /> },
      { path: '/topics/:topicId', element: <p>topic page</p> },
      { path: PATHS.tests, element: <p>tests page</p> },
      { path: '*', element: <p>somewhere else</p> },
    ],
  },
];
const at = (...entries) =>
  renderWithRealStore(null, {
    routes,
    entries,
    index: entries.length - 1,
  });
const where = router => router.state.location.pathname;

const begin = async (overrides = {}) => {
  await store.dispatch(
    startPractice({
      topicId: 't-hcf-lcm',
      topicName: 'HCF & LCM',
      subjectId: 'quant',
      subjectName: 'Quantitative Aptitude',
      count: 5,
      mode: 'practice',
      ...overrides,
    }),
  );
};
const session = () => store.getState().practice.session;
const option = text =>
  screen
    .getAllByRole('radio')
    .find(radio => within(radio).queryByText(text, { exact: true }));

describe('practice test flow', () => {
  beforeAll(loadExamData, 15000);
  beforeEach(() => {
    store.dispatch(discardSession());
    store.dispatch(clearResult());
  });

  describe('setup', () => {
    it('shows the topic, the daily allowance and the time a timed test gets', async () => {
      at('/practice/t-hcf-lcm');
      expect(
        await screen.findByText('HCF & LCM', {}, SLOW),
      ).toBeInTheDocument();
      expect(screen.getByText('20 of 20')).toBeInTheDocument();

      await userEvent.click(screen.getByRole('radio', { name: /Timed test/ }));
      expect(screen.getByText(/Time allowed: 10:00/)).toBeInTheDocument();
      await userEvent.click(screen.getByRole('radio', { name: '5' }));
      expect(screen.getByText(/Time allowed: 05:00/)).toBeInTheDocument();
    });

    it('starts a practice session and opens it', async () => {
      const { router } = at('/practice/t-hcf-lcm');
      await userEvent.click(
        await screen.findByRole('radio', { name: '5' }, SLOW),
      );
      await userEvent.click(
        screen.getByRole('button', { name: 'Start practice' }),
      );

      await waitFor(
        () => expect(where(router)).toBe('/practice/session'),
        SLOW,
      );
      expect(session().questions).toHaveLength(5);
      expect(session().mode).toBe('practice');
    });

    it('offers to resume a test that is in progress', async () => {
      await begin();
      const { router } = at('/practice/t-hcf-lcm');
      expect(
        await screen.findByText('You have a test in progress'),
      ).toBeInTheDocument();
      await userEvent.click(screen.getByRole('link', { name: /Resume/ }));
      expect(where(router)).toBe('/practice/session');
    });

    it('a link opened cold loads the topic first', async () => {
      at('/practice/t-ratio');
      expect(
        await screen.findByText('Ratio & Proportion', {}, SLOW),
      ).toBeInTheDocument();
    });
  });

  describe('session', () => {
    it('shows the explanation only after answering, then finishes with a confirmation', async () => {
      await begin();
      const { router } = at('/practice/session');
      const q = session().questions[0];
      expect(await screen.findByText('Question 1 of 5')).toBeInTheDocument();
      expect(screen.getByText(q.text)).toBeInTheDocument();
      expect(screen.queryByText(q.explanation)).not.toBeInTheDocument();

      await userEvent.click(option(q.options[q.answer]));
      expect(screen.getByText('Correct!')).toBeInTheDocument();
      expect(screen.getByText(q.explanation)).toBeInTheDocument();

      act(() => {
        store.dispatch(goToQuestion(4));
      });
      await userEvent.click(screen.getByRole('button', { name: 'Finish' }));
      const dialog = await screen.findByRole('dialog', {
        name: 'Finish practice?',
      });
      expect(dialog).toHaveTextContent('4 questions are still unanswered.');
      await userEvent.click(
        within(dialog).getByRole('button', { name: 'Finish' }),
      );

      await waitFor(() => expect(where(router)).toBe('/practice/result'));
      expect(session()).toBeNull();
    });

    it('marks a wrong answer and says which was right', async () => {
      await begin();
      at('/practice/session');
      const q = session().questions[0];
      const wrong = q.options.findIndex((_, i) => i !== q.answer);
      await userEvent.click(option(q.options[wrong]));
      expect(await screen.findByText('Not quite')).toBeInTheDocument();
      expect(
        within(option(q.options[q.answer])).getByText('Correct answer'),
      ).toBeInTheDocument();
      expect(
        within(option(q.options[wrong])).getByText('Your answer, wrong'),
      ).toBeInTheDocument();
    });

    it('moves with Previous / Next / Skip and the progress bar follows', async () => {
      await begin();
      at('/practice/session');
      await screen.findByText('Question 1 of 5');
      expect(screen.getByRole('button', { name: /Previous/ })).toBeDisabled();
      await userEvent.click(screen.getByRole('button', { name: /Skip/ }));
      expect(screen.getByText('Question 2 of 5')).toBeInTheDocument();
      expect(
        screen.getByRole('progressbar', { name: 'Progress through the test' }),
      ).toHaveAttribute('aria-valuenow', '2');
      await userEvent.click(screen.getByRole('button', { name: /Previous/ }));
      expect(screen.getByText('Question 1 of 5')).toBeInTheDocument();
    });

    it('bookmarks a question', async () => {
      await begin();
      at('/practice/session');
      const q = session().questions[0];
      await userEvent.click(
        await screen.findByRole('button', { name: 'Bookmark question' }),
      );
      expect(store.getState().practice.bookmarks[q.id]).toBe(true);
      expect(
        screen.getByRole('button', { name: 'Bookmark question' }),
      ).toHaveAttribute('aria-pressed', 'true');
    });

    it('a practice session has no timer, marking or palette-only controls', async () => {
      await begin();
      at('/practice/session');
      await screen.findByText('Question 1 of 5');
      expect(screen.queryByRole('timer')).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /Mark for review/ }),
      ).not.toBeInTheDocument();
    });

    it('with no session it sends the visitor to the Tests page', async () => {
      const { router } = at('/practice/session');
      await waitFor(() => expect(where(router)).toBe('/tests'));
    });

    it('shows AI questions with a badge and lets the student report one', async () => {
      await begin({ source: 'ai' });
      at('/practice/session');
      const q = session().questions[0];
      expect(
        await screen.findByText(/Question written by the/),
      ).toBeInTheDocument();
      await userEvent.click(option(q.options[q.answer]));
      await userEvent.click(
        screen.getByRole('button', { name: 'Report wrong question' }),
      );
      expect(
        await screen.findByRole('button', { name: 'Reported, thanks' }),
      ).toBeDisabled();
      expect(store.getState().practice.reported[q.id]).toBe(true);
    });
  });

  describe('keyboard', () => {
    it('digits and letters choose an option, arrows and N / P move', async () => {
      await begin();
      at('/practice/session');
      const q = session().questions[0];
      await screen.findByText('Question 1 of 5');

      await userEvent.keyboard('3');
      expect(session().answers[q.id]).toBe(2);
      await userEvent.keyboard('b');
      expect(session().answers[q.id]).toBeDefined();

      await userEvent.keyboard('{ArrowRight}');
      expect(screen.getByText('Question 2 of 5')).toBeInTheDocument();
      await userEvent.keyboard('n');
      expect(screen.getByText('Question 3 of 5')).toBeInTheDocument();
      await userEvent.keyboard('{ArrowLeft}');
      await userEvent.keyboard('p');
      expect(screen.getByText('Question 1 of 5')).toBeInTheDocument();
      await userEvent.keyboard('{ArrowLeft}'); // already at the first: stays
      expect(screen.getByText('Question 1 of 5')).toBeInTheDocument();
    });

    it('does nothing past the last option or with a modifier key held', async () => {
      await begin();
      at('/practice/session');
      const q = session().questions[0];
      await screen.findByText('Question 1 of 5');
      await userEvent.keyboard('9');
      await userEvent.keyboard('{Control>}1{/Control}');
      expect(session().answers[q.id]).toBeUndefined();
    });

    it('M marks for review in a timed test only', async () => {
      await begin();
      at('/practice/session');
      const q = session().questions[0];
      await screen.findByText('Question 1 of 5');
      await userEvent.keyboard('m');
      expect(session().marked[q.id]).toBeFalsy();
    });

    it('is switched off while a dialog is open', async () => {
      await begin();
      at('/practice/session');
      const q = session().questions[0];
      await screen.findByText('Question 1 of 5');
      await userEvent.click(screen.getByRole('button', { name: 'Leave test' }));
      await screen.findByRole('dialog', { name: 'Leave this test?' });
      await userEvent.keyboard('1');
      expect(session().answers[q.id]).toBeUndefined();
    });
  });

  describe('timed test', () => {
    it('shows a countdown, marking and clearing, and the palette', async () => {
      await begin({ mode: 'test' });
      at('/practice/session');
      expect(
        await screen.findByRole('timer', { name: 'Time left' }),
      ).toHaveTextContent(/0[45]:\d\d/);
      const q = session().questions[0];

      await userEvent.click(
        screen.getByRole('button', { name: 'Mark for review' }),
      );
      expect(session().marked[q.id]).toBe(true);
      await userEvent.keyboard('m');
      expect(session().marked[q.id]).toBeFalsy();

      const clear = screen.getByRole('button', { name: 'Clear answer' });
      expect(clear).toBeDisabled();
      await userEvent.keyboard('2');
      expect(clear).toBeEnabled();
      // a timed test keeps the answer back until the result
      expect(screen.queryByText('Correct!')).not.toBeInTheDocument();
      await userEvent.click(clear);
      expect(session().answers[q.id]).toBeUndefined();
    });

    it("the palette shows each question's state and jumps to it", async () => {
      await begin({ mode: 'test' });
      at('/practice/session');
      await screen.findByRole('timer');
      const palette = screen.getByRole('complementary', {
        name: 'Question palette',
      });
      expect(
        within(palette).getByRole('button', { name: 'Question 1, current' }),
      ).toHaveAttribute('aria-current', 'true');

      await userEvent.keyboard('1'); // answer question 1
      // an answered question shows as answered even while it is the current one
      expect(
        within(palette).getByRole('button', { name: 'Question 1, answered' }),
      ).toHaveAttribute('aria-current', 'true');
      await userEvent.click(
        within(palette).getByRole('button', {
          name: 'Question 3, not answered',
        }),
      );
      expect(screen.getByText('Question 3 of 5')).toBeInTheDocument();
      expect(
        within(palette).getByRole('button', { name: 'Question 1, answered' }),
      ).toBeInTheDocument();
      await userEvent.keyboard('m');
      await userEvent.click(
        within(palette).getByRole('button', { name: 'Question 1, answered' }),
      );
      expect(
        within(palette).getByRole('button', {
          name: 'Question 3, marked for review',
        }),
      ).toBeInTheDocument();
    });

    it('opens the palette in a sheet from the header button', async () => {
      await begin({ mode: 'test' });
      at('/practice/session');
      await userEvent.click(
        await screen.findByRole('button', { name: 'Question palette' }),
      );
      const sheet = await screen.findByRole('dialog', { name: 'Questions' });
      await userEvent.click(
        within(sheet).getByRole('button', { name: 'Question 2, not answered' }),
      );
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.getByText('Question 2 of 5')).toBeInTheDocument();
    });

    it('submits itself when the time is up', async () => {
      await begin({ mode: 'test' });
      const { router } = at('/practice/session');
      await screen.findByRole('timer');
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(Date.now() + 6 * 60 * 1000); // 6 minutes later
      try {
        await waitFor(
          () => expect(where(router)).toBe('/practice/result'),
          SLOW,
        );
      } finally {
        vi.useRealTimers();
      }
    });

    it('asks before closing or reloading the tab', async () => {
      await begin({ mode: 'test' });
      at('/practice/session');
      await screen.findByRole('timer');
      const event = new Event('beforeunload', { cancelable: true });
      window.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
    });

    it('lets an untimed session close without a prompt (it is saved and resumes)', async () => {
      await begin();
      at('/practice/session');
      await screen.findByText('Question 1 of 5');
      const event = new Event('beforeunload', { cancelable: true });
      window.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(false);
    });
  });

  describe('leaving', () => {
    it('asks first; Stay keeps the test open', async () => {
      await begin();
      const { router } = at('/topics/t-hcf-lcm', '/practice/session');
      await userEvent.click(
        await screen.findByRole('button', { name: 'Leave test' }),
      );
      const dialog = await screen.findByRole('dialog', {
        name: 'Leave this test?',
      });
      expect(dialog).toHaveTextContent(
        'Your answers are saved and you can resume later.',
      );
      await userEvent.click(
        within(dialog).getByRole('button', { name: 'Stay' }),
      );
      expect(where(router)).toBe('/practice/session');
      expect(session()).not.toBeNull();
    });

    it('Leave goes back and keeps the answers for a later resume', async () => {
      await begin();
      const { router } = at('/topics/t-hcf-lcm', '/practice/session');
      await userEvent.keyboard('1');
      await userEvent.click(
        await screen.findByRole('button', { name: 'Leave test' }),
      );
      await userEvent.click(
        within(await screen.findByRole('dialog')).getByRole('button', {
          name: 'Leave',
        }),
      );
      await waitFor(() => expect(where(router)).toBe('/topics/t-hcf-lcm'));
      expect(Object.keys(session().answers)).toHaveLength(1);
    });

    it('the browser Back button asks too', async () => {
      await begin({ mode: 'test' });
      const { router } = at('/topics/t-hcf-lcm', '/practice/session');
      await screen.findByRole('timer');
      act(() => {
        router.navigate(-1);
      });
      const dialog = await screen.findByRole('dialog', {
        name: 'Leave this test?',
      });
      expect(dialog).toHaveTextContent('the timer keeps running');
      await userEvent.click(
        within(dialog).getByRole('button', { name: 'Stay' }),
      );
      expect(where(router)).toBe('/practice/session');
    });

    it('opened directly, the arrow goes to the topic (after confirming)', async () => {
      await begin();
      const { router } = at('/practice/session');
      await userEvent.click(
        await screen.findByRole('button', { name: 'Leave test' }),
      );
      await userEvent.click(
        within(await screen.findByRole('dialog')).getByRole('button', {
          name: 'Leave',
        }),
      );
      await waitFor(() => expect(where(router)).toBe('/topics/t-hcf-lcm'));
    });
  });

  describe('result', () => {
    it('shows score, accuracy, review and lets the student retry the missed ones', async () => {
      await begin();
      const { router } = at('/practice/session');
      const q = session().questions[0];
      await screen.findByText('Question 1 of 5');
      await userEvent.click(option(q.options[q.answer]));
      act(() => {
        store.dispatch(goToQuestion(4));
      });
      await userEvent.click(screen.getByRole('button', { name: 'Finish' }));
      await userEvent.click(
        within(await screen.findByRole('dialog')).getByRole('button', {
          name: 'Finish',
        }),
      );
      await waitFor(() => expect(where(router)).toBe('/practice/result'));

      expect(await screen.findByText('1/5')).toBeInTheDocument();
      expect(screen.getByText(/Accuracy 100%/)).toBeInTheDocument();
      expect(screen.getByText('Review answers')).toBeInTheDocument();
      const result = store.getState().practice.result;
      expect(screen.getByText(result.review[1].text)).toBeInTheDocument();

      // filters
      await userEvent.click(screen.getByRole('button', { name: 'Wrong' }));
      expect(screen.getByText('Nothing here. Well done!')).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: 'Skipped' }));
      expect(screen.getByText(result.review[1].text)).toBeInTheDocument();
      expect(screen.queryByText(result.review[0].text)).not.toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: 'All' }));

      await userEvent.click(
        screen.getByRole('button', { name: 'Retry 4 missed' }),
      );
      await waitFor(() => expect(where(router)).toBe('/practice/session'));
      expect(session().questions).toHaveLength(4);
    });

    it('each reviewed question can be taken to the tutor', async () => {
      await begin();
      const { router } = at('/practice/session');
      await screen.findByText('Question 1 of 5');
      act(() => {
        store.dispatch(goToQuestion(4));
      });
      await userEvent.click(screen.getByRole('button', { name: 'Finish' }));
      await userEvent.click(
        within(await screen.findByRole('dialog')).getByRole('button', {
          name: 'Finish',
        }),
      );
      await screen.findByText('Review answers');
      await userEvent.click(
        screen.getAllByRole('button', { name: 'Ask epadh.ai' })[0],
      );
      expect(where(router)).toBe('/ask');
      expect(router.state.location.state.initialPrompt).toMatch(
        /^Explain this question in simple words/,
      );
      expect(router.state.location.state.topicId).toBe('t-hcf-lcm');
    });

    it('New test goes back to the setup page for the same topic', async () => {
      await begin();
      const { router } = at('/practice/session');
      await screen.findByText('Question 1 of 5');
      act(() => {
        store.dispatch(goToQuestion(4));
      });
      await userEvent.click(screen.getByRole('button', { name: 'Finish' }));
      await userEvent.click(
        within(await screen.findByRole('dialog')).getByRole('button', {
          name: 'Finish',
        }),
      );
      await userEvent.click(
        await screen.findByRole('button', { name: 'New test' }),
      );
      await waitFor(() => expect(where(router)).toBe('/practice/t-hcf-lcm'));
    });

    it('Done clears the result and goes back to the topic', async () => {
      await begin();
      const { router } = at('/topics/t-hcf-lcm', '/practice/session');
      await screen.findByText('Question 1 of 5');
      act(() => {
        store.dispatch(goToQuestion(4));
      });
      await userEvent.click(screen.getByRole('button', { name: 'Finish' }));
      await userEvent.click(
        within(await screen.findByRole('dialog')).getByRole('button', {
          name: 'Finish',
        }),
      );
      await userEvent.click(
        await screen.findByRole('button', { name: 'Done' }),
      );
      await waitFor(() => expect(where(router)).toBe('/topics/t-hcf-lcm'));
      expect(store.getState().practice.result).toBeNull();
    });

    it('says so when opened with no result', async () => {
      at('/practice/result');
      expect(
        await screen.findByText('There is no test result to show.'),
      ).toBeInTheDocument();
    });

    it('a reloaded result page (no history) goes back to the topic on Done', async () => {
      await begin();
      store.dispatch(selectOption(0));
      store.dispatch(submitSession()); // the result exists; nothing to go "back" to
      const { router } = at('/practice/result');
      await userEvent.click(
        await screen.findByRole('button', { name: 'Done' }),
      );
      await waitFor(() => expect(where(router)).toBe('/topics/t-hcf-lcm'));
      expect(store.getState().practice.result).toBeNull();
    });
  });

  // Last on purpose: it uses up the day's allowance, which every later test would notice.
  describe('daily limit', () => {
    const useUpTheAllowance = async () => {
      for (let guard = 0; guard < 6; guard += 1) {
        const left =
          selectMcqDailyLimit(store.getState()) -
          selectMcqUsedToday(store.getState());
        if (left <= 0) return;
        await begin({ count: 10 });
        const total = session().questions.length;
        for (let i = 0; i < total; i += 1) {
          store.dispatch(goToQuestion(i));
          store.dispatch(selectOption(0));
        }
        store.dispatch(submitSession());
      }
    };

    it('shows the upgrade button instead of Start, and it opens the paywall', async () => {
      await useUpTheAllowance();
      const { router } = at('/practice/t-hcf-lcm');
      expect(await screen.findByText('0 of 20')).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /^Start/ }),
      ).not.toBeInTheDocument();
      await userEvent.click(
        screen.getByRole('button', { name: /Daily limit reached/ }),
      );
      expect(
        router.state.location.pathname + router.state.location.search,
      ).toBe('/membership?feature=extendedPractice');
    });
  });
});
