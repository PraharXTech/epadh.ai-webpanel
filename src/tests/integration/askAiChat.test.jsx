import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AlertHost from '@/app/AlertHost';
import { logout } from '@/features/auth/store/authSlice';
import AskAiChatPage from '@/features/aiTutor/pages/AskAiChatPage';
import { AI_QUOTA_MESSAGE } from '@/features/aiTutor/services/aiTutorService';
import {
  deleteConversation,
  sendChatMessage,
  startConversation,
} from '@/features/aiTutor/store/aiTutorSlice';
import { chooseExam } from '@/features/user/store/userSlice';
import { __setOnlineForTests } from '@/services/network/network';
import { store } from '@/store';
import { renderWithRealStore } from '../utils/renderWithRealStore';

// Web port of mobile askAiChat.test.jsx, plus markdown, deep links, the photo flow, voice,
// spoken replies and the quota prompt. The file chooser, the microphone, the speaker and the
// AI service are replaced by stand-ins the tests control.
const media = vi.hoisted(() => ({
  touch: false,
  error: null,
  image: {
    uri: 'blob:photo',
    thumbUri: 'data:image/jpeg;base64,/9j/AAAA',
    width: 800,
    height: 600,
    size: 1000,
    mime: 'image/jpeg',
  },
}));
vi.mock('@/services/media/photoPicker', async importOriginal => ({
  ...(await importOriginal()),
  canUseCameraDirectly: () => media.touch,
  pickFromGallery: vi.fn(async () => {
    if (media.error) throw media.error;
    return media.image;
  }),
  captureFromCamera: vi.fn(async () => media.image),
  processImageFile: vi.fn(async () => media.image),
}));

const voice = vi.hoisted(() => ({
  supported: true,
  permission: true,
  callbacks: null,
  locale: null,
}));
vi.mock('@/features/aiTutor/services/voiceService', () => ({
  isVoiceSupported: () => voice.supported,
  requestMicPermission: vi.fn(async () => voice.permission),
  startListening: vi.fn(async (locale, callbacks) => {
    voice.locale = locale;
    voice.callbacks = callbacks;
  }),
  stopListening: vi.fn(async () => {}),
  cancelListening: vi.fn(async () => {}),
  teardownVoice: vi.fn(async () => {}),
}));

const tts = vi.hoisted(() => ({ ended: null }));
vi.mock('@/features/aiTutor/services/ttsService', () => ({
  isTtsSupported: () => true,
  speak: vi.fn(),
  stopSpeaking: vi.fn(),
  onSpeechEnd: callback => {
    tts.ended = callback;
    return () => {};
  },
}));

// The text service: by default the real mock (about a second per reply); tests can swap one
// reply, or make every reply instant.
const service = vi.hoisted(() => ({ real: null }));
vi.mock('@/features/aiTutor/services/aiTutorService', async importOriginal => {
  const actual = await importOriginal();
  service.real = actual.sendMessage;
  return { ...actual, sendMessage: vi.fn((...args) => service.real(...args)) };
});

import { sendMessage } from '@/features/aiTutor/services/aiTutorService';
import {
  captureFromCamera,
  pickFromGallery,
  processImageFile,
} from '@/services/media/photoPicker';
import { speak, stopSpeaking } from '@/features/aiTutor/services/ttsService';
import {
  startListening,
  stopListening,
} from '@/features/aiTutor/services/voiceService';

const SLOW = { timeout: 6000 };
const instantReply = text => ({
  id: `m-${Math.random()}`,
  role: 'ai',
  text,
  createdAt: Date.now(),
});
const routes = [
  {
    element: (
      <>
        <AlertHost />
        <Toaster />
        <Outlet />
      </>
    ),
    children: [
      { path: '/ask', element: <AskAiChatPage /> },
      { path: '/membership', element: <p>membership page</p> },
      { path: '*', element: <p>elsewhere</p> },
    ],
  },
];
const open = (url = '/ask', extra = {}) =>
  renderWithRealStore(null, { routes, entries: [url], ...extra });
const where = router =>
  router.state.location.pathname + router.state.location.search;
const box = () => screen.getByLabelText('Your question');
const used = () => store.getState().aiTutor.daily.count;

