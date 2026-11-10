import AppIcon from '@/components/common/AppIcon';
import Ring from '@/components/charts/Ring';
import { TYPE_ICONS, TYPE_TAGS } from '../utils/mockTests';
import MetaRow from './MetaRow';

// Score ring of the last attempt, or an empty ring with "Not attempted".
function Status({ progress }) {
  if (progress === null) {
    return (
      <span className="flex flex-col items-center">
        <span
          aria-hidden="true"
          className="h-9 w-9 rounded-full border-4 border-slate-200"
        />
        <span className="mt-1 text-center text-[10px] leading-3 text-slate-500">
          Not
          <br />
          attempted
        </span>
      </span>
    );
  }
  return (
    <Ring
      percent={progress}
      size={48}
      stroke={5}
      color={progress >= 50 ? '#2563eb' : '#f97316'}
      label="Score of the last attempt">
      <span className="text-[11px] font-bold text-slate-800">{progress}%</span>
    </Ring>
  );
}

// One mock test of the list. The whole row is one button: it opens the instructions, or
// Membership when the test is Pro and the student is on Free.
export default function MockTestRow({ examName, test, locked, onPress }) {
  const art = TYPE_ICONS[test.type];
  const tag = TYPE_TAGS[test.type];
  const title =
    test.type === 'full' && examName ? `${examName} ${test.name}` : test.name;
  return (
    <button
      type="button"
      onClick={() => onPress(test)}
      className="flex w-full items-center rounded-2xl bg-white p-3 text-left shadow-sm transition-colors hover:bg-slate-50">
      <span
        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${art.bg}`}>
        <AppIcon name={art.icon} size={26} color={art.color} />
      </span>
      <span className="ml-3 min-w-0 flex-1">
        <span className="flex items-center">
          <span className="line-clamp-2 flex-1 text-sm font-bold text-slate-900">
            {title}
          </span>
          {test.premium ? (
            <span
              className={`ml-2 flex items-center rounded-md px-1.5 py-0.5 ${
                locked ? 'bg-amber-100' : 'bg-blue-50'
              }`}>
              <AppIcon
                name="crown"
                size={10}
                color={locked ? '#b45309' : '#2563eb'}
              />
              <span
                className={`ml-0.5 text-[9px] font-bold ${
                  locked ? 'text-amber-700' : 'text-blue-700'
                }`}>
                PRO
              </span>
            </span>
          ) : null}
        </span>
        <span
          className={`mt-1 inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold ${tag.bg} ${tag.text}`}>
          {tag.label}
        </span>
        <span className="mt-1 block truncate text-xs text-slate-500">
          {test.subtitle}
        </span>
        <MetaRow test={test} className="mt-2 pr-2" />
      </span>
      <span className="ml-2 flex shrink-0 items-center border-l border-slate-100 pl-3">
        {locked ? (
          <span className="flex h-12 w-12 items-center justify-center">
            <AppIcon name="lock" size={20} color="#b45309" />
            <span className="sr-only">Pro only</span>
          </span>
        ) : (
          <Status progress={test.progress} />
        )}
        <AppIcon name="chevron-right" size={18} color="#94a3b8" />
      </span>
    </button>
  );
}
