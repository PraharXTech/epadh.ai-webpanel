import { useSelector } from 'react-redux';
import { hasFeature } from '@/features/membership/utils/entitlements';
import { selectEntitlements } from '@/store/selectors/userSelectors';

// Renders `children` when the student's plan includes `feature`, else `fallback`
// (a lock badge, a blurred teaser, an upgrade prompt...).
export default function FeatureGate({ feature, fallback = null, children }) {
  const entitlements = useSelector(selectEntitlements);
  return hasFeature(entitlements, feature) ? children : fallback;
}
