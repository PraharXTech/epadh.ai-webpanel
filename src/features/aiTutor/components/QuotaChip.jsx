import AppIcon from '@/components/common/AppIcon';

// "8/10 left today" header chip (plan.md section 5.9). Hidden entirely when the student has no
// daily limit (Pro / a backend-configured unlimited quota). Pressing it when the allowance is
// used up opens the upgrade prompt.
export default function QuotaChip({ limit, remaining, onPress }) {
  if (limit == null) {
    return null;
  }
  const atLimit = remaining <= 0;

  return (
    <button
      type="button"
      onClick={onPress}
      disabled={!atLimit}
      className={`flex items-center rounded-full px-2.5 py-1 ${
        atLimit ? 'bg-red-50' : 'bg-blue-50'
      }`}>
      <AppIcon
        name="sparkles"
        size={12}
        color={atLimit ? '#dc2626' : '#2563eb'}
      />
      <span
        className={`ml-1 text-[11px] font-semibold whitespace-nowrap ${
          atLimit ? 'text-red-600' : 'text-blue-600'
        }`}>
        {remaining}/{limit} left today
      </span>
    </button>
  );
}
