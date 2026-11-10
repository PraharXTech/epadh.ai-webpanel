import AppIcon from '@/components/common/AppIcon';

// White dropdown-style button: leading icon, label, chevron.
export default function SelectorPill({ icon, label, onPress, className = '' }) {
  return (
    <button
      type="button"
      onClick={onPress}
      className={`flex h-10 w-full items-center rounded-xl bg-white px-3 text-left shadow-sm transition-colors hover:bg-slate-50 ${className}`}>
      <AppIcon name={icon} color="#334155" size={18} />
      <span className="ml-2 min-w-0 flex-1 truncate text-sm font-medium text-slate-800">
        {label}
      </span>
      <AppIcon name="chevron-down" color="#334155" size={16} />
    </button>
  );
}
