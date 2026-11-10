import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import ConfirmDialog from '@/components/feedback/ConfirmDialog';
import { setAlertListener } from '@/services/alerts/alertStore';

// Renders what `showAlert()` (services/alerts/alertStore.js, copied from mobile) asks for.
// Web rule: a plain notice (one OK button, nothing to run) is a toast; a real choice is a
// modal ConfirmDialog. Mount once, inside the providers.
const TOAST_BY_TONE = {
  success: toast.success,
  danger: toast.error,
  warning: toast.error,
};

export default function AlertHost() {
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    setAlertListener(next => {
      const { title, message, buttons, tone } = next;
      if (buttons.length === 1 && !buttons[0].onPress) {
        const show = TOAST_BY_TONE[tone] ?? toast;
        show(message ? `${title}. ${message}` : title);
        return;
      }
      setAlert(next);
    });
    return () => setAlertListener(null);
  }, []);

  if (!alert) {
    return null;
  }
  return (
    <ConfirmDialog
      {...alert}
      onButtonPress={button => {
        setAlert(null);
        button.onPress?.();
      }}
    />
  );
}
