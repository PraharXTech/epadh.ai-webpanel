import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getErrorMessage } from '@/api/client';
import { logout } from '@/features/auth/store/authSlice';
import {
  createOrder,
  fetchPaymentHistory,
  fetchPaymentStatus,
  fetchPlans,
  verifyPayment,
} from '../services/membershipService';

const MAX_POLL_ATTEMPTS = 5;

const newIdempotencyKey = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const loadPlans = createAsyncThunk(
  'membership/loadPlans',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchPlans();
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

export const loadPaymentHistory = createAsyncThunk(
  'membership/loadHistory',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchPaymentHistory();
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

// Creates the order for a plan. Reuses the in-flight order's idempotency key on a
// retry (same tap target, same key) instead of minting a new one, and does nothing
// if a checkout is already in flight (blocks a double tap at the source). That check
// has to run in `condition`, before RTK dispatches `pending` — by the time the
// payload creator below runs, `pending` has already set the status to 'creating',
// so checking it there would reject every call, not just a genuine second one.
export const startCheckout = createAsyncThunk(
  'membership/startCheckout',
  async (planId, { getState, rejectWithValue }) => {
    const { membership } = getState();
    const idempotencyKey =
      membership.pendingOrder?.planId === planId
        ? membership.pendingOrder.idempotencyKey
        : newIdempotencyKey();
    try {
      const order = await createOrder({ planId, idempotencyKey });
      return { ...order, idempotencyKey };
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
  {
    condition: (planId, { getState }) =>
      getState().membership.checkout.status === 'idle',
  },
);

// `outcome` is what the (mocked) checkout sheet produced: 'success' | 'failed' |
// 'cancelled' | 'pending'. A pending outcome is handed off to pollPayment instead of
// verified directly, matching how a real UPI/bank-redirect payment resolves.
export const verifyCheckout = createAsyncThunk(
  'membership/verifyCheckout',
  async ({ orderId, planId, outcome }, { dispatch, rejectWithValue }) => {
    try {
      return outcome === 'pending'
        ? await dispatch(pollPayment({ orderId, planId })).unwrap()
        : await verifyPayment({ orderId, planId, outcome });
    } catch (e) {
      // pollPayment's own rejectWithValue payload (a plain {message, code} object)
      // comes through unwrap() as-is; verifyPayment throws a real Error instead,
      // which has the same two properties, so this handles both the same way.
      return rejectWithValue({ message: e.message, code: e.code ?? 'failed' });
    }
  },
);

export const pollPayment = createAsyncThunk(
  'membership/pollPayment',
  async ({ orderId, planId }, { rejectWithValue }) => {
    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
      const status = await fetchPaymentStatus({ orderId, planId, attempt });
      if (status.status === 'succeeded') {
        return status;
      }
    }
    return rejectWithValue({
      message: "Still processing. We'll update this once it's confirmed.",
      code: 'pending',
    });
  },
);

// App reopened with a payment that never resolved last time (killed mid-payment).
// Same shape as verifyCheckout's pending branch: poll until it settles.
export const resumePendingOrder = createAsyncThunk(
  'membership/resumePendingOrder',
  async (_, { getState, dispatch, rejectWithValue }) => {
    const { pendingOrder } = getState().membership;
    if (!pendingOrder) {
      return rejectWithValue({ message: 'Nothing to resume.', code: 'failed' });
    }
    try {
      return await dispatch(
        pollPayment({
          orderId: pendingOrder.orderId,
          planId: pendingOrder.planId,
        }),
      ).unwrap();
    } catch (e) {
      return rejectWithValue({ message: e.message, code: e.code ?? 'failed' });
    }
  },
);

const initialState = {
  plans: [],
  plansStatus: 'idle', // idle | loading | succeeded | failed
  checkout: {
    status: 'idle', // idle | creating | awaiting_action | verifying | polling | succeeded | failed
    planId: null,
    orderId: null,
    error: null,
    errorCode: null, // 'failed' | 'cancelled' | 'pending' (timed out)
    receipt: null,
  },
  // Kept apart from `checkout` (which resets on every screen visit) and persisted, so
  // an app kill mid-payment can be checked on the next launch even if the checkout
  // screen never remounts in time to see it happen.
  pendingOrder: null, // { orderId, planId, idempotencyKey, createdAt }
  history: [], // completed payments, newest first (persisted)
  historyStatus: 'idle',
};

const membershipSlice = createSlice({
  name: 'membership',
  initialState,
  reducers: {
    clearCheckout: state => {
      state.checkout = initialState.checkout;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(logout, () => initialState)
      .addCase(loadPlans.pending, state => {
        state.plansStatus = 'loading';
      })
      .addCase(loadPlans.fulfilled, (state, action) => {
        state.plansStatus = 'succeeded';
        state.plans = action.payload;
      })
      .addCase(loadPlans.rejected, state => {
        state.plansStatus = 'failed';
      })

      .addCase(startCheckout.pending, (state, action) => {
        state.checkout = {
          ...initialState.checkout,
          status: 'creating',
          planId: action.meta.arg,
        };
      })
      .addCase(startCheckout.fulfilled, (state, action) => {
        state.checkout.status = 'awaiting_action';
        state.checkout.orderId = action.payload.orderId;
        state.pendingOrder = {
          orderId: action.payload.orderId,
          planId: action.payload.planId,
          idempotencyKey: action.payload.idempotencyKey,
          createdAt: Date.now(),
        };
      })
      .addCase(startCheckout.rejected, (state, action) => {
        state.checkout.status = 'failed';
        state.checkout.error = action.payload ?? action.error.message;
        state.checkout.errorCode = 'failed';
      })

      .addCase(verifyCheckout.pending, (state, action) => {
        state.checkout.status =
          action.meta.arg.outcome === 'pending' ? 'polling' : 'verifying';
      })
      .addCase(verifyCheckout.fulfilled, (state, action) => {
        state.checkout.status = 'succeeded';
        state.checkout.receipt = action.payload.receipt;
        state.pendingOrder = null;
        state.history = [action.payload.receipt, ...state.history];
      })
      .addCase(verifyCheckout.rejected, (state, action) => {
        state.checkout.status = 'failed';
        state.checkout.error = action.payload?.message ?? action.error.message;
        state.checkout.errorCode = action.payload?.code ?? 'failed';
        // A definite failure or cancellation means there's nothing left to resume;
        // a timed-out "pending" might still resolve, so its order is kept.
        if (state.checkout.errorCode !== 'pending') {
          state.pendingOrder = null;
        }
      })

      .addCase(pollPayment.pending, state => {
        state.checkout.status = 'polling';
      })

      .addCase(resumePendingOrder.fulfilled, (state, action) => {
        state.checkout.status = 'succeeded';
        state.checkout.receipt = action.payload.receipt;
        state.checkout.planId = state.pendingOrder?.planId ?? null;
        state.pendingOrder = null;
        state.history = [action.payload.receipt, ...state.history];
      })
      .addCase(resumePendingOrder.rejected, (state, action) => {
        if (action.payload?.code && action.payload.code !== 'pending') {
          state.pendingOrder = null;
        }
      })

      .addCase(loadPaymentHistory.pending, state => {
        state.historyStatus = 'loading';
      })
      .addCase(loadPaymentHistory.fulfilled, (state, action) => {
        state.historyStatus = 'succeeded';
        // The server's list plus whatever this device already recorded locally,
        // de-duplicated by id, newest first.
        const known = new Set(state.history.map(h => h.id));
        const fromServer = action.payload.filter(h => !known.has(h.id));
        state.history = [...state.history, ...fromServer].sort(
          (a, b) => new Date(b.paidAt) - new Date(a.paidAt),
        );
      })
      .addCase(loadPaymentHistory.rejected, state => {
        state.historyStatus = 'failed';
      });
  },
});

export const { clearCheckout } = membershipSlice.actions;

export default membershipSlice.reducer;
