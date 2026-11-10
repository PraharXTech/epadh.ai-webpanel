import AppIcon from '@/components/common/AppIcon';

// One exam in the picker. A checkbox (several exams can be chosen), so screen readers hear
// "UPSSSC PET, checkbox, checked".
export default function ExamCard({ exam, selected, onPress }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={Boolean(selected)}
      onClick={() => onPress(exam)}
      className={`flex w-full items-center rounded-2xl border bg-white p-4 text-left transition-colors hover:bg-slate-50 ${
        selected ? 'border-blue-600 ring-1 ring-blue-600' : 'border-slate-200'
      }`}>
      <span
        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${exam.bg}`}>
        <AppIcon name={exam.icon} color={exam.color} size={28} />
      </span>
      <span className="ml-4 min-w-0 flex-1">
        <span className="block text-base font-bold text-slate-900">
          {exam.name}
        </span>
        <span className="block text-xs text-slate-500">{exam.description}</span>
        {exam.subjectCount ? (
          <span className="mt-0.5 block text-xs font-medium text-blue-600">
            {exam.subjectCount} subjects
          </span>
        ) : null}
      </span>
      <span
        aria-hidden="true"
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${
          selected ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
        }`}>
        {selected ? <AppIcon name="check" color="#ffffff" size={14} /> : null}
      </span>
    </button>
  );
}
