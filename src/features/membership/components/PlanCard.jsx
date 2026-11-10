import AppIcon from '@/components/common/AppIcon';
import { formatPrice } from '../utils/price';

// One purchasable plan: icon, price, period, an optional "Most popular" / savings pill and the
// struck-through monthly-equivalent price for the yearly plan. It is a radio of the plan
// group on the Membership page.
export default function PlanCard({ plan, selected, onPress }) {
  const savingsPercent = plan.compareAtPrice
    ? Math.round((1 - plan.price / plan.compareAtPrice) * 100)
    : null;
  const pillLabel = plan.popular
    ? 'Most Popular'
    : savingsPercent
      ? `Save ${savingsPercent}%`
      : plan.badge;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onPress}
      className={`flex w-full items-start rounded-2xl border-2 p-4 text-left transition-colors ${
        selected
          ? 'border-blue-600 bg-blue-50'
          : 'border-slate-200 bg-white hover:bg-slate-50'
      }`}>
      <span
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
          selected ? 'bg-blue-600' : 'bg-slate-100'
        }`}>
        <AppIcon
          name="crown"
          size={22}
          color={selected ? '#fde68a' : '#94a3b8'}
        />
      </span>

      <span className="ml-3 min-w-0 flex-1">
        <span className="block text-base font-extrabold text-slate-900">
          {plan.name}
        </span>
        {plan.description ? (
          <span className="mt-0.5 block text-xs text-slate-500">
            {plan.description}
          </span>
        ) : null}
        <span className="mt-1.5 flex items-baseline">
          <span className="text-xl font-extrabold text-slate-900">
            {formatPrice(plan.price, plan.currency)}
          </span>
          <span className="ml-1 text-xs text-slate-500">{`/ ${plan.interval}`}</span>
          {plan.compareAtPrice ? (
            <span className="ml-2 text-xs text-slate-400 line-through">
              {formatPrice(plan.compareAtPrice, plan.currency)}
            </span>
          ) : null}
        </span>
      </span>

      <span className="flex shrink-0 flex-col items-end">
        {pillLabel ? (
          <span
            className={`mb-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${
              plan.popular
                ? 'bg-amber-100 text-amber-700'
                : 'bg-emerald-100 text-emerald-700'
            }`}>
            {pillLabel}
          </span>
        ) : null}
        <span
          aria-hidden="true"
          className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
            selected ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
          }`}>
          {selected ? <AppIcon name="check" size={12} color="#ffffff" /> : null}
        </span>
      </span>
    </button>
  );
}
