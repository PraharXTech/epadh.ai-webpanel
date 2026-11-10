import BrandLogo from '@/components/common/BrandLogo';
import { BRAND } from '@/config/brand';

// Shown by BootGate while the session is being restored (mobile: SplashScreen).
export default function SplashPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-sky-50">
      <BrandLogo size={52} />
      <p className="mt-3 text-sm text-slate-500">{BRAND.tagline}</p>
      <div
        role="status"
        aria-label="Loading"
        className="mt-10 h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"
      />
    </div>
  );
}
