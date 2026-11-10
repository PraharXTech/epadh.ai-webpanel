import { useId, useState } from 'react';
import AppIcon from '../common/AppIcon';

// `icon` shows a leading icon; `prefix` shows any node (e.g. a country code) followed by a
// divider. Use one or the other. `type="password"` adds the show / hide toggle (mobile:
// `secureTextEntry`). Always pass `label`: it is read by screen readers, and is drawn above
// the field unless `hideLabel` is set (then it is visually hidden but still announced).
export default function TextField({
  label,
  hideLabel = false,
  icon,
  prefix,
  error,
  type = 'text',
  className = '',
  ...inputProps
}) {
  const id = useId();
  const errorId = `${id}-error`;
  const isPassword = type === 'password';
  const [shown, setShown] = useState(false);

  return (
    <div className={className}>
      {label ? (
        <label
          htmlFor={id}
          className={
            hideLabel
              ? 'sr-only'
              : 'mb-1 ml-1 block text-sm font-medium text-slate-700'
          }>
          {label}
        </label>
      ) : null}
      <div
        className={`flex h-14 items-center rounded-2xl border bg-white px-5 focus-within:ring-2 focus-within:ring-blue-200 ${
          error ? 'border-red-400' : 'border-slate-200'
        }`}>
        {icon ? <AppIcon name={icon} color="#64748b" size={20} /> : null}
        {prefix ? (
          <>
            {prefix}
            <span aria-hidden="true" className="mx-3 h-6 w-px bg-slate-300" />
          </>
        ) : null}
        <input
          id={id}
          type={isPassword && shown ? 'text' : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          autoCapitalize="none"
          className={`min-w-0 flex-1 bg-transparent py-0 text-[15px] text-slate-900 outline-none placeholder:text-slate-400 ${
            icon ? 'ml-3' : ''
          }`}
          {...inputProps}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setShown(value => !value)}
            aria-label={shown ? 'Hide password' : 'Show password'}
            className="rounded-full p-1">
            <AppIcon
              name={shown ? 'eye' : 'eye-off'}
              color="#64748b"
              size={22}
            />
          </button>
        ) : null}
      </div>
      {error ? (
        <p id={errorId} role="alert" className="mt-1 ml-1 text-xs text-red-500">
          {error}
        </p>
      ) : null}
    </div>
  );
}
