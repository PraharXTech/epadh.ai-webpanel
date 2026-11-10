// Mock data layer. Swap the bodies for real API calls (src/api) later.
//
// Contract for the real GET /home (one call, one first paint), to agree with PraharX:
//   user           { name }   (the bell's unread count comes from GET /notifications)
//   hero, quickActions, popularExams, motivation   (content the admin can change)
//   progress       { message }   plus, once the backend computes them, the numbers the app
//                  works out on the device today: syllabus percent, MCQs solved,
//                  mock tests, last activity (Continue Learning)
//   weakTopics     [{ id, name, accuracy }]   Pro only, empty for Free
// Until then the app fills the numbers from its own data (see HomeScreen); when the server
// sends them, those values replace the local ones and only this file and HomeScreen change.
const delay = (ms = 400) => new Promise(resolve => setTimeout(resolve, ms));

const MOCK_HOME = {
  user: { name: 'Abhishek' },
  hero: {
    badge: 'Your AI Study Partner',
    title: 'Prepare Smarter',
    brand: 'epadh.ai',
    subtitle:
      'AI-powered learning for competitive exams. Practice, learn, and achieve your goals.',
    cta: 'Start Learning',
  },
  quickActions: [
    {
      id: 'study',
      label: 'Study Material',
      icon: 'book-open',
      color: '#2563eb',
      bg: 'bg-blue-50',
    },
    {
      id: 'mcq',
      label: 'Practice Tests',
      icon: 'file-text',
      color: '#16a34a',
      bg: 'bg-green-50',
    },
    {
      id: 'mock',
      label: 'Mock Tests',
      icon: 'clipboard-check',
      color: '#e11d48',
      bg: 'bg-rose-50',
    },
    {
      id: 'ask',
      label: 'Ask epadh.ai',
      icon: 'bot',
      color: '#7c3aed',
      bg: 'bg-violet-50',
    },
  ],
  // `percent` and the 4 activity numbers on this card are all computed on the device
  // (see HomeScreen) until the backend sends them; `message` is the only part that is
  // genuinely admin content.
  progress: {
    percent: 65,
    message: 'You are on the right track!',
  },
  popularExams: [
    {
      id: 'pet',
      name: 'UPSSSC PET',
      icon: 'landmark',
      color: '#475569',
      testCount: 12450,
    },
    {
      id: 'police',
      name: 'UP Police',
      icon: 'shield-check',
      color: '#1d4ed8',
      testCount: 8230,
    },
    {
      id: 'gd',
      name: 'SSC GD',
      icon: 'medal',
      color: '#b91c1c',
      testCount: 15620,
    },
    {
      id: 'chsl',
      name: 'SSC CHSL',
      icon: 'medal',
      color: '#b91c1c',
      testCount: 11340,
    },
    { id: 'more', name: 'More Exams', icon: 'grid', color: '#475569' },
  ],
  motivation: 'Small Steps Today,\nBig Results Tomorrow!',
  weakTopics: [], // Pro only; real data comes with the analytics (Phase 8)
};

export const fetchHomeData = async () => {
  await delay();
  return MOCK_HOME;
};
