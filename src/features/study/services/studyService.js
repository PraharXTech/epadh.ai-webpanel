// Mock study-session layer. Real endpoint once the backend exists:
//   sendSessions -> POST /study-sessions  [{ id, type, refId, start, end, seconds }]
// The id makes it safe to send a session twice (the server ignores duplicates).
import { apiClient } from '@/api/client';
import { USE_MOCK_API } from '@/config/env';

const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

export const sendSessions = async sessions => {
  if (!USE_MOCK_API) {
    await apiClient.post('/study-sessions', { sessions });
    return;
  }
  await delay();
};
