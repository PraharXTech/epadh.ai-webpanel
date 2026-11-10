import Chip from '@/components/ui/Chip';

// "All exams" + one chip per exam the student prepares for, to narrow a mixed list
// (syllabus, material, papers) to a single exam. Not shown for a single exam, where
// there is nothing to choose. `value` is an exam id, or null for all of them.
export default function ExamFilterChips({ exams, value, onChange }) {
  if (exams.length < 2) {
    return null;
  }
  const chips = [{ id: null, name: 'All exams' }, ...exams];
  return (
    <div
      role="group"
      aria-label="Filter by exam"
      className="mb-3 flex gap-2 overflow-x-auto px-4 pb-1">
      {chips.map(chip => (
        <Chip
          key={chip.id ?? 'all'}
          selected={chip.id === value}
          aria-label={`Show ${chip.name}`}
          onClick={() => onChange(chip.id)}>
          {chip.name}
        </Chip>
      ))}
    </div>
  );
}
