import {
  answerStatus,
  initialsOf,
  maskName,
  percentileOf,
  rankEntries,
  scoreSheet,
} from '@/features/omr/utils/omrResult';

const MARKING = { correct: 3, wrong: -1 };

describe('OMR result helpers', () => {
  it('classifies a bubble as correct, wrong or blank', () => {
    expect(answerStatus(2, 2)).toBe('correct');
    expect(answerStatus(1, 2)).toBe('wrong');
    expect(answerStatus(null, 2)).toBe('unattempted');
    expect(answerStatus(undefined, 2)).toBe('unattempted');
  });

  it('grades with negative marking and rolls marks up per section', () => {
    const sheet = scoreSheet({
      sections: ['GS', 'Maths'],
      marking: MARKING,
      answers: [
        { no: 1, section: 'GS', marked: 0, correct: 0 },
        { no: 2, section: 'GS', marked: 1, correct: 0 },
        { no: 3, section: 'GS', marked: null, correct: 2 },
        { no: 4, section: 'Maths', marked: 3, correct: 3 },
      ],
    });
    expect(sheet).toMatchObject({
      total: 4,
      correct: 2,
      wrong: 1,
      unattempted: 1,
      score: 5, // 3 + (-1) + 0 + 3
      maxScore: 12,
      negativeMarks: 1,
      accuracy: 67,
    });
    expect(sheet.sections[0]).toMatchObject({
      name: 'GS',
      total: 3,
      correct: 1,
      wrong: 1,
      unattempted: 1,
      marks: 2,
      maxMarks: 9,
    });
    expect(sheet.sections[1].marks).toBe(3);
  });

  it('reports zero accuracy for a sheet with nothing attempted', () => {
    const sheet = scoreSheet({
      sections: ['GS'],
      marking: MARKING,
      answers: [{ no: 1, section: 'GS', marked: null, correct: 1 }],
    });
    expect(sheet.accuracy).toBe(0);
    expect(sheet.score).toBe(0);
  });

  it('computes percentile from rank', () => {
    expect(percentileOf(1, 100)).toBe(100);
    expect(percentileOf(100, 100)).toBe(0);
    expect(percentileOf(51, 101)).toBe(50);
    expect(percentileOf(1, 1)).toBe(0);
  });

  it('gives tied scores the same rank and skips the next one', () => {
    const ranked = rankEntries([
      { id: 'a', name: 'A', score: 10 },
      { id: 'b', name: 'B', score: 20 },
      { id: 'c', name: 'C', score: 20 },
      { id: 'd', name: 'D', score: 5 },
    ]);
    expect(ranked.map(e => [e.id, e.rank])).toEqual([
      ['b', 1],
      ['c', 1],
      ['a', 3],
      ['d', 4],
    ]);
  });

  it('masks other students names', () => {
    expect(maskName('Rohan Kumar')).toBe('Rohan K.');
    expect(maskName('Asha')).toBe('Asha');
    expect(maskName('  ')).toBe('Student');
    expect(maskName(null)).toBe('Student');
    expect(initialsOf('Rohan Kumar')).toBe('RK');
    expect(initialsOf('')).toBe('?');
  });
});
