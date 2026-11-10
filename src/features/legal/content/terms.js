import { BRAND, SUPPORT } from '@/config/brand';

// Draft Terms of Use. Plain-language and specific to what the app does. Have a lawyer
// review it (refunds, liability, governing law) before the Play Store release.
export const TERMS = {
  title: 'Terms & Conditions',
  intro: `Welcome to ${BRAND.name}. These terms are the agreement between you and ${BRAND.name} ("we", "us") for using our app. Please read them. By creating an account or using the app, you agree to them.`,
  sections: [
    {
      heading: 'Who can use the app',
      paragraphs: [
        'You can use the app if you are 18 or older, or if you are younger and a parent or guardian agrees to these terms and supervises your use.',
        'You need a valid mobile number or Google account to sign in. The details you give us must be true.',
      ],
    },
    {
      heading: 'Your account',
      bullets: [
        'You are responsible for what happens under your account. Do not share your login or OTP with anyone.',
        'One account is for one student. We may limit or suspend accounts that are shared or resold.',
        `Tell us at ${SUPPORT.email} if you think someone else is using your account.`,
      ],
    },
    {
      heading: 'What we provide',
      paragraphs: [
        `${BRAND.name} helps you prepare for competitive exams with study material, practice questions, mock tests, an AI tutor, study plans and performance reports.`,
        'We keep improving the app, so features, content and limits can change. We will try to tell you about changes that matter.',
      ],
    },
    {
      heading: 'AI answers and study content',
      bullets: [
        'The AI tutor and AI-generated questions can make mistakes. Check important facts with your textbook or teacher.',
        'Use the Report button on a question or answer that looks wrong. It helps us fix it.',
        'Practice and mock-test scores, ranks and predictions are for learning. They do not guarantee a result in any real exam.',
      ],
    },
    {
      heading: 'Free and Pro plans',
      paragraphs: [
        'The Free plan has daily limits, for example on practice questions and AI questions. Pro unlocks more features. The plans, prices, limits and validity shown in the app at the time you pay are what apply to you.',
      ],
    },
    {
      heading: 'Payments, renewals and refunds',
      bullets: [
        'Payments are made through our payment partner. We never see or store your card, UPI or bank details.',
        'A Pro plan is bought for a fixed period (for example a month or a year). It does not renew by itself. We remind you before it expires.',
        'When a plan ends, your account goes back to Free. Your study history stays.',
        'Payments are not refundable once Pro is active, except where the law requires it or where we charged you by mistake or twice. If something went wrong with a payment, write to us with the payment ID from Payment history.',
        'If money was deducted but Pro did not start, we will fix it or refund you after checking with the payment partner.',
      ],
    },
    {
      heading: 'Using the app properly',
      paragraphs: ['You agree not to:'],
      bullets: [
        'copy, download in bulk, resell or share our study material, questions or mock tests outside the app',
        'use bots, scripts or tools to scrape content or to cheat the ranking',
        'try to break, probe or overload the app or our servers',
        'upload anything unlawful, abusive or that you have no right to share',
        'use the AI tutor to create harmful content',
      ],
    },
    {
      heading: 'Content and ownership',
      paragraphs: [
        `The app, its design, study material, questions and mock tests belong to ${BRAND.name} or its licensors. You get a personal, non-transferable right to use them for your own preparation while your account is in good standing.`,
        'The photos, questions and messages you send us remain yours. You allow us to process them to run the app, to answer you, and to improve how it works.',
      ],
    },
    {
      heading: 'When we can pause or end access',
      paragraphs: [
        'We may suspend or close an account that breaks these terms or puts the app or other students at risk. You can stop using the app at any time and ask us to delete your account.',
      ],
    },
    {
      heading: 'Our responsibility',
      paragraphs: [
        'We work hard to keep the app running and the content correct, but we provide it "as is". The app may sometimes be slow, unavailable or contain errors.',
        'To the extent the law allows, we are not liable for indirect or consequential losses, or for exam results. Our total liability for a claim is limited to the amount you paid us in the 12 months before it.',
      ],
    },
    {
      heading: 'Changes to these terms',
      paragraphs: [
        'We may update these terms. If a change is important, we will tell you in the app. If you keep using the app after the date of change, you accept the new terms.',
      ],
    },
    {
      heading: 'Law that applies',
      paragraphs: [
        'These terms follow the laws of India. Disputes will be handled by the courts in India, after you have given us a chance to fix the problem first.',
      ],
    },
    {
      heading: 'Contact us',
      paragraphs: [
        `Questions about these terms? Email ${SUPPORT.email}. We reply ${SUPPORT.replyTime}.`,
      ],
    },
  ],
};
