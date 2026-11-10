import { useLocation, useNavigate } from 'react-router-dom';
import AppIcon from '@/components/common/AppIcon';
import BrandLogo from '@/components/common/BrandLogo';
import OfflineBanner from '@/components/common/OfflineBanner';
import banner from '@/assets/images/authbanner.png';
import { PATHS } from '@/routes/routePaths';

// Shared shell for Login / OTP. Phones: banner on top, form card below (like the app).
// Desktop (1024 px+): banner fills the left half, the form is centered on the right.
export default function AuthLayout({ children, showBack = false }) {
  const navigate = useNavigate();
  const location = useLocation();

  // A direct visit to /login/otp has no history to go back to: go to the login page.
  const goBack = () =>
    location.key === 'default' ? navigate(PATHS.login) : navigate(-1);

  return (
    <div className="min-h-dvh bg-white lg:grid lg:grid-cols-2">
      <div className="relative h-56 overflow-hidden sm:h-72 lg:h-auto">
        <img
          src={banner}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-top"
        />
        {showBack ? (
          <button
            type="button"
            onClick={goBack}
            aria-label="Go back"
            className="absolute top-4 left-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 hover:bg-white">
            <AppIcon name="arrow-left" color="#0f172a" size={20} />
          </button>
        ) : null}
      </div>

      <div className="flex flex-col">
        <OfflineBanner />
        <main className="relative z-10 -mt-10 flex flex-1 flex-col items-center px-5 pb-8 lg:mt-0 lg:justify-center">
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
