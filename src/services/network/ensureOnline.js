import { showAlert } from '@/services/alerts/alertStore';
import { isOnline } from './network';

const MESSAGES = {
  ai: 'Ask epadh.ai needs an internet connection. Connect and try again.',
  photo: 'Photo doubts need an internet connection. Connect and try again.',
  payment: 'Payments need an internet connection. Connect and try again.',
  omr: 'Scanning an OMR sheet needs an internet connection. Connect and try again.',
  generic: 'This needs an internet connection. Connect and try again.',
};

// Gate for features that cannot work offline (AI, payment, OMR). Returns true when it
// is fine to go ahead; otherwise tells the student why and returns false.
export const ensureOnline = (feature = 'generic') => {
  if (isOnline()) {
    return true;
  }
  showAlert("You're offline", MESSAGES[feature] ?? MESSAGES.generic, null, {
    tone: 'warning',
    icon: 'wifi-off',
  });
  return false;
};
