import { Link } from 'react-router-dom';
import AppIcon from '@/components/common/AppIcon';
import ProgressBar from '@/components/common/ProgressBar';

// One row of the syllabus drill-down (subject, chapter or topic).
// `leading` is the left-hand badge; `percent` shows a progress bar when given.
// Navigates with `to` (a real link: open in a new tab, copy the address) or runs `onPress`.
// A locked row swaps the chevron for a lock and is still clickable: the page passes an
// `onPress` that opens the paywall.
export default function SyllabusRow({
  title,
  subtitle,
  leading,
  percent,
  locked = false,
  to,
  onPress,
  current = false,
}) {
  const className = `flex w-full items-center rounded-xl bg-white px-3 py-3 text-left shadow-sm transition-colors hover:bg-slate-50 ${
    current ? 'ring-2 ring-blue-500' : ''
  }`;

  const content = (
    <>
      {leading}
      <span className="ml-3 min-w-0 flex-1">
        <span
          className={`line-clamp-2 block text-sm font-semibold ${
            locked ? 'text-slate-500' : 'text-slate-900'
          }`}>
          {title}
        </span>
        {subtitle ? (
          <span className="mt-0.5 block text-[11px] text-slate-500">
            {subtitle}
          </span>
        ) : null}
        {percent !== undefined ? (
          <span className="mt-2 flex items-center">
            <ProgressBar
              percent={percent}
              label={`${title} progress`}
              className="flex-1"
            />
            <span className="ml-2 text-[11px] font-semibold text-slate-600">
              {percent}%
            </span>
          </span>
        ) : null}
      </span>
      <span className="ml-2">
        {locked ? (
          <AppIcon name="lock" color="#b45309" size={18} />
        ) : (
          <AppIcon name="chevron-right" color="#94a3b8" size={18} />
        )}
      </span>
    </>
  );

  if (to && !locked) {
    return (
      <Link
        to={to}
        aria-current={current ? 'page' : undefined}
        className={className}>
        {content}
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={onPress}
      aria-label={locked ? `${title}, locked. Part of Pro` : undefined}
      className={className}>
      {content}
    </button>
  );
}
