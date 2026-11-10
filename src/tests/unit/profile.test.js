import {
  activeDayKeys,
  computeStreak,
  daysUntilDate,
  formatStudyTime,
  formatTargetDate,
  initialsOf,
  inputToIso,
  isoToInput,
  profileCompleteness,
  validateEmail,
  validateName,
  validateTargetDate,
} from '@/features/profile/utils/profile';

const NOW = new Date(2026, 9, 10, 15, 0).getTime(); // 10 Oct 2026, local
const at = (day, month = 9) => new Date(2026, month, day, 12, 0).getTime();
const days = (...list) => activeDayKeys({ practice: list.map(d => ({ finishedAt: at(d) })) });

describe('streak', () => {
  it('is zero with no activity', () => {
    expect(computeStreak(new Set(), NOW)).toEqual({ current: 0, best: 0 });
  });

  it('counts consecutive days ending today', () => {
    expect(computeStreak(days(8, 9, 10), NOW)).toEqual({ current: 3, best: 3 });
  });

  it('stays alive when only today is still missing', () => {
    expect(computeStreak(days(8, 9), NOW).current).toBe(2);
  });

  it('breaks after a missed day but remembers the best run', () => {
    expect(computeStreak(days(1, 2, 3, 4, 5, 8), NOW)).toEqual({
      current: 0,
      best: 5,
    });
  });

  it('counts across a month boundary', () => {
    const set = activeDayKeys({
      practice: [
        { finishedAt: new Date(2026, 8, 30, 10).getTime() },
        { finishedAt: new Date(2026, 9, 1, 10).getTime() },
      ],
    });
    expect(computeStreak(set, new Date(2026, 9, 1, 20).getTime()).current).toBe(2);
  });

  it('counts study sessions and mocks as active days too', () => {
    const set = activeDayKeys({
      sessions: [{ end: at(9) }],
      mock: [{ finishedAt: at(10) }],
    });
    expect(computeStreak(set, NOW).current).toBe(2);
  });
});

describe('profile completeness', () => {
  it('lists what is missing', () => {
    const r = profileCompleteness({
      profile: { name: 'Asha', mobile: '9876543210' },
      hasAvatar: false,
    });
    expect(r.percent).toBe(40);
    expect(r.missing.map(m => m.id)).toEqual(['email', 'avatar', 'target']);
  });

  it('is 100% when everything is filled', () => {
    const r = profileCompleteness({
      profile: {
        name: 'Asha',
        mobile: '9876543210',
        email: 'a@b.co',
        targetDate: '2027-01-01',
      },
      hasAvatar: true,
    });
    expect(r).toEqual({ percent: 100, missing: [] });
  });
});

describe('formatting', () => {
  it('initials', () => {
    expect(initialsOf('Abhishek Singh')).toBe('AS');
    expect(initialsOf('asha')).toBe('A');
    expect(initialsOf('  ')).toBe('S');
    expect(initialsOf(undefined)).toBe('S');
  });

  it('study time', () => {
    expect(formatStudyTime(0)).toBe('0m');
    expect(formatStudyTime(2700)).toBe('45m');
    expect(formatStudyTime(5400)).toBe('1h 30m');
    expect(formatStudyTime(7200)).toBe('2h');
  });

  it('dates round-trip between input, ISO and display', () => {
    expect(inputToIso('05/03/2027')).toBe('2027-03-05');
    expect(inputToIso('5-3-2027')).toBe('2027-03-05');
    expect(isoToInput('2027-03-05')).toBe('05/03/2027');
    expect(formatTargetDate('2027-03-05')).toBe('5 Mar 2027');
  });

  it('rejects days that do not exist', () => {
    expect(inputToIso('31/02/2027')).toBeNull();
    expect(inputToIso('2027-03-05')).toBeNull();
    expect(inputToIso('hello')).toBeNull();
  });
});

describe('exam countdown', () => {
  it('counts whole days', () => {
    expect(daysUntilDate('2026-10-15', NOW)).toBe(5);
    expect(daysUntilDate('2026-10-10', NOW)).toBe(0);
    expect(daysUntilDate('2026-10-09', NOW)).toBe(-1);
    expect(daysUntilDate(null, NOW)).toBeNull();
  });
});

describe('validation', () => {
  it('name', () => {
    expect(validateName('A')).toMatch(/at least 2/);
    expect(validateName('Asha')).toBeNull();
    expect(validateName('x'.repeat(41))).toMatch(/too long/);
  });

  it('email is optional but must look right when given', () => {
    expect(validateEmail('')).toBeNull();
    expect(validateEmail('asha@example.com')).toBeNull();
    expect(validateEmail('asha@')).toMatch(/valid email/);
  });

  it('exam date is optional, real and not in the past', () => {
    expect(validateTargetDate('', NOW)).toBeNull();
    expect(validateTargetDate('15/10/2026', NOW)).toBeNull();
    expect(validateTargetDate('10/10/2026', NOW)).toBeNull();
    expect(validateTargetDate('09/10/2026', NOW)).toMatch(/past/);
    expect(validateTargetDate('99/99/2026', NOW)).toMatch(/DD\/MM\/YYYY/);
  });
});
