import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { PATHS } from '@/routes/routePaths';
import { selectContinueItem } from '@/store/selectors/activitySelectors';
import { selectPracticeSession } from '@/store/selectors/practiceSelectors';

// The last thing the student did and a `resume()` that opens that exact place:
// the practice test in progress (or its setup), the material they were on, or the topic.
// Web port: `navigation.navigate(...)` became router links (no `navigation` argument).
export default function useContinueLearning() {
  const item = useSelector(selectContinueItem);
  const session = useSelector(selectPracticeSession);
  const navigate = useNavigate();

  const resume = useCallback(
    target => {
      const current = target ?? item;
      if (!current) {
        return;
      }
      if (current.mode === 'practice') {
        navigate(
          session?.topicId === current.topicId
            ? PATHS.practiceSession
            : PATHS.practiceSetup(current.topicId),
        );
      } else if (current.mode === 'material') {
        navigate(PATHS.material(current.itemId));
      } else {
        navigate(PATHS.topic(current.topicId));
      }
    },
    [item, session, navigate],
  );

  return { item, resume };
}
