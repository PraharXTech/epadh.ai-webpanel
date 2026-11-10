import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import AppIcon from '@/components/common/AppIcon';
import ScreenHeader from '@/components/common/ScreenHeader';
import Button from '@/components/ui/Button';
import { USE_MOCK_API } from '@/config/env';
import { PATHS } from '@/routes/routePaths';
import { ensureOnline } from '@/services/network/ensureOnline';
import { openRazorpayCheckout } from '@/services/payments/razorpay';
import {
  selectCheckout,
  selectPlans,
} from '@/store/selectors/membershipSelectors';
import {
  selectEntitlements,
  selectProfile,
} from '@/store/selectors/userSelectors';
import { formatPrice } from '../utils/price';
import { loadPlans, startCheckout } from '../store/membershipSlice';
import { isProActive } from '../utils/entitlements';

// Creates the order and opens the payment window.
//   - With the mock API (no backend yet) there is no real window: as soon as the order is
//     ready this hands over to the processing page as if the window had just closed after a
//     successful payment, and nothing is charged.
//   - With the real API it loads Razorpay Checkout.js (only now), opens it with the student's
//     details filled in, and hands the payment id and signature to the processing page, which
//     asks the server to verify them. Closing the window counts as "cancelled".
// Web change: the page is a step of the browser history, so it hands over with `replace` and
// the processing page reads its data from router state (or, after a reload, from the saved
// pending order).
export default function CheckoutPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { planId } = useParams();
  const plans = useSelector(selectPlans);
  const plan = plans.find(p => p.id === planId);
  const profile = useSelector(selectProfile);
  const checkout = useSelector(selectCheckout);
  const entitlements = useSelector(selectEntitlements);
  const pro = isProActive(entitlements);

  const [order, setOrder] = useState(null); // what the server created, for (re)opening the window
  const [windowError, setWindowError] = useState(null);
  const started = useRef(false);
  const mounted = useRef(false);
  const handedOff = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!plans.length) {
      dispatch(loadPlans());
    }
  }, [dispatch, plans.length]);

  const openWindow = useCallback(
    async created => {
      setWindowError(null);
      try {
        await openRazorpayCheckout({
          order: created,
          planName: plan?.name ?? 'epadh.ai Pro',
          prefill: {
            name: profile?.name,
            contact: profile?.mobile ? `+91${profile.mobile}` : '',
            email: profile?.email,
          },
          onSuccess: ({ paymentId, signature }) => {
            if (handedOff.current) {
              return;
            }
            handedOff.current = true;
            navigate(PATHS.paymentProcessing, {
              replace: true,
              state: {
                planId,
                orderId: created.orderId,
                outcome: 'success',
                paymentId,
                signature,
              },
            });
          },
          onDismiss: () => {
            if (handedOff.current) {
              return;
            }
            handedOff.current = true;
            navigate(PATHS.paymentProcessing, {
              replace: true,
              state: {
                planId,
                orderId: created.orderId,
                outcome: 'cancelled',
              },
            });
          },
          // The window stays open after a refused payment so the student can try another
          // method: just say what happened.
          onFailure: message => toast.error(message),
        });
      } catch (error) {
        setWindowError(error.message);
      }
    },
    [navigate, plan, planId, profile],
  );

  // Create the order once. (A ref, not the effect's cleanup, guards against the double run of
  // React's strict mode.)
  useEffect(() => {
    if (started.current || pro) {
      return;
    }
    if (!ensureOnline('payment')) {
      navigate(PATHS.membership, { replace: true });
      return;
    }
    started.current = true;
    dispatch(startCheckout(planId)).then(action => {
      if (!mounted.current || !startCheckout.fulfilled.match(action)) {
        return; // left the page meanwhile (the saved pending order is picked up later)
      }
      setOrder(action.payload);
      if (USE_MOCK_API) {
        handedOff.current = true;
        navigate(PATHS.paymentProcessing, {
          replace: true,
          state: {
            planId,
            orderId: action.payload.orderId,
            outcome: 'success',
          },
        });
      } else {
        openWindow(action.payload);
      }
    });
  }, [dispatch, navigate, openWindow, planId, pro]);

  // Already Pro (a second tab, or a payment that just went through): nothing to buy.
  if (pro) {
    return <Navigate to={PATHS.membership} replace />;
  }

  const failed = checkout.status === 'failed' && !order;

  return (
    <div className="mx-auto max-w-xl pb-8">
      <ScreenHeader title="Checkout" />

      <div className="px-4">
        <section
          aria-label="Plan"
          className="flex flex-col items-center rounded-2xl bg-white p-5 shadow-sm">
          <AppIcon name="crown" size={24} color="#d97706" />
          {plan ? (
            <>
              <p className="mt-2 text-base font-bold text-slate-900">
                {plan.name}
              </p>
              <p className="mt-1 text-3xl font-extrabold text-slate-900">
                {formatPrice(plan.price, plan.currency)}
              </p>
              <p className="text-xs text-slate-500">{`billed / ${plan.interval}`}</p>
            </>
          ) : (
            <span
              role="status"
              aria-label="Loading plan"
              className="mt-2 h-6 w-6 animate-spin rounded-full border-[3px] border-blue-600 border-t-transparent"
            />
          )}
        </section>

        <section
          aria-label="Billed to"
          className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">
            Billed to
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-800">
            {profile?.name ?? 'Student'}
          </p>
          {profile?.mobile ? (
            <p className="text-sm text-slate-600">+91 {profile.mobile}</p>
          ) : null}
        </section>

        <p className="mt-4 flex items-center rounded-xl bg-green-50 px-3 py-2 text-[11px] text-green-700">
          <AppIcon name="shield-check" size={16} color="#16a34a" />
          <span className="ml-2 flex-1">
            Payments are processed securely by Razorpay. epadh.ai never sees
            your card or bank details.
          </span>
        </p>

        {failed || windowError ? (
          <div role="alert" className="mt-5 text-center">
            <p className="text-sm text-red-600">
              {windowError ?? checkout.error}
            </p>
            <div className="mt-3 flex justify-center gap-2">
              {order ? (
                <Button size="sm" onClick={() => openWindow(order)}>
                  Try again
                </Button>
              ) : null}
              <Link
                to={PATHS.membership}
                replace
                className="inline-flex min-h-9 items-center rounded-full border border-slate-300 px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                Back to plans
              </Link>
            </div>
          </div>
        ) : (
          <div role="status" className="mt-6 flex flex-col items-center py-4">
            <span
              aria-hidden="true"
              className="h-6 w-6 animate-spin rounded-full border-[3px] border-blue-600 border-t-transparent"
            />
            <p className="mt-3 text-xs text-slate-500">
              {order && !USE_MOCK_API
                ? 'Complete the payment in the payment window.'
                : 'Setting up your payment…'}
            </p>
            {order && !USE_MOCK_API ? (
              <Button
                className="mt-3"
                size="sm"
                variant="outline"
                onClick={() => openWindow(order)}>
                Open the payment window again
              </Button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
