import {
  addDays,
  computeStreak,
  countedDays,
  dayCounts,
  historyByDay,
  lastDays,
  monthGrid,
  summarizeDays,
  weekTotals,
} from '@/features/study/utils/streak';
import { dayKey } from '@/utils/date';

// Local noon of a given day, so a timestamp never falls near a day boundary.
const at = (key, hour = 12) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, hour).getTime();
};
const session = (key, seconds, extra = {}) => ({
  id: `${key}-${seconds}`,
  type: 'study',
  refId: 't1',
  start: at(key) - seconds * 1000,
  end: at(key),
  seconds,
  ...extra,
});
const practice = key => ({
  id: `p-${key}`,
  topicId: 't1',
  finishedAt: at(key),
});
const counted = (...keys) => new Set(keys);

const TODAY = '2026-09-25';

describe('addDays', () => {
  it('moves across month and year ends', () => {
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29'); // leap year
    expect(addDays('2026-09-25', 0)).toBe('2026-09-25');
  });
});

describe('what counts as a day', () => {
  it('10 minutes of study counts, 9 minutes 59 seconds does not', () => {
    expect(dayCounts({ seconds: 600, practiceSets: 0 })).toBe(true);
    expect(dayCounts({ seconds: 599, practiceSets: 0 })).toBe(false);
  });

  it('one finished practice set counts on its own', () => {
    expect(dayCounts({ seconds: 0, practiceSets: 1 })).toBe(true);
  });

  it('an empty or missing day does not count', () => {
    expect(dayCounts(undefined)).toBe(false);
    expect(dayCounts({ seconds: 0, practiceSets: 0 })).toBe(false);
  });

  it('adds up several short sessions on one day', () => {
    const days = summarizeDays({
      sessions: [session(TODAY, 300), session(TODAY, 300)],
    });
    expect(days[TODAY].seconds).toBe(600);
    expect(countedDays(days).has(TODAY)).toBe(true);
  });

  it('counts the time a still-open session has saved', () => {
    const days = summarizeDays({
      active: { a: { id: 'a', seconds: 700, at: at(TODAY) } },
    });
    expect(countedDays(days).has(TODAY)).toBe(true);
  });

  it('counts a practice set finished late in the evening on that day', () => {
    const days = summarizeDays({
      practiceHistory: [{ id: 'p', finishedAt: at(TODAY, 23) }],
    });
    expect(days[TODAY].practiceSets).toBe(1);
  });

  it('keeps days apart', () => {
    const days = summarizeDays({
      sessions: [session('2026-09-24', 400), session(TODAY, 400)],
    });
    expect(countedDays(days).size).toBe(0); // 6 min each, neither counts
  });
});

describe('computeStreak', () => {
  it('is zero with no days', () => {
    expect(computeStreak(counted(), TODAY)).toEqual({
      current: 0,
      longest: 0,
      todayCounted: false,
      atRisk: false,
    });
  });

  it('counts consecutive days ending today', () => {
    const streak = computeStreak(
      counted('2026-09-23', '2026-09-24', TODAY),
      TODAY,
    );
    expect(streak).toMatchObject({
      current: 3,
      longest: 3,
      todayCounted: true,
      atRisk: false,
    });
  });

  it('a missed day resets the run', () => {
    const streak = computeStreak(
      counted('2026-09-20', '2026-09-21', '2026-09-22', TODAY),
      TODAY,
    );
    expect(streak.current).toBe(1);
    expect(streak.longest).toBe(3);
  });

  it('the same day counted twice is one day', () => {
    const days = summarizeDays({
      sessions: [session(TODAY, 700), session(TODAY, 900)],
      practiceHistory: [practice(TODAY), practice(TODAY)],
    });
    expect(computeStreak(countedDays(days), TODAY).current).toBe(1);
  });

  it('keeps the run alive through yesterday while today has not counted yet (at risk)', () => {
    const streak = computeStreak(counted('2026-09-23', '2026-09-24'), TODAY);
    expect(streak).toMatchObject({
      current: 2,
      todayCounted: false,
      atRisk: true,
    });
  });

  it('loses the run once a whole day was missed', () => {
    const streak = computeStreak(counted('2026-09-22', '2026-09-23'), TODAY);
    expect(streak).toMatchObject({ current: 0, longest: 2, atRisk: false });
  });

  it('rolls over at midnight: the same data gives a different answer the next day', () => {
    const days = counted('2026-09-24', TODAY);
    expect(computeStreak(days, TODAY).current).toBe(2);
    const tomorrow = computeStreak(days, '2026-09-26');
    expect(tomorrow).toMatchObject({
      current: 2,
      todayCounted: false,
      atRisk: true,
    });
    expect(computeStreak(days, '2026-09-27').current).toBe(0);
  });

  it('longest can be an old run that is longer than the current one', () => {
    const streak = computeStreak(
      counted('2026-08-01', '2026-08-02', '2026-08-03', '2026-08-04', TODAY),
      TODAY,
    );
    expect(streak).toMatchObject({ current: 1, longest: 4 });
  });

  it('a run crosses a month and a year boundary', () => {
    const streak = computeStreak(
      counted('2025-12-30', '2025-12-31', '2026-01-01', '2026-01-02'),
      '2026-01-02',
    );
    expect(streak.current).toBe(4);
  });
});

