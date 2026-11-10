// Rules for the two local reminders. Pure, so they can be tested without a phone.

export const STUDY_REMINDER_ID = 'reminder-study';
export const STREAK_REMINDER_ID = 'reminder-streak';

export const STREAK_REMINDER_HOUR = 20; // 8 pm
// Minutes of study that count as "studied today" (same bar the streak uses).
export const STUDIED_TODAY_MINUTES = 10;
export const TIME_STEP_MINUTES = 30;

const atTime = (base, hour, minute, addDays = 0) => {
  const d = new Date(base);
  d.setDate(d.getDate() + addDays);
  d.setHours(hour, minute, 0, 0);
  return d;
};

// The next moment the clock reads hour:minute (today if still ahead, else tomorrow).
export const nextOccurrence = (hour, minute, now = new Date()) => {
  const today = atTime(now, hour, minute);
  return today.getTime() > now.getTime() ? today : atTime(now, hour, minute, 1);
};

// When the streak reminder should fire: 8 pm today, unless the student already studied
// today (nothing to save, so tomorrow's 8 pm) or 8 pm has passed.
export const streakReminderTime = ({ studiedToday, now = new Date() }) => {
  const tonight = atTime(now, STREAK_REMINDER_HOUR, 0);
  return studiedToday || tonight.getTime() <= now.getTime()
    ? atTime(now, STREAK_REMINDER_HOUR, 0, 1)
    : tonight;
};

// Moves hour:minute by `deltaMinutes`, wrapping around midnight.
export const stepTime = ({ hour, minute }, deltaMinutes) => {
  const total = (hour * 60 + minute + deltaMinutes + 24 * 60) % (24 * 60);
  return { hour: Math.floor(total / 60), minute: total % 60 };
};

// "7:30 PM"
export const formatTime = ({ hour, minute }) => {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}:${String(minute).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
};
