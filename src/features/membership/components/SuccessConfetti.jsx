// Small scattered pieces around the success checkmark. Purely decorative, absolutely
// positioned inside whatever square the parent gives it. They pop in once; with "reduce
// motion" set they simply appear (see `.confetti-piece` in styles/tokens.css).
const PIECES = [
  { top: '2%', left: '16%', size: 14, color: '#60a5fa', rotate: 15 },
  { top: '6%', left: '76%', size: 12, color: '#fbbf24', rotate: -20 },
  { top: '2%', left: '46%', size: 10, color: '#34d399', rotate: -25 },
  { top: '40%', left: '0%', size: 12, color: '#f97316', rotate: 30 },
  { top: '36%', left: '92%', size: 10, color: '#60a5fa', rotate: -10 },
  { top: '70%', left: '6%', size: 10, color: '#fbbf24', rotate: 10 },
  { top: '74%', left: '86%', size: 12, color: '#34d399', rotate: 20 },
];

export default function SuccessConfetti() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {PIECES.map((piece, i) => (
        <span
          key={i}
          className="confetti-piece absolute rounded-[3px]"
          style={{
            top: piece.top,
            left: piece.left,
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.color,
            '--rotate': `${piece.rotate}deg`,
            animationDelay: `${i * 60}ms`,
          }}
        />
      ))}
    </div>
  );
}
