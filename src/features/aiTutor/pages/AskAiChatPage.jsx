import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import AppIcon from '@/components/common/AppIcon';
import ScreenHeader from '@/components/common/ScreenHeader';
import useStudySession from '@/features/study/hooks/useStudySession';
import usePaywall from '@/hooks/usePaywall';
import { PATHS } from '@/routes/routePaths';
import { showAlert } from '@/services/alerts/alertStore';
import { ensureOnline } from '@/services/network/ensureOnline';
import {
  selectActiveConversation,
  selectAiDailyLimit,
  selectAiRemainingToday,
  selectConversationList,
  selectSendError,
  selectSendStatus,
  selectTtsEnabled,
} from '@/store/selectors/aiTutorSelectors';
import { selectSelectedExamId } from '@/store/selectors/userSelectors';
import ChatBubble from '../components/ChatBubble';
import ChatComposer from '../components/ChatComposer';
import ConversationHistorySheet from '../components/ConversationHistorySheet';
import EmptyChatState from '../components/EmptyChatState';
import PhotoPreviewSheet from '../components/PhotoPreviewSheet';
import QuickPromptChips from '../components/QuickPromptChips';
import QuotaChip from '../components/QuotaChip';
import RetryRow from '../components/RetryRow';
import TypingBubble from '../components/TypingBubble';
import VoiceOverlay from '../components/VoiceOverlay';
import usePhotoDoubt from '../hooks/usePhotoDoubt';
import useVoiceInput from '../hooks/useVoiceInput';
import { AI_QUOTA_MESSAGE } from '../services/aiTutorService';
import {
  isTtsSupported,
  onSpeechEnd,
  speak,
  stopSpeaking,
} from '../services/ttsService';
import {
  clearSendError,
  deleteConversation,
  openConversation,
  rateMessage,
  sendChatMessage,
  sendPhotoMessage,
  startConversation,
  toggleTts,
} from '../store/aiTutorSlice';

