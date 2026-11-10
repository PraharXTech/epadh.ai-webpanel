import { dayKey } from '@/utils/date';

// How each kind of notification looks (icon, colour) and what it is called.
export const TYPE_STYLES = {
  new_mock: { icon: 'clipboard-check', color: '#e11d48', bg: 'bg-rose-50' },
  plan: { icon: 'calendar', color: '#2563eb', bg: 'bg-blue-50' },
  streak: { icon: 'flame', color: '#f97316', bg: 'bg-orange-50' },
  result: { icon: 'trophy', color: '#16a34a', bg: 'bg-green-50' },
  expiry: { icon: 'crown', color: '#d97706', bg: 'bg-amber-50' },
  payment: { icon: 'credit-card', color: '#16a34a', bg: 'bg-green-50' },
  offer: { icon: 'sparkles', color: '#7c3aed', bg: 'bg-violet-50' },
  info: { icon: 'bell', color: '#475569', bg: 'bg-slate-100' },
};

export const styleOf = type => TYPE_STYLES[type] ?? TYPE_STYLES.info;

export const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
];

const MIN = 60000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

// "Just now", "5m ago", "3h ago", "2d ago", then the date.
export const timeAgo = (at, now = Date.now()) => {
  const diff = Math.max(0, now - at);
  if (diff < MIN) {
    return 'Just now';
  }
  if (diff < HOUR) {
    return `${Math.floor(diff / MIN)}m ago`;
  }
  if (diff < DAY) {
    return `${Math.floor(diff / HOUR)}h ago`;
  }
  if (diff < 7 * DAY) {
    return `${Math.floor(diff / DAY)}d ago`;
  }
  return new Date(at).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
  });
};

// [{ title: 'Today' | 'Yesterday' | 'Earlier', data: [...] }], newest first, empty
// groups left out.
export const groupByDay = (items, now = Date.now()) => {
  const today = dayKey(new Date(now));
  const yesterday = dayKey(new Date(now - DAY));
  const groups = { Today: [], Yesterday: [], Earlier: [] };
  [...items]
    .sort((a, b) => b.createdAt - a.createdAt)
    .forEach(n => {
      const key = dayKey(new Date(n.createdAt));
      groups[key === today ? 'Today' : key === yesterday ? 'Yesterday' : 'Earlier'].push(n);
    });
  return Object.entries(groups)
    .filter(([, data]) => data.length > 0)
    .map(([title, data]) => ({ title, data }));
};

export const applyFilter = (items, filterId) =>
  filterId === 'unread' ? items.filter(n => !n.read) : items;
