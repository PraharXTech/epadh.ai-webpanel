import { dayKey } from '@/utils/date';

// Daily study plan (plan.md §5.14), worked out on the device from what the student has
// done. Free gets the basic rule-based list; Pro gets the "AI planner" version that
// also puts the weak topics first and plans the whole week. The server's planner
// replaces this when it exists; the tasks keep the same shape.

const DAY_MS = 86400000;

export const TASK_TYPES = {
  weak: { label: 'Weak topic', icon: 'target', color: '#dc2626', bg: 'bg-red-50' },
  study: { label: 'Study', icon: 'book-open', color: '#2563eb', bg: 'bg-blue-50' },
  practice: {
    label: 'Practice',
    icon: 'file-text',
    color: '#16a34a',
    bg: 'bg-green-50',
  },
  revise: { label: 'Revise', icon: 'repeat', color: '#7c3aed', bg: 'bg-violet-50' },
  mock: {
    label: 'Mock test',
    icon: 'clipboard-check',
    color: '#e11d48',
    bg: 'bg-rose-50',
  },
};

const pick = (list, n) => (list.length ? list[n % list.length] : null);

const flatten = tree =>
  tree.flatMap(subject =>
    subject.chapters.flatMap(chapter =>
      chapter.topics.map(topic => ({
        id: topic.id,
        name: topic.name,
        subjectName: subject.name,
        completed: topic.completed,
        locked: topic.locked,
      })),
    ),
  );

export const planTopics = flatten;

// The tasks for one day. `offset` moves through the syllabus for the week view,
// `version` is bumped by "Regenerate" to get a different but equally valid pick.
export const buildDailyPlan = ({
  topics,
  weakTopics = [],
  mockHistory = [],
  now = Date.now(),
  pro = false,
  offset = 0,
  version = 0,
  includeMock,
}) => {
  const open = topics.filter(t => !t.locked);
  const pending = open.filter(t => !t.completed);
  const done = open.filter(t => t.completed);
  const shift = offset + version;
  const tasks = [];

  if (pro) {
    weakTopics.slice(0, 2).forEach((_, k) => {
      const t = pick(weakTopics, shift + k);
      tasks.push({
        id: `weak-${t.id}`,
        type: 'weak',
        refId: t.id,
        title: t.name,
        subtitle: `${t.accuracy}% accuracy, practise 10 questions`,
        minutes: 15,
      });
    });
  }

  const studyCount = pro ? 2 : 1;
  for (let k = 0; k < studyCount && k < pending.length; k += 1) {
    const t = pick(pending, shift * studyCount + k);
    tasks.push({
      id: `study-${t.id}`,
      type: 'study',
      refId: t.id,
      title: t.name,
      subtitle: t.subjectName,
      minutes: k === 0 ? 25 : 20,
    });
    if (k === 0) {
      tasks.push({
        id: `practice-${t.id}`,
        type: 'practice',
        refId: t.id,
        title: t.name,
        subtitle: 'Practise 10 questions',
        minutes: 15,
      });
    }
  }

  const revise = pick(done, shift);
  if (revise) {
    tasks.push({
      id: `revise-${revise.id}`,
      type: 'revise',
      refId: revise.id,
      title: revise.name,
      subtitle: 'A quick look to keep it fresh',
      minutes: 10,
    });
  }

  const recentMock = mockHistory.some(m => now - m.finishedAt <= 7 * DAY_MS);
  if (includeMock ?? !recentMock) {
    tasks.push({
      id: `mock-${offset}`,
      type: 'mock',
      refId: null,
      title: 'Take a mock test',
      subtitle: 'Full paper under exam conditions',
      minutes: 30,
    });
  }

  // Unique ids (a weak topic can also be today's study topic).
  return tasks.filter((t, i) => tasks.findIndex(x => x.id === t.id) === i);
};

// Seven days starting today (Pro). Mock tests are spread, not repeated every day.
export const buildWeekPlan = ({ now = Date.now(), ...rest }) =>
  Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now + i * DAY_MS);
    return {
      day: dayKey(date),
      date,
      tasks: buildDailyPlan({
        ...rest,
        now,
        offset: i,
        includeMock: i % 3 === 2,
      }),
    };
  });

// Has the student done this task today? From real activity, so nothing to tick by hand.
export const isTaskDone = (
  task,
  { sessions = [], practiceHistory = [], mockHistory = [], completed = {}, now },
) => {
  const start = new Date(now).setHours(0, 0, 0, 0);
  const sessionToday = types =>
    sessions.some(
      s => types.includes(s.type) && s.refId === task.refId && s.end >= start,
    );
  const practicedToday = practiceHistory.some(
    p => p.topicId === task.refId && p.finishedAt >= start,
  );
  switch (task.type) {
    case 'study':
      return Boolean(completed[task.refId]) || sessionToday(['study']);
    case 'revise':
      return sessionToday(['study']) || practicedToday;
    case 'practice':
    case 'weak':
      return practicedToday || sessionToday(['practice', 'test']);
    case 'mock':
      return mockHistory.some(m => m.finishedAt >= start);
    default:
      return false;
  }
};

export const totalMinutes = tasks => tasks.reduce((n, t) => n + t.minutes, 0);
