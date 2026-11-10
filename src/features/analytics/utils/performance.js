import { dayKey } from '@/utils/date';

export const RANGES = [
  { id: '7d', label: '7 days', days: 7 },
  { id: '30d', label: '30 days', days: 30 },
  { id: 'all', label: 'All time', days: null },
];

// A topic needs this many answered questions before it is ranked as strong or weak
// (plan.md §5.13: "practice more to unlock insights" under a data threshold).
export const MIN_TOPIC_QUESTIONS = 5;
export const WEAK_BELOW = 60; // accuracy %
export const STRONG_FROM = 80;

const DAY_MS = 86400000;

const percent = (part, whole) => (whole ? Math.round((part / whole) * 100) : 0);

const inRange = (at, days, now) => days === null || now - at <= days * DAY_MS;

// How the last attempt on a topic compares with the ones before it.
const trendOf = attempts => {
  if (attempts.length < 2) {
    return 'flat';
  }
  const sorted = [...attempts].sort((a, b) => a.finishedAt - b.finishedAt);
  const last = sorted[sorted.length - 1];
  const before = sorted.slice(0, -1);
  const earlier = percent(
    before.reduce((n, a) => n + a.correct, 0),
    before.reduce((n, a) => n + a.correct + a.wrong, 0),
  );
  const latest = percent(last.correct, last.correct + last.wrong);
  if (latest >= earlier + 5) {
    return 'up';
  }
  return latest <= earlier - 5 ? 'down' : 'flat';
};

// Minutes studied on each of the last `count` days, oldest first.
export const studyActivity = (sessions, now = Date.now(), count = 7) => {
  const days = Array.from({ length: count }, (_, i) => {
    const date = new Date(now - (count - 1 - i) * DAY_MS);
    return { day: dayKey(date), date, seconds: 0 };
  });
  const byDay = new Map(days.map(d => [d.day, d]));
  sessions.forEach(s => {
    const bucket = byDay.get(dayKey(new Date(s.end)));
    if (bucket) {
      bucket.seconds += s.seconds;
    }
  });
  return days.map(d => ({
    day: d.day,
    label: d.date.toLocaleDateString('en-US', { weekday: 'short' }),
    minutes: Math.round(d.seconds / 60),
  }));
};

// Everything the Performance and Weak Topics screens show, from the saved practice and
// mock summaries. Pure, so it can be tested and later swapped for the server's numbers.
export const buildPerformance = ({
  practice = [],
  mock = [],
  sessions = [],
  now = Date.now(),
  days = null,
}) => {
  const practiceIn = practice.filter(p => inRange(p.finishedAt, days, now));
  const mockIn = mock.filter(m => inRange(m.finishedAt, days, now));

  const correct = [...practiceIn, ...mockIn].reduce(
    (n, a) => n + (a.correct ?? 0),
    0,
  );
  const wrong = [...practiceIn, ...mockIn].reduce(
    (n, a) => n + (a.wrong ?? 0),
    0,
  );

  // Each attempt as a percentage: practice by its accuracy of all questions, a mock by
  // its marks (negative marking included).
  const scores = [
    ...practiceIn.map(p => percent(p.correct, p.total)),
    ...mockIn.map(m => Math.max(0, percent(m.score, m.maxScore))),
  ];

  const subjectMap = new Map();
  const addSubject = (name, c, w) => {
    const row = subjectMap.get(name) ?? { name, correct: 0, wrong: 0 };
    row.correct += c;
    row.wrong += w;
    subjectMap.set(name, row);
  };
  practiceIn.forEach(p => addSubject(p.subjectName, p.correct, p.wrong));
  mockIn.forEach(m =>
    (m.sectionStats ?? []).forEach(s =>
      addSubject(s.subjectName, s.correct, s.wrong),
    ),
  );
  const subjects = [...subjectMap.values()]
    .map(s => ({
      ...s,
      attempted: s.correct + s.wrong,
      accuracy: percent(s.correct, s.correct + s.wrong),
    }))
    .filter(s => s.attempted > 0)
    .sort((a, b) => b.accuracy - a.accuracy);

  const topicMap = new Map();
  practiceIn.forEach(p => {
    const list = topicMap.get(p.topicId) ?? [];
    list.push(p);
    topicMap.set(p.topicId, list);
  });
  const topics = [...topicMap.entries()].map(([id, attempts]) => {
    const c = attempts.reduce((n, a) => n + a.correct, 0);
    const w = attempts.reduce((n, a) => n + a.wrong, 0);
    return {
      id,
      name: attempts[0].topicName,
      subjectName: attempts[0].subjectName,
      correct: c,
      wrong: w,
      attempted: c + w,
      accuracy: percent(c, c + w),
      trend: trendOf(attempts),
    };
  });
  const ranked = topics.filter(t => t.attempted >= MIN_TOPIC_QUESTIONS);

  return {
    tests: practiceIn.length + mockIn.length,
    attempted: correct + wrong,
    correct,
    wrong,
    accuracy: percent(correct, correct + wrong),
    avgScore: scores.length
      ? Math.round(scores.reduce((n, s) => n + s, 0) / scores.length)
      : 0,
    subjects,
    topics: ranked,
    weakTopics: ranked
      .filter(t => t.accuracy < WEAK_BELOW)
      .sort((a, b) => a.accuracy - b.accuracy),
    strongTopics: ranked
      .filter(t => t.accuracy >= STRONG_FROM)
      .sort((a, b) => b.accuracy - a.accuracy),
    activity: studyActivity(sessions, now, 7),
    studySeconds: sessions
      .filter(s => inRange(s.end, days, now))
      .reduce((n, s) => n + s.seconds, 0),
  };
};
