import { dayKey } from '@/utils/date';

export { dayKey };
export const SECONDS_PER_QUESTION = 60;
export const COUNT_OPTIONS = [5, 10];

export const MODES = {
  practice: {
    id: 'practice',
    label: 'Practice',
    detail:
      'See the answer and explanation right after each question. No timer.',
    icon: 'book-open',
  },
  test: {
    id: 'test',
    label: 'Timed test',
    detail:
      'One minute per question. Answers and explanations come at the end.',
    icon: 'clipboard-check',
  },
};

// "07:05" style clock for the timer.
export const formatClock = totalSeconds => {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

// "2 min 5 s" / "45 s" for the result screen.
export const formatDuration = totalSeconds => {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  return m ? `${m} min ${s % 60} s` : `${s} s`;
};

// answered: has a chosen option; palette state of one question in a session.
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

export const countAnswered = session =>
  session.questions.filter(q => session.answers[q.id] !== undefined).length;

// Grades a session. One mark per correct answer, no negative marking (that is for the
// Phase 6 mock tests). `timeSpentSec` is measured by the caller.
export const buildResult = (session, timeSpentSec) => {
  const review = session.questions.map(q => {
    const chosen = session.answers[q.id];
    const attempted = chosen !== undefined;
    return {
      ...q,
      chosen: attempted ? chosen : null,
      correct: chosen === q.answer,
    };
  });
  const total = review.length;
  const correct = review.filter(r => r.correct).length;
  const attempted = review.filter(r => r.chosen !== null).length;
  return {
    id: session.id,
    topicId: session.topicId,
    topicName: session.topicName,
    subjectName: session.subjectName,
    mode: session.mode,
    source: session.source ?? 'bank',
    total,
    correct,
    wrong: attempted - correct,
    skipped: total - attempted,
    accuracy: attempted ? Math.round((correct / attempted) * 100) : 0,
    score: correct,
    timeSpentSec: Math.round(timeSpentSec),
    finishedAt: Date.now(),
    review,
  };
};
