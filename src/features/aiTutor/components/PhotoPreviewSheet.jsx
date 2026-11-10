import { useState } from 'react';
import AppIcon from '@/components/common/AppIcon';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

// Preview of a captured / picked doubt photo, with an optional note before it is sent to the
// (mocked) vision AI (plan.md section 5.9: capture -> crop -> preview + note -> send).
export default function PhotoPreviewSheet({ image, onCancel, onSend }) {
  const [note, setNote] = useState('');

  return (
    <Modal
      open={Boolean(image)}
      title="Send this photo?"
      placement="bottom"
      onClose={onCancel}>
      <div className="px-5 pt-4 pb-8">
        <div className="mb-3 flex items-center justify-between">
          <p aria-hidden="true" className="text-lg font-bold text-slate-900">
            Send this photo?
          </p>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel"
            className="rounded-full p-1 hover:bg-slate-100">
            <AppIcon name="close" size={22} color="#475569" />
          </button>
        </div>

        {image ? (
          <img
            src={image.uri}
            alt="Your photo, ready to send"
            className="h-56 w-full rounded-2xl bg-slate-100 object-contain"
          />
        ) : null}

        <label className="mt-3 block rounded-2xl bg-slate-50 px-4 py-3">
          <span className="sr-only">Note (optional)</span>
          <textarea
            value={note}
            onChange={event => setNote(event.target.value)}
            rows={2}
            placeholder="Add a note (optional) — e.g. jis line mein atak gaye"
            className="block w-full resize-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          />
        </label>

        <Button
          fullWidth
          className="mt-4"
          data-autofocus
          onClick={() => {
            onSend(note.trim());
            setNote('');
          }}>
          Send to epadh.ai
        </Button>
      </div>
    </Modal>
  );
}
