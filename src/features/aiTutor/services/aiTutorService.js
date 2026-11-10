// Mock AI tutor. Real endpoint: POST /ai/chat { conversationId, examId, topicId, text }
// -> { id, role: 'ai', text, createdAt } (plan.md §5.8). The backend also owns the
// Hindi/Hinglish tone (system prompt, admin-configurable) — this mock just imitates
// it well enough to build and test the chat UI. Swapping USE_MOCK_API off is the only
// change needed once the real endpoint exists; callers never see the difference.
import { apiClient } from '@/api/client';
import { USE_MOCK_API } from '@/config/env';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const newId = () =>
  `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const OPENERS = [
  'Chalo isse step by step samajhte hain.',
  'Good question! Yeh concept exam mein baar-baar aata hai.',
  'Theek hai, seedhi aasan bhasha mein samjhata hoon.',
  'Achha doubt hai, dekhte hain.',
];

const genericReply = topicName =>
  `${OPENERS[Math.floor(Math.random() * OPENERS.length)]}\n\n${
    topicName ? `**${topicName}** ke baare mein: ` : ''
  }Yeh mock jawab hai — asli AI jawab backend judne ke baad yahan aayega. Tab tak is screen ka layout, quick prompts aur quota yahi test kar sakte hain.`;

// Canned replies for the quick-prompt chips (plan.md §11). Real generated
// practice/quiz sessions from these chips are Phase 6 work (AI questions); for now
// they just reply in-chat so the flow and layout can be tried end to end.
const QUICK_REPLIES = {
  simpler: (lastAiText, topicName) =>
    `Aur aasan tarike se${topicName ? ` (${topicName})` : ''}: ${
      lastAiText ? lastAiText.split('\n')[0].replace(/\*\*/g, '') : 'is topic ka core idea'
    } — ek baar mein ek hi step par dhyaan dijiye.`,
  questions: () =>
    'Is topic se sawal banana jald hi yahan se ho sakega. Abhi ke liye topic ke "Practice Test" tab se maujooda sawal try kijiye.',
  quiz: () =>
    'AI quiz jald hi seedha yahin se shuru hoga. Abhi ke liye "Practice Test" tab se apna test lijiye.',
  keypoints: (_lastAiText, topicName) =>
    `${topicName ?? 'Is topic'} ke mukhya exam points:\n• Definition aur formula yaad rakho\n• Ek solved example dekho\n• 5-10 practice sawal lagao\n• Apni galtiyan revise karo`,
};

export const sendMessage = async ({
  conversationId,
  examId,
  topicId,
  topicName,
  text,
  promptId,
  lastAiText,
}) => {
  if (!USE_MOCK_API) {
    const { data } = await apiClient.post('/ai/chat', {
      conversationId,
      examId,
      topicId,
      text,
    });
    return data;
  }
  await delay(600 + Math.random() * 500);
  const body = QUICK_REPLIES[promptId]
    ? QUICK_REPLIES[promptId](lastAiText, topicName)
    : genericReply(topicName);
  return { id: newId(), role: 'ai', text: body, createdAt: Date.now() };
};
