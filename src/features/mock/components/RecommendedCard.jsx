import AppIcon from '@/components/common/AppIcon';
import MetaRow from './MetaRow';

const LOOKS = {
  popular: {
    card: 'bg-blue-50 border-blue-100',
    badge: 'bg-orange-100 text-orange-700',
    badgeIcon: 'flame',
    badgeColor: '#ea580c',
    label: 'Most Popular',
    button: 'bg-blue-600 hover:bg-blue-700',
    art: '#bfdbfe',
  },
  latest: {
    card: 'bg-orange-50 border-orange-100',
    badge: 'bg-amber-100 text-amber-700',
    badgeIcon: 'star',
    badgeColor: '#d97706',
    label: 'Latest',
    button: 'bg-orange-500 hover:bg-orange-600',
    art: '#fed7aa',
  },
};

// A highlighted test with a "Start Test" button. `kind` picks the look (popular / latest).
export default function RecommendedCard({ kind, examName, test, onStart }) {
  const look = LOOKS[kind];
  const title = examName ? `${examName} ${test.name}` : test.name;
  return (
    <article
      aria-label={`${look.label}: ${title}`}
      className={`w-[240px] shrink-0 rounded-2xl border p-2.5 ${look.card}`}>
      <div className="flex justify-between">
        <div className="min-w-0 flex-1">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${look.badge}`}>
            <AppIcon name={look.badgeIcon} size={12} color={look.badgeColor} />
            <span className="ml-1">{look.label}</span>
          </span>
          <h3 className="mt-1.5 line-clamp-2 text-sm font-extrabold text-slate-900">
            {title}
          </h3>
        </div>
        <span
          aria-hidden="true"
          style={{ backgroundColor: look.art }}
          className="ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
          <AppIcon name="clipboard-list" size={18} color="#1e3a8a" />
        </span>
      </div>
      <div className="mt-2 rounded-lg bg-white px-2 py-1.5">
        <MetaRow test={test} small />
      </div>
      <button
        type="button"
        onClick={() => onStart(test)}
        aria-label={`Start ${title}`}
        className={`mt-2 flex h-9 w-full items-center justify-center rounded-xl text-sm font-bold text-white ${look.button}`}>
        Start Test
        <AppIcon name="arrow-right" size={16} color="#ffffff" />
      </button>
    </article>
  );
}
