import AppIcon from '@/components/common/AppIcon';

// Shown under the last message when the reply failed: what went wrong, and a retry that
// re-sends that same message without adding a second bubble.
export default function RetryRow({ message, onRetry }) {
  return (
    <li
      role="alert"
      className="mx-4 mb-3 flex items-center rounded-2xl bg-red-50 px-4 py-3">
      <AppIcon name="circle-x" size={18} color="#dc2626" />
      <span className="ml-2 flex-1 text-xs text-red-700">
        {message || "Couldn't get an answer."}
      </span>
      <button
        type="button"
        onClick={onRetry}
        className="ml-3 rounded-full bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700">
        Retry
      </button>
    </li>
  );
}
