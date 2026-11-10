import { createSlice } from '@reduxjs/toolkit';
import { logout } from '@/features/auth/store/authSlice';
import { sendSessions } from '../services/studyService';
import { MIN_SESSION_SEC } from '../utils/sessionClock';

const MAX_SESSIONS = 500;

const initialState = {
  // Finished sessions. `synced` flips once the server has them.
  sessions: [], // { id, type: study | practice | test | ai, refId, start, end, seconds, synced }
  // Sessions that are open right now, with their last saved checkpoint. If the app is
  // killed, the next launch closes them with what the checkpoint says.
  active: {}, // { [id]: { id, type, refId, start, seconds, at } }
  targetMinutes: 60, // daily study goal
};

const finish = (state, { id, type, refId, start, seconds, end }) => {
  const rounded = Math.round(seconds);
  if (rounded >= MIN_SESSION_SEC) {
    state.sessions.push({
      id,
      type,
      refId,
      start,
      end,
      seconds: rounded,
      synced: false,
    });
    if (state.sessions.length > MAX_SESSIONS) {
      // Drop the oldest ones the server already has.
      const extra = state.sessions.length - MAX_SESSIONS;
      const keep = state.sessions.filter((s, i) => i >= extra || !s.synced);
      state.sessions = keep;
    }
  }
  delete state.active[id];
};

const studySlice = createSlice({
  name: 'study',
  initialState,
  reducers: {
    beginSession: (state, action) => {
      const { id, type, refId, start } = action.payload;
      state.active[id] = { id, type, refId, start, seconds: 0, at: start };
    },
    checkpointSession: (state, action) => {
      const { id, seconds, at } = action.payload;
      if (state.active[id]) {
        state.active[id].seconds = seconds;
        state.active[id].at = at;
      }
    },
    endSession: (state, action) => {
      const { id, seconds, end } = action.payload;
      const open = state.active[id];
      if (open) {
        finish(state, { ...open, seconds, end });
      }
    },
    // App start: anything still open was cut short by a kill or crash.
    recoverActiveSessions: state => {
      Object.values(state.active).forEach(open =>
        finish(state, { ...open, end: open.at }),
      );
    },
    markSynced: (state, action) => {
      const ids = new Set(action.payload);
      state.sessions.forEach(s => {
        if (ids.has(s.id)) {
          s.synced = true;
        }
      });
    },
    setTargetMinutes: (state, action) => {
      state.targetMinutes = Math.max(5, Math.round(action.payload));
    },
  },
  extraReducers: builder => {
    builder.addCase(logout, () => initialState);
  },
});

export const {
  beginSession,
  checkpointSession,
  endSession,
  recoverActiveSessions,
  markSynced,
  setTargetMinutes,
} = studySlice.actions;

let syncing = false;

// Sends the sessions the server does not have yet. Failures are fine: they stay
// queued and go with the next attempt.
export const syncSessions = () => async (dispatch, getState) => {
  const pending = getState().study.sessions.filter(s => !s.synced);
  if (syncing || pending.length === 0) {
    return;
  }
  syncing = true;
  try {
    await sendSessions(pending);
    dispatch(markSynced(pending.map(s => s.id)));
  } catch (e) {
    // keep them queued
  } finally {
    syncing = false;
  }
};

export default studySlice.reducer;
