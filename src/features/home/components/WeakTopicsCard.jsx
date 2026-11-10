import { Link } from 'react-router-dom';
import AppIcon from '@/components/common/AppIcon';
import SectionHeader from '@/components/common/SectionHeader';
import FeatureGate from '@/components/gating/FeatureGate';
import { PATHS } from '@/routes/routePaths';

function Teaser({ onUpgrade }) {
  return (
    <button
      type="button"
      onClick={onUpgrade}
      className="flex w-full items-center rounded-2xl bg-red-50 p-4 text-left transition-colors hover:bg-red-100">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100">
        <AppIcon name="target" size={20} color="#dc2626" />
      </span>
      <span className="ml-3 min-w-0 flex-1">
        <span className="block text-sm font-bold text-slate-900">
          Find the topics that cost you marks
        </span>
        <span className="mt-0.5 block text-xs text-slate-500">
          Get AI-powered weak topic analysis with Pro.
        </span>
      </span>
      <span className="ml-2 flex items-center rounded-full bg-amber-500 px-3.5 py-2">
        <AppIcon name="lock" size={12} color="#ffffff" />
        <span className="ml-1 text-xs font-semibold text-white">
          Unlock with Pro
        </span>
      </span>
    </button>
  );
}

// Weak Topics (Pro): a locked teaser for Free students. The topics are worked out on the
// device (analytics/utils/performance.js) until the server sends its own list.
export default function WeakTopicsCard({ topics = [], onUpgrade }) {
  return (
    <section aria-label="Weak topics">
      <SectionHeader
        title="Weak Topics"
        actionLabel={topics.length ? 'View all' : undefined}
        actionTo={PATHS.weakTopics}
      />
      <FeatureGate
        feature="weakTopics"
        fallback={<Teaser onUpgrade={onUpgrade} />}>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          {topics.length === 0 ? (
            <p className="text-sm text-slate-600">
              Take a few practice tests and your weak topics will show up here.
            </p>
          ) : (
            <ul>
              {topics.map(t => (
                <li key={t.id}>
                  <Link
                    to={PATHS.topic(t.id)}
                    className="flex items-center rounded-lg py-2 hover:bg-slate-50">
                    <span className="flex-1 truncate text-sm font-semibold text-slate-900">
                      {t.name}
                    </span>
                    <span className="text-xs font-bold text-red-600">
                      {`${t.accuracy}%`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </FeatureGate>
    </section>
  );
}
