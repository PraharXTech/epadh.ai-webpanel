import { showAlert } from '@/services/alerts/alertStore';
import { logoutUser } from '../store/authSlice';

// "Log out?" dialog shared by Profile and the sidebar.
export const confirmLogout = dispatch =>
  showAlert(
    'Log out?',
    'Your progress stays saved on this account. You can log back in any time.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: () => dispatch(logoutUser()),
      },
    ],
    { tone: 'danger', icon: 'log-out' },
  );
