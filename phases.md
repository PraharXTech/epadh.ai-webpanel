# Web App — Delivery Phases

Companion to [plan.md](plan.md). Port of the mobile app in `C:\rn\EpadhAI` to a student web app (React 19, Vite, Tailwind v4, Redux Toolkit, React Router v7, react-hot-toast, JS/JSX).

How to read this file:

- Phases are named **W0 – W14** so they are not confused with the mobile Phase 0 – 11. Each says which mobile phase it ports.
- Every phase lists the **exact mobile files** to bring over, in three kinds (see plan.md §1):
  - **Copy as is**: pure `.js`, no native imports. Copy the file, fix nothing.
  - **Adapt**: `.js` that touches a native module. Keep the exports, change the inside.
  - **Rewrite markup**: `.jsx`. Keep the hooks and logic, swap `View / Text / Pressable / FlatList` for DOM + Tailwind. `XxxScreen.jsx` becomes `XxxPage.jsx` under `pages/`.
- Paths are relative to `src/` in both repos. Mobile `src/navigation/*` is handled in W1 (routes, layouts) and is not listed per phase.
- Backend is built in parallel by PraharX, so every phase works on the **mock services** first (`USE_MOCK_API`) and flips to the real API when the endpoint exists. Same as mobile.
- Legend: `[x]` done, `[ ]` to do.

Order of value if time is short: **W1 → W2 → W3 → W4 → W5 → W6 → W7 → W8 → W9**, then W10–W12, OMR (W11) last. Same advice as mobile.

---

## Scale of the port

Counts exclude `navigation/` (9 files, rebuilt as routes and layouts in W1).

| Phase | Copy | Adapt | Rewrite markup | Total files |
|---|---|---|---|---|
| W1 | 10 | 4 | 1 | 15 |
| W2 | 1 | 0 | 13 | 14 |
| W3 | 17 | 0 | 9 | 26 |
| W4 | 9 | 1 | 23 | 33 |
| W5 | 5 | 0 | 6 | 11 |
| W6 | 13 | 1 | 14 | 28 |
| W7 | 8 | 3 | 13 | 24 |
| W8 | 12 | 0 | 15 | 27 |
| W9 | 4 | 0 | 8 | 12 |
| W10 | 6 | 0 | 7 | 13 |
| W11 | 8 | 1 | 9 | 18 |
| W12 | 15 | 3 | 19 | 37 |
| **Total** | **108** | **13** | **137** | **258** |

Mobile tests to bring across: 25 unit (`__tests__/unit`) + 29 integration (`__tests__/integration`) + `App.test.jsx`, plus `test-utils/` (`render.jsx`, `practice.js`) and `__mocks__/`. Unit tests are almost pure copies. Integration tests need the React Native Testing Library calls swapped for React Testing Library.

---

## W0 — Foundation (done)

Goal: a web project that builds and has the right shape.

- [x] Vite + React 19, JS/JSX, ESLint
- [x] `react-router-dom`, `react-redux`, `@reduxjs/toolkit`, `react-hot-toast` installed
- [x] Tailwind CSS v4 via `@tailwindcss/vite`, `src/index.css` = `@import "tailwindcss"`
- [x] `@/…` alias in `vite.config.js` + `jsconfig.json`
- [x] Folder structure mirroring mobile `src/` (empty, `.gitkeep` only), `screens` → `pages`, `navigation` → `routes` + `layouts`
- [x] `plan.md` and `phases.md`
- [ ] Remove `.gitkeep` files as folders fill up

**Done when:** `npm run dev`, `npm run build` and `npm run lint` pass. (Met.)

---

## W1 — Platform layer (3–4 days)

Ports mobile Phase 0 and the infrastructure half of Phase 1 (1A, 1B). Nothing visible to the student yet except login-less shell and splash.

Install: `axios redux-persist lucide-react dompurify react-markdown` and dev `vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom prettier prettier-plugin-tailwindcss`.

Work items:

- [ ] Env: `.env.development`, `.env.production`, `.env.example` with `VITE_API_BASE_URL`, `VITE_USE_MOCK_API`, `VITE_APP_VERSION`
- [ ] `config/env.js` (adapt), `config/brand.js` (copy, keep `BRAND`, `SUPPORT`, `LEGAL_LAST_UPDATED`)
- [ ] Decide token storage (plan.md §3 / §10 q2) and write `services/storage/secureStorage.js` with the same three exports
- [ ] `api/client.js`: axios instance, bearer interceptor, single-flight refresh queue, `getErrorMessage`, `setSessionExpiredHandler`. Copy the logic, swap storage
- [ ] `store/index.js` with `redux-persist` on localStorage, all slices registered as their phase lands, `serializableCheck` ignored actions kept, **cross-tab logout** via the `storage` event
- [ ] `services/network/network.js` on `navigator.onLine` (same exports); `OfflineBanner` comes in W2
- [ ] Localization: copy `localization/` (`index.js`, `locales/en.js`, `locales/hi.js`), keep the "both files have the same keys" test
- [ ] Toast service: `services/alerts/alertStore.js` kept as a thin wrapper over `react-hot-toast` (`showAlert(title, message, actions, opts)` → toast for info, `ConfirmDialog` for choices). `<Toaster />` mounted once in `app/`
- [ ] Router: `routes/router.jsx` (`createBrowserRouter`), `routes/routePaths.js` (single table of paths from plan.md §4), guards `RequireAuth`, `RequireExam`, `RequireSession` (redirect when a guarded in-flow page is opened directly), exported `router` for `navigate()` outside React (replaces `navigationRef`, `goHome()`)
- [ ] Layouts: `PublicLayout`, `AppLayout` (sidebar + top bar + mobile bottom bar), `FocusLayout`
- [ ] Sidebar: rebuild `navigation/sidebar/sidebarItems.js` as `components/layout/sidebarItems.js` with `path` instead of `tab`/`screen`; `SidebarContent`, `SidebarProvider` (drawer state for < 1024 px)
- [ ] `app/BootGate.jsx` (splash, min 0.9 s, runs `bootstrapSession`) and `app/Providers.jsx` (Redux Provider, PersistGate, RouterProvider, Toaster, ErrorBoundary)
- [ ] `components/feedback/ErrorBoundary.jsx` (missing on mobile too) and `pages/public/NotFoundPage.jsx`
- [ ] Theme tokens in `src/styles/tokens.css` using Tailwind v4 `@theme` (brand blue `#2563eb`, semantic colours used in `sidebarItems`, radii, shadows) and **Noto Sans Devanagari** loaded
- [ ] Vitest config, `tests/utils/render.jsx` (port of `test-utils/render.jsx`: store + router + providers), jest-dom setup
- [ ] Prettier + Tailwind class sorting, `npm run test`, `npm run format`, a CI script (`lint`, `test`, `build`)
- [ ] Decide shared-package vs copy for `utils/store/services` (plan.md §1) and record the decision here

