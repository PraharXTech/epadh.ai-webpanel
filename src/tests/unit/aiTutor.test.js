import * as service from '@/features/aiTutor/services/aiTutorService';
import { store } from '@/store';
import { logout } from '@/features/auth/store/authSlice';
import {
  openConversation,
  rateMessage,
  sendChatMessage,
  sendPhotoMessage,
  startConversation,
  toggleTts,
} from '@/features/aiTutor/store/aiTutorSlice';
import {
  selectActiveConversation,
  selectAiDailyLimit,
  selectAiRemainingToday,
  selectAiUsedToday,
  selectConversationList,
  selectSendStatus,
  selectTtsEnabled,
} from '@/store/selectors/aiTutorSelectors';

const send = async (text, extra = {}) => {
  const promise = store.dispatch(sendChatMessage({ text, ...extra }));
  await jest.advanceTimersByTimeAsync(1500);
  return promise;
};

describe('ai tutor chat', () => {
  beforeAll(() => jest.useFakeTimers());
  afterAll(() => jest.useRealTimers());
  beforeEach(() => {
    store.dispatch(logout());
  });

  it('starts a conversation scoped to a topic', () => {
    store.dispatch(
      startConversation({
        examId: 'pet',
        topicId: 't-percentage',
        topicName: 'Percentage',
      }),
    );
    const conversation = selectActiveConversation(store.getState());
    expect(conversation.topicId).toBe('t-percentage');
    expect(conversation.title).toBe('Ask about Percentage');
    expect(conversation.messages).toHaveLength(0);
  });

  it('reuses the empty conversation for the same topic instead of creating a new one', () => {
    store.dispatch(
      startConversation({ topicId: 't-percentage', topicName: 'Percentage' }),
    );
    const first = selectActiveConversation(store.getState()).id;
    store.dispatch(
      startConversation({ topicId: 't-percentage', topicName: 'Percentage' }),
    );
    const second = selectActiveConversation(store.getState()).id;
    expect(second).toBe(first);
    expect(selectConversationList(store.getState())).toHaveLength(1);
  });

  it('starts a fresh conversation when the topic differs', () => {
    store.dispatch(
      startConversation({ topicId: 't-percentage', topicName: 'Percentage' }),
    );
    const first = selectActiveConversation(store.getState()).id;
    store.dispatch(
      startConversation({ topicId: 't-ratio', topicName: 'Ratio' }),
    );
    const second = selectActiveConversation(store.getState()).id;
    expect(second).not.toBe(first);
    expect(selectConversationList(store.getState())).toHaveLength(2);
  });

  it('adds the user bubble immediately and the AI reply once it resolves', async () => {
    store.dispatch(
      startConversation({ topicId: 't-percentage', topicName: 'Percentage' }),
    );

    const promise = store.dispatch(
      sendChatMessage({ text: 'HCF kaise nikale?' }),
    );
    // Still pending: the user's own message is already visible.
    let conversation = selectActiveConversation(store.getState());
    expect(conversation.messages).toHaveLength(1);
    expect(conversation.messages[0]).toMatchObject({
      role: 'user',
      text: 'HCF kaise nikale?',
    });
    expect(selectSendStatus(store.getState())).toBe('sending');

    await jest.advanceTimersByTimeAsync(1500);
    await promise;

    conversation = selectActiveConversation(store.getState());
    expect(conversation.messages).toHaveLength(2);
    expect(conversation.messages[1].role).toBe('ai');
    expect(conversation.messages[1].text.length).toBeGreaterThan(0);
    expect(selectSendStatus(store.getState())).toBe('idle');
  });

  it('gives the quick-prompt canned reply and mentions the topic', async () => {
    store.dispatch(
      startConversation({ topicId: 't-percentage', topicName: 'Percentage' }),
    );
    await send('मुख्य परीक्षा बिंदु बताओ', { promptId: 'keypoints' });

    const conversation = selectActiveConversation(store.getState());
    const reply = conversation.messages[1].text;
    expect(reply).toContain('Percentage');
    expect(reply).toContain('•');
  });

  it("counts one question against today's quota per AI reply", async () => {
    store.dispatch(
      startConversation({ topicId: 't-percentage', topicName: 'Percentage' }),
    );
    expect(selectAiUsedToday(store.getState())).toBe(0);
    expect(selectAiDailyLimit(store.getState())).toBe(10);

    await send('Sawal 1');
    expect(selectAiUsedToday(store.getState())).toBe(1);
    expect(selectAiRemainingToday(store.getState())).toBe(9);

    await send('Sawal 2');
    expect(selectAiUsedToday(store.getState())).toBe(2);
    expect(selectAiRemainingToday(store.getState())).toBe(8);
  });

  it('switches the active conversation and rates a message', async () => {
    store.dispatch(
      startConversation({ topicId: 't-percentage', topicName: 'Percentage' }),
    );
    const percentageId = selectActiveConversation(store.getState()).id;
    await send('Ek sawal');

    store.dispatch(startConversation({})); // generic chat
    const genericId = selectActiveConversation(store.getState()).id;
    expect(genericId).not.toBe(percentageId);

    store.dispatch(openConversation(percentageId));
    const active = selectActiveConversation(store.getState());
    expect(active.id).toBe(percentageId);

    const aiMessage = active.messages[1];
    store.dispatch(rateMessage({ messageId: aiMessage.id, rating: 'up' }));
    expect(selectActiveConversation(store.getState()).messages[1].rating).toBe(
      'up',
    );

    // Tapping the same rating again clears it.
    store.dispatch(rateMessage({ messageId: aiMessage.id, rating: 'up' }));
    expect(
      selectActiveConversation(store.getState()).messages[1].rating,
    ).toBeNull();
  });

  it('sends a photo doubt as a user bubble with an image and counts it against quota', async () => {
    store.dispatch(
      startConversation({ topicId: 't-percentage', topicName: 'Percentage' }),
    );

    const promise = store.dispatch(
      sendPhotoMessage({
        imageUri: 'file:///doubt.jpg',
        note: 'Yeh wala sawal',
      }),
    );
    let conversation = selectActiveConversation(store.getState());
    expect(conversation.messages[0]).toMatchObject({
      role: 'user',
      text: 'Yeh wala sawal',
      imageUri: 'file:///doubt.jpg',
    });

    await jest.advanceTimersByTimeAsync(2500);
    await promise;

    conversation = selectActiveConversation(store.getState());
    expect(conversation.messages[1].role).toBe('ai');
    expect(conversation.messages[1].text).toContain('Percentage');
    expect(selectAiUsedToday(store.getState())).toBe(1);
  });

  it('toggles the text-to-speech preference and resets it on logout', () => {
    expect(selectTtsEnabled(store.getState())).toBe(false);
    store.dispatch(toggleTts());
    expect(selectTtsEnabled(store.getState())).toBe(true);
    store.dispatch(toggleTts());
    expect(selectTtsEnabled(store.getState())).toBe(false);

    store.dispatch(toggleTts());
    store.dispatch(logout());
    expect(selectTtsEnabled(store.getState())).toBe(false);
  });

  it('clears every conversation on logout', async () => {
    store.dispatch(
      startConversation({ topicId: 't-percentage', topicName: 'Percentage' }),
    );
    await send('Kuch bhi');
    expect(selectConversationList(store.getState())).toHaveLength(1);

    store.dispatch(logout());
    expect(selectConversationList(store.getState())).toHaveLength(0);
    expect(selectActiveConversation(store.getState())).toBeNull();
    expect(selectAiUsedToday(store.getState())).toBe(0);
  });
});

describe('ai tutor retry', () => {
  beforeAll(() => jest.useFakeTimers());
  afterAll(() => jest.useRealTimers());
  beforeEach(() => {
    store.dispatch(logout());
    store.dispatch(startConversation({ examId: 'pet' }));
  });
  afterEach(() => jest.restoreAllMocks());

  it('re-asks the last message after a failure without adding a second bubble', async () => {
    jest
      .spyOn(service, 'sendMessage')
      .mockRejectedValueOnce(new Error('network'));
    await send('What is HCF?');
    expect(selectSendStatus(store.getState())).toBe('failed');
    expect(selectActiveConversation(store.getState()).messages).toHaveLength(1);

    await send('What is HCF?', { retry: true });
    const { messages } = selectActiveConversation(store.getState());
    expect(selectSendStatus(store.getState())).toBe('idle');
    expect(messages.map(m => m.role)).toEqual(['user', 'ai']);
  });
});
