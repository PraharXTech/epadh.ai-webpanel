import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getErrorMessage } from '@/api/client';
import { logout } from '@/features/auth/store/authSlice';
import {
  resumePendingOrder,
  verifyCheckout,
} from '@/features/membership/store/membershipSlice';
import {
  fetchNotifications as requestNotifications,
  markNotificationRead,
} from '../services/notificationService';

const MAX_KEPT = 100;

export const fetchNotifications = createAsyncThunk(
  'notifications/fetch',
  async (_, { rejectWithValue }) => {
    try {
      return await requestNotifications();
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

const initialState = {
  items: [], // newest first: { id, type, title, body, createdAt, read, link }
  dismissed: [], // ids the student removed, so a refresh does not bring them back
  status: 'idle', // idle | loading | succeeded | failed
  lastFetchedAt: null,
};

// What this device raised itself (ids start with "local-"), e.g. a confirmed payment.
const addLocal = (state, item) => {
  if (state.items.some(n => n.id === item.id)) {
    return;
  }
  state.items = [
    { read: false, link: null, ...item, createdAt: Date.now() },
    ...state.items,
  ];
};

const paymentDone = (state, action) => {
  const receipt = action.payload?.receipt;
  addLocal(state, {
    id: `local-pay-${receipt?.id ?? action.meta.requestId}`,
    type: 'payment',
    title: 'Payment successful',
    body: `${receipt?.planName ?? 'Pro'} is now active. All Pro features are unlocked.`,
    link: { name: 'Membership' },
  });
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    markRead: (state, action) => {
      const item = state.items.find(n => n.id === action.payload);
      if (item) {
        item.read = true;
      }
    },
    markAllRead: state => {
      state.items.forEach(n => {
        n.read = true;
      });
    },
    dismissNotification: (state, action) => {
      state.items = state.items.filter(n => n.id !== action.payload);
      state.dismissed = [...state.dismissed, action.payload].slice(
        -MAX_KEPT * 2,
      );
    },
    clearNotifications: state => {
      state.dismissed = [
        ...state.dismissed,
        ...state.items.map(n => n.id),
      ].slice(-MAX_KEPT * 2);
      state.items = [];
    },
  },
  extraReducers: builder => {
    builder
      .addCase(logout, () => initialState)
      .addCase(fetchNotifications.pending, state => {
        state.status = 'loading';
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.lastFetchedAt = Date.now();
        const gone = new Set(state.dismissed);
        const known = new Map(state.items.map(n => [n.id, n]));
        const fromServer = action.payload
          .filter(n => !gone.has(n.id))
          .map(n => {
            const mine = known.get(n.id);
            // Once read on this device it stays read; the first time seen keeps its time.
            return {
              ...n,
              read: Boolean(mine?.read || n.read),
              createdAt: mine?.createdAt ?? n.createdAt,
            };
          });
        const serverIds = new Set(fromServer.map(n => n.id));
        const local = state.items.filter(
          n => n.id.startsWith('local-') && !serverIds.has(n.id),
        );
        state.items = [...fromServer, ...local]
          .sort((a, b) => b.createdAt - a.createdAt)
          .slice(0, MAX_KEPT);
      })
      .addCase(fetchNotifications.rejected, state => {
        // The saved list stays on screen; the screen offers a retry.
        state.status = 'failed';
      })
      .addCase(verifyCheckout.fulfilled, paymentDone)
      .addCase(resumePendingOrder.fulfilled, paymentDone);
  },
});

export const {
  markRead,
  markAllRead,
  dismissNotification,
  clearNotifications,
} = notificationsSlice.actions;

// Shows it as read at once and tells the server in the background.
export const openNotification = id => (dispatch, getState) => {
  const item = getState().notifications.items.find(n => n.id === id);
  if (!item || item.read) {
    return;
  }
  dispatch(markRead(id));
  if (!id.startsWith('local-')) {
    markNotificationRead(id).catch(() => {});
  }
};

export default notificationsSlice.reducer;
