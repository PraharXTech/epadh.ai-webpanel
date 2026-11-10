import reducer, { recordScan, removeScan } from '@/features/omr/store/omrSlice';
import { omrRow } from '@/features/history/utils/history';
import { buildHistoryRows } from '@/features/history/utils/history';
import { historyStats, summarizeResult } from '@/features/omr/utils/omrResult';

const scan = (scanId, extra = {}) => ({
  scanId,
  testName: 'Test',
  scannedAt: '2026-10-08T05:00:00.000Z',
  score: 60,
  maxScore: 300,
  accuracy: 50,
  correct: 30,
  wrong: 30,
  unattempted: 40,
  rank: 10,
  participants: 120,
  ...extra,
});

describe('OMR history slice', () => {
  it('keeps newest first and does not list a scan twice', () => {
    let state = reducer(undefined, recordScan(scan('a')));
    state = reducer(state, recordScan(scan('b')));
    expect(state.history.map(h => h.scanId)).toEqual(['b', 'a']);

    state = reducer(
      state,
      recordScan(scan('a', { rank: 3, participants: 130, score: 999 })),
    );
    expect(state.history).toHaveLength(2);
    // only the rank moves; the stored score stays
    expect(state.history.find(h => h.scanId === 'a')).toMatchObject({
      rank: 3,
      participants: 130,
      score: 60,
    });
  });

  it('caps the list at 50 and removes a scan', () => {
    let state = reducer(undefined, { type: 'init' });
    for (let i = 0; i < 55; i += 1) {
      state = reducer(state, recordScan(scan(`s${i}`)));
    }
    expect(state.history).toHaveLength(50);
    expect(state.history[0].scanId).toBe('s54');

    state = reducer(state, removeScan('s54'));
    expect(state.history[0].scanId).toBe('s53');
  });
});

describe('OMR history helpers', () => {
  it('summarizes a result down to what the list needs', () => {
    const summary = summarizeResult({
      ...scan('x'),
      answers: [1, 2, 3],
      sections: [],
    });
    expect(summary).not.toHaveProperty('answers');
    expect(summary).toMatchObject({ scanId: 'x', score: 60, rank: 10 });
  });

  it('computes totals, treating a negative score as 0%', () => {
    expect(historyStats([])).toEqual({
      scans: 0,
      bestPercent: 0,
      avgAccuracy: 0,
    });
    expect(
      historyStats([
        scan('a', { score: 150, accuracy: 80 }),
        scan('b', { score: -5, accuracy: 20 }),
      ]),
    ).toEqual({ scans: 2, bestPercent: 50, avgAccuracy: 50 });
  });

  it('turns scans into History rows, shown only with enough participants for a rank', () => {
    expect(omrRow(scan('a')).subtitle).toBe('OMR scan · Rank 10 of 120');
    expect(omrRow(scan('a', { participants: 10 })).subtitle).toBe('OMR scan');

    const rows = buildHistoryRows({
      tab: 'omr',
      practice: [],
      mock: [],
      omr: [
        scan('old', { scannedAt: '2026-01-01T00:00:00.000Z' }),
        scan('new', { scannedAt: '2026-10-01T00:00:00.000Z' }),
      ],
    });
    expect(rows.map(r => r.id)).toEqual(['new', 'old']);
    expect(rows[0]).toMatchObject({ kind: 'omr', scoreText: '60/300' });
  });
});
