// Mock user layer. Real endpoints once the backend exists:
//   loadMe     -> GET /me
//   selectExams -> PUT /me/exams  { examIds } (the exams the student prepares for; all come from the admin's exam list)
import { apiClient } from '@/api/client';
import { USE_MOCK_API } from '@/config/env';

const delay = (ms = 400) => new Promise(resolve => setTimeout(resolve, ms));

export const FREE_ENTITLEMENTS = {
  plan: 'free',
  validTill: null,
  ai: { dailyLimit: 10, usedToday: 0 },
  mcq: { dailyLimit: 20, usedToday: 0 },
  features: {
    fullSyllabus: false,
    advancedMocks: false,
    studyPlanner: false,
    weakTopics: false,
    extendedPractice: false,
  },
};

// While mocked, the "server" hands back the profile the app last saved (`cachedProfile`),
// so edits survive a relaunch; the real GET /me ignores it.
export const loadMe = async cachedProfile => {
  if (!USE_MOCK_API) {
    const { data } = await apiClient.get('/me');
    return data;
  }
  await delay();
  return {
    profile: cachedProfile ?? { id: 'u1', name: 'Abhishek', mobile: null },
    selectedExamIds: null, // the slice keeps the locally saved exams while mocked
    entitlements: FREE_ENTITLEMENTS,
  };
};

// PUT /me { name, email, targetDate }. Email and targetDate are null when cleared.
export const saveProfileDetails = async ({ name, email, targetDate }) => {
  if (!USE_MOCK_API) {
    const { data } = await apiClient.put('/me', { name, email, targetDate });
    return data;
  }
  await delay(300);
  return { name, email, targetDate };
};

// POST /me/avatar (multipart image) -> { avatarUrl }; DELETE /me/avatar to remove it.
// While mocked the photo simply stays on the phone, so the local file is the "url".
export const saveAvatar = async uri => {
  if (!USE_MOCK_API) {
    if (!uri) {
      await apiClient.delete('/me/avatar');
      return { avatarUrl: null };
    }
    const form = new FormData();
    form.append('avatar', { uri, name: 'avatar.jpg', type: 'image/jpeg' });
    const { data } = await apiClient.post('/me/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  }
  await delay(300);
  return { avatarUrl: uri ?? null };
};

// DELETE /me: the server removes the account and its personal data (what the law makes
// it keep, such as payment records, stays). Resolves only once that is done.
export const removeAccount = async () => {
  if (!USE_MOCK_API) {
    await apiClient.delete('/me');
    return;
  }
  await delay(800);
};

export const saveSelectedExams = async ({ examIds }) => {
  if (!USE_MOCK_API) {
    await apiClient.put('/me/exams', { examIds });
    return { examIds };
  }
  await delay(300);
  return { examIds };
};
