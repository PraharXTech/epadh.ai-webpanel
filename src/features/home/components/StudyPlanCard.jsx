import { Link } from 'react-router-dom';
import AppIcon from '@/components/common/AppIcon';
import SectionHeader from '@/components/common/SectionHeader';
import { TASK_TYPES } from '@/features/plan/utils/planBuilder';
import { taskPath } from '@/features/plan/utils/taskLinks';
import { PATHS } from '@/routes/routePaths';

// "Today's Study Plan" on Home: the day's tasks (study / practice / revise ...), each ticking
// itself off from real activity, each opening its page. The full plan (and the Pro weekly
// planner) is the Plan page.
export default function StudyPlanCard({ tasks, doneCount, minutes }) {
  return (
    <section aria-label="Today's study plan">
      <SectionHeader
        title="Today's Study Plan"
        actionLabel="View plan"
        actionTo={PATHS.plan}
      />
      {tasks.length === 0 ? (
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">
            Pick a topic in the syllabus and your plan for today will appear
            here.
          </p>
          <Link
            to={PATHS.syllabus}
            className="mt-2 inline-block text-sm font-semibold text-blue-600 hover:underline">
            Open the syllabus
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="mb-2 text-xs text-slate-500">
            {`${doneCount} of ${tasks.length} done · ${minutes} min planned`}
          </p>
          <ul>
            {tasks.map(task => {
              const meta = TASK_TYPES[task.type];
              return (
                <li key={task.id}>
                  <Link
                    to={taskPath(task)}
                    className="flex items-center rounded-lg py-2 hover:bg-slate-50">
                    <span
                      className={`mr-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${meta.bg}`}>
                      <AppIcon name={meta.icon} size={16} color={meta.color} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block truncate text-sm font-semibold ${
                          task.done
                            ? 'text-slate-400 line-through'
                            : 'text-slate-900'
                        }`}>
                        {task.title}
                      </span>
                      <span className="block text-[11px] text-slate-500">
                        {meta.label} · {task.minutes} min
                      </span>
                    </span>
                    {task.done ? (
                      <span role="img" aria-label="Done">
                        <AppIcon name="circle-check" size={20} color="#16a34a" />
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
