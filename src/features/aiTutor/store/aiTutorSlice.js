import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getErrorMessage } from '@/api/client';
import { logout } from '@/features/auth/store/authSlice';
import { dayKey } from '@/utils/date';
import { analyzeDoubtPhoto } from '../services/doubtService';
import { sendMessage } from '../services/aiTutorService';

const MAX_CONVERSATIONS = 20;
const MAX_MESSAGES = 200;

const newId = prefix =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

// Sends the student's message (or a quick-prompt chip) in the active conversation.
// The user bubble is added optimistically on `pending` (see extraReducers) so it
// shows immediately; the AI reply lands on `fulfilled` and counts against today's quota.
export const sendChatMessage = createAsyncThunk(
  'aiTutor/send',
  async ({ text, promptId }, { getState, rejectWithValue }) => {
    // `retry: true` (see the pending case) re-asks the last message without a new bubble.
    try {
      const { aiTutor, user } = getState();
      const conversation = aiTutor.conversations[aiTutor.activeId];
      const lastAi = [...conversation.messages]
        .reverse()
        .find(m => m.role === 'ai');
      return await sendMessage({
        conversationId: conversation.id,
        examId: conversation.examId ?? user.selectedExamId,
        topicId: conversation.topicId,
        topicName: conversation.topicName,
        text,
        promptId,
        lastAiText: lastAi?.text,
      });
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

// Photo Doubt Solver (plan.md §5.9): same optimistic pending/fulfilled shape as
// sendChatMessage, but the user bubble carries an image and the reply comes from
// the (mocked) vision analysis instead of the text chat service.
export const sendPhotoMessage = createAsyncThunk(
  'aiTutor/sendPhoto',
  async ({ imageUri, note }, { getState, rejectWithValue }) => {
    try {
      const { aiTutor, user } = getState();
      const conversation = aiTutor.conversations[aiTutor.activeId];
      return await analyzeDoubtPhoto({
        imageUri,
        note,
        examId: conversation.examId ?? user.selectedExamId,
        topicId: conversation.topicId,
        topicName: conversation.topicName,
      });
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

const initialState = {
  conversations: {}, // { [id]: { id, examId, topicId, topicName, title, messages[], updatedAt } }
  order: [], // conversation ids, most recently active first
  activeId: null,
  sendStatus: 'idle', // idle | sending | failed
  error: null,
  daily: { date: null, count: 0 }, // messages sent today, for the free AI quota
  ttsEnabled: false, // speak AI replies aloud (§5.10 voice assistant)
};

const markSending = state => {
  state.sendStatus = 'sending';
  state.error = null;
};

// Shared by sendChatMessage.pending and sendPhotoMessage.pending: adds the user's
// own bubble right away and bumps the conversation to the top of the history list.
const pushUserMessage = (state, { text = '', imageUri } = {}) => {
  const conversation = state.conversations[state.activeId];
  if (!conversation) {
    return;
  }
  conversation.messages.push({
    id: newId('m'),
    role: 'user',
    text,
    imageUri,
    createdAt: Date.now(),
  });
  conversation.messages = conversation.messages.slice(-MAX_MESSAGES);
  conversation.updatedAt = Date.now();
  state.order = [
    state.activeId,
    ...state.order.filter(id => id !== state.activeId),
  ];
  state.sendStatus = 'sending';
  state.error = null;
};

// Shared by both thunks' fulfilled case: appends the AI reply and counts it
// against today's quota (a photo doubt counts the same as a text question).
const pushAiReply = (state, reply) => {
  const conversation = state.conversations[state.activeId];
  if (conversation) {
    conversation.messages.push(reply);
    conversation.messages = conversation.messages.slice(-MAX_MESSAGES);
    conversation.updatedAt = Date.now();
  }
  state.sendStatus = 'idle';
  const today = dayKey();
  state.daily =
    state.daily.date === today
      ? { date: today, count: state.daily.count + 1 }
      : { date: today, count: 1 };
};

const aiTutorSlice = createSlice({
  name: 'aiTutor',
  initialState,
  reducers: {
    // Opens the most recent empty conversation for this topic (generic chat when
    // topicId is undefined) instead of piling up blanks, or starts a fresh one.
    startConversation: {
      reducer: (state, action) => {
        const { id, examId, topicId, topicName } = action.payload;
        const existing = state.order
          .map(cid => state.conversations[cid])
          .find(
            c => c.messages.length === 0 && c.topicId === (topicId ?? null),
          );
        if (existing) {
          state.activeId = existing.id;
          return;
        }
        state.conversations[id] = {
          id,
          examId,
          topicId: topicId ?? null,
          topicName: topicName ?? null,
          title: topicName ? `Ask about ${topicName}` : 'New chat',
          messages: [],
          updatedAt: Date.now(),
        };
        state.order = [id, ...state.order].slice(0, MAX_CONVERSATIONS);
        state.activeId = id;
      },
      prepare: ({ examId, topicId, topicName } = {}) => ({
        payload: { id: newId('c'), examId, topicId, topicName },
      }),
    },
    openConversation: (state, action) => {
      if (state.conversations[action.payload]) {
        state.activeId = action.payload;
      }
    },
    // Removes a chat for good (today's quota is not given back). The chat that is waiting
    // for an AI reply cannot go: the reply is written to the active chat when it lands.
    deleteConversation: (state, action) => {
      const id = action.payload;
      if (!state.conversations[id]) {
        return;
      }
      if (id === state.activeId && state.sendStatus === 'sending') {
        return;
      }
      delete state.conversations[id];
      state.order = state.order.filter(cid => cid !== id);
      if (state.activeId === id) {
        state.activeId = null;
        state.error = null;
        state.sendStatus = 'idle';
      }
    },
    rateMessage: (state, action) => {
      const { messageId, rating } = action.payload; // rating: 'up' | 'down'
      const conversation = state.conversations[state.activeId];
      const message = conversation?.messages.find(m => m.id === messageId);
      if (message) {
        message.rating = message.rating === rating ? null : rating;
      }
    },
    clearSendError: state => {
      state.error = null;
      if (state.sendStatus === 'failed') {
        state.sendStatus = 'idle';
      }
    },
    toggleTts: state => {
      state.ttsEnabled = !state.ttsEnabled;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(logout, () => initialState)
      .addCase(sendChatMessage.pending, (state, action) =>
        action.meta.arg.retry
          ? markSending(state)
          : pushUserMessage(state, { text: action.meta.arg.text }),
      )
      .addCase(sendChatMessage.fulfilled, (state, action) =>
        pushAiReply(state, action.payload),
      )
      .addCase(sendChatMessage.rejected, (state, action) => {
        state.sendStatus = 'failed';
        state.error = action.payload ?? action.error.message;
      })
      .addCase(sendPhotoMessage.pending, (state, action) =>
        action.meta.arg.retry
          ? markSending(state)
          : pushUserMessage(state, {
              text: action.meta.arg.note ?? '',
              imageUri: action.meta.arg.imageUri,
            }),
      )
      .addCase(sendPhotoMessage.fulfilled, (state, action) =>
        pushAiReply(state, action.payload),
      )
      .addCase(sendPhotoMessage.rejected, (state, action) => {
        state.sendStatus = 'failed';
        state.error = action.payload ?? action.error.message;
      });
  },
});

export const {
  startConversation,
  openConversation,
  deleteConversation,
  rateMessage,
  clearSendError,
  toggleTts,
} = aiTutorSlice.actions;

export default aiTutorSlice.reducer;
