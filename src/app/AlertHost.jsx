import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { setAlertListener } from '@/services/alerts/alertStore';

// Renders what `showAlert()` (services/alerts/alertStore.js, copied from mobile) asks for.
// Web rule: a plain notice (one OK button) is a toast; a real choice (2+ buttons) is a
// modal dialog. Mount once, inside the providers.
const TOAST_BY_TONE = {
  success: toast.success,
  danger: toast.error,
  warning: toast.error,
};

export default function AlertHost() {
  const [dialog, setDialog] = useState(null);

  useEffect(() => {
    setAlertListener(alert => {
      const { title, message, buttons, tone } = alert;
      if (buttons.length === 1 && !buttons[0].onPress) {
        const show = TOAST_BY_TONE[tone] ?? toast;
        show(message ? `${title}. ${message}` : title);
        return;
      }
      setDialog(alert);
    });
    return () => setAlertListener(null);
  }, []);

  if (!dialog) {
    return null;
  }

  const choose = button => {
    setDialog(null);
    button.onPress?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="alert-title"
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
        <h2 id="alert-title" className="text-lg font-bold text-slate-900">
          {dialog.title}
        </h2>
        {dialog.message ? (
          <p className="mt-1 text-sm text-slate-600">{dialog.message}</p>
        ) : null}
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          {dialog.buttons.map(button => (
            <button
              key={button.text}
              type="button"
              autoFocus={button.style !== 'destructive'}
              onClick={() => choose(button)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                button.style === 'destructive'
                  ? 'bg-rose-600 text-white'
                  : button.style === 'cancel'
                    ? 'bg-slate-100 text-slate-700'
                    : 'bg-blue-600 text-white'
              }`}>
              {button.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
