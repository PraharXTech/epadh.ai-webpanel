import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectSelectedExamIds } from '@/store/selectors/userSelectors';

// Loads exam-scoped data for every exam the student prepares for (once per app run per
// exam, and again when they add one). Data saved from the last run shows instantly while
// it refreshes. `load` is an async thunk creator taking one exam id; `loadedExamIds` are
// the exams whose data is in the store. `hasData` is true as soon as any selected exam's
// data is there, so adding an exam never blanks the screen while the new one loads.
export default function useExamLoader(load, loadedExamIds) {
  const dispatch = useDispatch();
  const examIds = useSelector(selectSelectedExamIds);
  const requested = useRef(new Set()); // stops a failed load from retrying in a loop

  const refresh = useCallback(() => {
    examIds.forEach(id => {
      requested.current.add(id);
      dispatch(load(id));
    });
  }, [dispatch, examIds, load]);

  useEffect(() => {
    examIds
      .filter(id => !requested.current.has(id))
      .forEach(id => {
        requested.current.add(id);
        dispatch(load(id));
      });
  }, [examIds, dispatch, load]);

  return { refresh, hasData: examIds.some(id => loadedExamIds.includes(id)) };
}