Mobile files for this phase:

**Copy as is (pure JS)** (10)

*api*

- [ ] `api/client.js`
- [ ] `api/endpoints/auth.js`

*config*

- [ ] `config/brand.js`

*localization*

- [ ] `localization/index.js`
- [ ] `localization/locales/en.js`
- [ ] `localization/locales/hi.js`

*services*

- [ ] `services/alerts/alertStore.js`
- [ ] `services/network/ensureOnline.js`

*utils*

- [ ] `utils/date.js`
- [ ] `utils/greeting.js`

**Adapt (native module → web API, same exports)** (4)

*config*

- [ ] `config/env.js`

*services*

- [ ] `services/network/network.js` — replace `@react-native-community/netinfo`
- [ ] `services/storage/secureStorage.js` — replace `react-native-keychain`

*store*

- [ ] `store/index.js` — replace `@react-native-async-storage/async-storage`

**Rewrite markup (React Native → DOM + Tailwind, keep the logic)** (1)

- [ ] `screens/SplashScreen.jsx` → `pages/SplashPage.jsx`


**Done when:** the app boots to a splash, then the public shell, hits a mock API through the real client, a logout in one tab logs out the other, lint + test + build pass in CI.

---

## W2 — Shared UI kit and common components (3–4 days)

Ports the mobile `components/` tree and the unfinished mobile Phase 0 "shared UI kit".

- [ ] Build the kit once, then reuse: `Button, Input, Card, Chip, Badge, Avatar, Tabs, Modal, ConfirmDialog, Drawer / BottomSheet, Skeleton, EmptyState, ErrorState, ProgressBar, PageHeader`
- [ ] `AlertHost` + `CustomAlert` collapse into `ConfirmDialog` + toasts (mobile `customAlert.test.jsx` is ported to the new behaviour)
- [ ] `FeatureGate` and `usePaywall()` (navigate to `/membership?feature=…`)
- [ ] `OfflineBanner` wired to `useNetwork`
- [ ] Icon helper: `AppIcon` maps the mobile string ids (`'home'`, `'file-text'`, `'clipboard-check'`, …) to `lucide-react` components, so copied configs keep working
- [ ] `components/charts/`: tiny SVG/CSS bar, ring and line components (mobile used plain views, no chart lib)
- [ ] Storybook is **not** planned; a `/dev/ui` route (dev only) shows every component instead

Mobile files for this phase:

**Copy as is (pure JS)** (1)

- [ ] `hooks/usePaywall.js`

**Rewrite markup (React Native → DOM + Tailwind, keep the logic)** (13)

*components*

- [ ] `components/common/AlertHost.jsx`
- [ ] `components/common/AppIcon.jsx`
- [ ] `components/common/BrandLogo.jsx`
- [ ] `components/common/CustomAlert.jsx`
- [ ] `components/common/NoticeBanner.jsx`
- [ ] `components/common/OfflineBanner.jsx`
- [ ] `components/common/ProgressBar.jsx`
- [ ] `components/common/ScreenHeader.jsx`
- [ ] `components/common/ScreenLoader.jsx`
- [ ] `components/common/SectionHeader.jsx`
- [ ] `components/forms/TextField.jsx`
- [ ] `components/gating/FeatureGate.jsx`

*screens*

- [ ] `screens/PlaceholderScreen.jsx` → `pages/PlaceholderPage.jsx`


**Done when:** a dev-only UI gallery page shows every component in light layout at 360 / 768 / 1280 px, with keyboard focus visible and dialogs trapping focus.

---

## W3 — Auth, session and exam selection (3–4 days)

Ports mobile Phase 1. Mobile status was "done except FCM"; web does the same and **adds real Google sign-in** (plan.md §10 q5).

- [ ] Login page (mobile + OTP), OTP page (6 boxes, paste support, `autocomplete="one-time-code"`, 30 s resend, change number), shared `AuthLayout` (split screen on desktop)
- [ ] `/login/otp` without `location.state.mobile` redirects to `/login`
- [ ] Session bootstrap: `bootstrapSession` thunk copied, `GET /me`, refresh once on 401, clear on failure
- [ ] `RequireAuth` / `RequireExam` flow: no token → `/login`; no exam → `/onboarding/exam`; else the app. Post-login redirect back to the page the user wanted
- [ ] Exam selection: searchable list, multi-exam as on mobile, modal route `/exams/select`, change exam from Profile
- [ ] Logout: revoke on the server, clear tokens, every slice resets on `auth/logout`, persisted store purged, other tabs follow
- [ ] Google sign-in button (real Google Identity Services, falls back to a disabled state with a message if the client id is missing)
- [ ] Port: `session.test.js`, `validation.test.js`, `multiExam.test.js`, `examSelection*.test.jsx`

Mobile files for this phase:

**Copy as is (pure JS)** (17)

*auth*

- [ ] `features/auth/hooks/useCountdown.js`
- [ ] `features/auth/services/authService.js`
- [ ] `features/auth/store/authSlice.js`
- [ ] `features/auth/store/sessionThunks.js`
- [ ] `features/auth/utils/confirmLogout.js`

*exams*

