import { generateMockPaper } from '@/features/mock/utils/questionGenerator';
import { buildMockResult, perQuestionMarks } from '@/features/mock/utils/scoring';

describe('mock question generator', () => {
  it('generates the requested count, split evenly across subjects', () => {
    const paper = generateMockPaper({ subjects: ['quant', 'reasoning', 'gk'], count: 90 });
    expect(paper).toHaveLength(90);
    const bySubject = paper.reduce((counts, q) => {
      counts[q.subjectId] = (counts[q.subjectId] ?? 0) + 1;
      return counts;
    }, {});
    expect(bySubject).toEqual({ quant: 30, reasoning: 30, gk: 30 });
  });

  it('splits an uneven count across subjects without losing questions', () => {
    const paper = generateMockPaper({ subjects: ['quant', 'reasoning'], count: 25 });
    expect(paper).toHaveLength(25);
  });

  it('gives every question a correct answer among its own options, with unique options', () => {
    const paper = generateMockPaper({ subjects: ['quant', 'reasoning', 'gk'], count: 60 });
    paper.forEach(q => {
      expect(q.options).toHaveLength(4);
      expect(new Set(q.options).size).toBe(4);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(4);
      expect(q.explanation.length).toBeGreaterThan(0);
    });
  });

  it('keeps each subject as a single contiguous block', () => {
    const paper = generateMockPaper({ subjects: ['quant', 'reasoning', 'gk'], count: 30 });
    const seen = new Set();
    let lastSubject = null;
    paper.forEach(q => {
      if (q.subjectId !== lastSubject) {
        expect(seen.has(q.subjectId)).toBe(false); // a subject never reappears once left
        seen.add(q.subjectId);
        lastSubject = q.subjectId;
      }
    });
  });
});

const session = ({ answers, marked = {}, questions }) => ({
  id: 's1',
  answers,
  marked,
  questions,
});

const Q = (id, subjectId, answer = 0) => ({
  id,
  subjectId,
  subjectName: subjectId,
  text: `Q${id}`,
  options: ['a', 'b', 'c', 'd'],
  answer,
  explanation: 'because',
});

describe('mock scoring', () => {
  const test = { id: 't', marks: 40, questions: 20, negativePerWrong: 0.25 };

  it('derives marks per question from the test', () => {
    expect(perQuestionMarks(test)).toBe(2);
  });

  it('awards full marks for correct, none for unattempted, and a fraction off for wrong', () => {
    const questions = [Q('q1', 'quant', 0), Q('q2', 'quant', 0), Q('q3', 'quant', 0)];
    const s = session({
      questions,
      answers: { q1: 0, q2: 1 }, // q1 correct, q2 wrong, q3 unattempted
    });
    const result = buildMockResult(s, { ...test, questions: 3, marks: 6 }, 60);

    expect(result.correct).toBe(1);
    expect(result.wrong).toBe(1);
    expect(result.unattempted).toBe(1);
    // marks per question = 6/3 = 2, negative = 2*0.25 = 0.5
    expect(result.score).toBe(2 - 0.5);
    expect(result.negativeApplied).toBe(0.5);
    expect(result.accuracy).toBe(50); // 1 correct of 2 attempted
  });

  it('applies no negative marking when the test has none', () => {
    const questions = [Q('q1', 'quant', 0)];
    const s = session({ questions, answers: { q1: 1 } }); // wrong
    const result = buildMockResult(s, { ...test, questions: 1, marks: 2, negativePerWrong: 0 }, 10);
    expect(result.score).toBe(0);
    expect(result.negativeApplied).toBe(0);
  });

  it('groups review items into per-subject section stats', () => {
    const questions = [
      Q('q1', 'quant', 0),
      Q('q2', 'quant', 0),
      Q('q3', 'reasoning', 0),
    ];
    const s = session({ questions, answers: { q1: 0, q2: 1, q3: 0 } });
    const result = buildMockResult(s, { ...test, questions: 3, marks: 6 }, 30);

    const quant = result.sectionStats.find(x => x.subjectId === 'quant');
    const reasoning = result.sectionStats.find(x => x.subjectId === 'reasoning');
    expect(quant).toMatchObject({ total: 2, correct: 1, wrong: 1, unattempted: 0 });
    expect(reasoning).toMatchObject({ total: 1, correct: 1, wrong: 0, unattempted: 0 });
  });

  it('marks each review item as marked-for-review when it was', () => {
    const questions = [Q('q1', 'quant', 0)];
    const s = session({ questions, answers: {}, marked: { q1: true } });
    const result = buildMockResult(s, { ...test, questions: 1, marks: 2 }, 5);
    expect(result.review[0].marked).toBe(true);
  });
});
