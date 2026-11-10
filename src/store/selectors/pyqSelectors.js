import { createSelector } from '@reduxjs/toolkit';
import { sortPapers } from '@/features/pyq/utils/pyq';
import { selectSelectedExamIds } from './userSelectors';

export const selectPyqStatus = state => state.pyq.status;
export const selectPyqError = state => state.pyq.error;
// True once the list is here: kept from the last run, or just loaded.
export const selectPyqLoaded = state =>
  state.pyq.status === 'succeeded' || state.pyq.papers.length > 0;
export const selectSavedPapers = state => state.pyq.saved;
export const selectViewedPapers = state => state.pyq.viewed;

// Papers of the exams the student prepares for, newest year first.
export const selectPyqPapers = createSelector(
  [state => state.pyq.papers, selectSelectedExamIds],
  (papers, examIds) =>
    sortPapers(papers.filter(paper => examIds.includes(paper.examId))),
);

// Any paper, whichever exam it belongs to (a saved paper can outlive a deselected exam).
export const selectPyqPaperById = (state, id) =>
  state.pyq.papers.find(p => p.id === id);
