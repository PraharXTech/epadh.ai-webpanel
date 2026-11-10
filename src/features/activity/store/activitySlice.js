import { createSlice } from '@reduxjs/toolkit';
import { logout } from '@/features/auth/store/authSlice';
import { selectSelectedExamId } from '@/store/selectors/userSelectors';
import { saveActivity } from '../services/activityService';

// What the student did last, so Home can offer "Continue".
//   type: 'study' | 'practice'
//   mode: 'topic' (topic hub) | 'material' (a file / video, with itemId) | 'practice'
const initialState = {
  last: null, // { type, mode, examId, topicId, itemId?, at }
};

const activitySlice = createSlice({
  name: 'activity',
  initialState,
  reducers: {
    setLastActivity: (state, action) => {
      state.last = action.payload;
    },
  },
  extraReducers: builder => {
    builder.addCase(logout, () => initialState);
  },
});

export const { setLastActivity } = activitySlice.actions;

const SAVE_DELAY_MS = 800;
let saveTimer = null;

const isSame = (a, b) =>
  a &&
  a.type === b.type &&
  a.mode === b.mode &&
  a.examId === b.examId &&
  a.topicId === b.topicId &&
  a.itemId === b.itemId;

// Remembers the activity locally at once and sends it to the server after a short
// pause, so opening several screens in a row makes one request. Same activity twice
// in a row is ignored.
export const recordActivity = activity => (dispatch, getState) => {
  const examId = selectSelectedExamId(getState());
  if (!examId || !activity.topicId) {
    return;
  }
  const last = { ...activity, examId, at: Date.now() };
  if (isSame(getState().activity.last, last)) {
    return;
  }
  dispatch(setLastActivity(last));

  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveActivity(last).catch(() => {}); // best effort: the local copy is what Home uses
  }, SAVE_DELAY_MS);
};

export default activitySlice.reducer;
