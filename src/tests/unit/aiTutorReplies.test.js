import { logout } from '@/features/auth/store/authSlice';
import {
  openConversation,
  sendChatMessage,
  startConversation,
} from '@/features/aiTutor/store/aiTutorSlice';
import { store } from '@/store';
import { selectAiUsedToday } from '@/store/selectors/aiTutorSelectors';

// Web fix: a reply goes to the chat it was asked in. (Mobile wrote it to whichever chat was
// open when it arrived.)
describe('where an AI reply lands', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    store.dispatch(logout());
  });
  afterEach(() => vi.useRealTimers());

  const state = () => store.getState().aiTutor;
  const roles = id => state().conversations[id].messages.map(m => m.role);

  it('goes to the chat the question was asked in, even if another chat is open by then', async () => {
    store.dispatch(startConversation({ examId: 'pet' }));
    const first = state().activeId;
    const pending = store.dispatch(sendChatMessage({ text: 'pehla sawal' }));
    expect(roles(first)).toEqual(['user']);

    // the student opens a different chat while waiting
    store.dispatch(
      startConversation({
        examId: 'pet',
        topicId: 't-ratio',
        topicName: 'Ratio',
      }),
    );
    const second = state().activeId;
    expect(second).not.toBe(first);

    await vi.advanceTimersByTimeAsync(2000);
    await pending;
    expect(roles(first)).toEqual(['user', 'ai']); // the answer is where the question is
    expect(roles(second)).toEqual([]); // and not in the chat that happened to be open
    expect(selectAiUsedToday(store.getState())).toBe(1);

    store.dispatch(openConversation(first));
    expect(state().activeId).toBe(first);
  });

  it('is dropped, and not counted, when the chat is gone by the time it arrives (a logout)', async () => {
    store.dispatch(startConversation({ examId: 'pet' }));
    const pending = store.dispatch(sendChatMessage({ text: 'sawal' }));

    store.dispatch(logout()); // another student signs in on this browser
    store.dispatch(startConversation({ examId: 'pet' }));
    const theirs = state().activeId;

    await vi.advanceTimersByTimeAsync(2000);
    await pending;
    expect(roles(theirs)).toEqual([]); // nothing leaked into their chat
    expect(selectAiUsedToday(store.getState())).toBe(0); // and their allowance is untouched
    expect(state().sendStatus).toBe('idle');
  });

  it('still counts a normal reply once', async () => {
    store.dispatch(startConversation({ examId: 'pet' }));
    const pending = store.dispatch(sendChatMessage({ text: 'sawal' }));
    await vi.advanceTimersByTimeAsync(2000);
    await pending;
    expect(selectAiUsedToday(store.getState())).toBe(1);
  });
});
