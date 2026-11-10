import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { selectContinueItem } from '@/store/selectors/activitySelectors';
import { selectPracticeSession } from '@/store/selectors/practiceSelectors';

// The last thing the student did and a `resume()` that opens that exact place:
// the practice test in progress (or its setup), the material they were on, or the topic.
export default function useContinueLearning(navigation) {
  const item = useSelector(selectContinueItem);
  const session = useSelector(selectPracticeSession);

  const resume = useCallback(
    target => {
      const current = target ?? item;
      if (!current) {
        return;
      }
      if (current.mode === 'practice') {
        if (session?.topicId === current.topicId) {
          navigation.navigate('PracticeSession');
        } else {
          navigation.navigate('PracticeSetup', { topicId: current.topicId });
        }
      } else if (current.mode === 'material') {
        navigation.navigate('MaterialViewer', { itemId: current.itemId });
      } else {
        navigation.navigate('TopicDetail', { topicId: current.topicId });
      }
    },
    [item, session, navigation],
  );

  return { item, resume };
}
