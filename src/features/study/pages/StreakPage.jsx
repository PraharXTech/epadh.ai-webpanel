import { useState } from 'react';
import AppIcon from '@/components/common/AppIcon';
import ProgressBar from '@/components/common/ProgressBar';
import ScreenHeader from '@/components/common/ScreenHeader';
import BarChart from '@/components/charts/BarChart';
import EmptyState from '@/components/feedback/EmptyState';
import Tabs, { TabPanel } from '@/components/ui/Tabs';
import StreakHeatmap from '../components/StreakHeatmap';
import useStreak from '../hooks/useStreak';
import useStudyHistory from '../hooks/useStudyHistory';
import {
  addDays,
  lastDays,
  STREAK_MIN_MINUTES,
  weekTotals,
} from '../utils/streak';

const DAY_HEADING = new Intl.DateTimeFormat('en-IN', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});
const TIME = new Intl.DateTimeFormat('en-IN', {
  hour: 'numeric',
  minute: '2-digit',
});

const dayHeading = (key, today) => {
  if (key === today) {
    return 'Today';
  }
  if (key === addDays(today, -1)) {
    return 'Yesterday';
  }
  const [y, m, d] = key.split('-').map(Number);
  return DAY_HEADING.format(new Date(y, m - 1, d));
};

const duration = seconds =>
  seconds >= 3600
    ? `${Math.floor(seconds / 3600)} h ${Math.round((seconds % 3600) / 60)} min`
    : seconds >= 60
      ? `${Math.round(seconds / 60)} min`
      : `${seconds} s`;

const Stat = ({ label, value }) => (
  <div className="flex-1 rounded-xl bg-white py-3 text-center">
    <p className="text-lg font-extrabold text-slate-900">{value}</p>
    <p className="mt-0.5 text-[11px] text-slate-500">{label}</p>
  </div>
);

// Streak and study activity: the flame and run, today's progress, a month calendar, 7-day and
// 4-week bars, all-time numbers and the last 14 days of study sessions. Not in the mobile
// code (mobile phase.md describes it); built here from that description.
export default function StreakPage() {
  const streak = useStreak();
  const { today, days, sessions, totals } = streak;
  const history = useStudyHistory(sessions, today);
  const [range, setRange] = useState('week');

  const active = streak.current > 0;
  const progress = Math.min(
    100,
    Math.round((streak.todayMinutes / STREAK_MIN_MINUTES) * 100),
  );

  return (
    <div className="mx-auto max-w-3xl pb-8">
      <ScreenHeader title="Streak" subtitle="Your study activity" />

      <div className="mx-4 flex flex-col items-center rounded-2xl bg-white px-4 py-6 shadow-sm">
        <span
          className={`flex h-16 w-16 items-center justify-center rounded-full ${
            active ? 'bg-orange-100' : 'bg-slate-100'
          }`}>
          <AppIcon
            name="flame"
            size={34}
            color={active ? '#ea580c' : '#94a3b8'}
          />
        </span>
        <p className="mt-3 text-4xl font-extrabold text-slate-900">
          {streak.current}
        </p>
        <p className="text-sm text-slate-500">
          day{streak.current === 1 ? '' : 's'} in a row
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Longest streak: <b className="text-slate-700">{streak.longest}</b>
        </p>

        <div className="mt-5 w-full max-w-sm">
          <div className="mb-1 flex justify-between text-xs">
            <span className="font-semibold text-slate-700">Today</span>
            <span className="text-slate-500">
              {streak.todayCounted
                ? 'Counted!'
                : `${streak.todayMinutes} / ${STREAK_MIN_MINUTES} min`}
            </span>
          </div>
          <ProgressBar
            percent={streak.todayCounted ? 100 : progress}
            label="Progress toward today's streak"
          />
          <p
            className={`mt-2 text-center text-xs ${
              streak.atRisk ? 'font-semibold text-amber-700' : 'text-slate-500'
            }`}>
            {streak.todayCounted
              ? 'Today counts toward your streak.'
              : `Study ${streak.minutesToKeepStreak} more minute${
                  streak.minutesToKeepStreak === 1 ? '' : 's'
                } or finish one practice test to ${active ? 'keep your streak' : 'start a streak'}.`}
          </p>
        </div>
      </div>

      <div className="mx-4 mt-3 flex gap-2">
        <Stat label="Days studied" value={totals.daysStudied} />
        <Stat label="Sessions" value={totals.sessions} />
        <Stat label="Total time" value={duration(totals.seconds)} />
      </div>

      <div className="mx-4 mt-4">
        <StreakHeatmap days={days} today={today} />
      </div>

      <section
        aria-label="Study time"
        className="mx-4 mt-4 rounded-2xl bg-white p-4 shadow-sm">
        <Tabs
          id="range"
          label="Study time range"
          variant="pill"
          items={[
            { id: 'week', label: 'Last 7 days' },
            { id: 'weeks', label: 'Last 4 weeks' },
          ]}
          value={range}
          onChange={setRange}
        />
        <TabPanel tabsId="range" id="week" value={range} className="mt-4">
          <BarChart
            label="Minutes studied, last 7 days"
            unit="min"
            data={lastDays(days, 7, today).map(d => ({
              label: d.label,
              value: d.minutes,
            }))}
          />
        </TabPanel>
        <TabPanel tabsId="range" id="weeks" value={range} className="mt-4">
          <BarChart
            label="Minutes studied, last 4 weeks"
            unit="min"
            data={weekTotals(days, 4, today).map(w => ({
              label: w.label,
              value: w.minutes,
            }))}
          />
        </TabPanel>
      </section>

      <section aria-label="Study history" className="mx-4 mt-4">
        <h2 className="mb-2 text-sm font-bold text-slate-700">
          Study history · last 14 days
        </h2>
        {history.length === 0 ? (
          <div className="rounded-2xl bg-white shadow-sm">
            <EmptyState
              icon="clock"
              title="No study sessions yet"
              message="Read some material or take a practice test and it will show up here."
            />
          </div>
        ) : (
          history.map(group => (
            <div key={group.key} className="mb-3">
              <h3 className="mb-1 text-xs font-semibold text-slate-500">
                {dayHeading(group.key, today)}
              </h3>
              <ul className="overflow-hidden rounded-2xl bg-white shadow-sm">
                {group.sessions.map((s, i) => (
                  <li
                    key={s.id}
                    className={`flex items-center px-4 py-3 ${
                      i < group.sessions.length - 1
                        ? 'border-b border-slate-100'
                        : ''
                    }`}>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-900">
                        {s.name}
                      </span>
                      <span className="block text-[11px] text-slate-500">
                        {s.typeLabel} · {TIME.format(new Date(s.end))}
                      </span>
                    </span>
                    <span className="ml-3 text-sm font-bold text-slate-700">
                      {duration(s.seconds)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
