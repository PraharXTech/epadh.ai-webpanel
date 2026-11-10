import { useRef, useState } from 'react';
import AppIcon from '@/components/common/AppIcon';
import { showAlert } from '@/services/alerts/alertStore';
import { canUseCameraDirectly } from '@/services/media/photoPicker';

// On a phone: ask Camera or Gallery. On a laptop there is only the file chooser (a "camera"
// choice would open the same thing), so go straight to it.
const choosePhotoSource = onPick => {
  if (!canUseCameraDirectly()) {
    onPick('gallery');
    return;
  }
  showAlert(
    'Add a photo',
    'Take a new photo or pick one from your gallery.',
    [
      { text: 'Camera', onPress: () => onPick('camera') },
      { text: 'Gallery', onPress: () => onPick('gallery') },
      { text: 'Cancel', style: 'cancel' },
    ],
    { icon: 'camera' },
  );
};

const MAX_HEIGHT = 144; // px, about six lines

// Text box + send, plus the Photo Doubt Solver and Voice assistant entry points
// (plan.md sections 5.9, 5.10). Enter sends, Shift+Enter adds a line, and a photo pasted from
// the clipboard (a screenshot) goes through the same flow as a chosen one.
// `onPickPhoto('camera' | 'gallery')`, `onPasteImage(file)` and `onMic()` drive the actual
// capture / listening, owned by the page.
export default function ChatComposer({
  onSend,
  onPickPhoto,
  onPasteImage,
  onMic,
  voiceSupported = true,
  disabled,
}) {
  const [text, setText] = useState('');
  const area = useRef(null);

  const resize = () => {
    const el = area.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
    }
  };

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) {
      return;
    }
    setText('');
    onSend(trimmed);
    requestAnimationFrame(() => {
      if (area.current) {
        area.current.style.height = 'auto';
        area.current.focus();
      }
    });
  };

  const onKeyDown = event => {
    if (
      event.key === 'Enter' &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      submit();
    }
  };

  const onPaste = event => {
    const file = [...(event.clipboardData?.files ?? [])].find(f =>
      f.type.startsWith('image/'),
    );
    if (file && !disabled) {
      event.preventDefault();
      onPasteImage?.(file);
    }
  };

  const canSend = !disabled && text.trim();

  return (
    <div className="border-t border-slate-100 bg-white pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-3xl items-end px-3 py-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => choosePhotoSource(onPickPhoto)}
          aria-label="Ask with a photo"
          className="mr-1 mb-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-slate-100 disabled:opacity-50">
          <AppIcon
            name="camera"
            size={20}
            color={disabled ? '#cbd5e1' : '#64748b'}
          />
        </button>
        <button
          type="button"
          disabled={disabled || !voiceSupported}
          onClick={onMic}
          aria-label="Ask by voice"
          title={
            voiceSupported
              ? undefined
              : 'Voice input is not supported in this browser (try Chrome, Edge or Safari)'
          }
          className="mr-2 mb-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-slate-100 disabled:opacity-50">
          <AppIcon
            name="mic"
            size={20}
            color={disabled || !voiceSupported ? '#cbd5e1' : '#64748b'}
          />
        </button>

        <label className="flex-1 rounded-2xl bg-slate-100 px-4 py-2">
          <span className="sr-only">Your question</span>
          <textarea
            ref={area}
            value={text}
            rows={1}
            onChange={event => {
              setText(event.target.value);
              resize();
            }}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            placeholder="Apna sawal poochho…"
            className="block max-h-36 w-full resize-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          />
        </label>

        <button
          type="button"
          onClick={submit}
          disabled={!canSend}
          aria-label="Send"
          className={`mb-0.5 ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            canSend ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-200'
          }`}>
          <AppIcon
            name="send"
            size={17}
            color={canSend ? '#ffffff' : '#94a3b8'}
          />
        </button>
      </div>
    </div>
  );
}