- [ ] `features/exams/hooks/useExamFilter.js`
- [ ] `features/exams/services/examService.js`
- [ ] `features/exams/services/mockExamContent.js`
- [ ] `features/exams/store/examSlice.js`
- [ ] `features/exams/utils/examContent.js`

*hooks*

- [ ] `hooks/useExamLoader.js`

*store*

- [ ] `store/selectors/authSelectors.js`
- [ ] `store/selectors/examSelectors.js`
- [ ] `store/selectors/userSelectors.js`

*user*

- [ ] `features/user/services/userService.js`
- [ ] `features/user/store/userSlice.js`

*validation*

- [ ] `validation/authValidation.js`

**Rewrite markup (React Native → DOM + Tailwind, keep the logic)** (9)

*auth*

- [ ] `features/auth/components/AuthLayout.jsx`
- [ ] `features/auth/components/CountryCode.jsx`
- [ ] `features/auth/components/GoogleButton.jsx`
- [ ] `features/auth/components/OtpInput.jsx`
- [ ] `features/auth/screens/LoginScreen.jsx` → `features/auth/pages/LoginPage.jsx`
- [ ] `features/auth/screens/OtpScreen.jsx` → `features/auth/pages/OtpPage.jsx`

*exams*

- [ ] `features/exams/components/ExamCard.jsx`
- [ ] `features/exams/components/ExamFilterChips.jsx`
- [ ] `features/exams/screens/ExamSelectionScreen.jsx` → `features/exams/pages/ExamSelectionPage.jsx`


**Done when:** a new user can sign in with OTP, choose an exam, reload the tab and land on Home; logout wipes everything in all tabs; an expired token refreshes silently.

---

## W4 — Syllabus and study material (4–5 days)

Ports mobile Phase 2. Same mock syllabus tree, progress computed in the app.

- [ ] Routes `/syllabus`, `/syllabus/:examId/:subjectId`, `…/:chapterId`, `/topics/:topicId`, `/material/:itemId`, `/study-material`
- [ ] Desktop split view: syllabus tree on the left, topic detail on the right; mobile web stays one column
- [ ] Topic detail tabs (Study Material, Practice Test, Ask) mirrored in `?tab=`; Mark complete
- [ ] Material viewer: **PDF** (`react-pdf`, lazy-loaded), **HTML** (DOMPurify + typographic styles, text-size control), **video** (`<video controls>`), bookmark, resume position, `useTimeOnScreen`
- [ ] Locked chapters/topics → `/membership?feature=fullSyllabus`
- [ ] Syllabus progress tracker and Home ring/subject-count wiring
- [ ] Not done on mobile either: auto-complete on finish, real offline download
- [ ] Port: `syllabus.test.js`, `material.test.js`, `syllabusFlow`, `materialScreen`, `materialViewer` integration tests

Mobile files for this phase:

**Copy as is (pure JS)** (9)

*material*

- [ ] `features/material/hooks/useMaterial.js`
- [ ] `features/material/services/materialService.js`
- [ ] `features/material/store/materialSlice.js`
- [ ] `features/material/utils/format.js`

*store*

- [ ] `store/selectors/materialSelectors.js`
- [ ] `store/selectors/syllabusSelectors.js`

*syllabus*

- [ ] `features/syllabus/hooks/useSyllabus.js`
- [ ] `features/syllabus/services/syllabusService.js`
- [ ] `features/syllabus/store/syllabusSlice.js`

**Adapt (native module → web API, same exports)** (1)

- [ ] `hooks/useTimeOnScreen.js` — replace `react-native`

**Rewrite markup (React Native → DOM + Tailwind, keep the logic)** (23)

*material*

- [ ] `features/material/components/BottomSheet.jsx`
- [ ] `features/material/components/HtmlViewer.jsx`
- [ ] `features/material/components/ItemActionSheet.jsx`
- [ ] `features/material/components/MaterialBanner.jsx`
- [ ] `features/material/components/MaterialRow.jsx`
- [ ] `features/material/components/MaterialTypeIcon.jsx`
- [ ] `features/material/components/PdfViewer.jsx`
- [ ] `features/material/components/SelectorPill.jsx`
- [ ] `features/material/components/SmallProgressRing.jsx`
- [ ] `features/material/components/SubjectPickerSheet.jsx`
- [ ] `features/material/components/SubjectSection.jsx`
- [ ] `features/material/components/TypeFilterBar.jsx`
- [ ] `features/material/components/VideoPlayer.jsx`
- [ ] `features/material/components/ViewerMessage.jsx`
- [ ] `features/material/screens/MaterialScreen.jsx` → `features/material/pages/MaterialPage.jsx`
- [ ] `features/material/screens/MaterialViewerScreen.jsx` → `features/material/pages/MaterialViewerPage.jsx`

*syllabus*

- [ ] `features/syllabus/components/Badges.jsx`
- [ ] `features/syllabus/components/SubjectBadge.jsx`
- [ ] `features/syllabus/components/SyllabusRow.jsx`
- [ ] `features/syllabus/screens/ChapterListScreen.jsx` → `features/syllabus/pages/ChapterListPage.jsx`
- [ ] `features/syllabus/screens/SubjectListScreen.jsx` → `features/syllabus/pages/SubjectListPage.jsx`
- [ ] `features/syllabus/screens/TopicDetailScreen.jsx` → `features/syllabus/pages/TopicDetailPage.jsx`
- [ ] `features/syllabus/screens/TopicListScreen.jsx` → `features/syllabus/pages/TopicListPage.jsx`


**Done when:** a student can drill Exam → Subject → Chapter → Topic, read PDF/HTML/video, mark complete and see overall and subject progress change; refresh keeps the place.

---

## W5 — Practice tests (4–5 days)

Ports mobile Phase 3. Two modes: **Practice** (instant answer + explanation) and **Timed test** (1 min/question).

