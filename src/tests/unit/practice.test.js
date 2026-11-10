import { configureStore } from '@reduxjs/toolkit';
import * as slice from '@/features/practice/store/practiceSlice';
import { store } from '@/store';
import { logout } from '@/features/auth/store/authSlice';
import {
  clearAnswer,
  goToQuestion,
  retryMissed,
  selectOption,
  startPractice,
  submitSession,
  toggleMarked,
} from '@/features/practice/store/practiceSlice';
import { loadSyllabus } from '@/features/syllabus/store/syllabusSlice';
import {
  selectMcqDailyLimit,
  selectMcqUsedToday,
  selectPracticeResult,
  selectPracticeSession,
} from '@/store/selectors/practiceSelectors';

const TOPIC = {
  topicId: 't-hcf-lcm',
  topicName: 'HCF & LCM',
  subjectId: 'quant',
  subjectName: 'Quantitative Aptitude',
};

const start = async (extra = {}) => {
  const promise = store.dispatch(
    startPractice({ ...TOPIC, count: 5, mode: 'practice', ...extra }),
  );
  await jest.advanceTimersByTimeAsync(1000);
  return promise;
};

describe('practice test', () => {
  beforeAll(async () => {
    jest.useFakeTimers();
    const loading = store.dispatch(loadSyllabus('pet'));
    await jest.advanceTimersByTimeAsync(2000);
    await loading;
  });
  afterAll(() => jest.useRealTimers());
  beforeEach(() => {
    store.dispatch(logout());
  });

  it('starts with the topic questions first, topped up from the subject', async () => {
    await start();
    const session = selectPracticeSession(store.getState());
    expect(session.questions).toHaveLength(5);
    expect(session.mode).toBe('practice');
    expect(session.durationSec).toBeNull();
    const own = session.questions.filter(q => q.topicId === 't-hcf-lcm');
    expect(own).toHaveLength(3); // the topic has 3 questions, all included
    session.questions.forEach(q => expect(q.subjectId).toBe('quant'));
  });

  it('gives a timed test one minute per question', async () => {
    await start({ mode: 'test', count: 10 });
    const session = selectPracticeSession(store.getState());
    expect(session.durationSec).toBe(600);
  });

  it('locks the first answer in practice mode but allows changes in a test', async () => {
    await start();
    store.dispatch(selectOption(0));
    store.dispatch(selectOption(1));
    let session = selectPracticeSession(store.getState());
    expect(session.answers[session.questions[0].id]).toBe(0);

    store.dispatch(logout());
    await start({ mode: 'test' });
    store.dispatch(selectOption(0));
    store.dispatch(selectOption(1));
    session = selectPracticeSession(store.getState());
    expect(session.answers[session.questions[0].id]).toBe(1);
    store.dispatch(clearAnswer());
    session = selectPracticeSession(store.getState());
    expect(session.answers[session.questions[0].id]).toBeUndefined();
  });

  it('grades a session: correct, wrong, skipped, accuracy, daily count and history', async () => {
    await start();
    const { questions } = selectPracticeSession(store.getState());
    // Q1 right, Q2 wrong, Q3 right, Q4 and Q5 skipped.
    const pick = (i, right) =>
      right ? questions[i].answer : (questions[i].answer + 1) % 4;
    [
      [0, true],
      [1, false],
      [2, true],
    ].forEach(([i, right]) => {
      store.dispatch(goToQuestion(i));
      store.dispatch(selectOption(pick(i, right)));
    });
    store.dispatch(toggleMarked());
    store.dispatch(submitSession());

    const state = store.getState();
    expect(selectPracticeSession(state)).toBeNull();
    expect(selectPracticeResult(state)).toMatchObject({
      total: 5,
      correct: 2,
      wrong: 1,
      skipped: 2,
      score: 2,
      accuracy: 67,
    });
    expect(selectMcqUsedToday(state)).toBe(3);
    expect(state.practice.history).toHaveLength(1);
    expect(state.practice.history[0].review).toBeUndefined();

    // Submitting twice changes nothing.
    store.dispatch(submitSession());
    expect(selectMcqUsedToday(store.getState())).toBe(3);
  });

  it('retries only the missed questions', async () => {
    await start();
    const { questions } = selectPracticeSession(store.getState());
    store.dispatch(selectOption(questions[0].answer)); // Q1 right, the rest skipped
    store.dispatch(submitSession());
    store.dispatch(retryMissed());

    const state = store.getState();
    expect(selectPracticeResult(state)).toBeNull();
    const retry = selectPracticeSession(state);
    expect(retry.questions).toHaveLength(4);
    expect(retry.questions.map(q => q.id)).not.toContain(questions[0].id);
    expect(retry.answers).toEqual({});
  });

  it('cuts the set to what is left of the free daily limit, then refuses', async () => {
    expect(selectMcqDailyLimit(store.getState())).toBe(20);

    const answerFirst = async (count, answered) => {
      await start({ count });
      const { questions } = selectPracticeSession(store.getState());
      questions.slice(0, answered).forEach((q, i) => {
        store.dispatch(goToQuestion(i));
        store.dispatch(selectOption(q.answer));
      });
      store.dispatch(submitSession());
      return questions.length;
    };

    expect(await answerFirst(10, 6)).toBe(10);
    expect(await answerFirst(10, 10)).toBe(10); // 16 used
    expect(await answerFirst(10, 10)).toBe(4); // only 4 left, so the set is cut
    expect(selectMcqUsedToday(store.getState())).toBe(20);

    const blocked = await start({ count: 10 });
    expect(startPractice.rejected.match(blocked)).toBe(true);
    expect(selectPracticeSession(store.getState())).toBeNull();
  });
});

