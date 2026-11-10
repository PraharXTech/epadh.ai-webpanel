import { NavLink } from 'react-router-dom';
import AppIcon from '@/components/common/AppIcon';
import { BOTTOM_TABS } from './sidebarItems';

// The mobile app's 5-tab bar, kept for small screens so the site feels like the app.
export default function BottomBar() {
  return (
    <nav
      aria-label="Tabs"
      className="fixed inset-x-0 bottom-0 z-30 flex border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
      {BOTTOM_TABS.map(tab => (
        <NavLink
          key={tab.id}
          to={tab.path}
          end={tab.end}
          className={({ isActive }) =>
            `flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
              isActive ? 'text-blue-600' : 'text-slate-500'
            }`
          }>
          {({ isActive }) => (
            <>
              <AppIcon
                name={tab.icon}
                size={22}
                color={isActive ? '#2563eb' : '#64748b'}
              />
              {tab.label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
