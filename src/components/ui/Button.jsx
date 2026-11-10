import AppIcon from '@/components/common/AppIcon';

const VARIANTS = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300',
  secondary:
    'bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-60',
  outline:
    'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-60',
  danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300',
  ghost: 'text-blue-600 hover:bg-blue-50 disabled:opacity-60',
};

// Heights keep a 44 px touch target (plan.md section 8) except `sm`, for dense toolbars.
const SIZES = {
  sm: 'min-h-9 px-4 text-xs',
  md: 'min-h-11 px-5 text-sm',
  lg: 'min-h-12 px-6 text-base',
};

// The app's one button. `loading` disables it and shows a spinner, which also covers the
// double-tap guard the payment flow needs (mobile plan.md section 5.18).
export default function Button({
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  fullWidth = false,
  type = 'button',
  disabled,
  className = '',
  children,
  ...rest
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors disabled:cursor-not-allowed ${
        VARIANTS[variant]
      } ${SIZES[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}>
      {loading ? (
        <span
          aria-hidden="true"
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : icon ? (
        <AppIcon name={icon} size={18} color="currentColor" />
      ) : null}
      {children}
    </button>
  );
}