describe('AI-generated practice source', () => {
  it('starts an AI session whose questions are flagged, and reports one', async () => {
    const store = configureStore({
      reducer: {
        practice: slice.default,
        user: (s = { entitlements: null }) => s,
      },
    });
    await store.dispatch(
      slice.startPractice({
        topicId: 't-percentage',
        topicName: 'Percentage',
        subjectId: 'quant',
        subjectName: 'Quantitative Aptitude',
        count: 5,
        mode: 'practice',
        source: 'ai',
      }),
    );
    const { session } = store.getState().practice;
    expect(session.source).toBe('ai');
    expect(session.questions).toHaveLength(5);
    expect(session.questions.every(q => q.ai)).toBe(true);

    const id = session.questions[0].id;
    await store.dispatch(
      slice.reportQuestion({ questionId: id, reason: 'wrong-question' }),
    );
    expect(store.getState().practice.reported[id]).toBe(true);
  });
});

describe('saved results for History', () => {
  it('keeps the review of finished tests and reopens one by id', async () => {
    const store = configureStore({
      reducer: {
        practice: slice.default,
        user: (s = { entitlements: null }) => s,
      },
    });
    const finish = async () => {
      await store.dispatch(
        slice.startPractice({
          topicId: 't-percentage',
          topicName: 'Percentage',
          subjectId: 'quant',
          subjectName: 'Quantitative Aptitude',
          count: 5,
          mode: 'practice',
          source: 'bank',
        }),
      );
      store.dispatch(slice.submitSession());
      return store.getState().practice.result.id;
    };
    const first = await finish();
    await new Promise(resolve => setTimeout(resolve, 5)); // ids come from Date.now()
    await finish();
    store.dispatch(slice.clearResult());

    const { savedResults, history } = store.getState().practice;
    expect(savedResults).toHaveLength(2);
    expect(savedResults[0].review.length).toBe(5);
    expect(history[0].review).toBeUndefined(); // the list keeps summaries only

    store.dispatch(slice.openSavedResult(first));
    expect(store.getState().practice.result.id).toBe(first);
  });
});
