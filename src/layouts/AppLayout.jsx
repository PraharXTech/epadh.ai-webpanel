import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Outlet } from 'react-router-dom';
import OfflineBanner from '@/components/common/OfflineBanner';
import BottomBar from '@/components/layout/BottomBar';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import { fetchNotifications } from '@/features/notifications/store/notificationsSlice';
import useReconnectSync from '@/hooks/useReconnectSync';

// Logged-in shell. >= 1024 px: permanent sidebar. Below: hamburger drawer + bottom tabs.
// (Replaces the mobile AppStack chrome: SidebarProvider + AppBottomBar + OfflineBanner.)
export default function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const dispatch = useDispatch();

  // Send what was queued offline (study sessions, a mock's rank) when the connection returns.
  useReconnectSync();

  // So the bell shows what is waiting without opening the list first.
  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  return (
    <div className="flex min-h-dvh bg-slate-50">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-r border-slate-200 lg:block">
        <Sidebar />
      </aside>

      {drawerOpen ? (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-xl">
            <Sidebar onNavigate={() => setDrawerOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onMenu={() => setDrawerOpen(true)} />
        <OfflineBanner />
        <main className="flex-1 pb-20 lg:pb-0">
          <Outlet />
        </main>
      </div>
      <BottomBar />
    </div>
  );
}