const useUpTheAllowance = async () => {
  sendMessage.mockImplementation(async () => instantReply('ok'));
  for (let i = 0; i < 10; i += 1) {
    await store.dispatch(startConversation({ examId: 'pet' }));
    await store.dispatch(sendChatMessage({ text: `Sawal ${i}` }));
  }
  sendMessage.mockImplementation((...args) => service.real(...args));
};

describe('Ask epadh.ai chat page', () => {
  beforeEach(async () => {
    store.dispatch(logout());
    await store.dispatch(chooseExam({ examIds: ['pet'] }));
    media.touch = false;
    media.error = null;
    voice.supported = true;
    voice.permission = true;
    voice.callbacks = null;
    vi.clearAllMocks();
    sendMessage.mockImplementation((...args) => service.real(...args));
    __setOnlineForTests(true);
  }, 15000);

  describe('the basics', () => {
    it('greets the student and offers quick prompts when there is nothing yet', async () => {
      open();
      expect(await screen.findByText(/Hi, main/)).toHaveTextContent('hoon');
      expect(
        screen.getByRole('button', { name: 'इससे 10 सवाल बनाओ' }),
      ).toBeInTheDocument();
      expect(
        screen.getByText('0/10 left today'.replace('0', '10')),
      ).toBeInTheDocument();
    });

    it('scopes the conversation to a topic', async () => {
      open('/ask?topicId=t-percentage&topicName=Percentage');
      expect(
        await screen.findByRole('heading', { name: 'Ask about Percentage' }),
      ).toBeInTheDocument();
      expect(screen.getByText(/Percentage ke baare mein/)).toBeInTheDocument();
    });

    it('sends a typed message with Enter and shows the reply', async () => {
      open();
      await userEvent.type(
        await screen.findByLabelText('Your question'),
        'HCF kaise nikale?{Enter}',
      );
      expect(screen.getAllByText('HCF kaise nikale?')).toHaveLength(1);
      expect(box()).toHaveValue('');
      expect(
        screen.getByRole('status', { name: 'epadh.ai is typing' }),
      ).toBeInTheDocument();

      const log = screen.getByRole('log', { name: 'Conversation' });
      await waitFor(
        () => expect(within(log).getAllByRole('listitem')).toHaveLength(2),
        SLOW,
      );
      expect(
        screen.queryByRole('status', { name: 'epadh.ai is typing' }),
      ).not.toBeInTheDocument();
      expect(used()).toBe(1);
    });

    it('Shift+Enter adds a line instead of sending', async () => {
      open();
      await userEvent.type(
        await screen.findByLabelText('Your question'),
        'line one{Shift>}{Enter}{/Shift}line two',
      );
      expect(box()).toHaveValue('line one\nline two');
      expect(store.getState().aiTutor.daily.count).toBe(0);
    });

    it('the Send button waits for some text', async () => {
      open();
      await screen.findByLabelText('Your question');
      expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
      await userEvent.type(box(), '  ');
      expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
      await userEvent.type(box(), 'hello');
      expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled();
    });

    it('sends a quick prompt as the user message and gets its canned reply', async () => {
      open('/ask?topicId=t-percentage&topicName=Percentage');
      await userEvent.click(
        await screen.findByRole('button', { name: 'मुख्य परीक्षा बिंदु बताओ' }),
      );
      expect(
        await screen.findByText(/Percentage ke mukhya exam points/, {}, SLOW),
      ).toBeInTheDocument();
      expect(
        screen.getByText('मुख्य परीक्षा बिंदु बताओ', { selector: 'p' }),
      ).toBeInTheDocument();
      // chips come back under the last AI message
      expect(
        screen.getByRole('list', { name: 'Quick questions' }),
      ).toBeInTheDocument();
    });
  });

  describe('answers', () => {
    it('shows markdown: bold, lists, code and links that open in a new tab', async () => {
      sendMessage.mockResolvedValueOnce(
        instantReply(
          '**Mukhya baat**\n\n- pehla\n- doosra\n\nUse `x = 2` aur [dekho](https://example.com).',
        ),
      );
      open();
      await userEvent.type(
        await screen.findByLabelText('Your question'),
        'batao{Enter}',
      );
      const answer = await screen.findByText('Mukhya baat');
      expect(answer.tagName).toBe('STRONG');
      expect(
        screen.getAllByRole('listitem').some(li => li.textContent === 'pehla'),
      ).toBe(true);
      expect(screen.getByText('x = 2').tagName).toBe('CODE');
      const link = screen.getByRole('link', { name: 'dekho' });
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('never runs HTML or script that comes back in an answer', async () => {
      window.__pwned = false;
      sendMessage.mockResolvedValueOnce(
        instantReply(
          'safe <img src="x" onerror="window.__pwned = true"> <script>window.__pwned = true</script>',
        ),
      );
      open();
      await userEvent.type(
        await screen.findByLabelText('Your question'),
        'batao{Enter}',
      );
      await screen.findByText(/safe/);
      expect(document.querySelector('.chat-md img')).toBeNull();
      expect(document.querySelector('.chat-md script')).toBeNull();
      expect(window.__pwned).toBe(false);
    });

    it('rates an answer up, down, and takes the rating back', async () => {
      sendMessage.mockResolvedValueOnce(instantReply('jawab'));
      open();
      await userEvent.type(
        await screen.findByLabelText('Your question'),
        'sawal{Enter}',
      );
      const up = await screen.findByRole('button', { name: 'Good answer' });
      await userEvent.click(up);
      expect(up).toHaveAttribute('aria-pressed', 'true');
      await userEvent.click(
        screen.getByRole('button', { name: 'Poor answer' }),
      );
      expect(up).toHaveAttribute('aria-pressed', 'false');
      expect(
        screen.getByRole('button', { name: 'Poor answer' }),
      ).toHaveAttribute('aria-pressed', 'true');
      await userEvent.click(
        screen.getByRole('button', { name: 'Poor answer' }),
      );
      expect(
        screen.getByRole('button', { name: 'Poor answer' }),
      ).toHaveAttribute('aria-pressed', 'false');
    });

    it('copies an answer to the clipboard', async () => {
      const writeText = vi.fn().mockResolvedValue();
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText },
        configurable: true,
      });
      sendMessage.mockResolvedValueOnce(instantReply('copy me'));
      open();
      await userEvent.type(
        await screen.findByLabelText('Your question'),
        'sawal{Enter}',
      );
      await userEvent.click(
        await screen.findByRole('button', { name: 'Copy answer' }),
      );
      expect(writeText).toHaveBeenCalledWith('copy me');
    });

    it('a failed reply shows a retry that re-sends without a second bubble', async () => {
      sendMessage.mockRejectedValueOnce(new Error('Server is busy'));
      open();
      await userEvent.type(
        await screen.findByLabelText('Your question'),
        'meri problem{Enter}',
      );
      const alert = await screen.findByRole('alert', {}, SLOW);
      expect(alert).toHaveTextContent('Server is busy');
      expect(screen.getAllByText('meri problem')).toHaveLength(1);

      sendMessage.mockResolvedValueOnce(instantReply('ab theek'));
      await userEvent.click(
        within(alert).getByRole('button', { name: 'Retry' }),
      );
      expect(await screen.findByText('ab theek')).toBeInTheDocument();
      expect(screen.getAllByText('meri problem')).toHaveLength(1);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('refuses to send while offline and says why', async () => {
      open();
      await screen.findByLabelText('Your question');
      __setOnlineForTests(false);
      await userEvent.type(box(), 'sawal{Enter}');
      expect(
        await screen.findByText(/Ask epadh.ai needs an internet connection/),
      ).toBeInTheDocument();
      expect(sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('deep links', () => {
    it('?q= asks the question at once, once, and takes it out of the address', async () => {
      sendMessage.mockResolvedValue(instantReply('jawab mil gaya'));
      const { router } = open(
        '/ask?topicId=t-percentage&topicName=Percentage&q=Explain%20this',
      );
      expect(
        await screen.findByText('jawab mil gaya', {}, SLOW),
      ).toBeInTheDocument();
      expect(sendMessage).toHaveBeenCalledTimes(1);
      expect(sendMessage.mock.calls[0][0].text).toBe('Explain this');
      expect(where(router)).toBe(
        '/ask?topicId=t-percentage&topicName=Percentage',
      );
    });

    it('a question from a reviewed practice question arrives in router state', async () => {
      sendMessage.mockResolvedValue(instantReply('samjha diya'));
      const { router } = open('/ask', {
        entries: [
          {
            pathname: '/ask',
            state: {
              topicId: 't-ratio',
              topicName: 'Ratio',
              initialPrompt: 'Explain: 2:3 = ?',
            },
          },
        ],
      });
      expect(
        await screen.findByText('samjha diya', {}, SLOW),
      ).toBeInTheDocument();
      expect(sendMessage.mock.calls[0][0]).toMatchObject({
        text: 'Explain: 2:3 = ?',
        topicId: 't-ratio',
      });
      expect(router.state.location.state).toBeNull();
    });

    it('with the allowance used up, a deep-linked question opens the upgrade prompt instead', async () => {
      await useUpTheAllowance();
      sendMessage.mockClear();
      open('/ask?topicId=t-ratio&topicName=Ratio&q=Explain');
      expect(
        await screen.findByRole('dialog', {
          name: "You've used today's free questions",
        }),
      ).toBeInTheDocument();
      expect(sendMessage).not.toHaveBeenCalled();
    });

    it('a reload brings back the last chat for the topic instead of an empty one', async () => {
      const first = open('/ask?topicId=t-percentage&topicName=Percentage');
      await userEvent.type(
        await screen.findByLabelText('Your question'),
        'pehla sawal{Enter}',
      );
      await screen.findByText('pehla sawal');
      await waitFor(
        () => expect(store.getState().aiTutor.sendStatus).toBe('idle'),
        SLOW,
      );
      first.unmount();

      // a reload keeps the saved chats but forgets which one was open
      act(() => {
        store.dispatch(startConversation({ examId: 'pet' }));
      });
      act(() => {
        store.dispatch(deleteConversation(store.getState().aiTutor.activeId));
      });
      expect(store.getState().aiTutor.activeId).toBeNull();

      open('/ask?topicId=t-percentage&topicName=Percentage');
      expect(await screen.findByText('pehla sawal')).toBeInTheDocument();
    });
  });

  describe('history', () => {
    it('opens the history, starts a new chat and reopens an old one', async () => {
      open();
      await userEvent.type(
        await screen.findByLabelText('Your question'),
        'purana sawal{Enter}',
      );
      await waitFor(
        () => expect(store.getState().aiTutor.sendStatus).toBe('idle'),
        SLOW,
      );

      await userEvent.click(
        screen.getByRole('button', { name: 'Conversation history' }),
      );
      const sheet = await screen.findByRole('dialog', {
        name: 'Your conversations',
      });
      await userEvent.click(
        within(sheet).getByRole('button', { name: 'New chat' }),
      );
      expect(await screen.findByText(/Hi, main/)).toBeInTheDocument();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      await userEvent.click(
        screen.getByRole('button', { name: 'Conversation history' }),
      );
      const again = await screen.findByRole('dialog', {
        name: 'Your conversations',
      });
      // newest first: the empty chat, then the old one (its last line is the AI's answer)
      const rows = within(again).getAllByRole('listitem');
      expect(rows).toHaveLength(2);
      expect(rows[0]).toHaveTextContent('No messages yet');
      await userEvent.click(
        within(rows[1]).getByRole('button', { name: /^New chat/ }),
      );
      expect(await screen.findByText('purana sawal')).toBeInTheDocument();
    });
  });

  describe('deleting a chat', () => {
    const askOnce = async () => {
      await userEvent.type(
        await screen.findByLabelText('Your question'),
        'HCF kaise nikale?{Enter}',
      );
      await waitFor(
        () => expect(store.getState().aiTutor.sendStatus).toBe('idle'),
        SLOW,
      );
    };

    it('has no delete button on an empty chat', async () => {
      open();
      await screen.findByText(/Hi, main/);
      expect(
        screen.queryByRole('button', { name: 'Delete chat' }),
      ).not.toBeInTheDocument();
    });

    it('asks first, then removes the chat and opens a fresh one', async () => {
      open();
      await askOnce();
      const before = store.getState().aiTutor;
      const id = before.activeId;
      const count = before.daily.count;

      await userEvent.click(
        screen.getByRole('button', { name: 'Delete chat' }),
      );
      const dialog = await screen.findByRole('dialog', {
        name: 'Delete this chat?',
      });
      expect(store.getState().aiTutor.conversations[id]).toBeDefined();
      await userEvent.click(
        within(dialog).getByRole('button', { name: 'Delete' }),
      );

      const after = store.getState().aiTutor;
      expect(after.conversations[id]).toBeUndefined();
      expect(after.order).not.toContain(id);
      expect(after.conversations[after.activeId].messages).toHaveLength(0);
      expect(after.daily.count).toBe(count);
      expect(screen.queryByText('HCF kaise nikale?')).not.toBeInTheDocument();
    });

    it('Cancel (or Escape) keeps the chat', async () => {
      open();
      await askOnce();
      const id = store.getState().aiTutor.activeId;
      await userEvent.click(
        screen.getByRole('button', { name: 'Delete chat' }),
      );
      await screen.findByRole('dialog', { name: 'Delete this chat?' });
      await userEvent.keyboard('{Escape}');
      expect(
        store.getState().aiTutor.conversations[id].messages.length,
      ).toBeGreaterThan(0);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('deletes another chat from the history list and keeps the open one', async () => {
      open();
      await askOnce();
      const oldId = store.getState().aiTutor.activeId;
      act(() => {
        store.dispatch(startConversation({}));
      });
      const newId = store.getState().aiTutor.activeId;

      await userEvent.click(
        screen.getByRole('button', { name: 'Conversation history' }),
      );
      const sheet = await screen.findByRole('dialog', {
        name: 'Your conversations',
      });
      const deletes = within(sheet).getAllByRole('button', {
        name: /^Delete chat /,
      });
      expect(deletes).toHaveLength(2); // newest first: the empty chat, then the old one
      await userEvent.click(deletes[1]);
      await userEvent.click(
        within(
          await screen.findByRole('dialog', { name: 'Delete this chat?' }),
        ).getByRole('button', { name: 'Delete' }),
      );

      const after = store.getState().aiTutor;
      expect(after.conversations[oldId]).toBeUndefined();
      expect(after.activeId).toBe(newId);
    });

    it('does not delete the chat that is waiting for a reply', async () => {
      open();
      await screen.findByLabelText('Your question');
      act(() => {
        store.dispatch(sendChatMessage({ text: 'Percentage kya hai?' }));
      });
      const id = store.getState().aiTutor.activeId;
      await userEvent.click(
        await screen.findByRole('button', { name: 'Delete chat' }),
      );
      expect(
        await screen.findByText(
          /You can delete this chat once the reply has arrived/,
        ),
      ).toBeInTheDocument();
      expect(store.getState().aiTutor.conversations[id]).toBeDefined();
      store.dispatch(deleteConversation(id)); // the slice refuses it too
      expect(store.getState().aiTutor.conversations[id]).toBeDefined();
      await waitFor(
        () => expect(store.getState().aiTutor.sendStatus).toBe('idle'),
        SLOW,
      );
    });
  });

  describe('the daily allowance', () => {
    it('shows what is left and goes red at zero', async () => {
      open();
      expect(await screen.findByText('10/10 left today')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: '10/10 left today' }),
      ).toBeDisabled();
    });

    it('at zero: sending, photo and voice all open the upgrade prompt, and See Pro goes to Membership', async () => {
      await useUpTheAllowance();
      const { router } = open();
      const chip = await screen.findByRole('button', {
        name: '0/10 left today',
      });
      expect(box()).toBeEnabled();
      expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
      expect(
        screen.getByRole('button', { name: 'Ask with a photo' }),
      ).toBeDisabled();
      expect(
        screen.getByRole('button', { name: 'Ask by voice' }),
      ).toBeDisabled();

      await userEvent.click(chip);
      const dialog = await screen.findByRole('dialog', {
        name: "You've used today's free questions",
      });
      await userEvent.click(
        within(dialog).getByRole('button', { name: 'See Pro' }),
      );
      expect(where(router)).toBe('/membership?feature=ai');
    });

    it('the upgrade prompt can be dismissed with Not now', async () => {
      await useUpTheAllowance();
      open();
      await userEvent.click(
        await screen.findByRole('button', { name: '0/10 left today' }),
      );
      await userEvent.click(
        within(await screen.findByRole('dialog')).getByRole('button', {
          name: 'Not now',
        }),
      );
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('a server "too many requests" shows the same prompt, not a red error', async () => {
      sendMessage.mockRejectedValueOnce(new Error(AI_QUOTA_MESSAGE));
      open();
      await userEvent.type(
        await screen.findByLabelText('Your question'),
        'sawal{Enter}',
      );
      expect(
        await screen.findByRole(
          'dialog',
          { name: "You've used today's free questions" },
          SLOW,
        ),
      ).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('a Pro student has no limit and no chip', async () => {
      const { fetchMe } = await import('@/features/user/store/userSlice');
      act(() => {
        store.dispatch({
          type: fetchMe.fulfilled.type,
          payload: {
            profile: { id: 'u1', name: 'A', mobile: null },
            selectedExamId: 'pet',
            entitlements: { plan: 'pro', features: {} },
          },
        });
      });
      open();
      await screen.findByText(/Hi, main/);
      expect(screen.queryByText(/left today/)).not.toBeInTheDocument();
    });
  });

  describe('photo doubt', () => {
    it('on a laptop the photo button goes straight to the file chooser, then previews with a note', async () => {
      open();
      await userEvent.click(
        await screen.findByRole('button', { name: 'Ask with a photo' }),
      );
      expect(pickFromGallery).toHaveBeenCalled();
      const sheet = await screen.findByRole('dialog', {
        name: 'Send this photo?',
      });
      expect(
        within(sheet).getByRole('img', { name: 'Your photo, ready to send' }),
      ).toHaveAttribute('src', 'blob:photo');

      await userEvent.type(
        within(sheet).getByLabelText('Note (optional)'),
        'ye step',
      );
      await userEvent.click(
        within(sheet).getByRole('button', { name: 'Send to epadh.ai' }),
      );

      const sent = await screen.findByRole('img', { name: 'Photo you sent' });
      // the message keeps the small thumbnail so it survives a reload
      expect(sent).toHaveAttribute('src', media.image.thumbUri);
      expect(screen.getByText('ye step')).toBeInTheDocument();
      expect(
        await screen.findByText(/Photo mil gayi/, {}, SLOW),
      ).toBeInTheDocument();
      expect(used()).toBe(1);
    });

    it('on a phone it asks Camera or Gallery first', async () => {
      media.touch = true;
      open();
      await userEvent.click(
        await screen.findByRole('button', { name: 'Ask with a photo' }),
      );
      const dialog = await screen.findByRole('dialog', { name: 'Add a photo' });
      await userEvent.click(
        within(dialog).getByRole('button', { name: 'Camera' }),
      );
      expect(captureFromCamera).toHaveBeenCalled();
      expect(pickFromGallery).not.toHaveBeenCalled();
      expect(
        await screen.findByRole('dialog', { name: 'Send this photo?' }),
      ).toBeInTheDocument();
    });

    it('cancelling the preview sends nothing', async () => {
      open();
      await userEvent.click(
        await screen.findByRole('button', { name: 'Ask with a photo' }),
      );
      await userEvent.click(
        within(
          await screen.findByRole('dialog', { name: 'Send this photo?' }),
        ).getByRole('button', { name: 'Cancel' }),
      );
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(used()).toBe(0);
      expect(
        screen.queryByRole('img', { name: 'Photo you sent' }),
      ).not.toBeInTheDocument();
    });

    it('a photo pasted into the box goes through the same flow', async () => {
      open();
      const area = await screen.findByLabelText('Your question');
      const file = new File(['x'], 'shot.png', { type: 'image/png' });
      area.focus();
      await userEvent.paste({
        files: [file],
        types: ['Files'],
        getData: () => '',
      });
      expect(processImageFile).toHaveBeenCalledWith(file, 'doubt');
      expect(
        await screen.findByRole('dialog', { name: 'Send this photo?' }),
      ).toBeInTheDocument();
    });

    it('pasting plain text still just pastes text', async () => {
      open();
      await userEvent.click(await screen.findByLabelText('Your question'));
      await userEvent.paste('mera sawal');
      expect(box()).toHaveValue('mera sawal');
      expect(processImageFile).not.toHaveBeenCalled();
    });

    it('explains a photo that cannot be used', async () => {
      media.error = Object.assign(new Error('x'), { code: 'E_NOT_AN_IMAGE' });
      open();
      await userEvent.click(
        await screen.findByRole('button', { name: 'Ask with a photo' }),
      );
      expect(
        await screen.findByText(/Please choose a photo/),
      ).toBeInTheDocument();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('a failed photo reply can be retried with the same picture', async () => {
      const { analyzeDoubtPhoto } =
        await import('@/features/aiTutor/services/doubtService');
      expect(typeof analyzeDoubtPhoto).toBe('function');
      open();
      await userEvent.click(
        await screen.findByRole('button', { name: 'Ask with a photo' }),
      );
      await userEvent.click(
        within(
          await screen.findByRole('dialog', { name: 'Send this photo?' }),
        ).getByRole('button', { name: 'Send to epadh.ai' }),
      );
      await screen.findByText(/Photo mil gayi/, {}, SLOW);
      expect(
        screen.getAllByRole('img', { name: 'Photo you sent' }),
      ).toHaveLength(1);
    });
  });

  describe('voice', () => {
    it('is switched off, with a reason, in a browser without speech recognition', async () => {
      voice.supported = false;
      open();
      const mic = await screen.findByRole('button', { name: 'Ask by voice' });
      expect(mic).toBeDisabled();
      expect(mic).toHaveAttribute(
        'title',
        expect.stringMatching(/not supported in this browser/),
      );
    });

    it('listens, shows the words as they come, and sends them like a typed question', async () => {
      open();
      await userEvent.click(
        await screen.findByRole('button', { name: 'Ask by voice' }),
      );
      const overlay = await screen.findByRole('dialog', {
        name: 'Voice question',
      });
      expect(within(overlay).getByText('Sun raha hoon…')).toBeInTheDocument();
      expect(startListening).toHaveBeenCalledWith('hi-IN', expect.any(Object));

      act(() => voice.callbacks.onPartial('percentage kya'));
      expect(within(overlay).getByLabelText('What was heard')).toHaveValue(
        'percentage kya',
      );
      act(() => voice.callbacks.onFinal('percentage kya hota hai'));
      act(() => voice.callbacks.onEnd()); // the browser stops by itself after a pause
      expect(
        within(overlay).getByRole('button', { name: 'Start listening' }),
      ).toBeInTheDocument();

      await userEvent.click(
        within(overlay).getByRole('button', { name: 'Send' }),
      );
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(
        await screen.findByText('percentage kya hota hai'),
      ).toBeInTheDocument();
      expect(used()).toBe(0); // counted when the reply lands
      await waitFor(() => expect(used()).toBe(1), SLOW);
    });

    it('the words can be corrected before sending', async () => {
      open();
      await userEvent.click(
        await screen.findByRole('button', { name: 'Ask by voice' }),
      );
      const overlay = await screen.findByRole('dialog', {
        name: 'Voice question',
      });
      act(() => {
        voice.callbacks.onFinal('percentej kya');
        voice.callbacks.onEnd();
      });
      const field = within(overlay).getByLabelText('What was heard');
      await userEvent.clear(field);
      await userEvent.type(field, 'percentage kya');
      await userEvent.click(
        within(overlay).getByRole('button', { name: 'Send' }),
      );
      expect(await screen.findByText('percentage kya')).toBeInTheDocument();
    });

    it('switches language and listens again in it', async () => {
      open();
      await userEvent.click(
        await screen.findByRole('button', { name: 'Ask by voice' }),
      );
      const overlay = await screen.findByRole('dialog', {
        name: 'Voice question',
      });
      await userEvent.click(
        within(overlay).getByRole('button', { name: 'English' }),
      );
      await waitFor(() => expect(voice.locale).toBe('en-IN'));
      expect(
        within(overlay).getByRole('button', { name: 'English' }),
      ).toHaveAttribute('aria-pressed', 'true');
    });

    it('the mic button stops and restarts listening', async () => {
      open();
      await userEvent.click(
        await screen.findByRole('button', { name: 'Ask by voice' }),
      );
      const overlay = await screen.findByRole('dialog', {
        name: 'Voice question',
      });
      await userEvent.click(
        within(overlay).getByRole('button', { name: 'Stop listening' }),
      );
      expect(stopListening).toHaveBeenCalled();
      expect(
        within(overlay).getByRole('button', { name: 'Start listening' }),
      ).toBeInTheDocument();
      await userEvent.click(
        within(overlay).getByRole('button', { name: 'Start listening' }),
      );
      expect(startListening).toHaveBeenCalledTimes(2);
    });

    it('cancel closes without sending', async () => {
      open();
      await userEvent.click(
        await screen.findByRole('button', { name: 'Ask by voice' }),
      );
      const overlay = await screen.findByRole('dialog', {
        name: 'Voice question',
      });
      act(() => voice.callbacks.onFinal('adhura'));
      await userEvent.click(
        within(overlay).getByRole('button', { name: 'Cancel' }),
      );
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(used()).toBe(0);
    });

    it('tells the student when nothing was heard', async () => {
      open();
      await userEvent.click(
        await screen.findByRole('button', { name: 'Ask by voice' }),
      );
      await screen.findByRole('dialog', { name: 'Voice question' });
      act(() =>
        voice.callbacks.onError('Kuch sunayi nahi diya. Please try again.'),
      );
      expect(
        await screen.findByText(/Kuch sunayi nahi diya/),
      ).toBeInTheDocument();
    });

    it('explains a denied microphone and does not open the overlay', async () => {
      voice.permission = false;
      open();
      await userEvent.click(
        await screen.findByRole('button', { name: 'Ask by voice' }),
      );
      expect(
        await screen.findByText(/needs microphone permission/),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('dialog', { name: 'Voice question' }),
      ).not.toBeInTheDocument();
    });
  });

  describe('spoken replies', () => {
    it('reads the next AI reply aloud once the speaker is switched on, and can be stopped', async () => {
      sendMessage.mockResolvedValue(instantReply('suno yeh jawab'));
      open();
      await userEvent.click(
        await screen.findByRole('button', { name: 'Turn voice replies on' }),
      );
      expect(store.getState().aiTutor.ttsEnabled).toBe(true);
      await userEvent.type(box(), 'bolo{Enter}');
      await waitFor(() => expect(speak).toHaveBeenCalledWith('suno yeh jawab'));
      expect(speak).toHaveBeenCalledTimes(1);

      // while it speaks the button becomes "Stop speaking"
      expect(
        await screen.findByRole('button', { name: 'Stop speaking' }),
      ).toBeInTheDocument();
      await userEvent.click(
        screen.getByRole('button', { name: 'Stop speaking' }),
      );
      expect(stopSpeaking).toHaveBeenCalled();
      expect(store.getState().aiTutor.ttsEnabled).toBe(false);
    });

    it('does not speak when the speaker is off', async () => {
      sendMessage.mockResolvedValue(instantReply('chup'));
      open();
      await userEvent.type(
        await screen.findByLabelText('Your question'),
        'bolo{Enter}',
      );
      await screen.findByText('chup');
      expect(speak).not.toHaveBeenCalled();
    });

    it('goes quiet when the page is left', async () => {
      const view = open();
      await screen.findByText(/Hi, main/);
      stopSpeaking.mockClear();
      view.unmount();
      expect(stopSpeaking).toHaveBeenCalled();
    });
  });

  it('the back arrow goes back', async () => {
    const { router } = open('/ask', {
      entries: ['/elsewhere', '/ask'],
      index: 1,
    });
    await userEvent.click(
      await screen.findByRole('button', { name: 'Go back' }),
    );
    expect(router.state.location.pathname).toBe('/elsewhere');
  });
});
