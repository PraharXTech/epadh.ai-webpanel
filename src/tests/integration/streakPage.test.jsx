import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { logout } from '@/features/auth/store/authSlice';
import StreakPage from '@/features/study/pages/StreakPage';
import { store } from '@/store';
import { dayKey } from '@/utils/date';
import { loadExamData } from '../utils/examData';
import { renderWithRealStore } from '../utils/renderWithRealStore';
import { addStudySession } from '../utils/study';

// The Streak page is not in the mobile code (its phase.md describes it), so these tests are new.
const SLOW = { timeout: 5000 };
const open = () =>
  renderWithRealStore(<StreakPage />, { entries: ['/', '/streak'], index: 1 });

describe('Streak page', () => {
  beforeEach(async () => {
    store.dispatch(logout());
    await loadExamData();
  }, 15000);

  it('starts empty for a new student', async () => {
    open();
    expect(
      await screen.findByRole('heading', { name: 'Streak', level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText('days in a row')).toBeInTheDocument();
    expect(
      screen.getByText(
        /Study 10 more minutes or finish one practice test to start a streak/,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('No study sessions yet')).toBeInTheDocument();
    expect(screen.getByText('Days studied').previousSibling).toHaveTextContent(
      '0',
    );
  });

  describe('with a week of study', () => {
    beforeEach(() => {
      // today + 3 days back in a row, a gap, then day 5 and day 9
      [0, 1, 2, 3, 5, 9].forEach(daysAgo =>
        addStudySession({ daysAgo, seconds: 15 * 60 }),
      );
      addStudySession({
        daysAgo: 0,
        seconds: 10 * 60,
        type: 'practice',
        refId: 't-ratio',
        hour: 16,
      });
      addStudySession({ daysAgo: 1, seconds: 5 * 60, refId: 'm1', hour: 18 });
      addStudySession({ daysAgo: 20, seconds: 30 * 60 }); // older than 14 days
    });

    it('shows the run, the best run and the all-time numbers', async () => {
      open();
      const label = await screen.findByText('days in a row');
      expect(label.previousSibling).toHaveTextContent('4');
      expect(screen.getByText(/Longest streak:/)).toHaveTextContent(
        'Longest streak: 4',
      );
      expect(
        screen.getByText('Days studied').previousSibling,
      ).toHaveTextContent('7');
      expect(screen.getByText('Sessions').previousSibling).toHaveTextContent(
        '9',
      );
      expect(
        screen.getByText('Today counts toward your streak.'),
      ).toBeInTheDocument();
      expect(screen.getByText('Counted!')).toBeInTheDocument();
    });

    it('marks counted days, a missed day and today on the calendar', async () => {
      open();
      await screen.findByText('days in a row');
      const calendar = screen.getByRole('region', { name: 'Study calendar' });
      const cells = within(calendar).getAllByRole('img');
      const today = new Date();
      const todayCell = cells.find(
        c =>
          c.textContent === String(today.getDate()) &&
          c.className.includes('ring-2'),
      );
      expect(todayCell).toBeDefined();
      expect(todayCell.getAttribute('aria-label')).toMatch(
        /25 min studied, counted toward your streak/,
      );

      const gap = new Date();
      gap.setDate(gap.getDate() - 4);
      if (gap.getMonth() === today.getMonth()) {
        const gapCell = cells.find(
          c => c.textContent === String(gap.getDate()),
        );
        expect(gapCell.getAttribute('aria-label')).toMatch(/0 min studied$/);
      }
    });

    it('moves between months and stops at the current one', async () => {
      open();
      await screen.findByText('days in a row');
      const heading = () =>
        within(
          screen.getByRole('region', { name: 'Study calendar' }),
        ).getByRole('heading');
      const current = heading().textContent;
      const next = screen.getByRole('button', { name: 'Next month' });
      expect(next).toBeDisabled();

      await userEvent.click(
        screen.getByRole('button', { name: 'Previous month' }),
      );
      expect(heading().textContent).not.toBe(current);
      expect(next).toBeEnabled();
      await userEvent.click(next);
      expect(heading().textContent).toBe(current);
      expect(next).toBeDisabled();
    });

    it('draws 7-day and 4-week bars, switched by tabs', async () => {
      open();
      await screen.findByText('days in a row');
      const week = screen.getByRole('img', {
        name: /Minutes studied, last 7 days/,
      });
      expect(week.getAttribute('aria-label')).toMatch(/25 min/); // today: 15 + 10

      await userEvent.click(screen.getByRole('tab', { name: 'Last 4 weeks' }));
      expect(
        screen.getByRole('img', {
          name: /Minutes studied, last 4 weeks.*This week/,
        }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('img', { name: /last 7 days/ }),
      ).not.toBeInTheDocument();
    });

    it('lists the last 14 days of sessions by day with names, kinds and durations', async () => {
      open();
      const history = await screen.findByRole(
        'region',
        { name: 'Study history' },
        SLOW,
      );
      expect(
        within(history).getByRole('heading', { name: 'Today' }),
      ).toBeInTheDocument();
      expect(
        within(history).getByRole('heading', { name: 'Yesterday' }),
      ).toBeInTheDocument();

      // names come from the topic / material the session was spent on
      expect(
        await within(history).findByText('Ratio & Proportion'),
      ).toBeInTheDocument();
      expect(within(history).getByText(/Practice · /)).toBeInTheDocument();
      expect(
        await within(history).findByText('Number System – Complete Notes'),
      ).toBeInTheDocument();
      expect(within(history).getAllByText('Percentage').length).toBeGreaterThan(
        0,
      );
      expect(within(history).getAllByText('15 min').length).toBeGreaterThan(0);

      // newest session first inside a day: the 4 pm practice before the 11 am study
      const todayList = within(history).getAllByRole('list')[0];
      const rows = within(todayList).getAllByRole('listitem');
      expect(rows[0]).toHaveTextContent('Ratio & Proportion');

      // 6 days back is within range; 20 days back is not
      expect(within(history).queryByText('30 min')).not.toBeInTheDocument();
    });
  });

  it('warns that the streak is at risk until today counts', async () => {
    addStudySession({ daysAgo: 1, seconds: 20 * 60 });
    addStudySession({ daysAgo: 2, seconds: 20 * 60 });
    addStudySession({ seconds: 3 * 60 });
    open();
    expect(
      await screen.findByText(
        /Study 7 more minutes or finish one practice test to keep your streak/,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('3 / 10 min')).toBeInTheDocument();
    expect(
      screen.getByRole('progressbar', {
        name: "Progress toward today's streak",
      }),
    ).toHaveAttribute('aria-valuenow', '30');
  });

  it('uses the calendar dates of the visitor (a streak day is a local day)', () => {
    expect(dayKey(new Date(2026, 8, 25, 23, 59))).toBe('2026-09-25');
    expect(dayKey(new Date(2026, 8, 26, 0, 1))).toBe('2026-09-26');
  });
});
