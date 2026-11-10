// Grey pulsing placeholder shown instead of a spinner on first load (Home, lists). Size it
// with Tailwind classes: <Skeleton className="h-4 w-1/2" />. Hidden from screen readers;
// the page announces loading through its container (aria-busy).
export default function Skeleton({ className = '' }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-lg bg-slate-200 ${className}`}
    />
  );
}
