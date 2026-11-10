export const IDLE_DEFAULT_SEC = 45;
export const MIN_SESSION_SEC = 5;

// Counts the seconds a student is really studying on one screen. Time only runs while
// the app is in the foreground, the screen is focused, and the student has touched the
// screen within `idleSec` (pass null for content watched without touching, like a
// video). Pure and clock-agnostic: every method takes `at` in milliseconds, so it is
// easy to test and the hook only has to feed it events.
export const createClock = (
  at,
  { idleSec = IDLE_DEFAULT_SEC, away = false } = {},
) => {
  let total = 0; // seconds banked so far
  let runningSince = away ? null : at; // null while paused
  let lastTouch = at;
  let isAway = away; // background or another screen on top

  const pauseAt = time => {
    if (runningSince !== null) {
      total += Math.max(0, (time - runningSince) / 1000);
      runningSince = null;
    }
  };

  // Stops the clock at the moment idleness began (last touch + idleSec), not now.
  const applyIdle = at2 => {
    if (
      idleSec !== null &&
      runningSince !== null &&
      at2 - lastTouch > idleSec * 1000
    ) {
      pauseAt(Math.max(runningSince, lastTouch + idleSec * 1000));
    }
  };

  return {
    tick: applyIdle,
    touch(time) {
      applyIdle(time);
      lastTouch = time;
      if (!isAway && runningSince === null) {
        runningSince = time;
      }
    },
    setAway(value, time) {
      if (value === isAway) {
        return;
      }
      if (value) {
        applyIdle(time);
        pauseAt(time);
      } else {
        lastTouch = time;
        runningSince = time;
      }
      isAway = value;
    },
    seconds(time) {
      applyIdle(time);
      return total + (runningSince !== null ? (time - runningSince) / 1000 : 0);
    },
  };
};
