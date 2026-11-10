import Skeleton from '@/components/feedback/Skeleton';

// Grey placeholders in the shape of Home, shown on the very first load (no saved data).
export default function HomeSkeleton() {
  return (
    <div
      data-testid="home-skeleton"
      role="status"
      aria-label="Loading"
      aria-busy="true"
      className="mx-auto max-w-6xl px-4 pt-6">
      <Skeleton className="mb-2 h-4 w-28" />
      <Skeleton className="mb-4 h-7 w-44" />
      <Skeleton className="h-44 w-full rounded-3xl" />
      <div className="mt-4 grid grid-cols-4 gap-2">
        {[0, 1, 2, 3].map(i => (
          <Skeleton key={i} className="h-24 w-full rounded-2xl" />
        ))}
      </div>
      <Skeleton className="mt-4 h-40 w-full rounded-3xl" />
    </div>
  );
}
