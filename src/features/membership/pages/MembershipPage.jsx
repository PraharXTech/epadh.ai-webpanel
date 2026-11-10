import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import herobanner from '@/assets/images/membershipbanner.webp';
import AppIcon from '@/components/common/AppIcon';
import ScreenHeader from '@/components/common/ScreenHeader';
import Button from '@/components/ui/Button';
import { PATHS } from '@/routes/routePaths';
import {
  selectPendingOrder,
  selectPlans,
  selectPlansStatus,
} from '@/store/selectors/membershipSelectors';
import { selectEntitlements } from '@/store/selectors/userSelectors';
import ComparisonTable from '../components/ComparisonTable';
import PlanCard from '../components/PlanCard';
import { loadPlans, resumePendingOrder } from '../store/membershipSlice';
import {
  FEATURE_LABELS,
  daysUntilExpiry,
  isProActive,
} from '../utils/entitlements';

const CHECKLIST = ['More Practice', 'Better Scores', 'Exam Ready'];

const formatDate = iso =>
  new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

// Plans, a Free-vs-Pro comparison table, the current plan and its expiry, and the way into
// checkout. `?feature=` says what the student tried to open when a paywall sent them here
// (usePaywall), so the reason is explained.
// Web changes: the hero and the plans sit side by side from 1024 px; the plans are a radio
// group; the upgrade button sits under the plans instead of in a fixed bar (the bottom tab bar
// already owns that edge on a phone).
export default function MembershipPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const feature = params.get('feature');
  const entitlements = useSelector(selectEntitlements);
  const plans = useSelector(selectPlans);
  const plansStatus = useSelector(selectPlansStatus);
  const pendingOrder = useSelector(selectPendingOrder);

  const pro = isProActive(entitlements);
  const expiryDays = daysUntilExpiry(entitlements);

  // The "Most Popular" plan is the sensible default pick, until the student chooses.
  const [chosenId, setChosenId] = useState(null);
  const selectedPlan =
    plans.find(p => p.id === chosenId) ??
    plans.find(p => p.popular) ??
    plans[0] ??
    null;

  useEffect(() => {
    dispatch(loadPlans());
  }, [dispatch]);

  // A payment that never resolved before the tab was closed: pick up where it left off
  // rather than leave the student unsure whether they were charged. Checked once, on open.
  useEffect(() => {
    if (pendingOrder) {
      dispatch(resumePendingOrder());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-5xl pb-8">
      <ScreenHeader
        title="Membership"
        right={
          <Link
            to={PATHS.paymentHistory}
            aria-label="Payment history"
            className="rounded-full p-2 hover:bg-slate-100">
            <AppIcon name="calendar" size={22} color="#0f172a" />
          </Link>
        }
      />

      {pendingOrder ? (
        <div
          role="status"
          className="mx-4 mb-3 flex items-center rounded-2xl bg-amber-100 px-4 py-3">
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border-2 border-amber-700 border-t-transparent"
          />
          <p className="ml-3 flex-1 text-xs font-semibold text-amber-900">
            Checking on your last payment…
          </p>
        </div>
      ) : null}

      {feature ? (
        <div
          role="note"
          className="mx-4 mb-3 flex items-center rounded-2xl bg-blue-50 px-4 py-3">
          <AppIcon name="lock" size={18} color="#2563eb" />
          <p className="ml-3 flex-1 text-xs font-semibold text-blue-700">
            {`${FEATURE_LABELS[feature] ?? feature} needs Pro`}
          </p>
        </div>
      ) : null}

      <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-6 lg:px-4">
        <div>
          <section
            aria-label={pro ? 'Your plan' : 'Go Pro'}
            className="relative mx-4 mb-4 min-h-44 overflow-hidden rounded-3xl bg-sky-100 lg:mx-0">
            <img
              src={herobanner}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-right"
            />
            <div className="relative p-4 sm:p-6">
              <div className="w-3/5">
                <h2 className="text-lg leading-6 font-extrabold text-slate-900 sm:text-2xl sm:leading-8">
                  {pro ? (
                    <>
                      You&apos;re on <span className="text-blue-600">Pro</span>
                    </>
                  ) : (
                    <>
                      Unlock Your{' '}
                      <span className="text-blue-600">Full Potential</span>
                    </>
                  )}
                </h2>
                <p className="mt-1 text-xs leading-4 text-slate-600 sm:text-sm sm:leading-5">
                  {pro
                    ? expiryDays !== null
                      ? `Renews or expires on ${formatDate(
                          entitlements.validTill,
                        )} (${expiryDays} day${expiryDays === 1 ? '' : 's'} left)`
                      : 'Every Pro feature is unlocked'
                    : 'Get unlimited access to mock tests, practice sets, study material and more.'}
                </p>
                {!pro ? (
                  <ul className="mt-3">
                    {CHECKLIST.map(item => (
                      <li key={item} className="mb-1.5 flex items-center">
                        <span
                          aria-hidden="true"
                          className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600">
                          <AppIcon name="check" size={10} color="#ffffff" />
                        </span>
                        <span className="ml-1.5 text-[11px] font-semibold text-slate-700 sm:text-xs">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          </section>

          {!pro ? (
            <section aria-label="Plans" className="mx-4 mb-4 lg:mx-0">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-700">
                  Choose a Plan
                </h2>
                <div
                  role="group"
                  aria-label="Billing period"
                  className="flex rounded-full bg-slate-100 p-0.5">
                  {plans.map(plan => {
                    const active = plan.id === selectedPlan?.id;
                    return (
                      <button
                        key={plan.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setChosenId(plan.id)}
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          active ? 'bg-blue-600 text-white' : 'text-slate-500'
                        }`}>
                        {plan.interval === 'year' ? 'Yearly' : 'Monthly'}
                      </button>
                    );
                  })}
                </div>
              </div>
              {plansStatus === 'loading' && plans.length === 0 ? (
                <div
                  role="status"
                  aria-label="Loading plans"
                  className="mx-auto my-6 h-7 w-7 animate-spin rounded-full border-[3px] border-blue-600 border-t-transparent"
                />
              ) : plansStatus === 'failed' && plans.length === 0 ? (
                <div role="alert" className="py-4 text-center">
                  <p className="text-sm text-red-500">
                    Could not load the plans.
                  </p>
                  <Button
                    className="mt-3"
                    size="sm"
                    onClick={() => dispatch(loadPlans())}>
                    Retry
                  </Button>
                </div>
              ) : (
                <div
                  role="radiogroup"
                  aria-label="Plan"
                  className="flex flex-col gap-3">
                  {plans.map(plan => (
                    <PlanCard
                      key={plan.id}
                      plan={plan}
                      selected={plan.id === selectedPlan?.id}
                      onPress={() => setChosenId(plan.id)}
                    />
                  ))}
                </div>
              )}
              <Button
                fullWidth
                size="lg"
                icon="crown"
                className="mt-4"
                disabled={!selectedPlan}
                onClick={() => navigate(PATHS.checkout(selectedPlan.id))}>
                {selectedPlan
                  ? `Upgrade to ${selectedPlan.name}`
                  : 'Upgrade to Pro'}
              </Button>
            </section>
          ) : null}
        </div>

        <div>
          <h2 className="mx-4 mb-2 text-sm font-bold text-slate-700 lg:mx-0">
            Plan Comparison
          </h2>
          <div className="mx-4 lg:mx-0">
            <ComparisonTable />
          </div>

          <Link
            to={PATHS.paymentHistory}
            className="mx-4 mt-4 flex items-center rounded-2xl bg-white px-4 py-3 shadow-sm hover:bg-slate-50 lg:mx-0">
            <AppIcon name="file-text" size={18} color="#475569" />
            <span className="ml-3 flex-1 text-sm font-semibold text-slate-700">
              View Payment History
            </span>
            <AppIcon name="chevron-right" size={16} color="#94a3b8" />
          </Link>
        </div>
      </div>
    </div>
  );
}
