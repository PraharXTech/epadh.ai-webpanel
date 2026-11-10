import { useSelector } from 'react-redux';
import useExamLoader from '@/hooks/useExamLoader';
import { loadSyllabus } from '../store/syllabusSlice';
import {
  selectLoadedSyllabusExamIds,
  selectSyllabusError,
  selectSyllabusStatus,
  selectSyllabusTree,
} from '@/store/selectors/syllabusSelectors';

// Syllabus tree (with the student's progress) for the exams they prepare for.
export default function useSyllabus() {
  const tree = useSelector(selectSyllabusTree);
  const status = useSelector(selectSyllabusStatus);
  const error = useSelector(selectSyllabusError);
  const { refresh, hasData } = useExamLoader(
    loadSyllabus,
    useSelector(selectLoadedSyllabusExamIds),
  );

  return { tree, status, error, refresh, hasData };
}
