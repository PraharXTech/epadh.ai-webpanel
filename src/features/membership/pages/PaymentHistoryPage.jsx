import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AppIcon from '@/components/common/AppIcon';
import ScreenHeader from '@/components/common/ScreenHeader';
import ScreenLoader from '@/components/common/ScreenLoader';
import {
  selectPaymentHistory,
  selectPaymentHistoryStatus,
} from '@/store/selectors/membershipSelectors';
import { formatPrice } from '../utils/price';
import { loadPaymentHistory } from '../store/membershipSlice';

const formatDateTime = iso =>
  new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

function Row({ item }) {
  return (
    <li className="flex items-center rounded-2xl bg-white p-4 shadow-sm">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100">
        <AppIcon name="circle-check" size={18} color="#16a34a" />
      </span>
      <div className="ml-3 min-w-0 flex-1">
        <p className="text-sm font-bold text-slate-900">{item.planName}</p>
        <p className="mt-0.5 text-xs text-slate-500">
          {formatDateTime(item.paidAt)}
        </p>
        <p className="mt-0.5 truncate text-[11px] text-slate-400">{item.id}</p>
      </div>
      <p className="ml-3 text-base font-extrabold text-slate-900">
        {formatPrice(item.amount, item.currency)}
      </p>
    </li>
  );
}

// A receipt list. This device's own completed payments show up right away;
// `loadPaymentHistory` brings in anything paid from another device (de-duplicated by id).
export default function PaymentHistoryPage() {
  const dispatch = useDispatch();
  const history = useSelector(selectPaymentHistory);
  const status = useSelector(selectPaymentHistoryStatus);

  useEffect(() => {
    dispatch(loadPaymentHistory());
  }, [dispatch]);

  return (
    <div className="mx-auto max-w-3xl pb-8">
      <ScreenHeader title="Payment history" />
      {history.length === 0 ? (
        status === 'loading' ? (
          <ScreenLoader />
        ) : (
          <div className="flex flex-col items-center px-8 pt-16 text-center">
            <AppIcon name="credit-card" size={28} color="#94a3b8" />
            <p className="mt-3 text-sm text-slate-500">
              {status === 'failed'
                ? 'Could not load your payments. Pull up this page again in a moment.'
                : 'No payments yet. Once you go Pro, receipts show up here.'}
            </p>
          </div>
        )
      ) : (
        <ul className="flex flex-col gap-3 px-4">
          {history.map(item => (
            <Row key={item.id} item={item} />
          ))}
        </ul>
      )}
    </div>
  );
}
