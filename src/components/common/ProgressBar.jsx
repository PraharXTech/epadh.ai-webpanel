// `label` names what is being measured for screen readers ("Syllabus completed").
export default function ProgressBar({ percent = 0, label, className = '' }) {
  const value = Math.min(100, Math.max(0, percent));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value)}
      className={`h-1.5 overflow-hidden rounded-full bg-slate-200 ${className}`}>
      <div
        className="h-full rounded-full bg-blue-600 transition-[width]"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
