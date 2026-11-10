import { Link } from 'react-router-dom';
import AppIcon from './AppIcon';

// Section title with an optional "View all →" action: a button (`onActionPress`) or a link
// (`actionTo`).
export default function SectionHeader({
  title,
  actionLabel,
  onActionPress,
  actionTo,
}) {
  const action = actionLabel ? (
    <>
      <span className="mr-1 text-sm font-semibold whitespace-nowrap text-blue-600">
        {actionLabel}
      </span>
      <AppIcon name="arrow-right" color="#2563eb" size={14} />
    </>
  ) : null;

  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      {actionTo && action ? (
        <Link to={actionTo} className="ml-3 flex shrink-0 items-center">
          {action}
        </Link>
      ) : action ? (
        <button
          type="button"
          onClick={onActionPress}
          className="ml-3 flex shrink-0 items-center">
          {action}
        </button>
      ) : null}
    </div>
  );
}
