import { Outlet } from 'react-router-dom';
import OfflineBanner from '@/components/common/OfflineBanner';

// Logged-out pages: login, OTP, Terms, Privacy. W3 replaces the body of the auth pages
// with the shared AuthLayout (split screen on desktop).
export default function PublicLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-sky-50">
      <OfflineBanner />
      <main className="flex flex-1 items-center justify-center p-4">
        <Outlet />
      </main>
    </div>
  );
}
