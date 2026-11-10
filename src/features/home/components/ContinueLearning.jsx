import AppIcon from '@/components/common/AppIcon';
import ProgressBar from '@/components/common/ProgressBar';
import SectionHeader from '@/components/common/SectionHeader';
import Button from '@/components/ui/Button';

// There is only ever one "last activity", so this is a single full-width card, not a list.
function ContinueCard({ item, onContinue }) {
  return (
    <div className="flex items-center rounded-2xl bg-white p-4 shadow-sm">
      <span
        className={`mr-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${item.iconBg}`}>
        <AppIcon name={item.icon} color={item.color} size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold tracking-wide text-amber-600 uppercase">
          {item.typeLabel}
        </p>
        <p className="truncate text-base font-bold text-slate-900">
          {item.title}
        </p>
        <p className="line-clamp-2 text-xs leading-4 text-slate-500">
          {item.subtitle}
        </p>
        <div className="mt-1.5 flex items-center">
          <ProgressBar
            percent={item.percent}
            label={`${item.title} progress`}
            className="mr-2 flex-1"
          />
          <span className="text-[11px] font-semibold text-slate-600">
            {item.percent}%
          </span>
        </div>
        {item.topicCount ? (
          <p className="mt-1 text-[11px] text-slate-500">
            {`${item.completedCount} / ${item.topicCount} topics completed`}
          </p>
        ) : null}
      </div>
      <Button
        size="sm"
        className="ml-3"
        aria-label={`Continue ${item.title}`}
        onClick={() => onContinue?.(item)}>
        Continue
        <AppIcon name="arrow-right" color="currentColor" size={14} />
      </Button>
    </div>
  );
}

export default function ContinueLearning({ items, onContinue, onBrowse }) {
  const item = items[0];
  return (
    <section aria-label="Continue learning">
      <SectionHeader title="Continue Learning" />
      {item ? (
        <ContinueCard item={item} onContinue={onContinue} />
      ) : (
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-base font-bold text-slate-900">
            Nothing to continue yet
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Open a topic, read some material or take a practice test and it will
            show up here.
          </p>
          <Button size="sm" className="mt-3" onClick={onBrowse}>
            Pick your first topic
          </Button>
        </div>
      )}
    </section>
  );
}
