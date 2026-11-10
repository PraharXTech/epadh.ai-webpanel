import { Link } from 'react-router-dom';
import AppIcon from '@/components/common/AppIcon';

// The tiles under the banner. `toFor(action)` gives each tile's address.
export default function QuickActions({ actions, toFor }) {
  return (
    <nav aria-label="Quick actions">
      <ul className="grid grid-cols-4 gap-2">
        {actions.map(a => (
          <li key={a.id}>
            <Link
              to={toFor(a)}
              className={`flex h-24 flex-col items-center justify-center rounded-2xl px-1 transition-opacity hover:opacity-80 ${a.bg}`}>
              <span className="mb-2">
                <AppIcon name={a.icon} color={a.color} size={26} />
              </span>
              <span className="text-center text-[11px] font-semibold text-slate-800">
                {a.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
