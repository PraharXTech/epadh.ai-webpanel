import AppIcon from '@/components/common/AppIcon';
import SectionHeader from '@/components/common/SectionHeader';
import Ring from '@/components/charts/Ring';

const headlineFor = percent => {
  if (percent < 25) {
    return 'Just getting started!';
  }
  if (percent < 60) {
    return 'Keep going!';
  }
  if (percent < 90) {
    return "You're doing great!";
  }
  return 'Almost there!';
};

const STAT_META = {
  attempted: { icon: 'file-text', color: '#16a34a', bg: 'bg-green-100' },
  correct: { icon: 'circle-check', color: '#2563eb', bg: 'bg-blue-100' },
  wrong: { icon: 'circle-x', color: '#dc2626', bg: 'bg-red-100' },
  studyTime: { icon: 'clock', color: '#ea580c', bg: 'bg-orange-100' },
};

// `stats` is the student's real activity: { attempted, correct, wrong, studyHours }
// (see attemptStatsSelectors.js / studySelectors.js), not backend content, so it is not part
// of the mock GET /home payload the way `message` is.
export default function PreparationProgress({
  percent,
  message,
  stats,
  detailsTo,
}) {
  const tiles = [
    { id: 'attempted', value: stats.attempted, label: 'Questions Attempted' },
    { id: 'correct', value: stats.correct, label: 'Correct Answers' },
    { id: 'wrong', value: stats.wrong, label: 'Wrong Answers' },
    {
      id: 'studyTime',
      value:
        stats.studyHours >= 1
          ? `${stats.studyHours} hrs`
          : `${Math.round(stats.studyHours * 60)} min`,
      label: 'Study Time',
    },
  ];

  return (
    <section
      aria-label="Your preparation progress"
      className="rounded-3xl bg-white p-4 shadow-sm">
      <SectionHeader
        title="Your Preparation Progress"
        actionLabel="View Details"
        actionTo={detailsTo}
      />
      <div className="flex items-center">
        <Ring percent={percent} size={88} stroke={10} label="Syllabus completed">
          <span className="text-xl font-bold text-slate-900">{percent}%</span>
        </Ring>
        <div className="ml-4 flex-1">
          <p className="text-base font-bold text-slate-900">
            {headlineFor(percent)}
          </p>
          <p className="mt-0.5 text-sm text-slate-500">{message}</p>
        </div>
      </div>

      <div className="mt-4 mb-1 h-px bg-slate-100" />

      <ul className="grid grid-cols-4">
        {tiles.map(tile => {
          const meta = STAT_META[tile.id];
          return (
            <li key={tile.id} className="flex flex-col items-center pt-3">
              <span
                className={`mb-1.5 flex h-9 w-9 items-center justify-center rounded-full ${meta.bg}`}>
                <AppIcon name={meta.icon} size={16} color={meta.color} />
              </span>
              <span className="text-base font-extrabold text-slate-900">
                {tile.value}
              </span>
              <span className="text-center text-[10px] leading-3 text-slate-500">
                {tile.label}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
