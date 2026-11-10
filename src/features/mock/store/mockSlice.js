import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getErrorMessage } from '@/api/client';
import { logout } from '@/features/auth/store/authSlice';
import {
  fetchMockQuestions,
  fetchMockTestById,
  fetchServerTime,
  saveMockAnswers,
  submitMockAttempt,
} from '../services/mockService';
import { buildMockResult, serverNow } from '../utils/scoring';

const HISTORY_LIMIT = 50;
const SAVED_RESULTS_LIMIT = 10; // full attempts kept with their review, for History

// Contiguous question blocks by subject (the generator keeps each subject's
// questions together), for the session screen's section tabs.
const buildSections = questions => {
  const sections = [];
  questions.forEach((q, i) => {
    const last = sections[sections.length - 1];
    if (last && last.subjectId === q.subjectId) {
      last.end = i;
    } else {
      sections.push({
        subjectId: q.subjectId,
        subjectName: q.subjectName,
        start: i,
        end: i,
      });
    }
  });
  return sections;
};

// Loads the test and its paper, and starts the attempt. `endsAt` stands in for a
// server-anchored deadline until the real backend computes one (plan.md §5.11).
export const startMock = createAsyncThunk(
  'mock/start',
  async (testId, { rejectWithValue }) => {
    try {
      const test = await fetchMockTestById(testId);
      if (!test) {
        return rejectWithValue('This test is not available.');
      }
      const questions = await fetchMockQuestions(test);
      // Measured last, so the deadline starts when the paper is really in hand.
      const clockOffset = (await fetchServerTime()) - Date.now();
      return { test, questions, clockOffset };
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

// Grades the attempt and fetches the (mock) rank/percentile.
export const submitMock = createAsyncThunk(
  'mock/submit',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { session } = getState().mock;
      const test = {
        id: session.testId,
        name: session.testName,
        type: session.testType,
        marks: session.marksTotal,
        questions: session.questions.length,
        negativePerWrong: session.negativePerWrong,
      };
      const elapsed = Math.min(
        (serverNow(session) - session.startedAt) / 1000,
        session.durationSec,
      );
      const result = buildMockResult(session, test, elapsed);
      const scorePercent = Math.max(
        0,
        Math.round((result.score / result.maxScore) * 100),
      );
      // The score is graded on the device, so an attempt is never lost to a bad
      // connection: if the rank request fails it is queued (see syncPendingRank).
      try {
        const leaderboard = await submitMockAttempt({ scorePercent });
        return { ...result, ...leaderboard };
      } catch {
        return {
          ...result,
          rank: null,
          participants: null,
          percentile: null,
          rankPending: true,
          scorePercent,
        };
      }
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

// Sends the rank request of an attempt that was submitted offline.
export const syncPendingRank = createAsyncThunk(
  'mock/syncPendingRank',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { pendingRank } = getState().mock;
      const leaderboard = await submitMockAttempt({
        scorePercent: pendingRank.scorePercent,
      });
      return { id: pendingRank.id, ...leaderboard };
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
  { condition: (_, { getState }) => Boolean(getState().mock.pendingRank) },
);

// Autosave of the attempt in progress; a failure just flips `sync` to "offline" and
// the next autosave tries again with everything answered so far.
export const syncAnswers = createAsyncThunk(
  'mock/syncAnswers',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { session } = getState().mock;
      await saveMockAnswers({
        answers: session.answers,
        marked: session.marked,
      });
      return Date.now();
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
  { condition: (_, { getState }) => Boolean(getState().mock.session) },
);

const initialState = {
  session: null, // the attempt in progress (kept so it survives a kill and can resume)
  result: null, // the last finished attempt with its review and rank
  startStatus: 'idle', // idle | loading | failed
  submitStatus: 'idle', // idle | submitting | failed
  error: null,
  history: [], // finished attempts, newest first (summaries only)
  savedResults: [], // the latest finished attempts with their review, newest first
  pendingRank: null, // { id, scorePercent } of an attempt whose rank is still to be fetched
  sync: 'idle', // idle | saved | offline: autosave state of the attempt in progress
};

const mockSlice = createSlice({
  name: 'mock',
  initialState,
  reducers: {
    selectOption: (state, action) => {
      const { session } = state;
      if (!session) {
        return;
      }
      const question = session.questions[session.current];
      session.answers[question.id] = action.payload;
    },
    clearAnswer: state => {
      const { session } = state;
      if (session) {
        delete session.answers[session.questions[session.current].id];
      }
    },
    goToQuestion: (state, action) => {
      const { session } = state;
      if (session) {
        const max = session.questions.length - 1;
        session.current = Math.max(0, Math.min(max, action.payload));
      }
    },
    toggleMarked: state => {
      const { session } = state;
      if (session) {
        const id = session.questions[session.current].id;
        if (session.marked[id]) {
          delete session.marked[id];
        } else {
          session.marked[id] = true;
        }
      }
    },
    // History: reopen a finished attempt (only the latest ones keep their review).
    openSavedResult: (state, action) => {
      const saved = state.savedResults.find(r => r.id === action.payload);
      if (saved) {
        state.result = saved;
      }
    },
    clearResult: state => {
      state.result = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(logout, () => initialState)
      .addCase(startMock.pending, state => {
        state.startStatus = 'loading';
        state.error = null;
      })
      .addCase(startMock.fulfilled, (state, action) => {
        const { test, questions, clockOffset } = action.payload;
        const serverStart = Date.now() + clockOffset;
        state.sync = 'idle';
        state.startStatus = 'idle';
        state.result = null;
        state.session = {
          id: `ms-${Date.now()}`,
          testId: test.id,
          testName: test.name,
          testType: test.type,
          marksTotal: test.marks,
          negativePerWrong: test.negativePerWrong,
          questions,
          sections: buildSections(questions),
          answers: {},
          marked: {},
          current: 0,
          // All deadlines are on the server's clock (clockOffset = server - device).
          clockOffset,
          startedAt: serverStart,
          durationSec: test.minutes * 60,
          endsAt: serverStart + test.minutes * 60 * 1000,
        };
      })
      .addCase(startMock.rejected, (state, action) => {
        state.startStatus = 'failed';
        state.error = action.payload ?? action.error.message;
      })
      .addCase(submitMock.pending, state => {
        state.submitStatus = 'submitting';
        state.error = null;
      })
      .addCase(submitMock.fulfilled, (state, action) => {
        state.submitStatus = 'idle';
        state.result = action.payload;
        state.session = null;
        state.pendingRank = action.payload.rankPending
          ? { id: action.payload.id, scorePercent: action.payload.scorePercent }
          : null;
        const { review: _review, ...summary } = action.payload;
        state.history = [summary, ...state.history].slice(0, HISTORY_LIMIT);
        state.savedResults = [action.payload, ...state.savedResults].slice(
          0,
          SAVED_RESULTS_LIMIT,
        );
      })
      .addCase(syncAnswers.fulfilled, state => {
        state.sync = 'saved';
      })
      .addCase(syncAnswers.rejected, state => {
        state.sync = 'offline';
      })
      .addCase(syncPendingRank.fulfilled, (state, action) => {
        const { id, rank, participants, percentile } = action.payload;
        const fill = item =>
          item.id === id
            ? { ...item, rank, participants, percentile, rankPending: false }
            : item;
        state.pendingRank = null;
        if (state.result) {
          state.result = fill(state.result);
        }
        state.history = state.history.map(fill);
        state.savedResults = state.savedResults.map(fill);
      })
      .addCase(submitMock.rejected, (state, action) => {
        state.submitStatus = 'failed';
        state.error = action.payload ?? action.error.message;
      });
  },
});

export const {
  selectOption,
  clearAnswer,
  goToQuestion,
  toggleMarked,
  clearResult,
  openSavedResult,
} = mockSlice.actions;

export default mockSlice.reducer;
