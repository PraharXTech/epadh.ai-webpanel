import AppIcon from '@/components/common/AppIcon';

const STYLES = {
  notes: { bg: 'bg-red-100', badge: 'bg-red-500' },
  pyq: { bg: 'bg-violet-100', badge: 'bg-violet-500' },
  video: { bg: 'bg-blue-100', badge: 'bg-blue-500' },
  practice: { bg: 'bg-emerald-100', badge: 'bg-emerald-500' },
};

const SYMBOL = {
  video: 'play',
  practice: 'file-text',
};

// Tinted square with a coloured badge: "PDF" for documents, an icon otherwise.
export default function MaterialTypeIcon({ type, format }) {
  const style = STYLES[type] ?? STYLES.notes;
  const symbol = format === 'html' ? 'file-text' : SYMBOL[type];

  return (
    <span
      aria-hidden="true"
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${style.bg}`}>
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-md ${style.badge}`}>
        {symbol ? (
          <AppIcon name={symbol} color="#ffffff" size={16} />
        ) : (
          <span className="text-[8px] font-extrabold text-white">PDF</span>
        )}
      </span>
    </span>
  );
}
