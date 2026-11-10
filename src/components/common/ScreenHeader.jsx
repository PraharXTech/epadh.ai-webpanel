import useGoBack from '@/hooks/useGoBack';
import AppIcon from './AppIcon';

// Back arrow + title (+ optional subtitle and a right-hand action) for pushed pages.
// Back goes one step in history; when there is no page of the app behind (a shared link, a
// reload on a deep URL) it goes Home instead of leaving the site (hooks/useGoBack.js).
export default function ScreenHeader({ title, subtitle, onBack, right }) {
  const back = useGoBack();
  const goBack = onBack ?? (() => back());

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
