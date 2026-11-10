import { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectSelectedExams } from '@/store/selectors/examSelectors';

// Which of the student's exams a mixed list is narrowed to (null = all of them). A choice
// that is no longer one of their exams (they dropped it) falls back to all.
export default function useExamFilter() {
  const exams = useSelector(selectSelectedExams);
  const [choice, setChoice] = useState(null);
  const value = exams.some(exam => exam.id === choice) ? choice : null;
  return { exams, value, setValue: setChoice };
}
