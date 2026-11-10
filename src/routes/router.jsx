import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import ScreenLoader from '@/components/common/ScreenLoader';
import FocusLayout from '@/layouts/FocusLayout';
import AppLayout from '@/layouts/AppLayout';
import PublicLayout from '@/layouts/PublicLayout';
import ExamSelectionPage from '@/features/exams/pages/ExamSelectionPage';
import LoginPage from '@/features/auth/pages/LoginPage';
import OtpPage from '@/features/auth/pages/OtpPage';
import MaterialPage from '@/features/material/pages/MaterialPage';
import MaterialViewerPage from '@/features/material/pages/MaterialViewerPage';
import ChapterListPage from '@/features/syllabus/pages/ChapterListPage';
import SubjectListPage from '@/features/syllabus/pages/SubjectListPage';
import TopicDetailPage from '@/features/syllabus/pages/TopicDetailPage';
import TopicListPage from '@/features/syllabus/pages/TopicListPage';
import NotFoundPage from '@/pages/public/NotFoundPage';
import PlaceholderPage from '@/pages/PlaceholderPage';
import { OnboardingOnly, PublicOnly, RequireAuth, RequireExam } from './guards';
import { PATHS, PATTERNS } from './routePaths';

// Every route from plan.md section 4. Pages not ported yet render <PlaceholderPage/>;
// when a phase lands, swap its `ph(...)` for the real page (use React.lazy for code
// splitting). Keep this file the only place that knows which layout a page uses.
const ph = (title, mobile, phase) => (
  <PlaceholderPage title={title} mobile={mobile} phase={phase} />
);

// Dev-only component gallery. `import.meta.env.DEV` is replaced at build time, so the page
// and its imports are dropped from production bundles.
const devRoutes = import.meta.env.DEV
  ? (() => {
      const UiGalleryPage = lazy(() => import('@/pages/dev/UiGalleryPage'));
      return [
        {
          path: '/dev/ui',
          element: (
            <Suspense fallback={<ScreenLoader />}>
              <UiGalleryPage />
            </Suspense>
          ),
        },
      ];
    })()
  : [];

