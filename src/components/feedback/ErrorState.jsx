import AppIcon from '@/components/common/AppIcon';
import Button from '@/components/ui/Button';

// A failed load with a way out. `message` is already user-facing (getErrorMessage in
// api/client.js turns any failure into one).
export default function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try again',
  className = '',
}) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center px-6 py-10 text-center ${className}`}>
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
        <AppIcon name="circle-alert" size={26} color="#dc2626" />
      </span>
      <h3 className="mt-4 text-base font-bold text-slate-900">{title}</h3>
      {message ? (
        <p className="mt-1 max-w-sm text-sm text-slate-500">{message}</p>
      ) : null}
      {onRetry ? (
        <Button className="mt-4" onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}
