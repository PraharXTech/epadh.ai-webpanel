import {
  buildHistoryRows,
  practiceSubjects,
} from '@/features/history/utils/history';

const NOW = new Date('2026-10-01T12:00:00').getTime();
const DAY = 86400000;
const p = (id, subjectName, daysAgo) => ({
  id,
  topicName: id,
  subjectName,
  mode: 'practice',
  score: 7,
  total: 10,
  accuracy: 70,
  finishedAt: NOW - daysAgo * DAY,
});
const m = (id, daysAgo, extra = {}) => ({
  id,
  testName: id,
  score: 40,
  maxScore: 50,
  accuracy: 80,
  finishedAt: NOW - daysAgo * DAY,
  ...extra,
});

describe('history rows', () => {
  const practice = [
    p('a', 'Quant', 20),
    p('b', 'Reasoning', 1),
    p('c', 'Quant', 3),
  ];

  it('lists a tab newest first', () => {
    const rows = buildHistoryRows({
      tab: 'practice',
      practice,
      mock: [],
      now: NOW,
    });
    expect(rows.map(r => r.id)).toEqual(['b', 'c', 'a']);
    expect(rows[0].scoreText).toBe('7/10');
  });

  it('filters by date and by subject', () => {
    expect(
      buildHistoryRows({
        tab: 'practice',
        practice,
        mock: [],
        days: 7,
        now: NOW,
      }).map(r => r.id),
    ).toEqual(['b', 'c']);
    expect(
      buildHistoryRows({
        tab: 'practice',
        practice,
        mock: [],
        subject: 'Quant',
        now: NOW,
      }).map(r => r.id),
    ).toEqual(['c', 'a']);
    expect(practiceSubjects(practice)).toEqual(['Quant', 'Reasoning']);
  });

  it('mock rows show the rank only with enough participants, or that it is on its way', () => {
    const rows = buildHistoryRows({
      tab: 'mock',
      practice: [],
      mock: [
        m('big', 1, { rank: 12, participants: 300 }),
        m('small', 2, { rank: 2, participants: 5 }),
        m('queued', 3, { rankPending: true }),
      ],
      now: NOW,
    });
    expect(rows.map(r => r.subtitle)).toEqual([
      'Rank 12 of 300',
      'Mock test',
      'Rank on its way',
    ]);
    expect(rows[0].scoreText).toBe('40/50');
  });

  it('has no OMR rows yet', () => {
    expect(
      buildHistoryRows({ tab: 'omr', practice, mock: [], now: NOW }),
    ).toEqual([]);
  });
});
