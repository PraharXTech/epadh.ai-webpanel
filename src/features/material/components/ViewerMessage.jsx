import Button from '@/components/ui/Button';

// Centred message with an optional action, used for viewer errors / empty states.
export default function ViewerMessage({
  title,
  detail,
  actionLabel,
  onAction,
}) {
  return (
    <div
      role="status"
      className="flex flex-1 flex-col items-center justify-center px-8 py-10 text-center">
      <p className="text-base font-semibold text-slate-800">{title}</p>
      {detail ? <p className="mt-1 text-sm text-slate-500">{detail}</p> : null}
      {onAction ? (
        <Button className="mt-4" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
