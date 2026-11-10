// Mock activity layer. Real endpoints once the backend exists:
//   saveActivity -> PUT /activity  { type, mode, examId, topicId, itemId }
//   (the backend also returns it inside GET /home, see plan.md 5.5)
import { apiClient } from '@/api/client';
import { USE_MOCK_API } from '@/config/env';

const delay = (ms = 200) => new Promise(resolve => setTimeout(resolve, ms));

export const saveActivity = async activity => {
  if (!USE_MOCK_API) {
    await apiClient.put('/activity', activity);
    return;
  }
  await delay();
};
