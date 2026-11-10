// Filter / quick-reply pill. `selected` makes it a toggle (aria-pressed), used by the exam
// filters, the test categories, the AI quick prompts and the history filters.
export default function Chip({
  selected = false,
  className = '',
  children,
  ...rest
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={`inline-flex min-h-9 items-center rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-colors ${
        selected
          ? 'border-blue-600 bg-blue-600 text-white'
          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
      } ${className}`}
      {...rest}>
      {children}
    </button>
  );
}
