import AppIcon from '@/components/common/AppIcon';
import { describeItem } from '../utils/format';
import MaterialTypeIcon from './MaterialTypeIcon';
import SmallProgressRing from './SmallProgressRing';

// Right-hand status, in priority order: watch/read progress, bookmark, saved, download.
function TrailingStatus({ item, bookmarked, downloaded, onDownload }) {
  if (item.progress > 0) {
    return <SmallProgressRing percent={item.progress} />;
  }
  if (bookmarked) {
    return (
      <span role="img" aria-label="Bookmarked">
        <AppIcon name="bookmark" color="#2563eb" size={20} fill="#2563eb" />
      </span>
    );
  }
  if (downloaded) {
    return (
      <span role="img" aria-label="Saved for offline">
        <AppIcon name="circle-check" color="#16a34a" size={20} />
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={() => onDownload(item)}
      aria-label={`Download ${item.title} for offline`}
      className="rounded-full p-1 hover:bg-slate-100">
      <AppIcon name="download" color="#475569" size={20} />
    </button>
  );
}

// One material in a list. The title area opens it; download and the "more" menu are separate
// buttons next to it (a button cannot contain buttons).
export default function MaterialRow({
  item,
  bookmarked,
  downloaded,
  onPress,
  onDownload,
  onMenu,
  showDivider,
}) {
  return (
    <li
      className={`flex items-center px-3 py-2 ${
        showDivider ? 'border-b border-slate-100' : ''
      }`}>
      <button
        type="button"
        onClick={() => onPress?.(item)}
        className="flex min-w-0 flex-1 items-center rounded-lg text-left hover:bg-slate-50">
        <MaterialTypeIcon type={item.type} format={item.format} />
        <span className="ml-2.5 min-w-0 flex-1 pr-2">
          <span className="line-clamp-2 block text-sm font-semibold text-slate-900">
            {item.title}
          </span>
          <span className="mt-0.5 block text-[11px] text-slate-500">
            {describeItem(item)}
          </span>
        </span>
      </button>
      <TrailingStatus
        item={item}
        bookmarked={bookmarked}
        downloaded={downloaded}
        onDownload={onDownload}
      />
      <button
        type="button"
        onClick={() => onMenu(item)}
        aria-label={`More options for ${item.title}`}
        className="ml-2 rounded-full p-1 hover:bg-slate-100">
        <AppIcon name="more-vertical" color="#334155" size={20} />
      </button>
    </li>
  );
}
