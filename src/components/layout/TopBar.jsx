import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import AppIcon from '@/components/common/AppIcon';
import BrandLogo from '@/components/common/BrandLogo';
import { PATHS } from '@/routes/routePaths';
import { selectProfile } from '@/store/selectors/userSelectors';

export default function TopBar({ onMenu }) {
  const profile = useSelector(selectProfile);
  const initial = (profile?.name ?? '?').trim().charAt(0).toUpperCase() || '?';

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4">
      <button
        type="button"
        onClick={onMenu}
        aria-label="Open menu"
        className="rounded-lg p-2 hover:bg-slate-100 lg:hidden">
        <AppIcon name="menu" size={22} />
      </button>
      <div className="lg:hidden">
        <BrandLogo size={26} />
      </div>
      <div className="flex-1" />
      <Link
        to={PATHS.notifications}
        aria-label="Notifications"
        className="rounded-lg p-2 hover:bg-slate-100">
        <AppIcon name="bell" size={20} />
      </Link>
      <Link
        to={PATHS.profile}
        aria-label="Profile"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
        {initial}
      </Link>
    </header>
  );
}
