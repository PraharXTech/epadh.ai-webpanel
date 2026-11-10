import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { bootstrapSession } from '@/features/auth/store/sessionThunks';
import SplashPage from '@/pages/SplashPage';
import { startNetworkMonitor } from '@/services/network/network';
import { selectBootstrapped } from '@/store/selectors/authSelectors';

const MIN_SPLASH_MS = 900;

// Mobile RootNavigator's boot logic: show the splash (at least 0.9 s) while the session is
// restored, then let the router render. Guards run only after this, so a reload on a deep
// link never flashes the login page.
export default function BootGate({ children }) {
  const dispatch = useDispatch();
  const bootstrapped = useSelector(selectBootstrapped);
  const [splashElapsed, setSplashElapsed] = useState(false);

  useEffect(() => {
    startNetworkMonitor();
    dispatch(bootstrapSession());
    const timer = setTimeout(() => setSplashElapsed(true), MIN_SPLASH_MS);
    return () => clearTimeout(timer);
  }, [dispatch]);

  if (!bootstrapped || !splashElapsed) {
    return <SplashPage />;
  }
  return children;
}
