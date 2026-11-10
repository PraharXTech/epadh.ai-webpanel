// Help centre questions. `action` (optional) adds a button under the answer that opens
// one of the app's screens: { label, name }.
export const FAQS = [
  {
    id: 'login',
    category: 'Account',
    question: 'How do I log in?',
    answer:
      'Enter your mobile number and the OTP we send you, or continue with Google. You do not need a password. If the OTP does not arrive, wait 30 seconds and tap Resend.',
  },
  {
    id: 'edit-profile',
    category: 'Account',
    question: 'How do I change my name, photo or exam?',
    answer:
      'Open Profile. Tap Edit to change your name, email and exam date, the camera badge on your picture to change your photo, and Change on the exam card to switch the exam you are preparing for.',
    action: { label: 'Edit profile', name: 'EditProfile' },
  },
  {
    id: 'delete-account',
    category: 'Account',
    question: 'How do I delete my account?',
    answer:
      'Open Profile and tap Delete account at the bottom. You will see what gets removed and must type DELETE to confirm. Your data is removed for good, except records we must keep by law, such as payment receipts.',
    action: { label: 'Delete account', name: 'DeleteAccount' },
  },
  {
    id: 'offline',
    category: 'Study & practice',
    question: 'Can I study without internet?',
    answer:
      'Yes, partly. Study material you downloaded and the history already saved on your phone can be read offline. In a mock test, your answers are saved on the phone and sent automatically once you are back online.',
  },
  {
    id: 'streak',
    category: 'Study & practice',
    question: 'How is my streak counted?',
    answer:
      'A day counts when you study, practise or finish a mock test. Your streak keeps going if you have not studied yet today, and breaks only when a whole day is missed.',
  },
  {
    id: 'history-details',
    category: 'Study & practice',
    question: 'Why does History say "Details not kept"?',
    answer:
      'The full review with solutions is kept for your latest 20 practice tests and 10 mock tests. Older tests keep their score and accuracy only.',
    action: { label: 'Open History', name: 'History' },
  },
  {
    id: 'limits',
    category: 'Study & practice',
    question: 'Why can I not practise more questions today?',
    answer:
      'The Free plan has a daily limit on practice questions. Your usage today is on the membership card in Profile. The limit resets every day, and Pro removes it.',
    action: { label: 'See Pro plans', name: 'Membership' },
  },
  {
    id: 'ai-what',
    category: 'Ask epadh.ai',
    question: 'How does the AI tutor work, and can I trust it?',
    answer:
      'Ask epadh.ai explains topics and solves doubts in simple language. It can sometimes be wrong, so check important facts with your book or teacher, and use the Report button on anything that looks incorrect.',
  },
  {
    id: 'ai-photo-voice',
    category: 'Ask epadh.ai',
    question: 'How do I ask by photo or voice?',
    answer:
      'In the chat, tap the camera to photograph a question and crop it, or the microphone to speak. If nothing happens, allow Camera or Microphone for epadh.ai in your phone Settings.',
  },
  {
    id: 'ai-limit',
    category: 'Ask epadh.ai',
    question: 'It says I have used all my AI questions',
    answer:
      'Free plans have a daily number of AI questions. It resets the next day. Pro has a higher limit.',
    action: { label: 'See Pro plans', name: 'Membership' },
  },
  {
    id: 'pro-what',
    category: 'Membership & payments',
    question: 'What do I get with Pro?',
    answer:
      'Pro unlocks the full syllabus, advanced mock tests, weak-topic analysis, the personal study planner, extended practice and higher AI limits. The Membership screen shows the full comparison.',
    action: { label: 'Compare plans', name: 'Membership' },
  },
  {
    id: 'pay-failed',
    category: 'Membership & payments',
    question: 'Money was deducted but Pro is not active',
    answer:
      'Wait a few minutes and reopen the app. It checks unfinished payments by itself. If Pro is still not active after that, email us the payment ID from Payment history and we will sort it out or refund you.',
    action: { label: 'Payment history', name: 'PaymentHistory' },
  },
  {
    id: 'renew',
    category: 'Membership & payments',
    question: 'Does Pro renew automatically?',
    answer:
      'No. A plan runs for the period you bought. We remind you before it ends, and you can renew from the Membership screen. After it ends your account returns to Free and your history stays.',
  },
  {
    id: 'refund',
    category: 'Membership & payments',
    question: 'Can I get a refund?',
    answer:
      'Payments are not refundable once Pro is active, except where the law requires it or we charged you by mistake or twice. The Terms & Conditions explain this in full.',
    action: { label: 'Read the Terms', name: 'Terms' },
  },
  {
    id: 'slow',
    category: 'Technical',
    question: 'The app is slow or content does not load',
    answer:
      'Check your internet connection, then pull down on the screen to refresh. Close and reopen the app, and make sure you have the latest version from the Play Store. If it still fails, tell us what you were doing.',
  },
  {
    id: 'notifications',
    category: 'Technical',
    question: 'I am not getting notifications',
    answer:
      'Open your phone Settings, find epadh.ai under Apps, and turn Notifications on. Also check that battery saver is not stopping the app in the background.',
  },
];
