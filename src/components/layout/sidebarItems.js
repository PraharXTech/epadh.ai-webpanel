import { PATHS } from '@/routes/routePaths';

// What the sidebar lists. Web port of navigation/sidebar/sidebarItems.js: the mobile
// `tab` / `screen` split becomes one `path`. `color` tints the icon, `bg` its tile.
export const SIDEBAR_SECTIONS = [
  {
    id: 'main',
    title: null,
    items: [
      {
        id: 'home',
        label: 'Home',
        icon: 'home',
        path: PATHS.home,
        end: true,
        color: '#2563eb',
        bg: 'bg-blue-50',
      },
      {
        id: 'syllabus',
        label: 'Syllabus',
        icon: 'file-text',
        path: PATHS.syllabus,
        color: '#0891b2',
        bg: 'bg-cyan-50',
      },
      {
        id: 'tests',
        label: 'Tests',
        icon: 'clipboard-check',
        path: PATHS.tests,
        color: '#e11d48',
        bg: 'bg-rose-50',
      },
      {
        id: 'study',
        label: 'Study material',
        icon: 'book-open',
        path: PATHS.studyMaterial,
        color: '#16a34a',
        bg: 'bg-green-50',
      },
    ],
  },
  {
    id: 'learning',
    title: 'My learning',
    items: [
      {
        id: 'mocks',
        label: 'Mock tests',
        icon: 'trophy',
        path: PATHS.mocks,
        color: '#d97706',
        bg: 'bg-amber-50',
      },
      {
        id: 'pyq',
        label: 'Previous year papers',
        icon: 'file-text',
        path: PATHS.pyq,
        color: '#7c3aed',
        bg: 'bg-violet-50',
      },
      {
        id: 'omr',
        label: 'OMR scanner',
        icon: 'scan',
        path: PATHS.omr,
        color: '#0891b2',
        bg: 'bg-cyan-50',
      },
      {
        id: 'plan',
        label: 'Study plan',
        icon: 'calendar',
        path: PATHS.plan,
        color: '#2563eb',
        bg: 'bg-blue-50',
      },
      {
        id: 'performance',
        label: 'Performance',
        icon: 'chart-column',
        path: PATHS.performance,
        color: '#7c3aed',
        bg: 'bg-violet-50',
      },
      {
        id: 'weak',
        label: 'Weak topics',
        icon: 'target',
        path: PATHS.weakTopics,
        color: '#ea580c',
        bg: 'bg-orange-50',
      },
      {
        id: 'history',
        label: 'History',
        icon: 'clock',
        path: PATHS.history,
        color: '#475569',
        bg: 'bg-slate-100',
      },
    ],
  },
  {
    id: 'account',
    title: 'Account',
    items: [
      {
        id: 'profile',
        label: 'Profile',
        icon: 'user',
        path: PATHS.profile,
        color: '#2563eb',
        bg: 'bg-blue-50',
      },
      {
        id: 'notifications',
        label: 'Notifications',
        icon: 'bell',
        path: PATHS.notifications,
        color: '#e11d48',
        bg: 'bg-rose-50',
      },
      {
        id: 'membership',
        label: 'Membership',
        icon: 'crown',
        path: PATHS.membership,
        color: '#d97706',
        bg: 'bg-amber-50',
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: 'settings',
        path: PATHS.settings,
        color: '#475569',
        bg: 'bg-slate-100',
      },
      {
        id: 'help',
        label: 'Help & support',
        icon: 'message-square',
        path: PATHS.help,
        color: '#0891b2',
        bg: 'bg-cyan-50',
      },
    ],
  },
];

// The 5 tabs of the mobile bottom bar, shown on small screens only.
export const BOTTOM_TABS = [
  { id: 'home', label: 'Home', icon: 'home', path: PATHS.home, end: true },
  { id: 'exams', label: 'Exams', icon: 'file-text', path: PATHS.syllabus },
  { id: 'tests', label: 'Tests', icon: 'clipboard-check', path: PATHS.tests },
  { id: 'study', label: 'Study', icon: 'book-open', path: PATHS.studyMaterial },
  { id: 'profile', label: 'Profile', icon: 'user', path: PATHS.profile },
];
