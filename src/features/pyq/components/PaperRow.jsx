import AppIcon from '@/components/common/AppIcon';
import { describePaper, paperLabel } from '../utils/pyq';

// One uploaded paper: year + shift as the headline, then language / size, with a lock when it
// is Pro only, a tick once opened and a bookmark to keep it handy. `showExam` adds the exam's
// name above the headline, for a list that mixes several exams.
// The bookmark is a sibling of the row button (a button cannot sit inside a button).
export default function PaperRow({
  paper,
  locked,
  saved,
  viewed,
  showExam = false,
  onPress,
  onToggleSaved,
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => onPress(paper)}
        aria-label={`Open ${paper.title}`}
        className="flex w-full items-center rounded-2xl bg-white py-3 pr-14 pl-3 text-left shadow-sm transition-colors hover:bg-slate-50">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100">
          <AppIcon
            name={locked ? 'lock' : 'file-text'}
            size={20}
            color="#7c3aed"
          />
        </span>
        <span className="ml-3 min-w-0 flex-1">
          {showExam ? (
            <span className="mb-0.5 block truncate text-[11px] font-bold text-violet-600">
              {paper.examName}
            </span>
          ) : null}
          <span className="flex items-center">
            <span className="shrink truncate text-sm font-bold text-slate-900">
              {paperLabel(paper)}
            </span>
            {paper.premium ? (
              <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-700">
                PRO
              </span>
            ) : null}
            {viewed ? (
              <span className="ml-2 inline-flex items-center">
                <AppIcon name="circle-check" size={13} color="#16a34a" />
                <span className="ml-0.5 text-[10px] font-semibold text-green-700">
                  Viewed
                </span>
              </span>
            ) : null}
          </span>
          <span className="mt-0.5 block truncate text-xs text-slate-500">
            {describePaper(paper)}
          </span>
          {paper.answerKeyUrl ? (
            <span className="mt-0.5 block text-[11px] font-semibold text-blue-600">
              Answer key included
            </span>
          ) : null}
        </span>
      </button>
      <button
        type="button"
        onClick={() => onToggleSaved(paper.id)}
        aria-label={
          saved ? `Remove ${paper.title} from saved` : `Save ${paper.title}`
        }
        aria-pressed={saved}
        className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-2.5 hover:bg-slate-100">
        <AppIcon
          name="bookmark"
          size={20}
          color={saved ? '#2563eb' : '#94a3b8'}
          fill={saved ? '#2563eb' : 'none'}
        />
      </button>
    </div>
  );
}
