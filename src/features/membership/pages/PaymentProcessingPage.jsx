import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Navigate,
  useBlocker,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import AppIcon from '@/components/common/AppIcon';
import { PATHS } from '@/routes/routePaths';
import { showAlert } from '@/services/alerts/alertStore';
import {
  selectCheckout,
  selectPendingOrder,
  selectPlans,
} from '@/store/selectors/membershipSelectors';
import { formatPrice } from '../utils/price';
import {
  clearCheckout,
  resumePendingOrder,
  verifyCheckout,
} from '../store/membershipSlice';

const MESSAGES = {
  verifying: 'Confirming your payment with the bank…',
  polling: 'This is taking a little longer than usual. Hang tight…',
};

// Shown the moment a payment is submitted (the payment window closed after paying, or the mock
// checkout handed over) while the server confirms it. Owns the verification and routes the
// student on: success, or back to a fresh checkout to retry. The student cannot leave
// mid-confirmation (the router is blocked and closing the tab asks first), so they never
// lose track of a real charge.
//
// Where its data comes from:
//   - router state `{ planId, orderId, outcome, paymentId?, signature? }` from the checkout page;
//   - after a reload that state is gone, but a payment that never resolved is still saved as
//     the pending order: it is checked again here (`resumePendingOrder`), same as Membership does.
//   - no pending order: nothing to confirm (already settled, or a stale address), back to
//     Membership. (Router state outlives a reload, so a settled payment must not be verified twice.)
export default function PaymentProcessingPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { state } = useLocation();
  const checkout = useSelector(selectCheckout);
  const pendingOrder = useSelector(selectPendingOrder);
  const plans = useSelector(selectPlans);

  const planId = state?.planId ?? pendingOrder?.planId;
  const plan = plans.find(p => p.id === planId);
  const resuming = !state?.orderId && Boolean(pendingOrder);
  const started = useRef(false);
  const settled = useRef(false);

  const retry = () => {
    dispatch(clearCheckout());
    navigate(PATHS.checkout(planId), { replace: true });
  };

  const showFailure = (code, message) => {
    if (code === 'pending') {
      showAlert(
        'Still processing',
        "We couldn't confirm it in time. We'll keep checking. You can come back to Membership any time to see the result.",
        null,
        { tone: 'warning', icon: 'clock' },
      );
      navigate(PATHS.membership, { replace: true });
      return;
    }
    showAlert(
      code === 'cancelled' ? 'Payment cancelled' : 'Payment failed',
      message ?? 'Nothing was charged. You can try again.',
      [
        { text: 'Try again', onPress: retry },
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            dispatch(clearCheckout());
            navigate(PATHS.membership, { replace: true });
          },
        },
      ],
      {
        tone: 'danger',
        icon: code === 'cancelled' ? 'circle-x' : 'circle-alert',
      },
    );
  };

  // Start the confirmation once (a ref guards the double run of React's strict mode).
  useEffect(() => {
    if (started.current || !pendingOrder) {
      return;
    }
    started.current = true;
    const run = resuming
      ? dispatch(resumePendingOrder())
      : dispatch(
          verifyCheckout({
            orderId: state.orderId,
            planId: state.planId,
            outcome: state.outcome,
            paymentId: state.paymentId,
            signature: state.signature,
          }),
        );
    run.then(action => {
      settled.current = true;
      if (action.type.endsWith('/fulfilled')) {
        navigate(PATHS.paymentSuccess, { replace: true });
        return;
      }
      showFailure(
        action.payload?.code ?? 'failed',
        action.payload?.message ?? action.error?.message,
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Not leavable while confirming: a link or the back button is held, with a word why.
  const blocker = useBlocker(() => started.current && !settled.current);
  useEffect(() => {
    if (blocker.state === 'blocked') {
      blocker.reset();
      showAlert(
        'Please wait',
        'We are confirming your payment. This only takes a moment.',
        null,
        { icon: 'clock' },
      );
    }
  }, [blocker]);
  useEffect(() => {
    const warn = event => {
      if (started.current && !settled.current) {
        event.preventDefault();
      }
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);

  if (!pendingOrder && !started.current) {
    return <Navigate to={PATHS.membership} replace />;
  }

  return (
    <div className="mx-auto flex min-h-[70dvh] max-w-md flex-col items-center justify-center px-8">
      <span className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-50">
        <span
          role="status"
          aria-label="Confirming payment"
          className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"
        />
      </span>
      <h1 className="mt-6 text-center text-xl font-extrabold text-slate-900">
        Processing Payment
      </h1>
      <p aria-live="polite" className="mt-2 text-center text-sm text-slate-500">
        {MESSAGES[checkout.status] ?? MESSAGES.verifying}
      </p>

      {plan ? (
        <div className="mt-8 flex w-full items-center rounded-2xl bg-slate-50 p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
            <AppIcon name="crown" size={18} color="#fde68a" />
          </span>
          <div className="ml-3 flex-1">
            <p className="text-sm font-bold text-slate-900">{plan.name}</p>
            <p className="text-xs text-slate-500">{`billed / ${plan.interval}`}</p>
          </div>
          <p className="text-base font-extrabold text-slate-900">
            {formatPrice(plan.price, plan.currency)}
          </p>
        </div>
      ) : null}

      <p className="mt-6 flex items-center rounded-xl bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
        <AppIcon name="info" size={14} color="#b45309" />
        <span className="ml-2 flex-1">
          Please don&apos;t go back or close this tab while we confirm this.
        </span>
      </p>
    </div>
  );
}
