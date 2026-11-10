import {
  MIN_TOPIC_QUESTIONS,
  buildPerformance,
  studyActivity,
} from '@/features/analytics/utils/performance';

const NOW = new Date('2026-10-01T12:00:00').getTime();
const DAY = 86400000;

const practice = (topicId, correct, wrong, daysAgo = 0, subjectName = 'Quant') => ({
  id: `${topicId}-${daysAgo}-${correct}`,
  topicId,
  topicName: topicId.toUpperCase(),
  subjectName,
  correct,
  wrong,
  total: correct + wrong,
  finishedAt: NOW - daysAgo * DAY,
});

describe('buildPerformance', () => {
  it('totals accuracy and questions across practice and mock attempts', () => {
    const perf = buildPerformance({
      now: NOW,
      practice: [practice('a', 8, 2)],
      mock: [
        {
          id: 'm1',
          correct: 10,
          wrong: 10,
          score: 5,
          maxScore: 50,
          finishedAt: NOW,
          sectionStats: [{ subjectName: 'Reasoning', correct: 10, wrong: 10 }],
        },
      ],
    });
    expect(perf.tests).toBe(2);
    expect(perf.attempted).toBe(30);
    expect(perf.accuracy).toBe(60); // 18 / 30
    expect(perf.avgScore).toBe(45); // (80 + 10) / 2
    expect(perf.subjects.map(s => s.name)).toEqual(['Quant', 'Reasoning']);
  });

  it('only counts attempts inside the range', () => {
    const history = [practice('a', 5, 0, 1), practice('a', 0, 5, 20)];
    expect(buildPerformance({ now: NOW, practice: history, days: 7 }).tests).toBe(1);
    expect(buildPerformance({ now: NOW, practice: history, days: 30 }).tests).toBe(2);
    expect(buildPerformance({ now: NOW, practice: history, days: null }).tests).toBe(2);
  });

  it('ranks weak and strong topics only once there is enough data', () => {
    const perf = buildPerformance({
      now: NOW,
      practice: [
        practice('weak', 1, 4), // 20%, enough questions
        practice('few', 0, MIN_TOPIC_QUESTIONS - 1), // 0% but too little data
        practice('strong', 9, 1), // 90%
      ],
    });
    expect(perf.weakTopics.map(t => t.id)).toEqual(['weak']);
    expect(perf.strongTopics.map(t => t.id)).toEqual(['strong']);
    expect(perf.topics.map(t => t.id)).not.toContain('few');
  });

  it('shows the trend of the latest attempt against the earlier ones', () => {
    const perf = buildPerformance({
      now: NOW,
      practice: [practice('t', 2, 3, 5), practice('t', 5, 0, 0)],
    });
    expect(perf.topics[0].trend).toBe('up');
  });
});

describe('studyActivity', () => {
  it('buckets session minutes into the last 7 days, oldest first', () => {
    const sessions = [
      { end: NOW, seconds: 600 },
      { end: NOW - DAY, seconds: 1800 },
      { end: NOW - 10 * DAY, seconds: 9999 }, // outside the window
    ];
    const days = studyActivity(sessions, NOW, 7);
    expect(days).toHaveLength(7);
    expect(days[6].minutes).toBe(10);
    expect(days[5].minutes).toBe(30);
    expect(days.reduce((n, d) => n + d.minutes, 0)).toBe(40);
  });
});
