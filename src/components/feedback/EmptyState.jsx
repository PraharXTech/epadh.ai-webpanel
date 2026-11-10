import AppIcon from '@/components/common/AppIcon';

// "Nothing here yet" block: icon, title, a line of help and an optional action.
export default function EmptyState({
  icon = 'info',
  title,
  message,
  children,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center px-6 py-10 text-center ${className}`}>
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
        <AppIcon name={icon} size={26} color="#64748b" />
      </span>
      <h3 className="mt-4 text-base font-bold text-slate-900">{title}</h3>
      {message ? (
        <p className="mt-1 max-w-sm text-sm text-slate-500">{message}</p>
      ) : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}
