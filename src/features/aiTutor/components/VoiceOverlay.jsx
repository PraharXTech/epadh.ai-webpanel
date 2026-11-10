import AppIcon from '@/components/common/AppIcon';
import Button from '@/components/ui/Button';
import Chip from '@/components/ui/Chip';
import Modal from '@/components/ui/Modal';

const LANGS = [
  { id: 'hi', label: 'हिंदी' },
  { id: 'en', label: 'English' },
];

// Voice assistant overlay (plan.md section 5.10): mic -> live transcript -> editable text ->
// send. The transcript is handed back to the caller, which sends it exactly like a typed
// message.
export default function VoiceOverlay({
  visible,
  listening,
  lang,
  transcript,
  onChangeTranscript,
  onSwitchLang,
  onToggleMic,
  onCancel,
  onSend,
}) {
  return (
    <Modal
      open={visible}
      title="Voice question"
      placement="bottom"
      onClose={onCancel}>
      <div className="px-5 pt-5 pb-8">
        <div className="mb-4 flex items-center justify-between">
          <p role="status" className="text-lg font-bold text-slate-900">
            {listening ? 'Sun raha hoon…' : 'Apna sawal check karo'}
          </p>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel"
            className="rounded-full p-1 hover:bg-slate-100">
            <AppIcon name="close" size={22} color="#475569" />
          </button>
        </div>

        <div
          role="group"
          aria-label="Language"
          className="mb-4 flex justify-center gap-2">
          {LANGS.map(l => (
            <Chip
              key={l.id}
              selected={lang === l.id}
              onClick={() => onSwitchLang(l.id)}>
              {l.label}
            </Chip>
          ))}
        </div>

        <label className="block min-h-[72px] rounded-2xl bg-slate-50 px-4 py-3">
          <span className="sr-only">What was heard</span>
          <textarea
            value={transcript}
            onChange={event => onChangeTranscript(event.target.value)}
            rows={3}
            placeholder={
              listening ? 'Bolna shuru kijiye…' : 'Kuch sunayi nahi diya'
            }
            className="block w-full resize-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          />
        </label>

        <div className="mt-5 flex flex-col items-center">
          <button
            type="button"
            onClick={onToggleMic}
            aria-label={listening ? 'Stop listening' : 'Start listening'}
            data-autofocus
            className={`flex h-16 w-16 items-center justify-center rounded-full text-white ${
              listening
                ? 'animate-pulse bg-red-500'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}>
            <AppIcon name="mic" size={26} color="#ffffff" />
          </button>
          <p className="mt-2 text-xs text-slate-400">
            {listening ? 'Tap to stop' : 'Tap to speak again'}
          </p>
        </div>

        {!listening && transcript.trim() ? (
          <Button
            fullWidth
            className="mt-5"
            onClick={() => onSend(transcript.trim())}>
            Send
          </Button>
        ) : null}
      </div>
    </Modal>
  );
}
