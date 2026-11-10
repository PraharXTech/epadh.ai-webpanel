import { dayKey } from '@/utils/date';

// Everything the Profile screen derives from what the student has already done and
// typed: streak, how complete the profile is, and the exam countdown.
// Pure functions, so they can be tested and later swapped for the server's numbers.

const DAY_MS = 86400000;

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

// "2026-10-01" -> a whole-day number, so two keys can be compared without DST surprises.
const dayNumber = key => {
  const [y, m, d] = key.split('-').map(Number);
  return Date.UTC(y, m - 1, d) / DAY_MS;
};

// Every calendar day the student studied, practised or took a mock.
export const activeDayKeys = ({ sessions = [], practice = [], mock = [] }) => {
  const days = new Set();
  sessions.forEach(s => days.add(dayKey(new Date(s.end))));
  [...practice, ...mock].forEach(a => days.add(dayKey(new Date(a.finishedAt))));
  return days;
};

// `current` counts back from today; a student who has not studied yet today keeps the
// streak alive until the day ends, so it counts back from yesterday instead.
// `best` is the longest run ever.
export const computeStreak = (days, now = Date.now()) => {
  if (days.size === 0) {
    return { current: 0, best: 0 };
  }
  const numbers = [...days].map(dayNumber).sort((a, b) => a - b);

  let best = 1;
  let run = 1;
  for (let i = 1; i < numbers.length; i += 1) {
    run = numbers[i] - numbers[i - 1] === 1 ? run + 1 : 1;
    best = Math.max(best, run);
  }

  const set = new Set(numbers);
  const today = dayNumber(dayKey(new Date(now)));
  let cursor = set.has(today) ? today : today - 1;
  let current = 0;
  while (set.has(cursor)) {
    current += 1;
    cursor -= 1;
  }
  return { current, best };
};

// The profile fields that count towards "complete your profile".
export const profileCompleteness = ({ profile, hasAvatar }) => {
  const steps = [
    { id: 'name', label: 'Add your name', done: Boolean(profile?.name?.trim()) },
    { id: 'mobile', label: 'Add a phone number', done: Boolean(profile?.mobile) },
    { id: 'email', label: 'Add your email', done: Boolean(profile?.email) },
    { id: 'avatar', label: 'Add a profile photo', done: hasAvatar },
    {
      id: 'target',
      label: 'Set your exam date',
      done: Boolean(profile?.targetDate),
    },
  ];
  const done = steps.filter(s => s.done).length;
  return {
    percent: Math.round((done / steps.length) * 100),
    missing: steps.filter(s => !s.done),
  };
};

export const initialsOf = name => {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return 'S';
  }
  const letters =
    words.length === 1 ? words[0][0] : words[0][0] + words[words.length - 1][0];
  return letters.toUpperCase();
};

// 5400 -> "1h 30m", 2700 -> "45m"
export const formatStudyTime = seconds => {
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
};

// "2027-03-15" <->"15/03/2027" (what the student types) and "15 Mar 2027" (what we show).
export const isoToInput = iso => {
  if (!iso) {
    return '';
  }
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

export const formatTargetDate = iso => {
  if (!iso) {
    return '';
  }
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};

// Returns the ISO date for "DD/MM/YYYY" (or "DD-MM-YYYY"), or null when it is not a real day.
export const inputToIso = text => {
  const match = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(text.trim());
  if (!match) {
    return null;
  }
  const [d, m, y] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(y, m - 1, d);
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  ) {
    return null;
  }
  const pad = n => String(n).padStart(2, '0');
  return `${y}-${pad(m)}-${pad(d)}`;
};

// Whole days from today to the exam; 0 on the day itself, negative once it has passed.
export const daysUntilDate = (iso, now = Date.now()) => {
  if (!iso) {
    return null;
  }
  return dayNumber(iso) - dayNumber(dayKey(new Date(now)));
};

export const validateName = value => {
  const name = value.trim();
  if (name.length < 2) {
    return 'Enter your name (at least 2 letters)';
  }
  return name.length > 40 ? 'Name is too long (40 characters at most)' : null;
};

// Optional: an empty email is fine.
export const validateEmail = value =>
  !value.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
    ? null
    : 'Enter a valid email address';

// Optional: an empty date is fine. Must be a real day that is not in the past.
export const validateTargetDate = (value, now = Date.now()) => {
  if (!value.trim()) {
    return null;
  }
  const iso = inputToIso(value);
  if (!iso) {
    return 'Use the format DD/MM/YYYY';
  }
  return daysUntilDate(iso, now) < 0 ? 'Pick a date that is not in the past' : null;
};