export const router = createBrowserRouter([
  ...devRoutes,

  // ---- public: no session needed ----
  {
    element: <PublicLayout />,
    children: [
      {
        path: PATHS.terms,
        element: ph('Terms of Service', 'TermsScreen', 'W12'),
      },
      {
        path: PATHS.privacy,
        element: ph('Privacy Policy', 'PrivacyScreen', 'W12'),
      },
    ],
  },

  // login / OTP bring their own full-bleed layout (banner + card)
  {
    element: <PublicOnly />,
    children: [
      { path: PATHS.login, element: <LoginPage /> },
      { path: PATHS.otp, element: <OtpPage /> },
    ],
  },

  // ---- logged in ----
  {
    element: <RequireAuth />,
    children: [
      // no exam chosen yet: this is the only page
      {
        element: <OnboardingOnly />,
        children: [
          {
            path: PATHS.onboardingExam,
            element: <ExamSelectionPage />,
          },
        ],
      },

      // exam chosen: the app
      {
        element: <RequireExam />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { path: PATHS.home, element: ph('Home', 'HomeScreen', 'W6') },
              { path: PATHS.syllabus, element: <SubjectListPage /> },
              { path: PATTERNS.subject, element: <ChapterListPage /> },
              { path: PATTERNS.chapter, element: <TopicListPage /> },
              { path: PATTERNS.topic, element: <TopicDetailPage /> },
              { path: PATHS.studyMaterial, element: <MaterialPage /> },
              { path: PATHS.tests, element: ph('Tests', 'TestsScreen', 'W8') },
              {
                path: PATTERNS.practiceSetup,
                element: ph('Practice setup', 'PracticeSetupScreen', 'W5'),
              },
              {
                path: PATHS.practiceResult,
                element: ph('Practice result', 'PracticeResultScreen', 'W5'),
              },
              {
                path: PATHS.mocks,
                element: ph('Mock tests', 'MockTestsScreen', 'W8'),
              },
              {
                path: PATTERNS.mockInstructions,
                element: ph(
                  'Mock instructions',
                  'MockInstructionsScreen',
                  'W8',
                ),
              },
              {
                path: PATHS.mockResult,
                element: ph('Mock result', 'MockResultScreen', 'W8'),
              },
              {
                path: PATHS.pyq,
                element: ph('Previous year papers', 'PyqPapersScreen', 'W8'),
              },
              {
                path: PATHS.ask,
                element: ph('Ask epadh.ai', 'AskAiChatScreen', 'W7'),
              },
              {
                path: PATHS.omr,
                element: ph('OMR scanner', 'OmrScanScreen', 'W11'),
              },
              {
                path: PATTERNS.omrResult,
                element: ph('OMR result', 'OmrResultScreen', 'W11'),
              },
              {
                path: PATHS.omrHistory,
                element: ph('OMR history', 'OmrHistoryScreen', 'W11'),
              },
              {
                path: PATHS.history,
                element: ph('History', 'HistoryScreen', 'W10'),
              },
              {
                path: PATHS.plan,
                element: ph('Study plan', 'StudyPlanScreen', 'W10'),
              },
              {
                path: PATHS.performance,
                element: ph('Performance', 'PerformanceScreen', 'W10'),
              },
              {
                path: PATHS.weakTopics,
                element: ph('Weak topics', 'WeakTopicsScreen', 'W10'),
              },
              {
                path: PATHS.streak,
                element: ph('Streak', 'not in mobile code', 'W6'),
              },
              {
                path: PATHS.profile,
                element: ph('Profile', 'ProfileScreen', 'W12'),
              },
              {
                path: PATHS.profileEdit,
                element: ph('Edit profile', 'EditProfileScreen', 'W12'),
              },
              {
                path: PATHS.profileDelete,
                element: ph('Delete account', 'DeleteAccountScreen', 'W12'),
              },
              {
                path: PATHS.settings,
                element: ph('Settings', 'SettingsScreen', 'W12'),
              },
              {
                path: PATHS.help,
                element: ph('Help & support', 'HelpSupportScreen', 'W12'),
              },
              {
                path: PATHS.notifications,
                element: ph('Notifications', 'NotificationsScreen', 'W12'),
              },
              {
                path: PATHS.membership,
                element: ph('Membership', 'MembershipScreen', 'W9'),
              },
              {
                path: PATTERNS.checkout,
                element: ph('Checkout', 'CheckoutScreen', 'W9'),
              },
              {
                path: PATHS.paymentProcessing,
                element: ph(
                  'Processing payment',
                  'PaymentProcessingScreen',
                  'W9',
                ),
              },
              {
                path: PATHS.paymentSuccess,
                element: ph('Payment successful', 'PaymentSuccessScreen', 'W9'),
              },
              {
                path: PATHS.paymentHistory,
                element: ph('Payment history', 'PaymentHistoryScreen', 'W9'),
              },
            ],
          },

          // immersive pages: no sidebar or tabs
          {
            element: <FocusLayout />,
            children: [
              {
                path: PATHS.examSelect,
                element: <ExamSelectionPage changing />,
              },
              { path: PATTERNS.material, element: <MaterialViewerPage /> },
              {
                path: PATHS.practiceSession,
                element: ph('Practice session', 'PracticeSessionScreen', 'W5'),
              },
              {
                path: PATHS.mockSession,
                element: ph('Mock test', 'MockSessionScreen', 'W8'),
              },
              {
                path: PATTERNS.pyqViewer,
                element: ph('Paper', 'PyqViewerScreen', 'W8'),
              },
            ],
          },
        ],
      },
    ],
  },

  { path: '*', element: <NotFoundPage /> },
]);
