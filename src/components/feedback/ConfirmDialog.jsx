import AppIcon from '@/components/common/AppIcon';
import Modal from '@/components/ui/Modal';

const TONES = {
  default: { icon: 'info', color: '#2563eb', bg: 'bg-blue-100' },
  warning: { icon: 'circle-alert', color: '#b45309', bg: 'bg-amber-100' },
  danger: { icon: 'circle-x', color: '#dc2626', bg: 'bg-red-100' },
  success: { icon: 'circle-check', color: '#16a34a', bg: 'bg-green-100' },
};

const BUTTON = {
  cancel: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
  destructive: 'bg-red-600 text-white hover:bg-red-700',
  default: 'bg-blue-600 text-white hover:bg-blue-700',
};

// Web port of mobile CustomAlert: an icon-led dialog. `buttons` is
// [{ text, style?: 'default' | 'cancel' | 'destructive', onPress? }]. Three or more
// buttons stack; one or two sit side by side. Pressing Escape triggers the `cancel` button
// when there is one; with no cancel button the dialog must be answered.
export default function ConfirmDialog({
  open = true,
  title,
  message,
  buttons,
  tone = 'default',
  icon,
  onButtonPress,
}) {
  const look = TONES[tone] ?? TONES.default;
  const cancel = buttons.find(button => button.style === 'cancel');
  const stacked = buttons.length > 2;

  return (
    <Modal
      open={open}
      title={title}
      dismissible={Boolean(cancel)}
      onClose={() => cancel && onButtonPress(cancel)}>
      <div className="px-6 pt-6 pb-5">
        <div
          className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${look.bg}`}>
          <AppIcon name={icon ?? look.icon} size={26} color={look.color} />
        </div>
        <p
          aria-hidden="true"
          className="mt-4 text-center text-lg font-extrabold text-slate-900">
          {title}
        </p>
        {message ? (
          <p className="mt-2 text-center text-sm leading-5 text-slate-500">
            {message}
          </p>
        ) : null}
        <div className={`mt-6 flex gap-2 ${stacked ? 'flex-col' : ''}`}>
          {buttons.map(button => (
            <button
              key={button.text}
              type="button"
              data-autofocus={button.style !== 'destructive' ? '' : undefined}
              onClick={() => onButtonPress(button)}
              className={`min-h-11 flex-1 rounded-full px-4 text-sm font-semibold transition-colors ${
                BUTTON[button.style] ?? BUTTON.default
              }`}>
              {button.text}
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}