describe('last days, weeks and the month grid', () => {
  const days = summarizeDays({
    sessions: [
      session('2026-09-25', 1800),
      session('2026-09-24', 300),
      session('2026-09-20', 3600),
      session('2026-09-10', 1200),
    ],
  });

  it('lastDays gives n days oldest first with minutes and a label', () => {
    const week = lastDays(days, 7, TODAY);
    expect(week).toHaveLength(7);
    expect(week[6]).toMatchObject({
      key: TODAY,
      label: 'Fri',
      minutes: 30,
      counted: true,
    });
    expect(week[5]).toMatchObject({
      key: '2026-09-24',
      minutes: 5,
      counted: false,
    });
    expect(week[0].key).toBe('2026-09-19');
    expect(week[1]).toMatchObject({ minutes: 60 });
  });

  it('weekTotals sums 7-day blocks ending today', () => {
    const weeks = weekTotals(days, 4, TODAY);
    expect(weeks.map(w => w.minutes)).toEqual([0, 20, 0, 95]);
    expect(weeks[3].label).toBe('This week');
    expect(weeks[0].label).toBe('3 wk ago');
  });

  it('monthGrid lays a month out Monday first with padding', () => {
    const grid = monthGrid(days, 2026, 8, TODAY); // September 2026 starts on a Tuesday
    expect(grid.every(row => row.length === 7)).toBe(true);
    expect(grid[0][0]).toBeNull();
    expect(grid[0][1]).toMatchObject({ key: '2026-09-01', date: 1 });
    const flat = grid.flat().filter(Boolean);
    expect(flat).toHaveLength(30);
    expect(flat.find(c => c.key === TODAY)).toMatchObject({
      isToday: true,
      counted: true,
      minutes: 30,
    });
    expect(flat.find(c => c.key === '2026-09-26').isFuture).toBe(true);
    expect(flat.find(c => c.key === '2026-09-10')).toMatchObject({
      minutes: 20,
      counted: true,
    });
  });

  it('monthGrid handles a month that starts on Monday and one that fills 6 rows', () => {
    expect(monthGrid({}, 2026, 5, TODAY)[0][0]).toMatchObject({
      key: '2026-06-01',
    }); // Mon
    expect(monthGrid({}, 2026, 2, TODAY)).toHaveLength(6); // March 2026: Sunday 1st + 31 days
  });
});

describe('historyByDay', () => {
  it('groups the last 14 days, newest day and newest session first, dropping older ones', () => {
    const sessions = [
      session('2026-09-25', 400, { end: at('2026-09-25', 9) }),
      session('2026-09-25', 500, { end: at('2026-09-25', 18) }),
      session('2026-09-20', 600),
      session('2026-09-01', 600), // older than 14 days
    ];
    const groups = historyByDay(sessions, 14, TODAY);
    expect(groups.map(g => g.key)).toEqual(['2026-09-25', '2026-09-20']);
    expect(groups[0].sessions.map(s => s.seconds)).toEqual([500, 400]);
  });

  it('is empty with no sessions', () => {
    expect(historyByDay([], 14, TODAY)).toEqual([]);
  });
});

describe('dayKey interplay', () => {
  it('uses the same day buckets as the rest of the app', () => {
    expect(dayKey(new Date(at(TODAY)))).toBe(TODAY);
  });
});
