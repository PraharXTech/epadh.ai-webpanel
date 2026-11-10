import Chip from '@/components/ui/Chip';

// Plain pill filter chips (a category, a year, a sort option), scrollable sideways when they
// overflow. `options` is [{ id, label }].
export default function CategoryChips({
  options,
  value,
  onChange,
  label = 'Filter',
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex shrink-0 gap-2 overflow-x-auto px-4 pb-1">
      {options.map(o => (
        <Chip
          key={o.id}
          selected={o.id === value}
          onClick={() => onChange(o.id)}>
          {o.label}
        </Chip>
      ))}
    </div>
  );
}
