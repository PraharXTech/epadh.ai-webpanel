import { Link } from 'react-router-dom';
import AppIcon from '@/components/common/AppIcon';
import ProgressBar from '@/components/common/ProgressBar';
import { PATHS } from '@/routes/routePaths';

// Minutes studied today against the daily goal (default 60, changeable in Settings later).
export default function StudyTimeCard({ minutes, targetMinutes }) {
  const percent = targetMinutes
    ? Math.min(100, Math.round((minutes / targetMinutes) * 100))
    : 0;
  return (
    <Link
      to={PATHS.streak}
      className="flex flex-col rounded-2xl bg-white p-4 shadow-sm transition-colors hover:bg-slate-50">
      <span className="flex items-center">
        <span className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-orange-100">
          <AppIcon name="clock" size={16} color="#ea580c" />
        </span>
        <span className="text-sm font-bold text-slate-900">Study Time</span>
      </span>
      <span className="mt-3 text-2xl font-extrabold text-slate-900">
        {minutes}
        <span className="text-sm font-semibold text-slate-500">
          {' '}
          / {targetMinutes} min
        </span>
      </span>
      <ProgressBar
        percent={percent}
        label="Study time today"
        className="mt-2"
      />
      <span className="mt-1 text-[11px] text-slate-500">
        {minutes >= targetMinutes ? 'Goal reached today!' : "Today's goal"}
      </span>
    </Link>
  );
}
