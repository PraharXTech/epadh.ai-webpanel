import { useRef } from 'react';

// Six visible boxes over ONE real input, so paste, browser / phone SMS autofill
// (autocomplete="one-time-code") and screen readers all work without per-box focus code.
// The input is transparent and stretched over the boxes, so a click anywhere focuses it.
export default function OtpInput({
  value,
  onChange,
  length = 6,
  hasError,
  errorId,
}) {
  const inputRef = useRef(null);
  const activeIndex = Math.min(value.length, length - 1);

  return (
    <div className="relative">
      <div className="flex justify-between gap-2" aria-hidden="true">
        {Array.from({ length }).map((_, i) => {
          const focused = i === activeIndex;
          return (
            <div
              key={i}
              className={`flex h-14 w-12 items-center justify-center rounded-2xl border bg-white text-xl font-bold text-slate-900 ${
                hasError
                  ? 'border-red-400'
                  : focused
                    ? 'border-blue-600 ring-2 ring-blue-200'
                    : 'border-slate-200'
              }`}>
              {value[i] ?? ''}
            </div>
          );
        })}
      </div>
      <input
        ref={inputRef}
        value={value}
        onChange={event =>
          onChange(event.target.value.replace(/\D/g, '').slice(0, length))
        }
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={length}
        autoFocus
        autoComplete="one-time-code"
        aria-label={`${length}-digit verification code`}
        aria-invalid={hasError ? true : undefined}
        aria-describedby={hasError ? errorId : undefined}
        className="absolute inset-0 h-full w-full cursor-text bg-transparent text-transparent caret-transparent outline-none"
      />
    </div>
  );
}
