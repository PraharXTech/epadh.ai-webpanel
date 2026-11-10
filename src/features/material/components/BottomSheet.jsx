import AppIcon from '@/components/common/AppIcon';
import Modal from '@/components/ui/Modal';

// Bottom sheet on phones, centered dialog from 640 px up (ui/Modal placement="bottom"):
// dimmed backdrop (click or Escape to close), a title with a close button, and content.
export default function BottomSheet({ visible, title, onClose, children }) {
  return (
    <Modal open={visible} title={title} placement="bottom" onClose={onClose}>
      <div className="px-5 pt-4 pb-8">
        <div className="mb-3 flex items-center justify-between">
          <p
            aria-hidden="true"
            className="mr-3 flex-1 truncate text-lg font-bold text-slate-900">
            {title}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1 hover:bg-slate-100">
            <AppIcon name="close" color="#475569" size={22} />
          </button>
        </div>
        {children}
      </div>
    </Modal>
  );
}
