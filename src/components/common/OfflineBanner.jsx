import AppIcon from '@/components/common/AppIcon';
import { useT } from '@/localization';
import { useNetwork } from '@/services/network/network';

// Strip shown while the browser has no internet. Saved content keeps working; it says
// which features need the connection (AI, payments, scans).
export default function OfflineBanner() {
  const t = useT();
  const { isOnline } = useNetwork();

  if (isOnline) {
    return null;
  }
  return (
    <div role="alert" className="flex items-center bg-slate-800 px-4 py-2">
      <AppIcon name="wifi-off" size={16} color="#fbbf24" />
      <div className="ml-3 flex-1">
        <p className="text-xs font-bold text-white">{t('offline.title')}</p>
        <p className="text-[11px] text-slate-300">{t('offline.message')}</p>
      </div>
    </div>
  );
}