- [ ] Routes `/practice/:topicId` (setup), `/practice/session`, `/practice/result` (guards redirect when there is no session / result)
- [ ] Setup: mode, 5 or 10 questions, free-questions-left line, resume banner, recent attempts
- [ ] Session: question card, options, progress, prev / next / skip, bookmark; timed adds countdown, palette (side panel on desktop, sheet on phone), mark for review, clear answer, auto-submit, leave guard
- [ ] **Web additions:** keyboard shortcuts (`1–4` choose, `←/→` move, `M` mark, `Enter` next), `beforeunload` guard while a session is open, session survives reload (persisted `session`)
- [ ] Result: score, accuracy, correct / wrong / skipped, time, review with explanations, retry missed, new test
- [ ] Daily question limit from entitlements; upgrade prompt at zero
- [ ] AI-generated source switch + "AI" badge + "Report wrong question" (mobile Phase 6A) belong here in the UI but need W7/W8 services; leave the switch hidden behind a flag until the mock `fetchAiQuestions` is wired
- [ ] Port: `practice.test.js`, `practiceFlow` integration test, `test-utils/practice.js`

Mobile files for this phase:

**Copy as is (pure JS)** (5)

*practice*

- [ ] `features/practice/services/practiceService.js`
- [ ] `features/practice/store/practiceSlice.js`
- [ ] `features/practice/utils/scoring.js`

*store*

- [ ] `store/selectors/attemptStatsSelectors.js`
- [ ] `store/selectors/practiceSelectors.js`

**Rewrite markup (React Native → DOM + Tailwind, keep the logic)** (6)

- [ ] `features/practice/components/AiBadge.jsx`
- [ ] `features/practice/components/PracticeCard.jsx`
- [ ] `features/practice/components/ReportQuestionButton.jsx`
- [ ] `features/practice/screens/PracticeResultScreen.jsx` → `features/practice/pages/PracticeResultPage.jsx`
- [ ] `features/practice/screens/PracticeSessionScreen.jsx` → `features/practice/pages/PracticeSessionPage.jsx`
- [ ] `features/practice/screens/PracticeSetupScreen.jsx` → `features/practice/pages/PracticeSetupPage.jsx`


**Done when:** a student can run a practice test and a timed test, see explanations and results, reload mid-test and resume, and hit the daily limit.

---

## W6 — Home, activity, study tracker and streak (4–5 days)

Ports mobile Phase 4 (4A–4E). **Warning:** several Phase 4 items are marked done in mobile `phase.md` but are **not in the mobile code** (plan.md §9). They are built here from the text of mobile `phase.md` 4C–4E, not copied.

Present on mobile (port):
- [ ] Home page: Greeting, Hero banner ("Start Learning" resumes the last activity), Quick actions grid, Preparation progress + ring, Continue Learning, Weak Topics card (Pro teaser for Free), OMR card, Ask card, Popular exams, Motivation banner, skeleton, pull-to-refresh → refresh button + quiet re-fetch when data is > 2 min old
- [ ] `activity` slice + debounced write; Continue Learning deep-links to topic / material / practice session
- [ ] `studySessions` slice, `useStudySession` (visibility + idle 45 s + `pagehide` flush), `sessionClock.createClock`, kill recovery → tab-close recovery, sync queue
- [ ] `useReconnectSync` (queued sessions and pending mock rank sent when `online` fires)

Missing on mobile (build new, from `phase.md` text):
- [ ] `features/study/utils/streak.js`: day counts at ≥ 10 min or ≥ 1 finished practice set; current, longest, at-risk; unit tests for missed day, same day twice, rollover
- [ ] `/streak` page: flame, current / longest, today's progress to 10 min, month heatmap, 7-day and 4-week bars, total sessions, 14-day study history grouped by day
- [ ] Home **Today's Study Plan** card (study / practice / revise = 25 / 15 / 10 min, ticks itself off)
- [ ] Home **Study Time** card (today vs 60 min target) and **Streak** card
- [ ] Streak-at-risk reminder at 8 pm: in-tab only for now; real delivery arrives with Web Push in W12

Mobile files for this phase:

**Copy as is (pure JS)** (13)

*activity*

- [ ] `features/activity/hooks/useContinueLearning.js`
- [ ] `features/activity/services/activityService.js`
- [ ] `features/activity/store/activitySlice.js`

*home*

- [ ] `features/home/hooks/useHome.js`
- [ ] `features/home/services/homeService.js`
- [ ] `features/home/store/homeSlice.js`

*hooks*

- [ ] `hooks/useReconnectSync.js`

*store*

- [ ] `store/selectors/activitySelectors.js`
- [ ] `store/selectors/homeSelectors.js`
- [ ] `store/selectors/studySelectors.js`

*study*

- [ ] `features/study/services/studyService.js`
- [ ] `features/study/store/studySlice.js`
- [ ] `features/study/utils/sessionClock.js`

**Adapt (native module → web API, same exports)** (1)

- [ ] `features/study/hooks/useStudySession.js` — replace `react-native`

**Rewrite markup (React Native → DOM + Tailwind, keep the logic)** (14)

- [ ] `features/home/components/AskAiButton.jsx`
- [ ] `features/home/components/ContinueLearning.jsx`
- [ ] `features/home/components/GreetingSection.jsx`
- [ ] `features/home/components/HeroBanner.jsx`
- [ ] `features/home/components/HomeHeader.jsx`
- [ ] `features/home/components/HomeSkeleton.jsx`
- [ ] `features/home/components/MotivationBanner.jsx`
- [ ] `features/home/components/OmrScannerCard.jsx`
- [ ] `features/home/components/PopularExams.jsx`
- [ ] `features/home/components/PreparationProgress.jsx`
- [ ] `features/home/components/ProgressRing.jsx`
- [ ] `features/home/components/QuickActions.jsx`
- [ ] `features/home/components/WeakTopicsCard.jsx`
- [ ] `features/home/screens/HomeScreen.jsx` → `features/home/pages/HomePage.jsx`


**Done when:** Home matches the proposal's dashboard list in the plan's order, works offline from cache, updates after study or practice, Continue resumes to the exact place, and the streak is right across a week of mixed use.

---

## W7 — Ask AI tutor (6–7 days)

