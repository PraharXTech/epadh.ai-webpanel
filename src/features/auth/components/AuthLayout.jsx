import useGoBack from '@/hooks/useGoBack';
import AppIcon from '@/components/common/AppIcon';
import BrandLogo from '@/components/common/BrandLogo';
import OfflineBanner from '@/components/common/OfflineBanner';
import banner from '@/assets/images/authbanner.webp';
import { PATHS } from '@/routes/routePaths';

// Shared shell for Login / OTP.
//   Phones and tablets: the whole banner sits behind the content, and the form starts where
//   the banner's white wave begins (the mobile app does the same: 56% of the banner height).
//   Desktop (1024 px+): the banner fills the left half, the form is centered on the right.
// The banner is 1206 x 1305, so its height is 1.082 x its width; the content starts at 60%
// of the width (= about 56% of the height).
export default function AuthLayout({ children, showBack = false }) {
  // A direct visit to /login/otp has no history to go back to: go to the login page.
  const goBack = useGoBack(PATHS.login);

  return (
    <div
      className="relative min-h-dvh overflow-hidden bg-white lg:grid lg:grid-cols-2 lg:overflow-visible"
      style={{ '--banner-w': 'min(118vw, 640px)' }}>
      <img
        src={banner}
        alt=""
        className="absolute top-0 left-1/2 max-w-none -translate-x-1/2 lg:hidden"
        style={{ width: 'var(--banner-w)' }}
      />
      {/* The banner is the illustration over a white wave (the top ~62% is the picture).
          Scaled to 165% of the panel height and pinned to the top, the picture fills the
          panel and the wave ends at its bottom edge. */}
      <div
        aria-hidden="true"
        className="relative hidden bg-sky-100 bg-no-repeat lg:block"
        style={{
          backgroundImage: `url(${banner})`,
          backgroundSize: 'auto 165%',
          backgroundPosition: '50% 0',
        }}
      />

      {showBack ? (
        <button
          type="button"
          onClick={() => goBack()}
          aria-label="Go back"
          className="absolute top-4 left-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 hover:bg-white">
          <AppIcon name="arrow-left" color="#0f172a" size={20} />
        </button>
      ) : null}

      <div className="relative flex flex-col pt-[calc(var(--banner-w)*0.6)] lg:pt-0">
        <OfflineBanner />
        <main className="flex flex-1 flex-col items-center px-5 pt-4 pb-8 lg:justify-center">
          <div className="w-full max-w-md">
            <div className="mb-6 flex justify-center">
              <BrandLogo size={30} />
            </div>
            <div className="rounded-3xl border border-slate-200/70 bg-slate-100/90 p-5 shadow-sm backdrop-blur">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
