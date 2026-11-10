// Mock notification layer. Real endpoints once the backend exists (plan.md §6):
//   fetchNotifications -> GET /notifications        -> [{ id, type, title, body, createdAt, read, link }]
//   markNotificationRead -> PUT /notifications/:id/read
// The server decides what gets sent (plan reminder, streak at risk, new mock, result
// ready, membership expiring, payment status); the app only lists them and opens `link`.
//   type  'new_mock' | 'plan' | 'streak' | 'result' | 'expiry' | 'payment' | 'offer' | 'info'
//   link  { name, params? } — a screen to open when the notification is tapped, or null
import { apiClient } from '@/api/client';
import { USE_MOCK_API } from '@/config/env';

const delay = (ms = 400) => new Promise(resolve => setTimeout(resolve, ms));

const HOUR = 3600000;
const ago = hours => Date.now() - hours * HOUR;

// Fixed ids, so the same notification is never listed twice across refreshes.
const mockNotifications = () => [
  {
    id: 'srv-new-mock',
    type: 'new_mock',
    title: 'New mock test available',
    body: 'A fresh full-length mock test is live. Try it under real exam conditions.',
    createdAt: ago(2),
    read: false,
    link: { name: 'MockTests' },
  },
  {
    id: 'srv-plan',
    type: 'plan',
    title: "Today's study plan is ready",
    body: 'Three focused tasks picked from your weak topics. Start with the first one.',
    createdAt: ago(5),
    read: false,
    link: { name: 'StudyPlan' },
  },
  {
    id: 'srv-streak',
    type: 'streak',
    title: 'Keep your streak alive',
    body: 'Study for a few minutes today so you do not lose your streak.',
    createdAt: ago(27),
    read: false,
    link: { name: 'MainTabs', params: { screen: 'Study Material' } },
  },
  {
    id: 'srv-offer',
    type: 'offer',
    title: 'Go Pro for unlimited practice',
    body: 'Unlock weak-topic analysis, advanced mocks and a personal study planner.',
    createdAt: ago(52),
    read: true,
    link: { name: 'Membership' },
  },
  {
    id: 'srv-welcome',
    type: 'info',
    title: 'Welcome to epadh.ai',
    body: 'Padho Smarter, Jeeto Bada. Pick a topic, practise, and track your progress here.',
    createdAt: ago(24 * 6),
    read: true,
    link: null,
  },
];

export const fetchNotifications = async () => {
  if (!USE_MOCK_API) {
    const { data } = await apiClient.get('/notifications');
    return data;
  }
  await delay();
  return mockNotifications();
};

// Best effort: the app already shows it as read; a failed call is retried by the next
// fetch, which returns whatever the server has.
export const markNotificationRead = async id => {
  if (!USE_MOCK_API) {
    await apiClient.put(`/notifications/${id}/read`);
    return;
  }
  await delay(100);
};
