import { BRAND, SUPPORT } from '@/config/brand';

// Draft Privacy Policy that matches what the app does today. Have a lawyer review it
// (retention periods, grievance officer, processors) before the Play Store release, and
// keep it in step with the app whenever data handling changes.
export const PRIVACY = {
  title: 'Privacy Policy',
  intro: `${BRAND.name} respects your privacy. This page explains what we collect, why, who can see it, and the choices you have. It applies to the ${BRAND.name} mobile app.`,
  sections: [
    {
      heading: 'What we collect',
      paragraphs: ['Information you give us:'],
      bullets: [
        'your mobile number (to sign you in with an OTP) or your Google account name and email',
        'your name, and optionally your email, profile photo and exam date',
        'the exam you are preparing for',
        'questions, messages and photos you send to the AI tutor or the photo doubt solver',
        'reports you send about a wrong question or answer, and messages to support',
      ],
    },
    {
      heading: 'What we collect as you use the app',
      bullets: [
        'your study activity: topics opened, study time, practice and mock-test answers, scores, bookmarks and history',
        'your plan, usage against daily limits, and notification settings',
        'payment status and receipts. The payment itself happens with our payment partner, who handles your card, UPI or bank details. We do not see or store them.',
        'device and app information such as phone model, Android or iOS version and app version, and error reports, so we can fix problems',
      ],
    },
    {
      heading: 'Why we use it',
      bullets: [
        'to sign you in and keep your account secure',
        'to show your progress, history, streak, study plan and weak topics',
        'to give you AI answers and to generate practice questions',
        'to run payments and unlock Pro',
        'to send reminders and updates you have allowed',
        'to understand what works, fix bugs and improve the app',
        'to follow the law and prevent misuse',
      ],
    },
    {
      heading: 'AI features',
      paragraphs: [
        'When you ask the AI tutor something, the text of your question (and a photo, if you send one) is sent to our AI service to produce the answer. Please do not put personal details such as addresses or ID numbers in questions or photos.',
        'We may use reported questions and answers to check and improve content quality.',
      ],
    },
    {
      heading: 'Who we share it with',
      paragraphs: [
        'We do not sell your personal information. We share only what is needed with companies that help us run the app, under their own privacy duties:',
      ],
      bullets: [
        'cloud hosting and storage',
        'the AI service that answers your questions',
        'the payment partner that processes payments',
        'SMS and notification services that deliver OTPs and reminders',
        'sign-in with Google, if you choose it',
      ],
      after:
        'We may also share information if the law or a court requires it, or to protect the safety of students and the app.',
    },
    {
      heading: 'On your phone and how we protect it',
      bullets: [
        'Your login is kept in your phone’s secure storage.',
        'Your study history and saved lists are kept on your phone so the app works offline. Logging out removes them from the phone.',
        'Data is sent to our servers over encrypted connections.',
        'No system is perfectly secure, but we limit access to your data and review how it is protected.',
      ],
    },
    {
      heading: 'How long we keep it',
      paragraphs: [
        'We keep your information while your account is active and for as long as needed to give you the service, meet legal and accounting duties (such as payment records) and settle disputes. When you ask us to delete your account, we delete or anonymise your personal information, except what we must keep by law.',
      ],
    },
    {
      heading: 'Your choices',
      bullets: [
        'See and change your name, email, photo and exam date in Profile → Edit profile.',
        'Delete your account any time in Profile → Delete account. You can also ask for a copy of your data or a correction by emailing us from your registered number or email.',
        'Turn off notifications, camera, photos or microphone in your phone’s Settings at any time. Those features then stop working, but the rest of the app does.',
        'Stop using the app and log out whenever you like.',
      ],
    },
    {
      heading: 'Permissions the app may ask for',
      bullets: [
        'Camera and photos: to take or choose a photo for the doubt solver or your profile picture.',
        'Microphone: to ask the AI tutor by voice.',
        'Notifications: for study reminders and updates.',
      ],
    },
    {
      heading: 'Children',
      paragraphs: [
        'Many of our students are under 18. If you are under 18, please use the app with a parent or guardian’s consent. If you believe a child’s data was shared without a parent’s consent, write to us and we will remove it.',
      ],
    },
    {
      heading: 'Changes to this policy',
      paragraphs: [
        'We will update this page when our practices change, and tell you in the app about important changes.',
      ],
    },
    {
      heading: 'Contact and complaints',
      paragraphs: [
        `For any privacy question, request or complaint, email ${SUPPORT.email}. We reply ${SUPPORT.replyTime}.`,
      ],
    },
  ],
};
