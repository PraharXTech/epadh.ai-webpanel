import {
  buildDailyPlan,
  buildWeekPlan,
  isTaskDone,
} from '@/features/plan/utils/planBuilder';

const NOW = new Date('2026-10-01T12:00:00').getTime();
const topic = (id, completed = false, locked = false) => ({
  id,
  name: id.toUpperCase(),
  subjectName: 'Quant',
  completed,
  locked,
});
const topics = [
  topic('done-1', true),
  topic('p1'),
  topic('p2'),
  topic('p3'),
  topic('locked', false, true),
];
const weak = [
  { id: 'w1', name: 'W1', accuracy: 30 },
  { id: 'w2', name: 'W2', accuracy: 45 },
];

const types = tasks => tasks.map(t => t.type);

describe('daily plan', () => {
  it('Free: study, practise the same topic, revise a finished one, and a mock when none this week', () => {
    const tasks = buildDailyPlan({ topics, now: NOW });
    expect(types(tasks)).toEqual(['study', 'practice', 'revise', 'mock']);
    expect(tasks[0].refId).toBe(tasks[1].refId);
    expect(tasks.map(t => t.refId)).not.toContain('locked');
  });

  it('skips the mock when one was taken in the last 7 days', () => {
    const tasks = buildDailyPlan({
      topics,
      now: NOW,
      mockHistory: [{ finishedAt: NOW - 86400000 }],
    });
    expect(types(tasks)).not.toContain('mock');
  });

  it('Pro: weak topics first, then two study topics', () => {
    const tasks = buildDailyPlan({ topics, weakTopics: weak, pro: true, now: NOW });
    expect(types(tasks).slice(0, 2)).toEqual(['weak', 'weak']);
    expect(types(tasks).filter(t => t === 'study')).toHaveLength(2);
  });

  it('regenerating (a new version) picks different topics', () => {
    const a = buildDailyPlan({ topics, now: NOW, version: 0 });
    const b = buildDailyPlan({ topics, now: NOW, version: 1 });
    expect(a[0].refId).not.toBe(b[0].refId);
  });

  it('has no study tasks when everything is finished', () => {
    const tasks = buildDailyPlan({
      topics: [topic('a', true), topic('b', true)],
      now: NOW,
    });
    expect(types(tasks)).toEqual(['revise', 'mock']);
  });

  it('plans seven days, with a mock on some of them only', () => {
    const week = buildWeekPlan({ topics, weakTopics: weak, pro: true, now: NOW });
    expect(week).toHaveLength(7);
    const mocks = week.filter(d => d.tasks.some(t => t.type === 'mock'));
    expect(mocks.length).toBeGreaterThan(0);
    expect(mocks.length).toBeLessThan(7);
  });
});

describe('task done from real activity', () => {
  const start = new Date(NOW).setHours(0, 0, 0, 0);
  const task = (type, refId = 'p1') => ({ id: `${type}-${refId}`, type, refId });

  it('study: a session today or the topic completed', () => {
    expect(isTaskDone(task('study'), { now: NOW })).toBe(false);
    expect(
      isTaskDone(task('study'), {
        now: NOW,
        sessions: [{ type: 'study', refId: 'p1', end: start + 1000 }],
      }),
    ).toBe(true);
    expect(isTaskDone(task('study'), { now: NOW, completed: { p1: true } })).toBe(true);
  });

  it('ignores yesterday and other topics', () => {
    expect(
      isTaskDone(task('study'), {
        now: NOW,
        sessions: [
          { type: 'study', refId: 'p1', end: start - 1000 },
          { type: 'study', refId: 'p2', end: start + 1000 },
        ],
      }),
    ).toBe(false);
  });

  it('practice and weak: a finished practice test today on the topic', () => {
    const practiceHistory = [{ topicId: 'p1', finishedAt: start + 5000 }];
    expect(isTaskDone(task('practice'), { now: NOW, practiceHistory })).toBe(true);
    expect(isTaskDone(task('weak'), { now: NOW, practiceHistory })).toBe(true);
    expect(isTaskDone(task('weak', 'other'), { now: NOW, practiceHistory })).toBe(false);
  });

  it('mock: any mock finished today', () => {
    expect(isTaskDone(task('mock', null), { now: NOW, mockHistory: [{ finishedAt: start + 5 }] })).toBe(true);
    expect(isTaskDone(task('mock', null), { now: NOW, mockHistory: [] })).toBe(false);
  });
});
