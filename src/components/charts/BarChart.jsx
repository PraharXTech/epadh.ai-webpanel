// Small bar chart in plain DOM (no chart library, same decision as mobile). Used for the
// 7-day study activity and accuracy-per-subject views.
//   <BarChart data={[{ label: 'Mon', value: 25 }, ...]} max={60} unit="min" />
// `max` defaults to the largest value, so the tallest bar always fills the height.
export default function BarChart({
  data,
  max,
  height = 120,
  unit = '',
  label = 'Bar chart',
  color = 'bg-blue-600',
  className = '',
}) {
  const top = max ?? Math.max(1, ...data.map(item => item.value));
  const summary = data
    .map(item => `${item.label} ${item.value}${unit ? ` ${unit}` : ''}`)
    .join(', ');

  return (
    <div
      role="img"
      aria-label={`${label}: ${summary}`}
      className={`flex items-end gap-2 ${className}`}
      style={{ height: height + 24 }}>
      {data.map(item => {
        const percent = Math.min(100, (item.value / top) * 100);
        return (
          <div
            key={item.label}
            className="flex h-full min-w-0 flex-1 flex-col items-center justify-end">
            <div
              className="flex w-full items-end justify-center"
              style={{ height }}>
              <div
                data-bar
                className={`w-full max-w-8 rounded-t-md ${color} ${
                  item.value > 0 ? 'min-h-1' : ''
                }`}
                style={{ height: `${percent}%` }}
              />
            </div>
            <span className="mt-1 h-5 text-[11px] text-slate-500">
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
