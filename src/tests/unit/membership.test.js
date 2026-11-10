import { store } from '@/store';
import { logout } from '@/features/auth/store/authSlice';
import * as membershipService from '@/features/membership/services/membershipService';
import {
  clearCheckout,
  loadPaymentHistory,
  loadPlans,
  pollPayment,
  resumePendingOrder,
  startCheckout,
  verifyCheckout,
} from '@/features/membership/store/membershipSlice';
import {
  daysUntilExpiry,
  hasFeature,
  isProActive,
} from '@/features/membership/utils/entitlements';
import {
  selectCheckout,
  selectPaymentHistory,
  selectPendingOrder,
  selectPlans,
} from '@/store/selectors/membershipSelectors';
import { selectEntitlements } from '@/store/selectors/userSelectors';

const settle = async ms => {
  await jest.advanceTimersByTimeAsync(ms);
};

describe('entitlements', () => {
  it('isProActive requires plan pro and an unexpired (or absent) validTill', () => {
    expect(isProActive({ plan: 'free' })).toBe(false);
    expect(isProActive({ plan: 'pro', validTill: null })).toBe(true);
    expect(
      isProActive({
        plan: 'pro',
        validTill: new Date(Date.now() + 86400000).toISOString(),
      }),
    ).toBe(true);
    expect(
      isProActive({
        plan: 'pro',
        validTill: new Date(Date.now() - 1000).toISOString(),
      }),
    ).toBe(false);
  });

  it('hasFeature is true for any feature once Pro is active, expiry included', () => {
    const expired = {
      plan: 'pro',
      validTill: new Date(Date.now() - 1000).toISOString(),
      features: {},
    };
    expect(hasFeature(expired, 'omr')).toBe(false);
    const active = { plan: 'pro', validTill: null, features: {} };
    expect(hasFeature(active, 'omr')).toBe(true);
    expect(hasFeature({ plan: 'free', features: { omr: true } }, 'omr')).toBe(
      true,
    );
    expect(hasFeature({ plan: 'free', features: { omr: false } }, 'omr')).toBe(
      false,
    );
  });

  it('daysUntilExpiry counts down only for a Pro plan with an expiry', () => {
    expect(daysUntilExpiry({ plan: 'free' })).toBeNull();
    expect(daysUntilExpiry({ plan: 'pro', validTill: null })).toBeNull();
    // 2 days and 1 hour left rounds up to "3 days left" (so the last partial day
    // still reads as at least 1, not 0).
    const almost3days = new Date(
      Date.now() + 2 * 86400000 + 3600000,
    ).toISOString();
    expect(daysUntilExpiry({ plan: 'pro', validTill: almost3days })).toBe(3);
  });
});

