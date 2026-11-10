// A slim message strip at the top of a page, with an optional action ("Retry").
export default function NoticeBanner({ message, actionLabel, onAction }) {
  return (
    <div
      role="status"
      className="flex items-center bg-amber-100 px-4 py-2 text-amber-900">
      <p className="flex-1 text-xs">{message}</p>
      {actionLabel ? (
        <button
          type="button"
          onClick={onAction}
          className="ml-3 text-xs font-bold text-blue-700 hover:underline">
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
