import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { hasFeature } from '@/features/membership/utils/entitlements';
import { PATHS } from '@/routes/routePaths';
import { selectEntitlements } from '@/store/selectors/userSelectors';

// Client-side gating helpers. The server enforces the same rules; this is only UX.
//   canUse(feature)      -> is this feature unlocked for the student?
//   openPaywall(feature) -> take them to Membership, telling it what they tried to open
//                           (Membership reads it from `?feature=`)
// Web change from mobile: no `navigation` argument, the hook gets the router itself.
export default function usePaywall() {
  const entitlements = useSelector(selectEntitlements);
  const navigate = useNavigate();

  const canUse = useCallback(
    feature => hasFeature(entitlements, feature),
    [entitlements],
  );

  const openPaywall = useCallback(
    feature =>
      navigate(`${PATHS.membership}?feature=${encodeURIComponent(feature)}`),
    [navigate],
  );

  return { canUse, openPaywall };
}
