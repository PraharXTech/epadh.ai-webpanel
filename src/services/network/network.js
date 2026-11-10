import { useSyncExternalStore } from 'react';

// One shared "is the browser online?" value, so components (hook) and plain code
// (thunks, guards) read the same thing. Web port of the NetInfo version: the browser
// only tells us `navigator.onLine`, which is reliable for "definitely offline" and
// optimistic for "online" (the API client still handles real request failures).
let online =
  typeof navigator === 'undefined' ? true : navigator.onLine !== false;
const listeners = new Set();

const apply = next => {
  if (next === online) {
    return;
  }
  online = next;
  listeners.forEach(listener => listener(online));
};

export const isOnline = () => online;

// Calls `listener(online)` whenever the state flips. Returns the unsubscribe function.
export const subscribeNetwork = listener => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

let started = false;

// Starts watching the connection. Safe to call more than once.
export const startNetworkMonitor = () => {
  if (started || typeof window === 'undefined') {
    return;
  }
  started = true;
  apply(navigator.onLine !== false);
  window.addEventListener('online', () => apply(true));
  window.addEventListener('offline', () => apply(false));
};

export const useNetwork = () => {
  const isConnected = useSyncExternalStore(
    subscribeNetwork,
    isOnline,
    () => true,
  );
  return { isOnline: isConnected };
};

// Test hook: forces the state without touching the browser.
export const __setOnlineForTests = value => {
  online = value;
  listeners.forEach(listener => listener(online));
};