Ports mobile Phase 5. Mock services; the AI key never in the bundle.

- [ ] Route `/ask` with `?topicId=` and `?q=` deep links (replaces `route.params`)
- [ ] Chat: bubbles, typing indicator, **Markdown** (`react-markdown`, safe by default), copy, thumbs up/down, conversation history (drawer, 20 chats, persisted), retry row for failed replies, quick-prompt chips, empty state
- [ ] Quota chip ("8/10 left today"); at 0 → upgrade dialog; 429 maps to the same dialog; `ensureOnline` guard
- [ ] **Photo doubt:** file picker + camera capture + crop (`react-easy-crop`) + preview sheet + optional note, compressed to 1600 px / JPEG 0.8
- [ ] **Voice:** Web Speech API with live transcript, language toggle (Hindi / English), TTS toggle and stop. Feature-detect and hide the mic with a tooltip in unsupported browsers (Firefox)
- [ ] "Ask epadh.ai" entry from topic detail, and from each reviewed question on practice / mock result pages (mobile 5D)
- [ ] Known gap carried over: same button on the **live** practice explanation (mobile 5D open item) — do it here
- [ ] Port: `aiTutor.test.js`, `askAiChat` integration test

Mobile files for this phase:

**Copy as is (pure JS)** (8)

*aiTutor*

- [ ] `features/aiTutor/hooks/usePhotoDoubt.js`
- [ ] `features/aiTutor/hooks/useVoiceInput.js`
- [ ] `features/aiTutor/services/aiTutorService.js`
- [ ] `features/aiTutor/services/doubtService.js`
- [ ] `features/aiTutor/store/aiTutorSlice.js`
- [ ] `features/aiTutor/utils/questionPrompt.js`
- [ ] `features/aiTutor/utils/quickPrompts.js`

*store*

- [ ] `store/selectors/aiTutorSelectors.js`

**Adapt (native module → web API, same exports)** (3)

*aiTutor*

- [ ] `features/aiTutor/services/ttsService.js` — replace `react-native-tts`
- [ ] `features/aiTutor/services/voiceService.js` — replace `react-native`, `@react-native-voice/voice`

*services*

- [ ] `services/media/photoPicker.js` — replace `react-native-image-crop-picker`

**Rewrite markup (React Native → DOM + Tailwind, keep the logic)** (13)

- [ ] `features/aiTutor/components/AskAiQuestionButton.jsx`
- [ ] `features/aiTutor/components/ChatBubble.jsx`
- [ ] `features/aiTutor/components/ChatComposer.jsx`
- [ ] `features/aiTutor/components/ConversationHistorySheet.jsx`
- [ ] `features/aiTutor/components/EmptyChatState.jsx`
- [ ] `features/aiTutor/components/MessageText.jsx`
- [ ] `features/aiTutor/components/PhotoPreviewSheet.jsx`
- [ ] `features/aiTutor/components/QuickPromptChips.jsx`
- [ ] `features/aiTutor/components/QuotaChip.jsx`
- [ ] `features/aiTutor/components/RetryRow.jsx`
- [ ] `features/aiTutor/components/TypingBubble.jsx`
- [ ] `features/aiTutor/components/VoiceOverlay.jsx`
- [ ] `features/aiTutor/screens/AskAiChatScreen.jsx` → `features/aiTutor/pages/AskAiChatPage.jsx`


**Done when:** a Free user can chat, send a photo, use voice (where supported), hit the daily limit and see the upgrade dialog; the same page works on a phone-sized browser.

---

## W8 — Mock tests, PYQ papers and Tests hub (6–7 days)

Ports mobile Phase 6 and the "Previous Year Papers" extra.

- [ ] `/tests` hub, `/mocks` list (type filter, recommended, Free/Pro badges, Pro-gated PYQ), `/mocks/:testId` instructions (with the **platform-only rank disclaimer**)
- [ ] `/mocks/session`: countdown from the server-anchored `endsAt` (`GET /time` offset), palette side panel, section tabs, mark for review, clear, summary dialog before submit, autosave every 5 s with "Offline, will sync", auto-submit at zero, `beforeunload` + router-blocker guard, persisted attempt survives reload
- [ ] `/mocks/result`: score, negative marking, accuracy, section stats, rank and percentile, "Not enough participants yet" under 30, `pendingRank` queue; solutions with All / Wrong / Unattempted / Marked filters; Ask per solution
- [ ] `/pyq` and `/pyq/:paperId`: newest first, search, year chips, Saved chip, Viewed tick, Pro lock, PDF viewer with Question paper / Answer key switch, "Attempt as a test" shortcut
- [ ] **Web additions:** keyboard navigation, optional fullscreen for the session, a warning when the tab loses focus (logged, not punished)
- [ ] Port: `mockQuestions`, `mockSlice`, `pyq`, `testCatalog` unit tests; `mockTestFlow`, `pyqPapers`, `testsScreen` integration tests

Mobile files for this phase:

**Copy as is (pure JS)** (12)

*mock*

- [ ] `features/mock/services/mockService.js`
- [ ] `features/mock/store/mockSlice.js`
- [ ] `features/mock/utils/mockTests.js`
- [ ] `features/mock/utils/questionGenerator.js`
- [ ] `features/mock/utils/scoring.js`

*pyq*

- [ ] `features/pyq/hooks/usePyqPapers.js`
- [ ] `features/pyq/services/pyqService.js`
- [ ] `features/pyq/store/pyqSlice.js`
- [ ] `features/pyq/utils/pyq.js`

*store*

- [ ] `store/selectors/mockSelectors.js`
- [ ] `store/selectors/pyqSelectors.js`

*tests*

- [ ] `features/tests/utils/catalog.js`

**Rewrite markup (React Native → DOM + Tailwind, keep the logic)** (15)

*mock*

