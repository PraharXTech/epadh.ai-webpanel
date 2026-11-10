import { Link } from 'react-router-dom';
import AppIcon from '@/components/common/AppIcon';
import { PATHS } from '@/routes/routePaths';

const hint = ({ current, todayCounted, atRisk, minutesToKeepStreak }) => {
  if (atRisk) {
    return `Study ${minutesToKeepStreak} more min today to keep it`;
  }
  if (todayCounted) {
    return 'Today counted. See you tomorrow!';
  }
  return current === 0 ? 'Study 10 min today to start a streak' : '';
};

// The current streak on Home. Tapping it opens the streak page.
export default function StreakCard({ streak }) {
  const active = streak.current > 0;
  return (
    <Link
      to={PATHS.streak}
      className="flex flex-col rounded-2xl bg-white p-4 shadow-sm transition-colors hover:bg-slate-50">
      <span className="flex items-center">
        <span
          className={`mr-2 flex h-8 w-8 items-center justify-center rounded-full ${
            active ? 'bg-orange-100' : 'bg-slate-100'
          }`}>
          <AppIcon
            name="flame"
            size={16}
            color={active ? '#ea580c' : '#94a3b8'}
          />
        </span>
        <span className="text-sm font-bold text-slate-900">Streak</span>
      </span>
      <span className="mt-3 text-2xl font-extrabold text-slate-900">
        {streak.current}
        <span className="text-sm font-semibold text-slate-500">
          {' '}
          day{streak.current === 1 ? '' : 's'}
        </span>
      </span>
      <span
        className={`mt-2 text-[11px] ${
          streak.atRisk ? 'font-semibold text-amber-700' : 'text-slate-500'
        }`}>
        {hint(streak)}
      </span>
    </Link>
  );
}
