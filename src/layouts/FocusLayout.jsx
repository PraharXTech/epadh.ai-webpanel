import { Outlet } from 'react-router-dom';
import OfflineBanner from '@/components/common/OfflineBanner';

// Immersive pages (mock / practice session, material viewer): no sidebar, no tabs, so
// nothing pulls the student out of the exam. A fixed-height shell: the page itself scrolls
// inside <main>, or (viewers) manages its own scroll area, which is what lets reading
// progress and "resume where you stopped" work. The page draws its own header.
export default function FocusLayout() {
  return (
    <div className="flex h-dvh flex-col bg-white">
      <OfflineBanner />
      <main className="min-h-0 flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
