import { combineReducers, configureStore } from '@reduxjs/toolkit';
import storage from 'redux-persist/lib/storage';
import {
  FLUSH,
  PAUSE,
  PERSIST,
  persistReducer,
  persistStore,
  PURGE,
  REGISTER,
  REHYDRATE,
} from 'redux-persist';
import { setSessionExpiredHandler } from '@/api/client';
import { clearTokens } from '@/services/storage/secureStorage';
import activityReducer from '@/features/activity/store/activitySlice';
import planReducer from '@/features/plan/store/planSlice';
import aiTutorReducer from '@/features/aiTutor/store/aiTutorSlice';
import authReducer, { logout } from '@/features/auth/store/authSlice';
import examReducer from '@/features/exams/store/examSlice';
import homeReducer from '@/features/home/store/homeSlice';
import membershipReducer from '@/features/membership/store/membershipSlice';
import mockReducer from '@/features/mock/store/mockSlice';
import notificationsReducer from '@/features/notifications/store/notificationsSlice';
import omrReducer from '@/features/omr/store/omrSlice';
import pyqReducer from '@/features/pyq/store/pyqSlice';
import practiceReducer from '@/features/practice/store/practiceSlice';
import materialReducer from '@/features/material/store/materialSlice';
import settingsReducer from '@/features/settings/store/settingsSlice';
import studyReducer, {
  recoverActiveSessions,
  syncSessions,
} from '@/features/study/store/studySlice';
import syllabusReducer from '@/features/syllabus/store/syllabusSlice';
import userReducer from '@/features/user/store/userSlice';

// Every slice resets itself on the auth `logout` action (keeps redux-persist's
// bookkeeping intact, which a reset-to-undefined root reducer would drop).
// Persist only what is safe and useful offline. Tokens are NOT here,
// they live in secure storage (src/services/storage/secureStorage.js).
const appReducer = combineReducers({
  auth: persistReducer(
    {
      key: 'auth',
      storage,
      whitelist: ['user', 'isAuthenticated'],
    },
    authReducer,
  ),
  user: persistReducer(
    {
      key: 'user',
      storage,
      whitelist: [
        'profile',
        'selectedExamIds',
        'selectedExamId',
        'entitlements',
      ],
    },
    userReducer,
  ),
  exams: persistReducer(
    { key: 'exams', storage, whitelist: ['items'] },
    examReducer,
  ),
  material: persistReducer(
    {
      key: 'material',
      storage,
      whitelist: [
        'byExam',
        'bookmarks',
        'downloads',
        'progress',
        'timeSpent',
        'fontSize',
      ],
    },
    materialReducer,
  ),
  syllabus: persistReducer(
    {
      key: 'syllabus',
      storage,
      whitelist: ['trees', 'completed'],
    },
    syllabusReducer,
  ),
  practice: persistReducer(
    {
      key: 'practice',
      storage,
      whitelist: [
        'session',
        'result',
        'history',
        'totalAttempted',
        'daily',
        'bookmarks',
        'reported',
        'savedResults',
      ],
    },
    practiceReducer,
  ),
  activity: persistReducer(
    { key: 'activity', storage, whitelist: ['last'] },
    activityReducer,
  ),
  study: persistReducer(
    {
      key: 'study',
      storage,
      whitelist: ['sessions', 'active', 'targetMinutes'],
    },
    studyReducer,
  ),
  settings: persistReducer(
    { key: 'settings', storage },
    settingsReducer,
  ),
  home: persistReducer(
    {
      key: 'home',
      storage,
      whitelist: ['data', 'updatedAt'],
    },
    homeReducer,
  ),
  plan: persistReducer({ key: 'plan', storage }, planReducer),
  aiTutor: persistReducer(
    {
      key: 'aiTutor',
      storage,
      whitelist: ['conversations', 'order', 'daily', 'ttsEnabled'],
    },
    aiTutorReducer,
  ),
  mock: persistReducer(
    {
      key: 'mock',
      storage,
      whitelist: ['session', 'result', 'history', 'savedResults', 'pendingRank'],
    },
    mockReducer,
  ),
  omr: persistReducer(
    { key: 'omr', storage, whitelist: ['history'] },
    omrReducer,
  ),
  pyq: persistReducer(
    {
      key: 'pyq',
      storage,
      whitelist: ['papers', 'saved', 'viewed'],
    },
    pyqReducer,
  ),
  notifications: persistReducer(
    {
      key: 'notifications',
      storage,
      whitelist: ['items', 'dismissed', 'lastFetchedAt'],
    },
    notificationsReducer,
  ),
  membership: persistReducer(
    {
      key: 'membership',
      storage,
      // `checkout` is not persisted: it is only the in-flight state of the screen that
      // is open right now. `pendingOrder` is what survives an app kill mid-payment.
      whitelist: ['pendingOrder', 'history'],
    },
    membershipReducer,
  ),
});

// Web only: tell the other open tabs when this one logs out (the  event fires in
// every tab EXCEPT the one that wrote the key).  stops two tabs
// from bouncing the same logout back and forth.
const LOGOUT_SIGNAL_KEY = 'epadhai.logoutAt';
let applyingRemoteLogout = false;

const crossTabLogout = () => next => action => {
  const result = next(action);
  if (action.type === logout.type && !applyingRemoteLogout) {
    try {
      window.localStorage.setItem(LOGOUT_SIGNAL_KEY, String(Date.now()));
    } catch {
      // storage blocked: other tabs will notice at their next refresh failure
    }
  }
  return result;
};

export const store = configureStore({
  reducer: appReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(crossTabLogout),
});

// Once saved data is back: close study sessions a kill left open, and send the queue.
export const persistor = persistStore(store, null, () => {
  store.dispatch(recoverActiveSessions());
  store.dispatch(syncSessions());
});

// Dead session (refresh failed): sign the user out.
setSessionExpiredHandler(() => store.dispatch(logout()));

window.addEventListener('storage', event => {
  if (event.key !== LOGOUT_SIGNAL_KEY || !event.newValue) {
    return;
  }
  applyingRemoteLogout = true;
  clearTokens().finally(() => {
    store.dispatch(logout());
    applyingRemoteLogout = false;
  });
});
