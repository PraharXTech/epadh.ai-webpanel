import { useState } from 'react';
import AppIcon from '@/components/common/AppIcon';
import { monthGrid } from '../utils/streak';

const HEADINGS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MONTH = new Intl.DateTimeFormat('en-IN', {
  month: 'long',
  year: 'numeric',
});
const LONG_DAY = new Intl.DateTimeFormat('en-IN', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

const shade = cell => {
  if (cell.isFuture) {
    return 'bg-slate-50 text-slate-300';
  }
  if (cell.counted) {
    return cell.minutes >= 45
      ? 'bg-green-600 text-white'
      : cell.minutes >= 25
        ? 'bg-green-500 text-white'
        : 'bg-green-400 text-white';
  }
  return cell.minutes > 0
    ? 'bg-green-100 text-green-800'
    : 'bg-slate-100 text-slate-500';
};

const describe = cell => {
  const [y, m, d] = cell.key.split('-').map(Number);
  const when = LONG_DAY.format(new Date(y, m - 1, d));
  if (cell.isFuture) {
    return when;
  }
  return `${when}: ${cell.minutes} min studied${cell.counted ? ', counted toward your streak' : ''}`;
};

// One month as a calendar. Green days counted toward the streak (darker = more minutes), pale
// green days had some study but not enough, grey days none. Arrows move between months;
// the next-month arrow stops at the current month.
export default function StreakHeatmap({ days, today }) {
  const [year, month] = today.split('-').map(Number);
  const [offset, setOffset] = useState(0); // months back from today's month
  const shown = new Date(year, month - 1 - offset, 1);
  const grid = monthGrid(days, shown.getFullYear(), shown.getMonth(), today);

  return (
    <section
      aria-label="Study calendar"
      className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setOffset(o => o + 1)}
          aria-label="Previous month"
          className="rounded-full p-2 hover:bg-slate-100">
          <AppIcon name="chevron-left" size={18} color="#334155" />
        </button>
        <h2 className="text-sm font-bold text-slate-900">
          {MONTH.format(shown)}
        </h2>
        <button
          type="button"
          onClick={() => setOffset(o => o - 1)}
          disabled={offset === 0}
          aria-label="Next month"
          className="rounded-full p-2 hover:bg-slate-100 disabled:opacity-30">
          <AppIcon name="chevron-right" size={18} color="#334155" />
        </button>
      </div>

      <table className="w-full table-fixed border-separate border-spacing-1">
        <thead>
          <tr>
            {HEADINGS.map((h, i) => (
              <th
                key={i}
                scope="col"
                className="pb-1 text-[11px] font-semibold text-slate-400">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.map((row, r) => (
            <tr key={r}>
              {row.map((cell, c) => (
                <td key={c} className="p-0">
                  {cell ? (
                    <div
                      role="img"
                      aria-label={describe(cell)}
                      title={describe(cell)}
                      className={`flex aspect-square items-center justify-center rounded-lg text-xs font-semibold ${shade(
                        cell,
                      )} ${cell.isToday ? 'ring-2 ring-blue-600' : ''}`}>
                      {cell.date}
                    </div>
                  ) : null}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
        <li className="flex items-center">
          <span className="mr-1.5 h-3 w-3 rounded bg-green-500" /> Counted
        </li>
        <li className="flex items-center">
          <span className="mr-1.5 h-3 w-3 rounded bg-green-100" /> Some study
        </li>
        <li className="flex items-center">
          <span className="mr-1.5 h-3 w-3 rounded bg-slate-100" /> None
        </li>
      </ul>
    </section>
  );
}