- [ ] `features/mock/components/MetaRow.jsx`
- [ ] `features/mock/components/MockTestRow.jsx`
- [ ] `features/mock/components/RecommendedCard.jsx`
- [ ] `features/mock/screens/MockInstructionsScreen.jsx` → `features/mock/pages/MockInstructionsPage.jsx`
- [ ] `features/mock/screens/MockResultScreen.jsx` → `features/mock/pages/MockResultPage.jsx`
- [ ] `features/mock/screens/MockSessionScreen.jsx` → `features/mock/pages/MockSessionPage.jsx`
- [ ] `features/mock/screens/MockTestsScreen.jsx` → `features/mock/pages/MockTestsPage.jsx`

*pyq*

- [ ] `features/pyq/components/PaperRow.jsx`
- [ ] `features/pyq/screens/PyqPapersScreen.jsx` → `features/pyq/pages/PyqPapersPage.jsx`
- [ ] `features/pyq/screens/PyqViewerScreen.jsx` → `features/pyq/pages/PyqViewerPage.jsx`

*tests*

- [ ] `features/tests/components/CategoryChips.jsx`
- [ ] `features/tests/components/TestRow.jsx`
- [ ] `features/tests/components/TestsHero.jsx`
- [ ] `features/tests/components/TestsStatsRow.jsx`
- [ ] `features/tests/screens/TestsScreen.jsx` → `features/tests/pages/TestsPage.jsx`


**Done when:** a student can attempt a full timed mock (including a PYQ paper), reload mid-test without losing time or answers, submit, and review solutions with rank and percentile.

---

## W9 — Membership, payments and gating (4–5 days)

Ports mobile Phase 7. Mobile is on a mock payment layer; so is web until the backend exists.

- [ ] `/membership`: plans, Free vs Pro comparison table, current plan + expiry countdown, upgrade CTA, "why you're here" banner from `?feature=`
- [ ] Checkout flow `/membership/checkout/:planId` → `/membership/processing` → `/membership/success`; confetti
- [ ] State machine copied from `membershipSlice` (cancelled, failed, pending polled up to 5 times, killed-mid-payment resume via persisted `pendingOrder`, idempotency key reuse, double-click guard)
- [ ] **Real Razorpay Checkout.js**: load the script lazily only on the checkout page, open with prefill, verify on the server (needs backend order endpoint; keep the mock switch)
- [ ] Payment history `/membership/payments`, merged local + server, de-duplicated
- [ ] Entitlements refreshed after payment, and (open item on mobile) on tab focus via `visibilitychange` → `fetchMe()`
- [ ] Gating audit: every locked feature goes through `FeatureGate` / `usePaywall`
- [ ] Port: `membership.test.js`, `entitlements.test.js`, `membershipFlow` integration test

Mobile files for this phase:

**Copy as is (pure JS)** (4)

*membership*

- [ ] `features/membership/services/membershipService.js`
- [ ] `features/membership/store/membershipSlice.js`
- [ ] `features/membership/utils/entitlements.js`

*store*

- [ ] `store/selectors/membershipSelectors.js`

**Rewrite markup (React Native → DOM + Tailwind, keep the logic)** (8)

- [ ] `features/membership/components/ComparisonTable.jsx`
- [ ] `features/membership/components/PlanCard.jsx`
- [ ] `features/membership/components/SuccessConfetti.jsx`
- [ ] `features/membership/screens/CheckoutScreen.jsx` → `features/membership/pages/CheckoutPage.jsx`
- [ ] `features/membership/screens/MembershipScreen.jsx` → `features/membership/pages/MembershipPage.jsx`
- [ ] `features/membership/screens/PaymentHistoryScreen.jsx` → `features/membership/pages/PaymentHistoryPage.jsx`
- [ ] `features/membership/screens/PaymentProcessingScreen.jsx` → `features/membership/pages/PaymentProcessingPage.jsx`
- [ ] `features/membership/screens/PaymentSuccessScreen.jsx` → `features/membership/pages/PaymentSuccessPage.jsx`


**Done when:** a Free user can buy Pro (test keys once the backend exists) and Pro features unlock at once; an expired Pro locks them again; closing the tab mid-payment resumes cleanly.

---

## W10 — Analytics, weak topics, study plan and history (5–6 days)

Ports mobile Phase 8. Numbers are computed on the device from saved histories (`analytics/utils/performance.js`) until the server provides them.

- [ ] `/performance`: tests taken, answered, accuracy, average score, syllabus %, study time, 7-day bars, 7 / 30 / all filter; Free = summary, Pro = subject accuracy + strong topics (teaser)
- [ ] `/weak-topics` (Pro): ≥ 5 answered and < 60 % accuracy, lowest first, trend arrow, Revise / Practice / Ask actions, empty state; Home card shows top 3
- [ ] `/plan`: Free basic rule-based day; Pro planner (weak topics first, two study topics, Today / This week, Regenerate); the plan is kept so it does not reshuffle; tasks tick off from real activity and link to their page
- [ ] `/history`: MCQ Practice, Mock Tests and OMR tabs, date filter, subject filter on practice, paging 15 at a time, reopen stored results (kept for latest 20 practice / 10 mock)
- [ ] Charts use `components/charts` (SVG), responsive widths; wider layouts than mobile
- [ ] Carried-over gaps: real chart library, subject filter on Weak Topics, per-subject drill-down, plan reminder notifications (W12)
- [ ] Port: `performance`, `studyPlan`, `history` unit tests; `analyticsScreens`, `studyPlanScreen`, `historyScreen` integration tests

Mobile files for this phase:

**Copy as is (pure JS)** (6)

*analytics*

- [ ] `features/analytics/hooks.js`
- [ ] `features/analytics/utils/performance.js`

*history*

- [ ] `features/history/utils/history.js`

*plan*

- [ ] `features/plan/hooks.js`
- [ ] `features/plan/store/planSlice.js`
- [ ] `features/plan/utils/planBuilder.js`

**Rewrite markup (React Native → DOM + Tailwind, keep the logic)** (7)

*analytics*

