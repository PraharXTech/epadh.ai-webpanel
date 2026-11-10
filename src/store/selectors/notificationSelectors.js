export const selectNotifications = state => state.notifications.items;
export const selectNotificationsStatus = state => state.notifications.status;
// A number, so the Home bell does not re-render when nothing about the count changed.
export const selectUnreadNotificationCount = state =>
  state.notifications.items.filter(n => !n.read).length;
