// Mock payment layer, shaped exactly like the real flow (plan.md §5.18) so swapping
// in `react-native-razorpay` and the real endpoints later only touches this file:
//   fetchPlans     -> GET /plans
//   createOrder    -> POST /payments/orders {planId, idempotencyKey} -> { orderId, amount, currency, keyId }
//   (the app would then open RazorpayCheckout.open({...}) here, prefilled with the
//   student's name/phone; verifyPayment below stands in for what it returns)
//   verifyPayment  -> POST /payments/verify {orderId, paymentId, signature}
//   paymentStatus  -> GET /payments/:id (polling a payment stuck "pending")
//   fetchHistory   -> GET /payments/history
import { apiClient } from '@/api/client';
import { USE_MOCK_API } from '@/config/env';

const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

export const PLANS = [
  {
    id: 'pro-monthly',
    name: 'Pro Monthly',
    description: 'Perfect for focused preparation.',
    interval: 'month',
    price: 149,
    currency: 'INR',
    durationDays: 30,
    popular: true,
  },
  {
    id: 'pro-yearly',
    name: 'Pro Yearly',
    description: 'Best value for serious aspirants.',
    interval: 'year',
    price: 999,
    currency: 'INR',
    durationDays: 365,
    badge: 'Best value',
    compareAtPrice: 1788, // 149 x 12, shown struck through
  },
];

export const fetchPlans = async () => {
  if (!USE_MOCK_API) {
    const { data } = await apiClient.get('/plans');
    return data;
  }
  await delay(300);
  return PLANS;
};

// The server creates the Razorpay order and returns its id plus the checkout key;
// mocked here as a locally generated id, nothing is charged. `idempotencyKey` lets a
// retried tap reuse the same order instead of creating a second one.
export const createOrder = async ({ planId, idempotencyKey }) => {
  const plan = PLANS.find(p => p.id === planId);
  if (!plan) {
    throw new Error('Unknown plan');
  }
  if (!USE_MOCK_API) {
    const { data } = await apiClient.post('/payments/orders', {
      planId,
      idempotencyKey,
    });
    return data;
  }
  await delay(500);
  return {
    orderId: `order_mock_${idempotencyKey}`,
    amount: plan.price * 100, // paise, matching Razorpay's own unit
    currency: plan.currency,
    keyId: 'rzp_test_mock',
    planId,
  };
};

// Real flow: the Razorpay SDK hands back a paymentId + signature, which the server
// verifies against its own secret; the app never decides success itself. Mocked here:
// `outcome` stands in for what the checkout sheet would have produced.
export const verifyPayment = async ({ orderId, planId, outcome }) => {
  if (!USE_MOCK_API) {
    const { data } = await apiClient.post('/payments/verify', {
      orderId,
      planId,
    });
    return data; // { entitlements, receipt }
  }
  await delay(700);
  if (outcome !== 'success') {
    const error = new Error(
      outcome === 'cancelled'
        ? 'Payment was cancelled'
        : "Payment could not be verified. If money was deducted, it's refunded within 5-7 days.",
    );
    error.code = outcome; // 'failed' | 'cancelled'
    throw error;
  }
  const plan = PLANS.find(p => p.id === planId);
  const validTill = new Date(
    Date.now() + plan.durationDays * 86400000,
  ).toISOString();
  const paidAt = new Date();
  return {
    receipt: {
      id: orderId,
      planId,
      planName: plan.name,
      amount: plan.price,
      currency: plan.currency,
      method: 'UPI',
      // Cosmetic only (mock): EPD + date + a 6-digit sequence, the same shape a real
      // gateway's own reference number would have.
      transactionId: `EPD${paidAt
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, '')}${Math.floor(100000 + Math.random() * 900000)}`,
      paidAt: paidAt.toISOString(),
    },
    entitlements: {
      plan: 'pro',
      validTill,
      ai: { dailyLimit: 100, usedToday: 0 },
      mcq: { dailyLimit: 200, usedToday: 0 },
      features: {
        fullSyllabus: true,
        advancedMocks: true,
        studyPlanner: true,
        weakTopics: true,
        extendedPractice: true,
      },
    },
  };
};

// A payment stuck "pending" (e.g. a UPI app the student hasn't confirmed in yet).
// `attempt` is caller-tracked so this stays a pure, deterministic mock: the first
// couple of polls say pending, then it resolves as if the student had confirmed it.
export const fetchPaymentStatus = async ({ orderId, planId, attempt }) => {
  if (!USE_MOCK_API) {
    const { data } = await apiClient.get(`/payments/${orderId}`);
    return data;
  }
  await delay(1000);
  if (attempt < 2) {
    return { status: 'pending' };
  }
  const result = await verifyPayment({ orderId, planId, outcome: 'success' });
  return { status: 'succeeded', ...result };
};

// The server's record of past payments. The app's own slice keeps a local history
// too (appended right after each successful payment), so this is only what a fresh
// install or another device would need to catch up on.
export const fetchPaymentHistory = async () => {
  if (!USE_MOCK_API) {
    const { data } = await apiClient.get('/payments/history');
    return data;
  }
  await delay(300);
  return [];
};