- [ ] `features/analytics/components/AccuracyRow.jsx`
- [ ] `features/analytics/components/ProTeaser.jsx`
- [ ] `features/analytics/components/StatTile.jsx`
- [ ] `features/analytics/screens/PerformanceScreen.jsx` → `features/analytics/pages/PerformancePage.jsx`
- [ ] `features/analytics/screens/WeakTopicsScreen.jsx` → `features/analytics/pages/WeakTopicsPage.jsx`

*history*

- [ ] `features/history/screens/HistoryScreen.jsx` → `features/history/pages/HistoryPage.jsx`

*plan*

- [ ] `features/plan/screens/StudyPlanScreen.jsx` → `features/plan/pages/StudyPlanPage.jsx`


**Done when:** after using practice and mocks, the student sees accurate weak topics, a plan that reacts to them, and complete history.

---

## W11 — AI OMR scanner (Pro) (5–6 days)

Ports mobile Phase 9. **Mobile is only partly done** (scan screen with mock upload); the rest is built for both apps together.

- [ ] Pro gate with teaser for Free
- [ ] Setup: choose test / answer key and marking scheme
- [ ] Capture: drag-and-drop + file picker + PDF upload (as mobile), **webcam capture** with alignment frame where `getUserMedia` exists, tips, orientation fix and compress client-side
- [ ] Upload → mock `POST /omr/scan`, processing status with polling, timeout and retry, `ensureOnline`
- [ ] Detected-answers review grid with manual correction, flagged rows (blank / multi-mark)
- [ ] Result page `/omr/result/:scanId`: total, correct, wrong, unattempted, negative marking, accuracy, weak topics, feedback; `OmrHistory` page; entries feed weak topics and analytics
- [ ] Field test with real OMR photos (phone camera uploads) in varied light and angles
- [ ] Port: `omrSheet`, `omrResult`, `omrHistory` unit tests; `omrScan`, `omrResult`, `omrHistory` integration tests

Mobile files for this phase:

**Copy as is (pure JS)** (8)

*omr*

- [ ] `features/omr/hooks/useOmrResult.js`
- [ ] `features/omr/hooks/useOmrSheet.js`
- [ ] `features/omr/services/omrResultService.js`
- [ ] `features/omr/services/omrService.js`
- [ ] `features/omr/store/omrSlice.js`
- [ ] `features/omr/utils/omrResult.js`
- [ ] `features/omr/utils/omrSheet.js`

*store*

- [ ] `store/selectors/omrSelectors.js`

**Adapt (native module → web API, same exports)** (1)

- [ ] `services/media/documentPicker.js` — replace `@react-native-documents/picker`

**Rewrite markup (React Native → DOM + Tailwind, keep the logic)** (9)

- [ ] `features/omr/components/AnswerReview.jsx`
- [ ] `features/omr/components/LeaderboardList.jsx`
- [ ] `features/omr/components/ResultStats.jsx`
- [ ] `features/omr/components/ScanHistoryRow.jsx`
- [ ] `features/omr/components/ScanOverlay.jsx`
- [ ] `features/omr/components/ScoreHero.jsx`
- [ ] `features/omr/screens/OmrHistoryScreen.jsx` → `features/omr/pages/OmrHistoryPage.jsx`
- [ ] `features/omr/screens/OmrResultScreen.jsx` → `features/omr/pages/OmrResultPage.jsx`
- [ ] `features/omr/screens/OmrScanScreen.jsx` → `features/omr/pages/OmrScanPage.jsx`


**Done when:** a Pro student can upload or photograph an OMR sheet and get a correct scored result with weak-topic feedback, with a chance to correct misreads.

---

## W12 — Profile, settings, notifications, legal and support (3–4 days)

Ports mobile Phase 10.

- [ ] `/profile`, `/profile/edit` (name, email, exam date, avatar via file picker + square crop, `POST /me/avatar`), membership card, daily goal, profile completeness, `/profile/delete` (type DELETE to confirm)
- [ ] `/settings`: daily study reminder (time **input**, replaces the mobile 30-minute stepper), streak reminder, read replies aloud, daily goal, language (English / हिन्दी), version, Terms, Privacy
- [ ] `/notifications`: list, unread dot and count, mark read, dismiss, filters, local "payment successful" entry, tap opens linked page
- [ ] **Reminders on web:** `useReminderSync` rebuilt on Notification permission + FCM web push (service worker `firebase-messaging-sw.js`, `POST /devices`) — needs a Firebase project (same blocker as mobile). Until then in-tab only, and Settings says so
- [ ] `/help` (FAQs, `mailto:` with prefilled body), `/terms`, `/privacy` (also public)
- [ ] Localization: translate Settings, offline banner, profile menu (as mobile) and **start the full string pass** for every page (mobile left this open)
- [ ] Port: `profile`, `settings`, `support`, `notifications` unit tests; `profileScreen`, `settingsScreen`, `deleteAccount`, `notificationsScreen`, `helpAndLegalScreens` integration tests

Mobile files for this phase:

**Copy as is (pure JS)** (15)

*legal*

- [ ] `features/legal/content/privacy.js`
- [ ] `features/legal/content/terms.js`

*notifications*

- [ ] `features/notifications/services/notificationService.js`
- [ ] `features/notifications/store/notificationsSlice.js`
- [ ] `features/notifications/utils/notifications.js`

*profile*

- [ ] `features/profile/hooks/useAvatarChange.js`
- [ ] `features/profile/hooks/useProfileStats.js`
- [ ] `features/profile/utils/profile.js`

*settings*

- [ ] `features/settings/hooks/useReminderSettings.js`
- [ ] `features/settings/store/settingsSlice.js`
- [ ] `features/settings/utils/reminders.js`

*store*

- [ ] `store/selectors/notificationSelectors.js`
- [ ] `store/selectors/settingsSelectors.js`

*support*

- [ ] `features/support/content/faqs.js`
- [ ] `features/support/utils/support.js`

**Adapt (native module → web API, same exports)** (3)

*services*

- [ ] `services/notifications/localNotifications.js` — replace `@notifee/react-native`

*settings*

- [ ] `features/settings/hooks/useReminderSync.js` — replace `react-native`

*support*