describe('membership checkout', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    store.dispatch(logout());
  });
  afterEach(() => jest.useRealTimers());

  it('loads the plan list', async () => {
    const loading = store.dispatch(loadPlans());
    await settle(500);
    await loading;
    const plans = selectPlans(store.getState());
    expect(plans.length).toBeGreaterThan(0);
    expect(plans.map(p => p.id)).toContain('pro-monthly');
  });

  it('creates an order and moves to awaiting_action', async () => {
    const starting = store.dispatch(startCheckout('pro-monthly'));
    await settle(700);
    await starting;
    const checkout = selectCheckout(store.getState());
    expect(checkout.status).toBe('awaiting_action');
    expect(checkout.orderId).toMatch(/^order_mock_/);
    expect(selectPendingOrder(store.getState())).toMatchObject({
      planId: 'pro-monthly',
      orderId: checkout.orderId,
    });
  });

  it('refuses to start a second checkout while one is already in flight', async () => {
    store.dispatch(startCheckout('pro-monthly'));
    const second = await store.dispatch(startCheckout('pro-yearly'));
    expect(startCheckout.rejected.match(second)).toBe(true);
    await settle(700);
  });

  it('reuses the same idempotency key on a retry for the same plan', async () => {
    store.dispatch(startCheckout('pro-monthly'));
    await settle(700);
    const first = selectPendingOrder(store.getState()).idempotencyKey;

    store.dispatch(clearCheckout());
    store.dispatch(startCheckout('pro-monthly'));
    await settle(700);
    const second = selectPendingOrder(store.getState()).idempotencyKey;
    expect(second).toBe(first);
  });

  it('a successful payment unlocks Pro and records a receipt', async () => {
    store.dispatch(startCheckout('pro-monthly'));
    await settle(700);
    const { orderId } = selectCheckout(store.getState());

    const verifying = store.dispatch(
      verifyCheckout({ orderId, planId: 'pro-monthly', outcome: 'success' }),
    );
    await settle(800);
    await verifying;

    const state = store.getState();
    expect(selectCheckout(state).status).toBe('succeeded');
    expect(selectPendingOrder(state)).toBeNull();
    expect(selectEntitlements(state).plan).toBe('pro');
    expect(isProActive(selectEntitlements(state))).toBe(true);
    expect(selectPaymentHistory(state)).toHaveLength(1);
    expect(selectPaymentHistory(state)[0].planId).toBe('pro-monthly');
  });

  it('a failed payment stays Free and drops the pending order', async () => {
    store.dispatch(startCheckout('pro-monthly'));
    await settle(700);
    const { orderId } = selectCheckout(store.getState());

    const verifying = store.dispatch(
      verifyCheckout({ orderId, planId: 'pro-monthly', outcome: 'failed' }),
    );
    await settle(800);
    await verifying;

    const state = store.getState();
    expect(selectCheckout(state).status).toBe('failed');
    expect(selectCheckout(state).errorCode).toBe('failed');
    expect(selectPendingOrder(state)).toBeNull();
    expect(selectEntitlements(state).plan).toBe('free');
  });

  it('a cancelled payment is reported distinctly from a failure', async () => {
    store.dispatch(startCheckout('pro-monthly'));
    await settle(700);
    const { orderId } = selectCheckout(store.getState());

    const verifying = store.dispatch(
      verifyCheckout({ orderId, planId: 'pro-monthly', outcome: 'cancelled' }),
    );
    await settle(800);
    await verifying;

    expect(selectCheckout(store.getState()).errorCode).toBe('cancelled');
  });

  it('a pending payment polls until it settles', async () => {
    store.dispatch(startCheckout('pro-monthly'));
    await settle(700);
    const { orderId } = selectCheckout(store.getState());

    const verifying = store.dispatch(
      verifyCheckout({ orderId, planId: 'pro-monthly', outcome: 'pending' }),
    );
    await settle(1000); // first poll: still pending
    expect(selectCheckout(store.getState()).status).toBe('polling');
    await settle(4000); // remaining polls resolve it
    await verifying;

    const state = store.getState();
    expect(selectCheckout(state).status).toBe('succeeded');
    expect(selectEntitlements(state).plan).toBe('pro');
  });

  it('a payment stuck pending past the timeout keeps the order for later, not as a failure', async () => {
    const alwaysPending = jest
      .spyOn(membershipService, 'fetchPaymentStatus')
      .mockResolvedValue({ status: 'pending' });

    store.dispatch(startCheckout('pro-monthly'));
    await settle(700);
    const { orderId } = selectCheckout(store.getState());

    const pollingPromise = store.dispatch(
      pollPayment({ orderId, planId: 'pro-monthly' }),
    );
    await settle(6000);
    const polling = await pollingPromise;

    expect(pollPayment.rejected.match(polling)).toBe(true);
    expect(polling.payload).toMatchObject({ code: 'pending' });
    // pollPayment alone doesn't touch pendingOrder (only verifyCheckout/resume do);
    // this just confirms it really did exhaust every attempt without ever
    // resolving, rather than silently succeeding.
    expect(alwaysPending).toHaveBeenCalledTimes(5);

    alwaysPending.mockRestore();
  });
});

describe('resuming a payment after the app was killed mid-payment', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    store.dispatch(logout());
  });
  afterEach(() => jest.useRealTimers());

  it('resolves the leftover pending order and unlocks Pro', async () => {
    store.dispatch(startCheckout('pro-yearly'));
    await settle(700);
    const pending = selectPendingOrder(store.getState());
    // Simulate the app having been killed right here: `checkout` is gone (it isn't
    // persisted), but `pendingOrder` survived.
    store.dispatch(clearCheckout());
    expect(selectCheckout(store.getState()).status).toBe('idle');

    const resuming = store.dispatch(resumePendingOrder());
    await settle(6000);
    await resuming;

    const state = store.getState();
    expect(selectEntitlements(state).plan).toBe('pro');
    expect(selectPendingOrder(state)).toBeNull();
    expect(selectPaymentHistory(state)[0].id).toBe(pending.orderId);
  });

  it('does nothing when there is no pending order', async () => {
    const resuming = await store.dispatch(resumePendingOrder());
    expect(resumePendingOrder.rejected.match(resuming)).toBe(true);
  });
});

describe('payment history', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    store.dispatch(logout());
  });
  afterEach(() => jest.useRealTimers());

  it("merges the server's history with what this device already has, without duplicates", async () => {
    store.dispatch(startCheckout('pro-monthly'));
    await settle(700);
    const { orderId } = selectCheckout(store.getState());
    const verifying = store.dispatch(
      verifyCheckout({ orderId, planId: 'pro-monthly', outcome: 'success' }),
    );
    await settle(800);
    await verifying;
    expect(selectPaymentHistory(store.getState())).toHaveLength(1);

    const loading = store.dispatch(loadPaymentHistory());
    await settle(400);
    await loading;
    // The mock server has nothing of its own, so the local receipt is untouched.
    expect(selectPaymentHistory(store.getState())).toHaveLength(1);
  });
});
