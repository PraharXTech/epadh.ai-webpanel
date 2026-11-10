import { useLocation, useNavigate } from 'react-router-dom';
import { PATHS } from '@/routes/routePaths';
import AppIcon from './AppIcon';

// Back arrow + title (+ optional subtitle and a right-hand action) for pushed pages.
// Back goes one step in history; when the page was opened directly (a shared link, a
// reload on a deep URL) there is no history, so it goes Home instead of leaving the site.
export default function ScreenHeader({ title, subtitle, onBack, right }) {
  const navigate = useNavigate();
  const location = useLocation();

  const goBack =
    onBack ??
    (() => (location.key === 'default' ? navigate(PATHS.home) : navigate(-1)));

  return (
    <div className="flex items-center px-4 pt-2 pb-3">
      <button
        type="button"
        onClick={goBack}
        aria-label="Go back"
        className="mr-3 rounded-full p-2 hover:bg-slate-100">
        <AppIcon name="arrow-left" color="#0f172a" size={22} />
      </button>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-xl font-extrabold text-slate-900">
          {title}
        </h1>
        {subtitle ? (
          <p className="truncate text-xs text-slate-500">{subtitle}</p>
        ) : null}
      </div>
      {right}
    </div>
  );
}
