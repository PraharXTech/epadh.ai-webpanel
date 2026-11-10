import {
  selectOption,
  startPractice,
  submitSession,
} from '@/features/practice/store/practiceSlice';
import { store } from '@/store';

// Web port of mobile test-utils/practice.js. Starts a 5-question practice test on a topic,
// answers one question and submits it, so it counts as a finished practice set (the mock
// service delays about half a second; no fake timers needed).
export const finishPracticeForTest = async topicId => {
  await store.dispatch(
    startPractice({
      topicId,
      topicName: topicId,
      subjectId: 'quant',
      subjectName: 'Quantitative Aptitude',
      count: 5,
      mode: 'practice',
    }),
  );
  store.dispatch(selectOption(0));
  store.dispatch(submitSession());
};
