import AppIcon from '@/components/common/AppIcon';
import BottomSheet from './BottomSheet';

export default function SubjectPickerSheet({
  visible,
  subjects,
  selectedId,
  onSelect,
  onClose,
}) {
  const options = [{ id: null, name: 'All Subjects' }, ...subjects];

  return (
    <BottomSheet visible={visible} title="Select subject" onClose={onClose}>
      <div role="radiogroup" aria-label="Subject">
        {options.map(option => {
          const selected = option.id === selectedId;
          return (
            <button
              key={option.id ?? 'all'}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onSelect(option.id)}
              className="flex h-14 w-full items-center justify-between border-b border-slate-100 text-left hover:bg-slate-50">
              <span
                className={`text-base ${
                  selected ? 'font-bold text-blue-600' : 'text-slate-800'
                }`}>
                {option.name}
              </span>
              {selected ? (
                <AppIcon name="check" color="#2563eb" size={20} />
              ) : null}
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
}
