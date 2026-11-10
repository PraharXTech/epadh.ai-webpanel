import { createSelector } from '@reduxjs/toolkit';
import { selectSelectedExamIds } from './userSelectors';

export const selectExams = state => state.exams.items;
export const selectExamsStatus = state => state.exams.status;
export const selectExamsError = state => state.exams.error;
export const selectExamById = (state, id) =>
  state.exams.items.find(exam => exam.id === id) ?? null;

// The exams the student prepares for, as { id, name, ... } in the order they chose
// them. Before the exam list has loaded an exam is known only by its id.
export const selectSelectedExams = createSelector(
  [selectSelectedExamIds, selectExams],
  (ids, exams) =>
    ids.map(id => exams.find(exam => exam.id === id) ?? { id, name: id }),
);

// "UPSSSC PET", "UPSSSC PET, SSC GD", ... for headers and pills.
export const selectSelectedExamLabel = createSelector(
  [selectSelectedExams],
  selected =>
    selected.length
      ? selected.map(exam => exam.name).join(', ')
      : 'Select exam',
);

// The exam's name when the student prepares for exactly one, else null. Test titles
// carry the exam ("UPSSSC PET Full Mock Test 01") only when there is no doubt which.
export const selectSoleExamName = createSelector(
  [selectSelectedExams],
  selected => (selected.length === 1 ? selected[0].name : null),
);
