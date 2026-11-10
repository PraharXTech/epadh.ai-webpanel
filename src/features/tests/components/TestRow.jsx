import AppIcon from '@/components/common/AppIcon';
import { KIND_META } from '../utils/catalog';

function MetaItem({ icon, text }) {
  return (
    <span className="mr-3 inline-flex items-center">
      <AppIcon name={icon} size={12} color="#64748b" />
      <span className="ml-1 text-[11px] text-slate-500">{text}</span>
    </span>
  );
}

// One row of the "All Tests" list: mock / subject / practice tests get a "Start Test"
// pill, a chapter test a lighter "Practice" badge. The whole row opens it either way; a
// locked chapter shows a lock instead.
export default function TestRow({ row, onPress }) {
  const meta = KIND_META[row.kind];
  return (
    <button
      type="button"
      onClick={() => onPress(row)}
      className="flex w-full items-center rounded-2xl bg-white p-3 text-left shadow-sm transition-colors hover:bg-slate-50">
      <span
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${meta.bg}`}>
        <AppIcon name={meta.icon} size={22} color={meta.color} />
      </span>
      <span className="ml-3 min-w-0 flex-1">
        <span className="line-clamp-2 block text-sm font-bold text-slate-900">
          {row.title}
        </span>
        <span className="mt-0.5 block truncate text-xs text-slate-500">
          {row.subtitle}
        </span>
        <span className="mt-1.5 flex flex-wrap items-center">
          {row.questions ? (
            <MetaItem icon="file-text" text={`${row.questions} Qs`} />
          ) : null}
          {row.minutes ? (
            <MetaItem icon="clock" text={`${row.minutes} Mins`} />
          ) : null}
          <span className="text-[11px] text-slate-500">{row.tag}</span>
        </span>
        {row.attempted && row.accuracy !== null ? (
          <span className="mt-1 block text-[11px] font-semibold text-blue-600">
            {`Last score: ${row.accuracy}%`}
          </span>
        ) : null}
      </span>
      <span className="ml-2 flex shrink-0 flex-col items-end gap-1.5">
        {row.locked ? (
          <>
            <AppIcon name="lock" color="#b45309" size={18} />
            <span className="sr-only">Pro only</span>
          </>
        ) : meta.cta === 'button' ? (
          <span className="rounded-full bg-amber-500 px-3.5 py-1.5 text-xs font-bold text-white">
            Start Test
          </span>
        ) : (
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.tagBg} ${meta.tagText}`}>
            Practice
          </span>
        )}
        <AppIcon name="chevron-right" size={16} color="#94a3b8" />
      </span>
    </button>
  );
}
