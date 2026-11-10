import * as service from '@/features/mock/services/mockService';
import { syncAnswers, syncPendingRank } from '@/features/mock/store/mockSlice';
import { MIN_PARTICIPANTS, serverNow } from '@/features/mock/utils/scoring';
import { store } from '@/store';
import { logout } from '@/features/auth/store/authSlice';
import {
  clearAnswer,
  goToQuestion,
  selectOption,
  startMock,
  submitMock,
  toggleMarked,
} from '@/features/mock/store/mockSlice';
import {
  selectMockHistory,
  selectMockResult,
  selectMockSession,
} from '@/store/selectors/mockSelectors';

const start = async (testId = 'subject-quant') => {
  const promise = store.dispatch(startMock(testId));
  await jest.advanceTimersByTimeAsync(1000);
  return promise;
};

describe('mock test attempt', () => {
  beforeAll(() => jest.useFakeTimers());
  afterAll(() => jest.useRealTimers());
  beforeEach(() => {
    store.dispatch(logout());
  });

  it('starts a session with the test\'s own question count, sections and duration', async () => {
    await start('subject-quant');
    const session = selectMockSession(store.getState());
    expect(session.testId).toBe('subject-quant');
    expect(session.questions).toHaveLength(25);
    expect(session.sections).toEqual([
      { subjectId: 'quant', subjectName: 'Quantitative Aptitude', start: 0, end: 24 },
    ]);
    expect(session.durationSec).toBe(25 * 60);
    expect(session.endsAt).toBeGreaterThan(Date.now());
  });

  it('builds multiple sections for a full mock', async () => {
    await start('full-01');
    const session = selectMockSession(store.getState());
    expect(session.sections.map(s => s.subjectId)).toEqual(['quant', 'reasoning', 'gk']);
  });

  it('rejects starting an unknown test', async () => {
    const action = await start('does-not-exist');
    expect(startMock.rejected.match(action)).toBe(true);
    expect(selectMockSession(store.getState())).toBeNull();
  });

  it('answers, clears, marks and navigates questions', async () => {
    await start('subject-quant');
    store.dispatch(selectOption(2));
    let session = selectMockSession(store.getState());
    const firstId = session.questions[0].id;
    expect(session.answers[firstId]).toBe(2);

    store.dispatch(toggleMarked());
    session = selectMockSession(store.getState());
    expect(session.marked[firstId]).toBe(true);

    store.dispatch(goToQuestion(5));
    session = selectMockSession(store.getState());
    expect(session.current).toBe(5);

    store.dispatch(goToQuestion(2));
    store.dispatch(clearAnswer());
    session = selectMockSession(store.getState());
    expect(session.answers[session.questions[2].id]).toBeUndefined();

    // Out-of-range jumps clamp instead of crashing.
    store.dispatch(goToQuestion(999));
    expect(selectMockSession(store.getState()).current).toBe(24);
  });

  it('submits, grades with negative marking, and returns a rank/percentile', async () => {
    await start('subject-quant');
    let session = selectMockSession(store.getState());
    session.questions.slice(0, 5).forEach((q, i) => {
      store.dispatch(goToQuestion(i));
      store.dispatch(selectOption(q.answer)); // all correct
    });

    const promise = store.dispatch(submitMock());
    await jest.advanceTimersByTimeAsync(1000);
    await promise;

    expect(selectMockSession(store.getState())).toBeNull();
    const result = selectMockResult(store.getState());
    expect(result.correct).toBe(5);
    expect(result.unattempted).toBe(20);
    expect(result.rank).toBeGreaterThan(0);
    expect(result.participants).toBeGreaterThan(0);
    expect(result.percentile).toBeGreaterThanOrEqual(0);
    expect(selectMockHistory(store.getState())).toHaveLength(1);
  });

  it('clears session, result and history on logout', async () => {
    await start('subject-quant');
    store.dispatch(logout());
    expect(selectMockSession(store.getState())).toBeNull();
    expect(selectMockHistory(store.getState())).toHaveLength(0);
  });
});

describe('mock attempt: server clock, offline submit and autosave', () => {
  beforeAll(() => jest.useFakeTimers());
  afterAll(() => jest.useRealTimers());
  beforeEach(() => {
    store.dispatch(logout());
  });
  afterEach(() => jest.restoreAllMocks());

  it('anchors the deadline to the server clock, not the phone clock', async () => {
    jest.spyOn(service, 'fetchServerTime').mockResolvedValue(Date.now() + 60 * 60 * 1000);
    await start('subject-quant');
    const session = selectMockSession(store.getState());
    expect(session.clockOffset).toBeGreaterThan(59 * 60 * 1000);
    // The full duration is left on the server's clock whatever the device says.
    expect(session.endsAt - serverNow(session)).toBeCloseTo(25 * 60 * 1000, -3);
  });

  it('keeps the score and queues the rank when the submit request fails', async () => {
    await start('subject-quant');
    const session = selectMockSession(store.getState());
    store.dispatch(selectOption(session.questions[0].answer));
    jest.spyOn(service, 'submitMockAttempt').mockRejectedValueOnce(new Error('offline'));

    const promise = store.dispatch(submitMock());
    await jest.advanceTimersByTimeAsync(1000);
    await promise;

    const state = store.getState();
    expect(selectMockSession(state)).toBeNull();
    expect(selectMockResult(state).correct).toBe(1);
    expect(selectMockResult(state).rankPending).toBe(true);
    expect(selectMockResult(state).rank).toBeNull();
    expect(state.mock.pendingRank).toEqual(
      expect.objectContaining({ id: selectMockResult(state).id }),
    );

    // Back online: the rank fills in on the result and in the history.
    const sync = store.dispatch(syncPendingRank());
    await jest.advanceTimersByTimeAsync(1000);
    await sync;
    const after = store.getState();
    expect(after.mock.pendingRank).toBeNull();
    expect(selectMockResult(after).rankPending).toBe(false);
    expect(selectMockResult(after).rank).toBeGreaterThan(0);
    expect(selectMockHistory(after)[0].rank).toBeGreaterThan(0);
  });

  it('autosave marks the attempt offline on failure and saved once it goes through', async () => {
    await start('subject-quant');
    jest.spyOn(service, 'saveMockAnswers').mockRejectedValueOnce(new Error('offline'));
    let promise = store.dispatch(syncAnswers());
    await jest.advanceTimersByTimeAsync(500);
    await promise;
    expect(store.getState().mock.sync).toBe('offline');

    promise = store.dispatch(syncAnswers());
    await jest.advanceTimersByTimeAsync(500);
    await promise;
    expect(store.getState().mock.sync).toBe('saved');
  });

  it('needs a minimum number of participants before a rank is shown', () => {
    expect(MIN_PARTICIPANTS).toBeGreaterThan(1);
  });
});
