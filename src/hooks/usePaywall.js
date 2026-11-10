import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { hasFeature } from '@/features/membership/utils/entitlements';
import { selectEntitlements } from '@/store/selectors/userSelectors';

// Client-side gating helpers. The server enforces the same rules; this is only UX.
//   canUse(feature)      -> is this feature unlocked for the student?
//   openPaywall(feature) -> take them to Membership, telling it what they tried to open
export default function usePaywall(navigation) {
  const entitlements = useSelector(selectEntitlements);

  const canUse = useCallback(
    feature => hasFeature(entitlements, feature),
    [entitlements],
  );

  const openPaywall = useCallback(
    feature => navigation.navigate('Membership', { feature }),
    [navigation],
  );

  return { canUse, openPaywall };
}
