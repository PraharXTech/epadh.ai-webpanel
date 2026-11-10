import { store } from '@/store';
import { logout } from '@/features/auth/store/authSlice';
import {
  beginSession,
  checkpointSession,
  endSession,
  recoverActiveSessions,
  syncSessions,
} from '@/features/study/store/studySlice';
import { createClock } from '@/features/study/utils/sessionClock';
import {
  selectTodayStudyMinutes,
  selectTodayStudySeconds,
} from '@/store/selectors/studySelectors';

const S = 1000;

describe('session clock', () => {
  it('counts continuous time while the student keeps touching the screen', () => {
    const clock = createClock(0, { idleSec: 45 });
    clock.touch(30 * S);
    clock.touch(60 * S);
    expect(clock.seconds(80 * S)).toBe(80);
  });

  it('stops counting 45 s after the last touch, and resumes on the next touch', () => {
    const clock = createClock(0, { idleSec: 45 });
    clock.touch(10 * S);
    // Nothing touched for a long while: only 10 + 45 seconds count.
    expect(clock.seconds(200 * S)).toBe(55);
    clock.touch(300 * S);
    expect(clock.seconds(320 * S)).toBe(75); // 55 + 20 s since the touch
  });

  it('never goes idle when idleSec is null (video)', () => {
    const clock = createClock(0, { idleSec: null });
    expect(clock.seconds(600 * S)).toBe(600);
  });

  it('pauses while away (background or another screen) and resumes after', () => {
    const clock = createClock(0, { idleSec: 45 });
    clock.touch(20 * S);
    clock.setAway(true, 30 * S);
    expect(clock.seconds(500 * S)).toBe(30);
    clock.touch(400 * S); // a touch while away does not restart it
    expect(clock.seconds(500 * S)).toBe(30);
    clock.setAway(false, 600 * S);
    expect(clock.seconds(620 * S)).toBe(50);
  });

  it('starts paused when created while away', () => {
    const clock = createClock(0, { away: true });
    expect(clock.seconds(100 * S)).toBe(0);
    clock.setAway(false, 100 * S);
    expect(clock.seconds(110 * S)).toBe(10);
  });
});

describe('study sessions', () => {
  beforeEach(() => {
    store.dispatch(logout());
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-09-25T10:00:00'));
  });
  afterEach(() => jest.useRealTimers());

  const begin = (id = 'a', type = 'study', refId = 't-ratio') =>
    store.dispatch(beginSession({ id, type, refId, start: Date.now() }));

  it('saves a finished session and drops it from the open ones', () => {
    begin();
    store.dispatch(endSession({ id: 'a', seconds: 120.4, end: Date.now() }));
    const { sessions, active } = store.getState().study;
    expect(active).toEqual({});
    expect(sessions).toHaveLength(1);
    expect(sessions[0]).toMatchObject({
      id: 'a',
      type: 'study',
      refId: 't-ratio',
      seconds: 120,
      synced: false,
    });
  });

  it('drops sessions shorter than 5 seconds', () => {
    begin();
    store.dispatch(endSession({ id: 'a', seconds: 4, end: Date.now() }));
    expect(store.getState().study.sessions).toEqual([]);
    expect(store.getState().study.active).toEqual({});
  });

  it('adds up today, including open sessions, and ignores other days', () => {
    begin('a');
    store.dispatch(endSession({ id: 'a', seconds: 600, end: Date.now() }));
    begin('b');
    store.dispatch(checkpointSession({ id: 'b', seconds: 90, at: Date.now() }));
    expect(selectTodayStudySeconds(store.getState())).toBe(690);
    expect(selectTodayStudyMinutes(store.getState())).toBe(11);

    jest.setSystemTime(new Date('2026-09-26T10:00:00'));
    expect(selectTodayStudySeconds(store.getState())).toBe(0);
  });

  it('closes a session cut short by a kill with its last checkpoint', () => {
    begin();
    jest.setSystemTime(new Date('2026-09-25T10:00:30'));
    store.dispatch(checkpointSession({ id: 'a', seconds: 25, at: Date.now() }));
    // App killed here. On the next launch:
    store.dispatch(recoverActiveSessions());
    const { sessions, active } = store.getState().study;
    expect(active).toEqual({});
    expect(sessions).toHaveLength(1);
    expect(sessions[0]).toMatchObject({ seconds: 25, end: Date.now() });
  });

  it('keeps sessions queued until the server accepts them', async () => {
    begin();
    store.dispatch(endSession({ id: 'a', seconds: 60, end: Date.now() }));

    const sync = store.dispatch(syncSessions());
    await jest.advanceTimersByTimeAsync(1000);
    await sync;
    expect(store.getState().study.sessions[0].synced).toBe(true);
  });
});
