import AppIcon from '@/components/common/AppIcon';
import BottomSheet from './BottomSheet';

function Action({ icon, label, onPress, color = '#0f172a' }) {
  return (
    <button
      type="button"
      onClick={onPress}
      className="flex h-14 w-full items-center border-b border-slate-100 text-left hover:bg-slate-50">
      <AppIcon name={icon} color={color} size={22} />
      <span className="ml-4 text-base text-slate-800">{label}</span>
    </button>
  );
}

// The "three dots" menu of a material row.
export default function ItemActionSheet({
  item,
  bookmarked,
  downloaded,
  onToggleBookmark,
  onDownload,
  onClose,
}) {
  return (
    <BottomSheet visible={Boolean(item)} title={item?.title} onClose={onClose}>
      <Action
        icon="bookmark"
        color="#2563eb"
        label={bookmarked ? 'Remove bookmark' : 'Bookmark'}
        onPress={() => {
          onToggleBookmark(item);
          onClose();
        }}
      />
      {item?.type !== 'practice' ? (
        <Action
          icon={downloaded ? 'circle-check' : 'download'}
          color={downloaded ? '#16a34a' : '#475569'}
          label={downloaded ? 'Downloaded' : 'Download for offline'}
          onPress={() => {
            if (!downloaded) {
              onDownload(item);
            }
            onClose();
          }}
        />
      ) : null}
    </BottomSheet>
  );
}
