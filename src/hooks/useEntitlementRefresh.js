import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { USE_MOCK_API } from '@/config/env';
import { fetchMe } from '@/features/user/store/userSlice';
import { subscribePageVisibility } from '@/services/page/visibility';
import { selectCheckout } from '@/store/selectors/membershipSelectors';

const MIN_GAP_MS = 60 * 1000; // at most once a minute

// Re-reads the student's plan from the server when they come back to the tab. A payment made
// on another device, a Pro plan that expired, or one an admin granted shows up without a
// reload. (Open item on mobile; the web has Page Visibility for it.)
//
// Skipped while a payment is being confirmed (that flow applies the entitlements itself) and
// with the mock API, whose `GET /me` stand-in always answers "Free" and would undo a mock
// purchase. Mount once in the logged-in area.
export default function useEntitlementRefresh() {
  const dispatch = useDispatch();
  const status = useSelector(selectCheckout).status;
  const busy = ['creating', 'awaiting_action', 'verifying', 'polling'].includes(
    status,
  );
  const latest = useRef({ busy });
  useEffect(() => {
    latest.current = { busy };
  });

  useEffect(() => {
    if (USE_MOCK_API) {
      return undefined;
    }
    let last = Date.now();
    return subscribePageVisibility(visible => {
      if (!visible || latest.current.busy || Date.now() - last < MIN_GAP_MS) {
        return;
      }
      last = Date.now();
      dispatch(fetchMe());
    });
  }, [dispatch]);
}
