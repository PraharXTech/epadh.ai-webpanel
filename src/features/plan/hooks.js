import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import usePerformance from '@/features/analytics/hooks';
import { hasFeature } from '@/features/membership/utils/entitlements';
import { selectMockHistory } from '@/store/selectors/mockSelectors';
import { selectPracticeHistory } from '@/store/selectors/practiceSelectors';
import { selectStudySessions } from '@/store/selectors/studySelectors';
import {
  selectCompletedTopics,
  selectSyllabusTree,
} from '@/store/selectors/syllabusSelectors';
import { selectEntitlements } from '@/store/selectors/userSelectors';
import { dayKey } from '@/utils/date';
import { regeneratePlan, setPlan } from './store/planSlice';
import {
  buildDailyPlan,
  buildWeekPlan,
  isTaskDone,
  planTopics,
  totalMinutes,
} from './utils/planBuilder';

// Today's plan (kept for the day), the week ahead (Pro) and which tasks the student has
// already done. The plan is rebuilt on a new day, after "Regenerate", or when the plan
// type changes (Free <-> Pro); activity only ticks tasks off, it never reshuffles them.
export default function usePlan() {
  const dispatch = useDispatch();
  const plan = useSelector(state => state.plan);
  const tree = useSelector(selectSyllabusTree);
  const completed = useSelector(selectCompletedTopics);
  const entitlements = useSelector(selectEntitlements);
  const sessions = useSelector(selectStudySessions);
  const practiceHistory = useSelector(selectPracticeHistory);
  const mockHistory = useSelector(selectMockHistory);
  const { weakTopics } = usePerformance('all');

  const pro = hasFeature(entitlements, 'studyPlanner');
  const topics = useMemo(() => planTopics(tree), [tree]);
  const today = dayKey();
  const generatedBy = pro ? 'ai' : 'rules';

  useEffect(() => {
    const stale =
      plan.day !== today ||
      plan.generatedBy !== generatedBy ||
      (plan.tasks.length === 0 && topics.length > 0);
    if (stale && topics.length > 0) {
      dispatch(
        setPlan({
          day: today,
          generatedBy,
          version: plan.version,
          tasks: buildDailyPlan({
            topics,
            weakTopics,
            mockHistory,
            pro,
            version: plan.version,
          }),
        }),
      );
    }
    // Only these decide when the plan is rebuilt; activity must not reshuffle it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan.day, plan.generatedBy, plan.version, today, generatedBy, topics]);

  const now = Date.now();
  const tasks = plan.tasks.map(task => ({
    ...task,
    done: isTaskDone(task, {
      sessions,
      practiceHistory,
      mockHistory,
      completed,
      now,
    }),
  }));

  const week = useMemo(
    () =>
      pro
        ? buildWeekPlan({
            topics,
            weakTopics,
            mockHistory,
            pro,
            version: plan.version,
          })
        : [],
    [pro, topics, weakTopics, mockHistory, plan.version],
  );

  return {
    pro,
    tasks,
    week,
    doneCount: tasks.filter(t => t.done).length,
    minutes: totalMinutes(tasks),
    regenerate: () => dispatch(regeneratePlan()),
  };
}
