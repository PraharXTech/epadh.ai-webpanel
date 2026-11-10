const TONES = {
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-green-100 text-green-700',
  amber: 'bg-amber-100 text-amber-800',
  red: 'bg-red-100 text-red-700',
  violet: 'bg-violet-100 text-violet-700',
  slate: 'bg-slate-100 text-slate-600',
};

// Small status label: Free / Pro, AI, Viewed, Resume, difficulty...
export default function Badge({ tone = 'slate', className = '', children }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${TONES[tone]} ${className}`}>
      {children}
    </span>
  );
}