// Ask epadh.ai: text chat, Photo Doubt Solver and Voice assistant (plan.md sections 5.8-5.10).
// The AI replies (text, photo analysis) are mocked until the real backend endpoints exist
// (aiTutorService.js, doubtService.js); the file chooser, crop, microphone and speaker are real.
//
// Where it opens from (all deep links):
//   /ask                                          a general chat
//   /ask?topicId=t1&topicName=Percentage          a chat about one topic (the topic page's Ask tab)
//   /ask?topicId=t1&q=Explain...                  asks that question at once
//   router state { topicId, topicName, initialPrompt }   from a reviewed question (long prompt)
// The question is removed from the address after it is sent, so a reload never asks it again.
export default function AskAiChatPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const entry = location.state ?? {};
  const topicId = entry.topicId ?? params.get('topicId') ?? null;
  const topicName = entry.topicName ?? params.get('topicName') ?? null;
  const initialPrompt = entry.initialPrompt ?? params.get('q') ?? null;
  const { openPaywall } = usePaywall();

  const examId = useSelector(selectSelectedExamId);
  const conversation = useSelector(selectActiveConversation);
  const conversations = useSelector(selectConversationList);
  const sendStatus = useSelector(selectSendStatus);
  const error = useSelector(selectSendError);
  const limit = useSelector(selectAiDailyLimit);
  const remaining = useSelector(selectAiRemainingToday);
  const ttsEnabled = useSelector(selectTtsEnabled);
  const [historyOpen, setHistoryOpen] = useState(false);

  const photoDoubt = usePhotoDoubt();
  const voice = useVoiceInput();

  const atLimit = remaining === 0;
  const sending = sendStatus === 'sending';
  const failed = sendStatus === 'failed';
  const messages = conversation?.messages ?? [];

  // "You've used today's free questions": offer Pro instead of a bare error.
  const askToUpgrade = () =>
    showAlert(
      "You've used today's free questions",
      'Pro gives you many more AI questions every day.',
      [
        { text: 'Not now', style: 'cancel' },
        { text: 'See Pro', onPress: () => openPaywall('ai') },
      ],
      { tone: 'warning', icon: 'sparkles' },
    );

  // Reuse the active conversation when it already matches this entry point (same topic, or the
  // general chat again); otherwise open or create the right one.
  // Web addition: the saved chats survive a reload but "which one is open" does not (mobile
  // behaves the same after a restart). On a cold load with no question to ask, reopen the most
  // recent chat for this topic so a reload does not drop the student's place.
  useEffect(() => {
    if (initialPrompt || !conversation || conversation.topicId !== topicId) {
      const lastForTopic = conversations.find(c => c.topicId === topicId);
      if (!initialPrompt && !conversation && lastForTopic) {
        dispatch(openConversation(lastForTopic.id));
      } else {
        dispatch(startConversation({ examId, topicId, topicName }));
      }
    }
    // Only a different topic starts a different chat.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId]);

  // A question sent from a result page: once the fresh (empty) chat is the active one, ask it
  // right away, a single time, then take it out of the address.
  const promptSent = useRef(false);
  useEffect(() => {
    if (
      initialPrompt &&
      !promptSent.current &&
      conversation &&
      conversation.messages.length === 0 &&
      conversation.topicId === topicId
    ) {
      promptSent.current = true;
      if (remaining === 0) {
        askToUpgrade();
      } else {
        dispatch(sendChatMessage({ text: initialPrompt }));
      }
      const clean = new URLSearchParams();
      if (topicId) {
        clean.set('topicId', topicId);
      }
      if (topicName) {
        clean.set('topicName', topicName);
      }
      navigate(`${PATHS.ask}${clean.size ? `?${clean}` : ''}`, {
        replace: true,
        state: null,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation, initialPrompt, topicId, remaining]);

  const { touchProps } = useStudySession({
    type: 'ai',
    refId: conversation?.id ?? null,
  });

  // A server 429 comes back as the quota message: same prompt as running out locally.
  useEffect(() => {
    if (failed && error === AI_QUOTA_MESSAGE) {
      dispatch(clearSendError());
      askToUpgrade();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [failed, error]);

  // Keep the newest message in view.
  const endRef = useRef(null);
  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: 'end' });
  }, [messages.length, sending, failed]);

  const send = (text, promptId) => {
    if (atLimit) {
      askToUpgrade();
      return;
    }
    if (!ensureOnline('ai')) {
      return;
    }
    dispatch(sendChatMessage({ text, promptId }));
  };

  // Re-asks the last thing the student sent (text or photo) after a failed reply.
  const retry = () => {
    if (atLimit) {
      askToUpgrade();
      return;
    }
    if (!ensureOnline('ai')) {
      return;
    }
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUser) {
      return;
    }
    if (lastUser.imageUri) {
      dispatch(
        sendPhotoMessage({
          imageUri: lastUser.imageUri,
          note: lastUser.text,
          retry: true,
        }),
      );
    } else {
      dispatch(sendChatMessage({ text: lastUser.text, retry: true }));
    }
  };

  const pickPhoto = source => {
    if (atLimit) {
      askToUpgrade();
      return;
    }
    if (!ensureOnline('photo')) {
      return;
    }
    photoDoubt.capture(source);
  };

  const pastePhoto = file => {
    if (atLimit) {
      askToUpgrade();
      return;
    }
    if (ensureOnline('photo')) {
      photoDoubt.addFile(file);
    }
  };

  const openMic = () => {
    if (atLimit) {
      askToUpgrade();
      return;
    }
    if (!ensureOnline('ai')) {
      return;
    }
    voice.openOverlay();
  };

  const sendVoiceTranscript = text => {
    voice.close();
    send(text);
  };

  // Speaks the newest AI reply aloud when the speaker toggle is on (plan.md section 5.10).
  const [speaking, setSpeaking] = useState(false);
  const lastSpokenId = useRef(null);

  useEffect(() => onSpeechEnd(() => setSpeaking(false)), []);

  useEffect(() => {
    if (!ttsEnabled) {
      return;
    }
    const last = messages[messages.length - 1];
    if (last?.role === 'ai' && last.id !== lastSpokenId.current) {
      lastSpokenId.current = last.id;
      setSpeaking(true);
      speak(last.text);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ttsEnabled, messages.length]);

  // Leaving the page must not leave the speaker talking.
  useEffect(() => () => stopSpeaking(), []);

  const toggleSpeaker = () => {
    if (ttsEnabled) {
      stopSpeaking();
      setSpeaking(false);
    }
    dispatch(toggleTts());
  };

  // Asks first, then removes the chat. Deleting the one on screen opens a fresh chat.
  const confirmDelete = target => {
    if (target.id === conversation?.id && sending) {
      showAlert(
        'Please wait',
        'You can delete this chat once the reply has arrived.',
        null,
        { tone: 'warning' },
      );
      return;
    }
    showAlert(
      'Delete this chat?',
      'The conversation is removed for good. Your daily question count stays the same.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (target.id === conversation?.id) {
              stopSpeaking();
              setSpeaking(false);
            }
            dispatch(deleteConversation(target.id));
            if (target.id === conversation?.id) {
              dispatch(startConversation({ examId }));
            }
          },
        },
      ],
      { tone: 'danger', icon: 'trash' },
    );
  };

  const lastIsAi = messages[messages.length - 1]?.role === 'ai';

  return (
    <div
      className="mx-auto flex h-full min-h-0 max-w-3xl flex-col bg-sky-50"
      {...touchProps}>
      <ScreenHeader
        title={
          conversation?.topicName
            ? `Ask about ${conversation.topicName}`
            : 'Ask epadh.ai'
        }
        subtitle="AI tutor · Hindi/Hinglish"
        right={
          <div className="flex items-center gap-1">
            {isTtsSupported() ? (
              <button
                type="button"
                onClick={toggleSpeaker}
                aria-label={
                  speaking
                    ? 'Stop speaking'
                    : ttsEnabled
                      ? 'Turn voice replies off'
                      : 'Turn voice replies on'
                }
                aria-pressed={ttsEnabled}
                className="rounded-full p-2 hover:bg-slate-100">
                <AppIcon
                  name={ttsEnabled ? 'volume-2' : 'volume-x'}
                  size={19}
                  color={speaking ? '#2563eb' : '#334155'}
                />
              </button>
            ) : null}
            {messages.length > 0 ? (
              <button
                type="button"
                onClick={() => confirmDelete(conversation)}
                aria-label="Delete chat"
                className="rounded-full p-2 hover:bg-red-50">
                <AppIcon name="trash" size={19} color="#dc2626" />
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              aria-label="Conversation history"
              className="rounded-full p-2 hover:bg-slate-100">
              <AppIcon name="message-square" size={20} color="#334155" />
            </button>
          </div>
        }
      />

      {limit != null ? (
        <div className="flex justify-end px-4 pb-2">
          <QuotaChip
            limit={limit}
            remaining={remaining}
            onPress={askToUpgrade}
          />
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col">
        {messages.length === 0 ? (
          <EmptyChatState
            topicName={conversation?.topicName}
            onPrompt={prompt => send(prompt.text, prompt.id)}
            disabled={sending}
          />
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto py-3">
            <ul role="log" aria-label="Conversation" aria-live="polite">
              {messages.map(message => (
                <ChatBubble
                  key={message.id}
                  message={message}
                  onRate={(id, rating) =>
                    dispatch(rateMessage({ messageId: id, rating }))
                  }
                />
              ))}
              {sending ? (
                <TypingBubble />
              ) : failed ? (
                <RetryRow message={error} onRetry={retry} />
              ) : null}
            </ul>
            <div ref={endRef} />
          </div>
        )}

        {messages.length > 0 && lastIsAi && !sending ? (
          <div className="mb-2">
            <QuickPromptChips
              onPress={prompt => send(prompt.text, prompt.id)}
              disabled={atLimit}
            />
          </div>
        ) : null}

        <ChatComposer
          onSend={send}
          onPickPhoto={pickPhoto}
          onPasteImage={pastePhoto}
          onMic={openMic}
          voiceSupported={voice.supported}
          disabled={sending || atLimit}
        />
      </div>

      <ConversationHistorySheet
        visible={historyOpen}
        conversations={conversations}
        activeId={conversation?.id}
        onClose={() => setHistoryOpen(false)}
        onOpen={id => {
          dispatch(openConversation(id));
          setHistoryOpen(false);
        }}
        onNew={() => {
          dispatch(startConversation({ examId }));
          setHistoryOpen(false);
        }}
        onDelete={target => {
          setHistoryOpen(false);
          confirmDelete(target);
        }}
      />

      <PhotoPreviewSheet
        image={photoDoubt.pending}
        onCancel={photoDoubt.cancel}
        onSend={note => ensureOnline('photo') && photoDoubt.send(note)}
      />

      <VoiceOverlay
        visible={voice.open}
        listening={voice.listening}
        lang={voice.lang}
        transcript={voice.transcript}
        onChangeTranscript={voice.setTranscript}
        onSwitchLang={voice.switchLang}
        onToggleMic={() => (voice.listening ? voice.stop() : voice.resume())}
        onCancel={voice.close}
        onSend={sendVoiceTranscript}
      />
    </div>
  );
}
