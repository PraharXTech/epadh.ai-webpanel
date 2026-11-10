import { store } from '@/store';
import { logout } from '@/features/auth/store/authSlice';
import {
  setLanguage,
  setStreakReminder,
  updateStudyReminder,
} from '@/features/settings/store/settingsSlice';
import {
  formatTime,
  nextOccurrence,
  stepTime,
  streakReminderTime,
} from '@/features/settings/utils/reminders';
import en from '@/localization/locales/en';
import hi from '@/localization/locales/hi';
import { translate } from '@/localization';
import { ensureOnline } from '@/services/network/ensureOnline';
import {
  __setOnlineForTests,
  isOnline,
  subscribeNetwork,
} from '@/services/network/network';
import { setAlertListener } from '@/services/alerts/alertStore';

const at = (hour, minute = 0, day = 10) =>
  new Date(2026, 9, day, hour, minute, 0, 0);

describe('reminder rules', () => {
  it('nextOccurrence is today when still ahead, tomorrow once passed', () => {
    expect(nextOccurrence(19, 0, at(15))).toEqual(at(19));
    expect(nextOccurrence(19, 0, at(19))).toEqual(at(19, 0, 11));
    expect(nextOccurrence(7, 30, at(15))).toEqual(at(7, 30, 11));
  });

  it('streak reminder is 8 pm tonight unless already studied or past 8 pm', () => {
    expect(streakReminderTime({ studiedToday: false, now: at(15) })).toEqual(
      at(20),
    );
    expect(streakReminderTime({ studiedToday: true, now: at(15) })).toEqual(
      at(20, 0, 11),
    );
    expect(streakReminderTime({ studiedToday: false, now: at(21) })).toEqual(
      at(20, 0, 11),
    );
  });

  it('stepTime wraps around midnight', () => {
    expect(stepTime({ hour: 23, minute: 30 }, 30)).toEqual({
      hour: 0,
      minute: 0,
    });
    expect(stepTime({ hour: 0, minute: 0 }, -30)).toEqual({
      hour: 23,
      minute: 30,
    });
    expect(stepTime({ hour: 19, minute: 0 }, 30)).toEqual({
      hour: 19,
      minute: 30,
    });
  });

  it('formatTime uses a 12 hour clock', () => {
    expect(formatTime({ hour: 0, minute: 5 })).toBe('12:05 AM');
    expect(formatTime({ hour: 12, minute: 0 })).toBe('12:00 PM');
    expect(formatTime({ hour: 19, minute: 30 })).toBe('7:30 PM');
  });
});

describe('localization', () => {
  it('Hindi has exactly the English keys', () => {
    expect(Object.keys(hi).sort()).toEqual(Object.keys(en).sort());
  });

  it('every Hindi string keeps the same {placeholders}', () => {
    const holes = text => (text.match(/\{\w+\}/g) ?? []).sort();
    Object.keys(en).forEach(key => {
      expect(holes(hi[key])).toEqual(holes(en[key]));
    });
  });

  it('translate fills values, falls back to English, then to the key', () => {
    expect(translate('en', 'settings.minutes', { n: 45 })).toBe('45 min');
    expect(translate('hi', 'settings.minutes', { n: 45 })).toBe('45 मिनट');
    expect(translate('fr', 'settings.title')).toBe('Settings');
    expect(translate('en', 'no.such.key')).toBe('no.such.key');
  });
});

describe('settings slice', () => {
  beforeEach(() => store.dispatch(logout()));

  it('keeps language and reminders, and logout resets them', () => {
    store.dispatch(setLanguage('hi'));
    store.dispatch(updateStudyReminder({ enabled: true, hour: 6, minute: 30 }));
    store.dispatch(setStreakReminder(true));
    expect(store.getState().settings.language).toBe('hi');
    expect(store.getState().settings.reminders).toEqual({
      study: { enabled: true, hour: 6, minute: 30 },
      streak: { enabled: true },
    });

    store.dispatch(logout());
    expect(store.getState().settings.language).toBe('en');
    expect(store.getState().settings.reminders.study.enabled).toBe(false);
  });
});

describe('network guard', () => {
  afterEach(() => {
    __setOnlineForTests(true);
    setAlertListener(null);
  });

  it('lets online calls through without a message', () => {
    const listener = jest.fn();
    setAlertListener(listener);
    expect(ensureOnline('ai')).toBe(true);
    expect(listener).not.toHaveBeenCalled();
  });

  it('blocks offline calls and says why', () => {
    const listener = jest.fn();
    setAlertListener(listener);
    __setOnlineForTests(false);
    expect(isOnline()).toBe(false);
    expect(ensureOnline('payment')).toBe(false);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].message).toMatch(/Payments need/);
  });

  it('tells subscribers when the state flips, and stops after unsubscribe', () => {
    const seen = [];
    const stop = subscribeNetwork(online => seen.push(online));
    __setOnlineForTests(false);
    __setOnlineForTests(true);
    stop();
    __setOnlineForTests(false);
    expect(seen).toEqual([false, true]);
  });
});
