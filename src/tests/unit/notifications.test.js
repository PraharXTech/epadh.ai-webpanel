import { store } from '@/store';
import { logout } from '@/features/auth/store/authSlice';
import {
  clearNotifications,
  dismissNotification,
  fetchNotifications,
  markAllRead,
  openNotification,
} from '@/features/notifications/store/notificationsSlice';
import { verifyCheckout } from '@/features/membership/store/membershipSlice';
import {
  applyFilter,
  groupByDay,
  timeAgo,
} from '@/features/notifications/utils/notifications';
import {
  selectNotifications,
  selectUnreadNotificationCount,
} from '@/store/selectors/notificationSelectors';

const NOW = new Date(2026, 9, 10, 15, 0).getTime();
const at = (daysBack, hour = 9) =>
  new Date(2026, 9, 10 - daysBack, hour, 0).getTime();

describe('notification helpers', () => {
  it('timeAgo', () => {
    expect(timeAgo(NOW - 20000, NOW)).toBe('Just now');
    expect(timeAgo(NOW - 5 * 60000, NOW)).toBe('5m ago');
    expect(timeAgo(NOW - 3 * 3600000, NOW)).toBe('3h ago');
    expect(timeAgo(NOW - 2 * 86400000, NOW)).toBe('2d ago');
    expect(timeAgo(NOW - 20 * 86400000, NOW)).toMatch(/Sep/);
  });

  it('groups by day, newest first, leaving out empty groups', () => {
    const items = [
      { id: 'old', createdAt: at(5) },
      { id: 'today-early', createdAt: at(0, 8) },
      { id: 'yest', createdAt: at(1) },
      { id: 'today-late', createdAt: at(0, 14) },
    ];
    const groups = groupByDay(items, NOW);
    expect(groups.map(g => g.title)).toEqual(['Today', 'Yesterday', 'Earlier']);
    expect(groups[0].data.map(n => n.id)).toEqual([
      'today-late',
      'today-early',
    ]);
    expect(groupByDay([items[0]], NOW).map(g => g.title)).toEqual(['Earlier']);
  });

  it('unread filter', () => {
    const items = [
      { id: 'a', read: true },
      { id: 'b', read: false },
    ];
    expect(applyFilter(items, 'all')).toHaveLength(2);
    expect(applyFilter(items, 'unread').map(n => n.id)).toEqual(['b']);
  });
});

describe('notifications store', () => {
  beforeAll(() => jest.useFakeTimers());
  afterAll(() => jest.useRealTimers());
  beforeEach(() => store.dispatch(logout()));

  const load = async () => {
    const loading = store.dispatch(fetchNotifications());
    await jest.advanceTimersByTimeAsync(1000);
    await loading;
  };

  it('loads the list newest first with an unread count', async () => {
    await load();
    const items = selectNotifications(store.getState());
    expect(items.length).toBeGreaterThan(3);
    const times = items.map(n => n.createdAt);
    expect(times).toEqual([...times].sort((a, b) => b - a));
    expect(selectUnreadNotificationCount(store.getState())).toBe(
      items.filter(n => !n.read).length,
    );
  });

  it('opening marks one read; mark all read clears the count', async () => {
    await load();
    const before = selectUnreadNotificationCount(store.getState());
    const first = selectNotifications(store.getState()).find(n => !n.read);
    store.dispatch(openNotification(first.id));
    await jest.advanceTimersByTimeAsync(500);
    expect(selectUnreadNotificationCount(store.getState())).toBe(before - 1);
    store.dispatch(markAllRead());
    expect(selectUnreadNotificationCount(store.getState())).toBe(0);
  });

  it('a refresh keeps what was read and does not change first-seen times', async () => {
    await load();
    store.dispatch(markAllRead());
    const seen = selectNotifications(store.getState()).map(n => n.createdAt);
    await jest.advanceTimersByTimeAsync(60000);
    await load();
    expect(selectUnreadNotificationCount(store.getState())).toBe(0);
    expect(selectNotifications(store.getState()).map(n => n.createdAt)).toEqual(
      seen,
    );
  });

  it('a dismissed notification does not come back on refresh', async () => {
    await load();
    const [victim] = selectNotifications(store.getState());
    store.dispatch(dismissNotification(victim.id));
    await load();
    expect(
      selectNotifications(store.getState()).some(n => n.id === victim.id),
    ).toBe(false);
  });

  it('clear all empties the list and stays empty after a refresh', async () => {
    await load();
    store.dispatch(clearNotifications());
    expect(selectNotifications(store.getState())).toEqual([]);
    await load();
    expect(selectNotifications(store.getState())).toEqual([]);
  });

  it('a confirmed payment raises a "Payment successful" notification that survives refresh', async () => {
    await load();
    store.dispatch({
      type: verifyCheckout.fulfilled.type,
      payload: { receipt: { id: 'pay_1', planName: 'Pro Monthly' } },
      meta: { requestId: 'r1' },
    });
    const payment = selectNotifications(store.getState())[0];
    expect(payment).toMatchObject({
      id: 'local-pay-pay_1',
      type: 'payment',
      read: false,
    });
    expect(payment.body).toContain('Pro Monthly');
    await load();
    expect(
      selectNotifications(store.getState()).some(
        n => n.id === 'local-pay-pay_1',
      ),
    ).toBe(true);
  });
});
