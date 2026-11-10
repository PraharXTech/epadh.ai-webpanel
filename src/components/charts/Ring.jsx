// Circular progress (syllabus %, daily goal). SVG, no library. Children are drawn in the
// middle: <Ring percent={72}><b>72%</b></Ring>.
export default function Ring({
  percent = 0,
  size = 96,
  stroke = 10,
  color = '#2563eb',
  track = '#e2e8f0',
  label,
  children,
}) {
  const value = Math.min(100, Math.max(0, percent));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value)}
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={track}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - value / 100)}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
