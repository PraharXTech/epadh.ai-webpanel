// Mock only: the mock syllabus and study material are one big set of subjects, so each
// exam is given the subjects it would plausibly cover. Subjects shared by two exams are
// the same rows (same ids), which is what lets the app show them once. The real backend
// returns each exam's own syllabus, so this file goes away with the mock.
const EXAM_SUBJECTS = {
  pet: ['quant', 'gk', 'reasoning'],
  police: ['gk', 'reasoning'],
  gd: ['quant', 'reasoning'],
  chsl: ['quant', 'gk'],
};

// Subject ids of an exam; every subject for an exam the mock does not know.
export const mockSubjectIds = (examId, allIds) =>
  EXAM_SUBJECTS[examId] ?? allIds;
