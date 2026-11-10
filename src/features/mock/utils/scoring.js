import { formatClock, formatDuration } from '@/features/practice/utils/scoring';

export { formatClock, formatDuration };

// answered/marked/current/unanswered palette state, same rules as practice.
export const questionState = (session, question, index) => {
  const answered = session.answers[question.id] !== undefined;
  const marked = Boolean(session.marked[question.id]);
  if (marked) {
    return 'marked';
  }
  if (answered) {
    return 'answered';
  }
  return index === session.current ? 'current' : 'unanswered';
};

// Rank is only meaningful with enough people to compare against (plan.md §5.11).
export const MIN_PARTICIPANTS = 30;

// Now on the server's clock: the device clock plus the offset measured at the start.
export const serverNow = session => Date.now() + (session.clockOffset ?? 0);

export const countMarked = session =>
  session.questions.filter(q => session.marked[q.id]).length;

export const countAnswered = session =>
  session.questions.filter(q => session.answers[q.id] !== undefined).length;

// Marks per question and the per-wrong-answer penalty, both derived from the test's
// own total marks/negativePerWrong (plan.md §5.11: defaults come from the test).
export const perQuestionMarks = test => test.marks / test.questions;

// Grades a mock attempt with negative marking, and buckets each question's marks by
// section so the result can show a per-section breakdown.
export const buildMockResult = (session, test, timeSpentSec) => {
  const perQuestion = perQuestionMarks(test);
  const negativePerWrong = perQuestion * (test.negativePerWrong ?? 0);

  const bySection = new Map();
  const review = session.questions.map(q => {
    const chosen = session.answers[q.id];
    const attempted = chosen !== undefined;
    const correct = chosen === q.answer;
    const marks = attempted ? (correct ? perQuestion : -negativePerWrong) : 0;

    const section = bySection.get(q.subjectId) ?? {
      subjectId: q.subjectId,
      subjectName: q.subjectName,
      total: 0,
      correct: 0,
      wrong: 0,
      unattempted: 0,
      marks: 0,
    };
    section.total += 1;
    if (!attempted) {
      section.unattempted += 1;
    } else if (correct) {
      section.correct += 1;
    } else {
      section.wrong += 1;
    }
    section.marks += marks;
    bySection.set(q.subjectId, section);

    return {
      ...q,
      chosen: attempted ? chosen : null,
      correct,
      marks,
      marked: Boolean(session.marked[q.id]),
    };
  });

  const total = review.length;
  const correct = review.filter(r => r.correct).length;
  const attempted = review.filter(r => r.chosen !== null).length;
  const wrong = attempted - correct;
  const unattempted = total - attempted;
  const negativeApplied = Math.round(wrong * negativePerWrong * 100) / 100;
  const score = Math.round((correct * perQuestion - negativeApplied) * 100) / 100;

  return {
    id: session.id,
    testId: test.id,
    testName: test.name,
    testType: test.type,
    total,
    correct,
    wrong,
    unattempted,
    accuracy: attempted ? Math.round((correct / attempted) * 100) : 0,
    score,
    maxScore: test.marks,
    negativeApplied,
    timeSpentSec: Math.round(timeSpentSec),
    finishedAt: Date.now(),
    sectionStats: [...bySection.values()],
    review,
  };
};
