import { NavLink } from 'react-router-dom';
import AppIcon from '@/components/common/AppIcon';
import BrandLogo from '@/components/common/BrandLogo';
import { SIDEBAR_SECTIONS } from './sidebarItems';

// Navigation list: a fixed column on desktop, the contents of the drawer on small
// screens. `onNavigate` lets the drawer close itself after a link is followed.
export default function Sidebar({ onNavigate }) {
  return (
    <nav aria-label="Main" className="flex h-full flex-col overflow-y-auto bg-white p-4">
      <div className="mb-6 px-2">
        <BrandLogo size={32} />
      </div>
      {SIDEBAR_SECTIONS.map(section => (
        <div key={section.id} className="mb-4">
          {section.title ? (
            <p className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {section.title}
            </p>
          ) : null}
          <ul>
            {section.items.map(item => (
              <li key={item.id}>
                <NavLink
                  to={item.path}
                  end={item.end}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-2 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`
                  }
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${item.bg}`}
                  >
                    <AppIcon name={item.icon} size={18} color={item.color} />
                  </span>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
