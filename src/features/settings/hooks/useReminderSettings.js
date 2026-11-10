import { useDispatch, useSelector } from 'react-redux';
import { showAlert } from '@/services/alerts/alertStore';
import {
  openNotificationSettings,
  requestNotificationPermission,
} from '@/services/notifications/localNotifications';
import { useT } from '@/localization';
import {
  selectNotificationPermission,
  selectReminders,
} from '@/store/selectors/settingsSelectors';
import {
  setNotificationPermission,
  setStreakReminder,
  updateStudyReminder,
} from '../store/settingsSlice';
import { stepTime, TIME_STEP_MINUTES } from '../utils/reminders';

// What the Settings screen needs for reminders. Turning one on asks the phone for
// permission first (in a way the student can follow); if it is refused the switch
// stays off and the alert offers the phone's notification settings.
export default function useReminderSettings() {
  const dispatch = useDispatch();
  const t = useT();
  const reminders = useSelector(selectReminders);
  const permission = useSelector(selectNotificationPermission);

  const ensurePermission = async () => {
    if (permission === 'granted') {
      return true;
    }
    let status;
    try {
      status = await requestNotificationPermission();
    } catch (e) {
      status = 'denied';
    }
    dispatch(setNotificationPermission(status));
    if (status !== 'granted') {
      showAlert(
        t('settings.permissionTitle'),
        t('settings.permissionBody'),
        [
          {
            text: t('settings.openSettings'),
            onPress: () => openNotificationSettings().catch(() => {}),
          },
          { text: t('common.cancel'), style: 'cancel' },
        ],
        { tone: 'warning', icon: 'bell' },
      );
      return false;
    }
    return true;
  };

  const toggle = async (enabled, apply) => {
    if (enabled && !(await ensurePermission())) {
      return;
    }
    dispatch(apply(enabled));
  };

  return {
    study: reminders.study,
    streak: reminders.streak,
    toggleStudy: enabled =>
      toggle(enabled, value => updateStudyReminder({ enabled: value })),
    toggleStreak: enabled => toggle(enabled, setStreakReminder),
    shiftStudyTime: direction =>
      dispatch(
        updateStudyReminder(
          stepTime(reminders.study, direction * TIME_STEP_MINUTES),
        ),
      ),
  };
}
