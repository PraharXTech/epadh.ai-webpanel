import AppIcon from '@/components/common/AppIcon';
import { TYPE_FILTERS } from '../utils/format';

export default function TypeFilterBar({ value, onChange }) {
  return (
    <div
      role="group"
      aria-label="Filter by type"
      className="mx-3 mt-3 grid grid-cols-4 gap-2 px-1">
      {TYPE_FILTERS.map(filter => {
        const active = filter.id === value;
        return (
          <button
            key={filter.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(filter.id)}
            className={`flex h-[60px] flex-col items-center justify-center rounded-xl border transition-colors ${
              active
                ? 'border-blue-500 bg-blue-50'
                : 'border-white bg-white hover:bg-slate-50'
            }`}>
            <AppIcon name={filter.icon} color={filter.color} size={22} />
            <span
              className={`mt-1.5 truncate text-[11px] ${
                active
                  ? 'font-bold text-slate-900'
                  : 'font-medium text-slate-700'
              }`}>
              {filter.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