- [ ] `features/support/services/supportMail.js` — replace `react-native`

**Rewrite markup (React Native → DOM + Tailwind, keep the logic)** (19)

*legal*

- [ ] `features/legal/components/LegalDocument.jsx`
- [ ] `features/legal/screens/PrivacyScreen.jsx` → `features/legal/pages/PrivacyPage.jsx`
- [ ] `features/legal/screens/TermsScreen.jsx` → `features/legal/pages/TermsPage.jsx`

*notifications*

- [ ] `features/notifications/components/NotificationRow.jsx`
- [ ] `features/notifications/screens/NotificationsScreen.jsx` → `features/notifications/pages/NotificationsPage.jsx`

*profile*

- [ ] `features/profile/components/CompleteProfileCard.jsx`
- [ ] `features/profile/components/DailyGoalCard.jsx`
- [ ] `features/profile/components/ExamCard.jsx`
- [ ] `features/profile/components/MembershipCard.jsx`
- [ ] `features/profile/components/MenuGroup.jsx`
- [ ] `features/profile/components/ProfileHero.jsx`
- [ ] `features/profile/components/StatsCard.jsx`
- [ ] `features/profile/screens/DeleteAccountScreen.jsx` → `features/profile/pages/DeleteAccountPage.jsx`
- [ ] `features/profile/screens/EditProfileScreen.jsx` → `features/profile/pages/EditProfilePage.jsx`
- [ ] `features/profile/screens/ProfileScreen.jsx` → `features/profile/pages/ProfilePage.jsx`

*settings*

- [ ] `features/settings/components/SettingsCard.jsx`
- [ ] `features/settings/screens/SettingsScreen.jsx` → `features/settings/pages/SettingsPage.jsx`

*support*

- [ ] `features/support/components/FaqItem.jsx`
- [ ] `features/support/screens/HelpSupportScreen.jsx` → `features/support/pages/HelpSupportPage.jsx`


**Done when:** a student can edit profile and settings, get a reminder at the chosen time (with push set up), use cached content offline, and is told clearly what needs internet.

---

## W13 — Responsive, accessibility, performance and optional PWA (4–5 days)

Web-only polish that mobile does not have.

- [ ] Responsive audit of every page at 360 / 768 / 1024 / 1280 / 1920
- [ ] Keyboard and screen-reader pass: focus order, dialogs, tabs, palette, skip link, live regions for timers and toasts
- [ ] Contrast AA, 44 px touch targets on touch, reduced-motion support
- [ ] Devanagari rendering check across Chrome, Edge, Firefox, Safari
- [ ] Code splitting per route, lazy `react-pdf` / Razorpay / charts; bundle budget (initial ≤ 250 kB gzip); Lighthouse ≥ 90 on Home
- [ ] Optional: PWA (manifest, service worker, offline shell, install prompt)
- [ ] Optional: `/welcome` landing page with SEO meta, Open Graph, sitemap; app routes `noindex`
- [ ] Sentry + analytics event wrapper (`services/analytics`): page view, test started / submitted, paywall shown, purchase

**Done when:** Lighthouse and axe checks pass on the key pages and the app feels native on a phone-sized browser.

---

## W14 — QA, hardening and release (5–7 days)

- [ ] Playwright e2e of the full loop: Study → Practice → Test → Analyze → Weakness → Improve, plus login, payment (mock) and logout
- [ ] Browser matrix: Chrome, Edge, Firefox, Safari, iOS Safari, Android Chrome; low-end laptop and phone
- [ ] Performance profile: mock + AI chat memory, long history lists, cold load on 4G
- [ ] Security review: token storage, CSP, DOMPurify on all study HTML, no secrets in the bundle, HTTPS + HSTS, payment verification path, dependency audit (`npm audit` currently reports issues)
- [ ] Bug bash with real content from the admin panel
- [ ] Hosting, environments, domain, CORS / cookie settings, CI/CD pipeline, error and uptime monitoring
- [ ] Privacy policy URL live (unblocks the Play Store item on mobile)
- [ ] Handover doc and the diff list between mobile and web (what is intentionally different)

**Done when:** the production build passes the QA checklist and is live behind the real domain.

---

## Summary schedule

| Phase | Focus | Est. days | Depends on |
|---|---|---|---|
| W0 | Foundation | done | none |
| W1 | Platform layer | 3–4 | W0 |
| W2 | UI kit | 3–4 | W1 |
| W3 | Auth + exam selection | 3–4 | W1, W2 |
| W4 | Syllabus + material | 4–5 | W3 |
| W5 | Practice | 4–5 | W4 |
| W6 | Home, streak, study time | 4–5 | W5 |
| W7 | Ask AI | 6–7 | W3 |
| W8 | Mocks + PYQ | 6–7 | W4, W5 |
| W9 | Membership + payments | 4–5 | W3 |
| W10 | Analytics, planner, history | 5–6 | W5, W8 |
| W11 | OMR | 5–6 | W8, W9 |
| W12 | Profile, settings, notifications | 3–4 | most |
| W13 | Responsive, a11y, PWA | 4–5 | all |
| W14 | QA + release | 5–7 | all |

Total ≈ 56–72 working days sequentially. The copy-heavy phases (the 108 pure-JS files) are fast; the time goes into the 144 `.jsx` files, the OMR/AI/payment integrations and the web-only polish. W7 and W9 can run in parallel with W4–W6 with two developers.

## Definition of done (every phase)

1. Pages match the design language (Tailwind, lucide icons, shared UI kit) with loading, empty, error and offline states, at 360 px and 1280 px.
2. State lives in a Redux slice with a service layer; no fetch calls inside components.
3. Free/Pro gating through `FeatureGate` / `usePaywall`; server enforcement verified.
4. The matching mobile unit and integration tests are ported and pass; `npm run lint`, `npm test` and `npm run build` pass.
5. Keyboard-only walkthrough of the new pages works.
6. Mock service replaced by the real endpoint, or clearly marked as still mocked in this file.
7. Any deliberate difference from mobile is noted next to the phase.
