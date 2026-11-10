import AppIcon from '@/components/common/AppIcon';
import MaterialRow from './MaterialRow';

export default function SubjectSection({
  subject,
  items,
  bookmarks,
  downloads,
  onViewAll,
  onItemPress,
  onDownload,
  onMenu,
}) {
  return (
    <section className="mt-4 px-4" aria-label={subject.name}>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center">
          <span
            aria-hidden="true"
            className={`flex h-8 w-8 items-center justify-center rounded-full ${subject.bg}`}>
            <AppIcon name={subject.icon} color={subject.color} size={18} />
          </span>
          <h2 className="ml-2.5 text-base font-bold text-slate-900">
            {subject.name}
          </h2>
        </div>
        {onViewAll ? (
          <button
            type="button"
            onClick={() => onViewAll(subject)}
            aria-label={`View all ${subject.name}`}
            className="flex items-center">
            <span className="mr-1 text-xs font-semibold text-blue-600">
              View All
            </span>
            <AppIcon name="chevron-right" color="#2563eb" size={14} />
          </button>
        ) : null}
      </div>

      <ul className="overflow-hidden rounded-2xl bg-white shadow-sm">
        {items.map((item, index) => (
          <MaterialRow
            key={item.id}
            item={item}
            bookmarked={Boolean(bookmarks[item.id])}
            downloaded={Boolean(downloads[item.id])}
            showDivider={index < items.length - 1}
            onPress={onItemPress}
            onDownload={onDownload}
            onMenu={onMenu}
          />
        ))}
      </ul>
    </section>
  );
}
