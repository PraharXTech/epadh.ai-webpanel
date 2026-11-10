import { Outlet } from 'react-router-dom';
import OfflineBanner from '@/components/common/OfflineBanner';

// Immersive pages (mock / practice session, material viewer): no sidebar, no tabs, so
// nothing pulls the student out of the exam. The page itself draws its own header.
export default function FocusLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <OfflineBanner />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
