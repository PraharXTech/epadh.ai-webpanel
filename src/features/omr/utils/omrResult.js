// Scoring and ranking helpers for a scanned OMR sheet. The server does the real
// detection and grading (plan.md §5.12); these turn its answers into the numbers the
// result and leaderboard screens show, and back the mock service.
export const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

// Rank is only meaningful with enough people to compare against (plan.md §5.11).
export const MIN_PARTICIPANTS = 30;

const round1 = value => Math.round(value * 10) / 10;

// `marked` is the option index the student filled in, or null for a blank bubble.
export const answerStatus = (marked, correct) => {
  if (marked === null || marked === undefined) {
    return 'unattempted';
  }
  return marked === correct ? 'correct' : 'wrong';
};

// Grades every question and rolls the marks up per section. `marking` is
// { correct, wrong } marks per answer; `wrong` is the (negative) penalty.
export const scoreSheet = ({ answers, sections, marking }) => {
  const graded = answers.map(a => {
    const status = answerStatus(a.marked, a.correct);
    let marks = 0;
    if (status === 'correct') {
      marks = marking.correct;
    } else if (status === 'wrong') {
      marks = marking.wrong;
    }
    return { ...a, status, marks };
  });

  const sectionStats = sections.map(name => {
    const rows = graded.filter(a => a.section === name);
    const correct = rows.filter(a => a.status === 'correct').length;
    const wrong = rows.filter(a => a.status === 'wrong').length;
    return {
      name,
      total: rows.length,
      correct,
      wrong,
      unattempted: rows.length - correct - wrong,
      marks: rows.reduce((sum, a) => sum + a.marks, 0),
      maxMarks: rows.length * marking.correct,
      accuracy: correct + wrong ? Math.round((correct / (correct + wrong)) * 100) : 0,
    };
  });

  const correct = graded.filter(a => a.status === 'correct').length;
  const wrong = graded.filter(a => a.status === 'wrong').length;
  const attempted = correct + wrong;
  return {
    answers: graded,
    sections: sectionStats,
    total: graded.length,
    correct,
    wrong,
    unattempted: graded.length - attempted,
    attempted,
    score: graded.reduce((sum, a) => sum + a.marks, 0),
    maxScore: graded.length * marking.correct,
    negativeMarks: wrong * Math.abs(marking.wrong),
    accuracy: attempted ? Math.round((correct / attempted) * 100) : 0,
  };
};

// Share of participants this score beats (0-100, one decimal): rank 1 of N -> the
// highest percentile, last place -> 0.
export const percentileOf = (rank, participants) => {
  if (!participants || participants < 2) {
    return 0;
  }
  return round1(((participants - rank) / (participants - 1)) * 100);
};

// Competition ranking: equal scores share a rank, so 1, 2, 2, 4.
export const rankEntries = entries => {
  const sorted = [...entries].sort(
    (a, b) => b.score - a.score || a.name.localeCompare(b.name),
  );
  return sorted.map((entry, index) => {
    const tied = sorted.findIndex(e => e.score === entry.score);
    return { ...entry, rank: tied + 1, position: index + 1 };
  });
};

// "Rohan Kumar" -> "Rohan K." so other students are never shown in full.
export const maskName = name => {
  const parts = String(name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) {
    return 'Student';
  }
  if (parts.length === 1) {
    return parts[0];
  }
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
};

export const initialsOf = name =>
  String(name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0].toUpperCase())
    .join('') || '?';

export const formatMarks = value => {
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
};

// Colour band for an accuracy / score percentage, matching AccuracyRow.
export const toneOf = percent => {
  if (percent >= 80) {
    return { text: 'text-green-600', bar: '#16a34a' };
  }
  if (percent >= 60) {
    return { text: 'text-amber-600', bar: '#d97706' };
  }
  return { text: 'text-red-600', bar: '#dc2626' };
};

// The few numbers kept on the device for the history list.
export const summarizeResult = result => ({
  scanId: result.scanId,
  testName: result.testName,
  scannedAt: result.scannedAt,
  score: result.score,
  maxScore: result.maxScore,
  accuracy: result.accuracy,
  correct: result.correct,
  wrong: result.wrong,
  unattempted: result.unattempted,
  rank: result.rank ?? null,
  participants: result.participants ?? null,
});

// Totals across scans for the summary card on the history screen.
export const historyStats = history => {
  if (history.length === 0) {
    return { scans: 0, bestPercent: 0, avgAccuracy: 0 };
  }
  const percents = history.map(h =>
    h.maxScore ? Math.max(0, Math.round((h.score / h.maxScore) * 100)) : 0,
  );
  return {
    scans: history.length,
    bestPercent: Math.max(...percents),
    avgAccuracy: Math.round(
      history.reduce((sum, h) => sum + h.accuracy, 0) / history.length,
    ),
  };
};

export const ANSWER_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'correct', label: 'Correct' },
  { id: 'wrong', label: 'Wrong' },
  { id: 'unattempted', label: 'Blank' },
];
