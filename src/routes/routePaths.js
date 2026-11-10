// Single table of every URL in the app (plan.md section 4). Pages and navigation code
// import from here instead of typing strings, so a path changes in one place.
// Static paths are strings; paths with params are builder functions.
export const PATHS = {
  // public
  login: '/login',
  otp: '/login/otp',
  terms: '/terms',
  privacy: '/privacy',

  // onboarding / exam
  onboardingExam: '/onboarding/exam',
  examSelect: '/exams/select',

  // main
  home: '/',
  syllabus: '/syllabus',
  tests: '/tests',
  studyMaterial: '/study-material',
  profile: '/profile',

  // syllabus drill-down
  subject: (examId, subjectId) => `/syllabus/${examId}/${subjectId}`,
  chapter: (examId, subjectId, chapterId) =>
    `/syllabus/${examId}/${subjectId}/${chapterId}`,
  topic: topicId => `/topics/${topicId}`,
  material: itemId => `/material/${itemId}`,

  // practice
  practiceSetup: topicId => `/practice/${topicId}`,
  practiceSession: '/practice/session',
  practiceResult: '/practice/result',

  // mocks and papers
  mocks: '/mocks',
  mockInstructions: testId => `/mocks/${testId}`,
  mockSession: '/mocks/session',
  mockResult: '/mocks/result',
  pyq: '/pyq',
  pyqViewer: paperId => `/pyq/${paperId}`,

  // AI tutor (query: ?topicId=...&q=...)
  ask: '/ask',

  // OMR
  omr: '/omr',
  omrResult: scanId => `/omr/result/${scanId}`,
  omrHistory: '/omr/history',

  // insights
  history: '/history',
  plan: '/plan',
  performance: '/performance',
  weakTopics: '/weak-topics',
  streak: '/streak',

  // account
  profileEdit: '/profile/edit',
  profileDelete: '/profile/delete',
  settings: '/settings',
  help: '/help',
  notifications: '/notifications',

  // membership
  membership: '/membership',
  checkout: planId => `/membership/checkout/${planId}`,
  paymentProcessing: '/membership/processing',
  paymentSuccess: '/membership/success',
  paymentHistory: '/membership/payments',
};

// Route patterns for React Router (the same table, with `:param` placeholders).
export const PATTERNS = {
  subject: '/syllabus/:examId/:subjectId',
  chapter: '/syllabus/:examId/:subjectId/:chapterId',
  topic: '/topics/:topicId',
  material: '/material/:itemId',
  practiceSetup: '/practice/:topicId',
  mockInstructions: '/mocks/:testId',
  pyqViewer: '/pyq/:paperId',
  omrResult: '/omr/result/:scanId',
  checkout: '/membership/checkout/:planId',
};
