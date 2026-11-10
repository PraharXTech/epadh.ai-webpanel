import AppIcon from '@/components/common/AppIcon';

// Numbered circle for chapters.
export function NumberBadge({ n, locked }) {
  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
        locked ? 'bg-amber-100 text-amber-700' : 'bg-blue-50 text-blue-600'
      }`}>
      {n}
    </span>
  );
}

// Tick for a completed topic, empty ring otherwise.
export function TopicStatusBadge({ completed }) {
  return completed ? (
    <span
      role="img"
      aria-label="Completed"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100">
      <AppIcon name="check" color="#16a34a" size={18} />
    </span>
  ) : (
    <span
      aria-hidden="true"
      className="h-9 w-9 shrink-0 rounded-full border-2 border-slate-200 bg-white"
    />
  );
}
