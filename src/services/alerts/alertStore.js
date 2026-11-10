// Tiny pub-sub so `showAlert` can be called from anywhere — a hook, a service, an
// event handler, not just from inside a component with access to state — exactly
// like React Native's own Alert.alert. The one <AlertHost/> mounted at the app root
// (App.jsx) subscribes and renders the actual custom-styled dialog.
let listener = null;

export const setAlertListener = fn => {
  listener = fn;
};

// Drop-in replacement for Alert.alert(title, message, buttons): buttons is an array
// of { text, onPress?, style?: 'default' | 'cancel' | 'destructive' }. Omitting
// buttons gives a single "OK" that just dismisses, same as the native API.
// `tone` ('default' | 'warning' | 'danger' | 'success') picks the accent colour;
// `icon` (an AppIcon name) overrides the tone's default icon glyph.
export const showAlert = (
  title,
  message,
  buttons,
  { tone = 'default', icon } = {},
) => {
  listener?.({
    title,
    message,
    buttons: buttons?.length ? buttons : [{ text: 'OK' }],
    tone,
    icon,
  });
};
