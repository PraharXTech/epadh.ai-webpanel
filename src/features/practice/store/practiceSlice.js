import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getErrorMessage } from '@/api/client';
import { logout } from '@/features/auth/store/authSlice';
import { hasFeature } from '@/features/membership/utils/entitlements';
import {
  fetchAiQuestions,
  fetchQuestions,
  reportQuestion as sendQuestionReport,
} from '../services/practiceService';
import { SECONDS_PER_QUESTION, buildResult, dayKey } from '../utils/scoring';

const HISTORY_LIMIT = 200;
// Full results (with the question review) kept so the History screen can reopen them.
const SAVED_RESULTS_LIMIT = 20;

const newSession = ({ topic, mode, questions, source = 'bank' }) => ({
  id: `s-${Date.now()}`,
  topicId: topic.topicId,
  topicName: topic.topicName,
  subjectName: topic.subjectName,
  mode, // practice | test
  source, // bank | ai
  questions,
  answers: {}, // { [questionId]: chosen option index }
  marked: {}, // { [questionId]: true } marked for review (timed test)
  current: 0,
  startedAt: Date.now(),
  durationSec: mode === 'test' ? questions.length * SECONDS_PER_QUESTION : null,
  activeSec: 0, // seconds the student spent on the screen (practice mode)
});

// Loads a fresh set of questions and starts a session. The free daily limit is applied
// here (the server enforces the same rule): the set is cut to what is left for today.
export const startPractice = createAsyncThunk(
  'practice/start',
  async (
    { topicId, topicName, subjectId, subjectName, count, mode, source },
    { getState, rejectWithValue },
  ) => {
    try {
      const { user, practice } = getState();
      const unlimited = hasFeature(user.entitlements, 'extendedPractice');
      const limit = user.entitlements?.mcq?.dailyLimit ?? Infinity;
      const used = practice.daily.date === dayKey() ? practice.daily.count : 0;
      const allowed = unlimited ? count : Math.min(count, limit - used);
      if (allowed <= 0) {
        return rejectWithValue("You have used today's free questions.");
      }
      const load = source === 'ai' ? fetchAiQuestions : fetchQuestions;
      const questions = await load({
        topicId,
        subjectId,
        count: allowed,
      });
      return {
        topic: { topicId, topicName, subjectName },
        mode,
        source,
        questions,
      };
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

// Flags a wrong or unclear question (plan.md §5.10). The id is kept locally so the
// button reads "Reported" straight away, even if the request is still in flight.
export const reportQuestion = createAsyncThunk(
  'practice/reportQuestion',
  async ({ questionId, reason }, { rejectWithValue }) => {
    try {
      await sendQuestionReport({ questionId, reason });
      return questionId;
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

const initialState = {
  session: null, // the test in progress (kept so it survives a kill and can resume)
  result: null, // the last finished test with its review
  startStatus: 'idle', // idle | loading | failed
  error: null,
  history: [], // finished tests, newest first (summaries only)
  totalAttempted: 0, // questions ever answered, for the MCQs Solved stat
  daily: { date: null, count: 0 }, // questions attempted today, for the free limit
  bookmarks: {}, // { [questionId]: true }
  reported: {}, // { [questionId]: true } questions the student flagged
  savedResults: [], // the latest finished tests with their review, newest first
};

const practiceSlice = createSlice({
  name: 'practice',
  initialState,
  reducers: {
    // Picking an option. In practice mode the first answer is final (the explanation
    // shows straight away); in a timed test it can be changed until submit.
    selectOption: (state, action) => {
      const { session } = state;
      if (!session) {
        return;
      }
      const question = session.questions[session.current];
      if (
        session.mode === 'practice' &&
        session.answers[question.id] !== undefined
      ) {
        return;
      }
      session.answers[question.id] = action.payload;
    },
    clearAnswer: state => {
      const { session } = state;
      if (session?.mode === 'test') {
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
    addActiveTime: (state, action) => {
      if (state.session) {
        state.session.activeSec += Math.round(action.payload);
      }
    },
    toggleQuestionBookmark: (state, action) => {
      const id = action.payload;
      if (state.bookmarks[id]) {
        delete state.bookmarks[id];
      } else {
        state.bookmarks[id] = true;
      }
    },
    // Grades the session, stores the result and counts the attempted questions
    // against today's limit. Does nothing when there is no session (double submit).
    submitSession: state => {
      const { session } = state;
      if (!session) {
        return;
      }
      const elapsed =
        session.mode === 'test'
          ? Math.min(
              (Date.now() - session.startedAt) / 1000,
              session.durationSec,
            )
          : session.activeSec;
      const result = buildResult(session, elapsed);
      state.result = result;
      state.session = null;

      const today = dayKey();
      const attempted = result.total - result.skipped;
      state.totalAttempted += attempted;
      state.daily =
        state.daily.date === today
          ? { date: today, count: state.daily.count + attempted }
          : { date: today, count: attempted };

      const { review: _review, ...summary } = result;
      state.history = [summary, ...state.history].slice(0, HISTORY_LIMIT);
      state.savedResults = [result, ...state.savedResults].slice(
        0,
        SAVED_RESULTS_LIMIT,
      );
    },
    // "Retry wrong ones": a new session made of the questions missed last time.
    retryMissed: state => {
      const missed = state.result?.review.filter(r => !r.correct) ?? [];
      if (!missed.length) {
        return;
      }
      const { topicId, topicName, subjectName, mode, source } = state.result;
      state.session = newSession({
        topic: { topicId, topicName, subjectName },
        mode,
        source,
        questions: missed.map(({ chosen, correct, ...q }) => q),
      });
      state.result = null;
    },
    discardSession: state => {
      state.session = null;
    },
    // History: reopen a finished test (only the latest ones keep their review).
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
      .addCase(reportQuestion.pending, (state, action) => {
        state.reported[action.meta.arg.questionId] = true;
      })
      .addCase(reportQuestion.rejected, (state, action) => {
        delete state.reported[action.meta.arg.questionId];
      })
      .addCase(startPractice.pending, state => {
        state.startStatus = 'loading';
        state.error = null;
      })
      .addCase(startPractice.fulfilled, (state, action) => {
        state.startStatus = 'idle';
        state.session = newSession(action.payload);
        state.result = null;
      })
      .addCase(startPractice.rejected, (state, action) => {
        state.startStatus = 'failed';
        state.error = action.payload ?? action.error.message;
      });
  },
});

export const {
  selectOption,
  clearAnswer,
  goToQuestion,
  toggleMarked,
  addActiveTime,
  toggleQuestionBookmark,
  submitSession,
  retryMissed,
  discardSession,
  openSavedResult,
  clearResult,
} = practiceSlice.actions;

export default practiceSlice.reducer;
