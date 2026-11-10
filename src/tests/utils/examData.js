import { loadExams } from '@/features/exams/store/examSlice';
import { loadMaterial } from '@/features/material/store/materialSlice';
import { loadSyllabus } from '@/features/syllabus/store/syllabusSlice';
import { chooseExam } from '@/features/user/store/userSlice';
import { store } from '@/store';

// Picks the "pet" exam and loads its syllabus and material (mock services, real timers, about
// a second). Web port of loadExamData in the mobile test-utils.
export const loadExamData = async () => {
  await store.dispatch(chooseExam({ examIds: ['pet'] }));
  await Promise.all([
    store.dispatch(loadExams()),
    store.dispatch(loadSyllabus('pet')),
    store.dispatch(loadMaterial('pet')),
  ]);
};
