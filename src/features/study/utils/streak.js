import { dayKey } from '@/utils/date';

// Study streak rules (mobile phase.md 4C; plan.md section 5.15). Pure functions over the saved
// study sessions and practice history, so they are easy to test. The server will compute the
// streak in IST once it exists (a device clock can be changed); until then this runs on the
// device, in the browser's local time.
//
// A day COUNTS toward the streak when the student studied for at least 10 minutes or finished
// at least one practice set that day (thresholds to confirm with PraharX).
export const STREAK_MIN_MINUTES = 10;
export const STREAK_MIN_PRACTICE_SETS = 1;

const DAY_MS = 86400000;

// "2026-09-25" plus `n` days. Built from year / month / day so a daylight-saving change
// (never in India, but the browser may be anywhere) cannot skip or repeat a date.
export const addDays = (key, n) => {
  const [y, m, d] = key.split('-').map(Number);
  return dayKey(new Date(y, m - 1, d + n));
};

const dateOf = key => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};

// { "2026-09-25": { seconds, practiceSets } } from finished sessions, the sessions still open
// (their last saved checkpoint) and the finished practice sets.
export const summarizeDays = ({
  sessions = [],
  active = {},
  practiceHistory = [],
} = {}) => {
  const days = {};
  const day = key => (days[key] ??= { seconds: 0, practiceSets: 0 });
  sessions.forEach(s => {
    day(dayKey(new Date(s.end))).seconds += s.seconds;
  });
  Object.values(active).forEach(s => {
    day(dayKey(new Date(s.at))).seconds += s.seconds;
  });
  practiceHistory.forEach(p => {
    day(dayKey(new Date(p.finishedAt))).practiceSets += 1;
  });
  return days;
};

export const dayCounts = entry =>
  Boolean(entry) &&
  (entry.seconds >= STREAK_MIN_MINUTES * 60 ||
    entry.practiceSets >= STREAK_MIN_PRACTICE_SETS);

export const minutesOf = entry => Math.floor((entry?.seconds ?? 0) / 60);

export const countedDays = days =>
  new Set(Object.keys(days).filter(key => dayCounts(days[key])));

// current  consecutive counted days up to today; if today has not counted YET the run that
//          ends yesterday is still alive (the student can still keep it today)
// longest  the best run ever
// atRisk   a run is alive but today has not counted yet
export const computeStreak = (counted, today = dayKey()) => {
  const todayCounted = counted.has(today);

  let current = 0;
  let cursor = todayCounted ? today : addDays(today, -1);
  while (counted.has(cursor)) {
    current += 1;
    cursor = addDays(cursor, -1);
  }

  let longest = 0;
  let run = 0;
  let previous = null;
  [...counted].sort().forEach(key => {
    run = previous !== null && addDays(previous, 1) === key ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = key;
  });

  return {
    current,
    longest: Math.max(longest, current),
    todayCounted,
    atRisk: current > 0 && !todayCounted,
  };
};

const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// The last `n` days ending today, oldest first: for the 7-day bars.
export const lastDays = (days, n, today = dayKey()) =>
  Array.from({ length: n }, (_, i) => {
    const key = addDays(today, i - (n - 1));
    return {
      key,
      label: WEEKDAY[dateOf(key).getDay()],
      minutes: minutesOf(days[key]),
      counted: dayCounts(days[key]),
    };
  });

// Minutes per week for the last `weeks` weeks (7-day blocks ending today), oldest first.
export const weekTotals = (days, weeks, today = dayKey()) =>
  Array.from({ length: weeks }, (_, w) => {
    const end = addDays(today, -7 * (weeks - 1 - w));
    let minutes = 0;
    for (let i = 0; i < 7; i += 1) {
      minutes += minutesOf(days[addDays(end, -i)]);
    }
    return {
      key: end,
      label: w === weeks - 1 ? 'This week' : `${weeks - 1 - w} wk ago`,
      minutes,
    };
  });

// One calendar month as rows of 7 cells, Monday first. `null` pads the first and last row.
// month is 0-11.
export const monthGrid = (days, year, month, today = dayKey()) => {
  const first = new Date(year, month, 1);
  const length = new Date(year, month + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7; // Monday = 0
  const cells = Array.from({ length: lead }, () => null);
  for (let d = 1; d <= length; d += 1) {
    const key = dayKey(new Date(year, month, d));
    cells.push({
      key,
      date: d,
      minutes: minutesOf(days[key]),
      counted: dayCounts(days[key]),
      isToday: key === today,
      isFuture: key > today,
    });
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }
  return Array.from({ length: cells.length / 7 }, (_, r) =>
    cells.slice(r * 7, r * 7 + 7),
  );
};

// All-time numbers for the summary row.
export const studyTotals = ({ sessions = [], days }) => ({
  daysStudied: Object.values(days).filter(d => d.seconds > 0).length,
  sessions: sessions.length,
  seconds: sessions.reduce((sum, s) => sum + s.seconds, 0),
});

// Finished sessions of the last `n` days grouped by day, newest day first, newest session
// first inside a day.
export const historyByDay = (sessions, n = 14, today = dayKey()) => {
  const oldest = addDays(today, -(n - 1));
  const groups = {};
  sessions.forEach(s => {
    const key = dayKey(new Date(s.end));
    if (key >= oldest && key <= today) {
      (groups[key] ??= []).push(s);
    }
  });
  return Object.keys(groups)
    .sort()
    .reverse()
    .map(key => ({
      key,
      sessions: groups[key].sort((a, b) => b.end - a.end),
    }));
};

export { DAY_MS };
