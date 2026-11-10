import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useDispatch } from 'react-redux';
import {
  isPageVisible,
  subscribePageVisibility,
} from '@/services/page/visibility';
import {
  beginSession,
  checkpointSession,
  endSession,
  syncSessions,
} from '../store/studySlice';
import { IDLE_DEFAULT_SEC, createClock } from '../utils/sessionClock';

const TICK_MS = 5000; // idle check
const CHECKPOINT_EVERY = 3; // ticks between saved checkpoints (about 15 s)

const newId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

// Tracks one study / practice / test page as a study session (plan.md 5.15).
// Time counts only while the tab is visible and the student is interacting with the page
// (`idleSec` of no activity pauses it; null turns that off, for a video). The session is
// saved every ~15 s, and when the tab is hidden or closed, so a closed tab loses little,
// and is ended and queued for the server when the page goes away.
//
//   const { touchProps } = useStudySession({ type: 'study', refId: topicId });
//   <div {...touchProps}> ... </div>   // pointer, key, scroll and wheel activity inside keep it running
//   touch()                            // for activity the handlers cannot see (a PDF's page turn)
//
// Does nothing while `refId` is empty (nothing to attribute the time to yet).
//
// Web port: AppState -> Page Visibility; the React Navigation `navigation` argument is gone,
// because a page that is not on screen is unmounted, so "focused" is the same as "mounted".
// Touch handlers became pointer / keyboard / scroll handlers.
export default function useStudySession({
  type,
  refId,
  idleSec = IDLE_DEFAULT_SEC,
}) {
  const dispatch = useDispatch();
  const clockRef = useRef(null);

  const touch = useCallback(() => clockRef.current?.touch(Date.now()), []);
  const touchProps = useMemo(
    () => ({
      onPointerDown: touch,
      onPointerMove: touch,
      onKeyDown: touch,
      onWheel: touch,
      onTouchStart: touch,
      // `scroll` does not bubble in React, so listen in the capture phase.
      onScrollCapture: touch,
    }),
    [touch],
  );

  useEffect(() => {
    if (!refId) {
      return undefined;
    }
    const id = newId();
    const startedAt = Date.now();

    const clock = createClock(startedAt, {
      idleSec,
      away: !isPageVisible(),
    });
    clockRef.current = clock;
    dispatch(beginSession({ id, type, refId, start: startedAt }));

    const checkpoint = () => {
      const now = Date.now();
      dispatch(
        checkpointSession({
          id,
          seconds: Math.round(clock.seconds(now)),
          at: now,
        }),
      );
    };

    let ticks = 0;
    const timer = setInterval(() => {
      clock.tick(Date.now());
      ticks += 1;
      if (ticks % CHECKPOINT_EVERY === 0) {
        checkpoint();
      }
    }, TICK_MS);

    const unsubscribe = subscribePageVisibility(visible => {
      clock.setAway(!visible, Date.now());
      if (!visible) {
        checkpoint(); // the tab may be closed while hidden
      }
    });

    return () => {
      clearInterval(timer);
      unsubscribe();
      const now = Date.now();
      dispatch(
        endSession({ id, seconds: Math.round(clock.seconds(now)), end: now }),
      );
      dispatch(syncSessions());
      clockRef.current = null;
    };
  }, [dispatch, type, refId, idleSec]);

  return { touchProps, touch };
}
