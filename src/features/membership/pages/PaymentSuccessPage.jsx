import { useDispatch, useSelector } from 'react-redux';
import { Navigate, useNavigate } from 'react-router-dom';
import AppIcon from '@/components/common/AppIcon';
import Button from '@/components/ui/Button';
import { PATHS } from '@/routes/routePaths';
import { showAlert } from '@/services/alerts/alertStore';
import {
  selectCheckout,
  selectPlans,
} from '@/store/selectors/membershipSelectors';
import { formatPrice } from '../utils/price';
import SuccessConfetti from '../components/SuccessConfetti';
import { clearCheckout } from '../store/membershipSlice';

const formatDateTime = iso =>
  new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

// A generic "what you get" summary, not the live entitlements matrix: the exact gating is in
// ComparisonTable; this is the four highlights worth celebrating.
const INCLUDED = [
  {
    icon: 'file-text',
    label: 'Full Syllabus',
    bg: 'bg-blue-100',
    color: '#2563eb',
  },
  {
    icon: 'chart-column',
    label: 'Unlimited Mocks',
    bg: 'bg-orange-100',
    color: '#ea580c',
  },
  { icon: 'bot', label: 'AI Tutor', bg: 'bg-violet-100', color: '#7c3aed' },
  {
    icon: 'download',
    label: 'Downloads',
    bg: 'bg-emerald-100',
    color: '#16a34a',
  },
];

// The last stop of the payment flow. Entitlements are already unlocked by the time this shows
// (userSlice applies them the moment verification succeeds). The receipt lives in the
// transient checkout state, so a reload goes to Membership, where the plan and the receipt (in
// Payment History) are.
export default function PaymentSuccessPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { receipt } = useSelector(selectCheckout);
  const plan = useSelector(selectPlans).find(p => p.id === receipt?.planId);

  const done = () => {
    // Navigate first: with the receipt cleared this page would send itself to Membership.
    navigate(PATHS.home, { replace: true });
    dispatch(clearCheckout());
  };

  const downloadInvoice = () => {
    // No PDF generation yet: the receipt itself already lives in Payment History.
    showAlert(
      'Invoice on its way',
      "We'll email your invoice shortly. You can also find every receipt any time in Payment History.",
      null,
      { tone: 'success', icon: 'file-text' },
    );
  };

  if (!receipt) {
    return <Navigate to={PATHS.membership} replace />;
  }

  return (
    <div className="mx-auto max-w-xl px-5 pb-10">
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={done}
          aria-label="Close"
          className="rounded-full p-2 hover:bg-slate-100">
          <AppIcon name="close" size={22} color="#64748b" />
        </button>
      </div>

      <div className="flex flex-col items-center">
        <div className="relative flex h-36 w-36 items-center justify-center">
          <SuccessConfetti />
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500">
              <AppIcon name="check" size={30} color="#ffffff" />
            </span>
          </span>
        </div>
        <h1 className="mt-2 text-center text-2xl font-extrabold text-slate-900">
          Payment Successful!
        </h1>
        <p className="mt-2 text-center text-sm leading-5 text-slate-500">
          Welcome to Pro! You now have full access to all premium features.
        </p>
      </div>

      <section
        aria-label="Plan"
        className="mt-6 flex items-center rounded-2xl bg-slate-50 p-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600">
          <AppIcon name="crown" size={22} color="#fde68a" />
        </span>
        <div className="ml-3 min-w-0 flex-1">
          <div className="flex items-center">
            <p className="text-sm font-extrabold text-slate-900">
              {receipt.planName}
            </p>
            <span className="ml-2 flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              <span
                aria-hidden="true"
                className="mr-1 h-1.5 w-1.5 rounded-full bg-emerald-600"
              />
              Active
            </span>
          </div>
          {plan?.description ? (
            <p className="mt-0.5 text-xs text-slate-500">{plan.description}</p>
          ) : null}
        </div>
        <div className="text-right">
          <p className="text-base font-extrabold text-slate-900">
            {formatPrice(receipt.amount, receipt.currency)}
          </p>
          {plan ? (
            <p className="text-[11px] text-slate-500">{`per ${plan.interval}`}</p>
          ) : null}
        </div>
      </section>

      <h2 className="mt-6 mb-3 text-sm font-bold text-slate-800">
        What&apos;s Included?
      </h2>
      <ul className="grid grid-cols-4 gap-2">
        {INCLUDED.map(item => (
          <li
            key={item.label}
            className="flex flex-col items-center rounded-2xl bg-slate-50 px-1 py-3">
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-full ${item.bg}`}>
              <AppIcon name={item.icon} size={16} color={item.color} />
            </span>
            <span className="mt-1.5 text-center text-[10px] leading-3 font-semibold text-slate-700">
              {item.label}
            </span>
          </li>
        ))}
      </ul>

      <section
        aria-label="Transaction details"
        className="mt-3 overflow-hidden rounded-2xl border border-slate-100">
        <h2 className="bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-800">
          Transaction Details
        </h2>
        <dl>
          {[
            ['Plan', receipt.planName],
            ['Amount Paid', formatPrice(receipt.amount, receipt.currency)],
            ['Payment Method', receipt.method ?? 'UPI'],
            ['Transaction ID', `#${receipt.transactionId ?? receipt.id}`],
            ['Date & Time', formatDateTime(receipt.paidAt)],
          ].map(([label, value], i, all) => (
            <div
              key={label}
              className={`flex items-center justify-between px-4 py-3 ${
                i < all.length - 1 ? 'border-b border-slate-50' : ''
              }`}>
              <dt className="text-xs text-slate-500">{label}</dt>
              <dd className="ml-3 text-right text-xs font-semibold break-all text-slate-800">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="mt-6 flex flex-col gap-2.5">
        <Button fullWidth size="lg" onClick={done}>
          Continue to App
          <AppIcon name="arrow-right" size={16} color="#ffffff" />
        </Button>
        <Button
          fullWidth
          variant="outline"
          icon="file-text"
          onClick={downloadInvoice}>
          Download Invoice
        </Button>
      </div>
    </div>
  );
}
