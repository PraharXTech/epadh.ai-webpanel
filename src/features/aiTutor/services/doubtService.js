// Photo Doubt Solver analysis. Real endpoint: POST /ai/doubt/photo (multipart image
// + optional note) -> { id, role: 'ai', text, createdAt } (plan.md §5.9). The backend
// runs the actual vision model; this mock proves out the capture → analyze → answer
// flow in the chat UI until that endpoint exists.
import { apiClient } from '@/api/client';
import { USE_MOCK_API } from '@/config/env';
import { recallImage } from '@/services/media/imageRegistry';
import { AI_QUOTA_MESSAGE } from './aiTutorService';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const newId = () =>
  `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const analyzeDoubtPhoto = async ({
  imageUri,
  note,
  examId,
  topicId,
  topicName,
}) => {
  if (!USE_MOCK_API) {
    // WEB CHANGE: a browser FormData takes a Blob, not the React Native { uri, name, type }.
    // The full-size photo is remembered in memory; after a reload only the small thumbnail the
    // message saved is left, which is what gets sent then.
    const image = recallImage(imageUri) ?? (await (await fetch(imageUri)).blob());
    const form = new FormData();
    form.append('image', image, 'doubt.jpg');
    if (note) {
      form.append('note', note);
    }
    if (examId) {
      form.append('examId', examId);
    }
    if (topicId) {
      form.append('topicId', topicId);
    }
    // (no Content-Type header: the browser adds multipart/form-data with its boundary)
    try {
      const { data } = await apiClient.post('/ai/doubt/photo', form);
      return data;
    } catch (e) {
      throw e?.response?.status === 429 ? new Error(AI_QUOTA_MESSAGE) : e;
    }
  }

  await delay(1100 + Math.random() * 700);
  const body =
    `Photo mil gayi${note ? `, saath mein note bhi mila: "${note}"` : ''}.\n\n` +
    `${topicName ? `**${topicName}** se related sawal lagta hai. ` : ''}` +
    'Yeh mock solution hai — asli photo-doubt AI backend judne ke baad yahan step-by-step solution aayega.';
  return { id: newId(), role: 'ai', text: body, createdAt: Date.now() };
};
