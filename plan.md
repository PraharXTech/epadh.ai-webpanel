# Web App Plan — epadh.ai Student Web (port of the mobile app)

Source of truth: the React Native app in `C:\rn\EpadhAI` (its `plan.md`, `phase.md` and `src/`).
Scope: **the student-facing web app**, a feature-for-feature port of the mobile app, running in a browser on desktop, tablet and phone. The Admin Panel, backend and DB stay out of scope, except for the API contract this app needs (it is the same contract the mobile app uses, see mobile `plan.md` §7).

> Assumption to confirm: "web panel" here means the **student web app**. The admin panel is a separate project (the workspace already has `doubtcomm-crm-admin` and `speaking-fever-admin` as examples). If you meant the admin panel, only §1–§3 and the folder layout carry over.

Core product loop (unchanged): **Study → Practice → Test → Analyze → Identify Weakness → Improve → Repeat**.

Companion file: [phases.md](phases.md) has the delivery order, per-phase checklists and the file-by-file port list.

---

## 1. Port strategy

The mobile app has 267 source files under `src/`. They fall into three groups, and the group decides the effort:

| Group | Files | What to do |
|---|---|---|
| **COPY** (`.js`, no native imports) | 108 | Copy as is. Redux slices, selectors, services, `utils/`, `validation/`, `constants`, localization catalogs, mock data, scoring and planner logic. These are pure JS and run in the browser unchanged. Tests for them move with them. |
| **ADAPT** (`.js` using a native module or `__DEV__`) | 15 | Same function names and signatures, new web implementation underneath (see §3). Screens never notice the swap. |
| **UI** (`.jsx`) | 144 + navigation | Rewrite the markup: `View/Text/Pressable/FlatList/ScrollView` → `div/span/button/ul`, `className` Tailwind classes stay almost identical. Logic (hooks, selectors, dispatches) is kept as is. |

Rules that keep the port cheap and the two apps in step:

1. **Do not redesign logic.** If a thunk, slice or util exists on mobile, copy it first, change it only when the browser forces it. Anything changed for the web gets a comment saying why.
2. **Same slice names, same state shape, same service signatures.** Then the real backend is wired once for both apps.
3. **Mock first, real API second**, same as mobile: every service keeps the `USE_MOCK_API` switch.
4. **Same file name where it makes sense.** Mobile `XxxScreen.jsx` becomes `XxxPage.jsx` in a `pages/` folder, everything else keeps its name, so a diff between the two trees stays readable.
5. Business rules (gating, quota, scoring, streak, plan builder) live in `utils/` and are shared verbatim. If a rule changes, change it in both repos in the same week.
6. No native-only features are faked. Where the browser cannot do something (see §3), the page shows an honest fallback.

> The first step of Phase W1 is to decide whether `utils/`, `store/` and `services/` stay a **copy** or become a shared package (npm workspace). Copy is simpler now; a shared package avoids drift later. Recommendation: copy now, extract a shared package when the backend is real and both apps are stable.

---

## 2. Tech stack (web)

| Concern | Choice | Status |
|---|---|---|
| Framework | React 19 + Vite 8, JavaScript (`.js` / `.jsx`), no TypeScript | installed |
| Routing | `react-router-dom` v7 (data router: `createBrowserRouter`) | installed |
| State | `@reduxjs/toolkit` + `react-redux` | installed |
| State persistence | `redux-persist` with a small `localStorage` adapter (`services/storage/persistStorage.js`; mobile used AsyncStorage) | installed |
| Toasts | `react-hot-toast` (replaces `AlertHost` / `CustomAlert` for transient messages) | installed |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite` (mobile used NativeWind on Tailwind 3) | installed |
| Icons | `lucide-react` (mobile used `lucide-react-native`, same icon names) | installed |
| HTTP | `axios` with the same interceptors and refresh queue | installed |
| Path alias | `@/…` → `src/…` (vite + jsconfig) | done |
| Markdown in AI answers | `react-markdown` (mobile has a custom `MessageText`; markdown is simpler on web) | installed |
| PDF viewer | `react-pdf` (pdf.js) or the browser's own `<iframe>` viewer | **to add** (decide in W4) |
| HTML study material | `dompurify` + `dangerouslySetInnerHTML` (mobile used `react-native-render-html`) | installed |
| Video | native `<video>` (HLS via `hls.js` only if the backend serves HLS) | none / later |
| Payments | Razorpay Checkout.js (web) | **to add** in W9 |
| Push notifications | Firebase Cloud Messaging web SDK + service worker | **to add** in W12 |
| Voice in | Web Speech API `SpeechRecognition` (`hi-IN` / `en-IN`; Chrome/Edge/Safari only) | browser built-in |
| Voice out | `window.speechSynthesis` | browser built-in |
| Photo / OMR capture | `<input type="file" accept="image/*" capture>` + `getUserMedia` for a live frame; `react-easy-crop` for cropping | **to add** |
| Network status | `navigator.onLine` + `online` / `offline` events | built-in |
| Forms | plain controlled inputs and the copied validators (as mobile); `react-hook-form` + `zod` only if a form grows | optional |
| Tests | Vitest + React Testing Library + jsdom (mobile used Jest + react-test-renderer) | installed |
| Lint / format | ESLint 10 (installed), Prettier + `prettier-plugin-tailwindcss` | installed |

The AI provider key, Razorpay secret and every other secret **never live in the web bundle**. Everything goes through the backend (same rule as mobile).

---

## 3. Native-module replacement map (the 15 ADAPT files)

| Mobile file | Mobile uses | Web replacement |
|---|---|---|
| `config/env.js` | `__DEV__`, `10.0.2.2` emulator URL | `import.meta.env.DEV`, `VITE_API_BASE_URL`, `.env.development` / `.env.production`; keep `USE_MOCK_API` from `VITE_USE_MOCK_API` |
| `services/storage/secureStorage.js` | `react-native-keychain` | **Security decision (W1):** preferred = refresh token in an `httpOnly; Secure; SameSite` cookie set by the backend, access token in memory only. Fallback while the backend is mocked = access token in memory + refresh token in `localStorage`, clearly marked temporary. Same `saveTokens / loadTokens / clearTokens` API. |
| `store/index.js` | `AsyncStorage` | `redux-persist/lib/storage` (localStorage). Same whitelists. Add `storage` event sync so a logout in one tab logs out the others. |
| `services/network/network.js` | `@react-native-community/netinfo` | `navigator.onLine` + `online`/`offline` listeners. Same `isOnline / subscribeNetwork / useNetwork / startNetworkMonitor` exports. |
| `hooks/useTimeOnScreen.js` | `AppState` | `document.visibilityState` + `visibilitychange` (hidden counts as background). |
| `features/study/hooks/useStudySession.js` | `AppState` | Same swap. Idle detection adds `mousemove` / `keydown` / `scroll` / `touchstart` as "interaction". Also flush the checkpoint on `pagehide` (replaces "app goes to background"). |
| `features/aiTutor/services/voiceService.js` | `@react-native-voice/voice`, `PermissionsAndroid` | Web Speech API. Same `startListening / stopListening / cancelListening / teardownVoice`. `requestMicPermission` uses `navigator.mediaDevices.getUserMedia({audio:true})`. Unsupported browser → show "Voice not supported in this browser", keep typing. |
| `features/aiTutor/services/ttsService.js` | `react-native-tts` | `speechSynthesis` (`SpeechSynthesisUtterance`, voice picked by `lang`). |
| `services/media/photoPicker.js` | `react-native-image-crop-picker` | File input + camera capture + `react-easy-crop`, compress via canvas to 1600 px / JPEG 0.8 (same limits as mobile). Returns the same `{uri, width, height, size, mime}` shape (a blob URL). |
| `services/media/documentPicker.js` | `@react-native-documents/picker` | `<input type="file" accept="application/pdf,image/*">` |
| `services/notifications/localNotifications.js` | `@notifee/react-native` local scheduling | **No reliable local scheduling in browsers.** Replace with: in-tab timers + the Notifications API while a tab is open, and server-sent Web Push (FCM) for real reminders (W12). Settings page tells the student reminders need notifications allowed. |
| `features/settings/hooks/useReminderSync.js` | `AppState`, notifee | Rebuild around the above: keep the same reminder rules from `settings/utils/reminders.js` (copied), different delivery. |
| `features/support/services/supportMail.js` | `Linking`, `Platform`, `package.json` version | `window.location.href = mailto:…`, `navigator.userAgent` for platform, `import.meta.env.VITE_APP_VERSION`. |
| `navigation/navigationRef.js` | React Navigation ref | `router.navigate()` from the data router instance exported from `routes/router.jsx`. Same `goHome()` helper. |
| `navigation/sidebar/sidebarItems.js` | `navigationRef`, `StackActions` | Items keep `id / label / icon / color / bg`, but `tab`/`screen` become a single `path`. |

---

## 4. Screen → route map

React Navigation screen names become URLs. Params that were `route.params` become path params, query strings or `location.state`.

**Public** (no session)

| Mobile screen | Web route | Notes |
|---|---|---|
| Splash | no route: `<BootGate>` shows the splash (min 0.9 s) while `bootstrapSession` runs | |
| Login | `/login` | |
| Otp | `/login/otp` | `mobile` param in `location.state`; direct visit without it redirects to `/login` |
| Terms / Privacy | `/terms`, `/privacy` | also public, so the Play Store / footer link works. Replaces the "public privacy URL" TODO from mobile. |
| *(new)* Landing | `/welcome` | optional marketing page for web, W13 |

**Protected** (session required, `<RequireAuth>`; inside `AppLayout` with sidebar + top bar)

| Mobile screen | Web route | Params |
|---|---|---|
| ExamOnboarding | `/onboarding/exam` | shown instead of everything else while no exam is selected (`<RequireExam>`) |
| ExamSelection (modal) | `/exams/select` | a full page without sidebar or tabs (its own sticky Save bar), reached from Profile and the sidebar |
| Home (tab) | `/` | |
| Exams / SubjectList (tab) | `/syllabus` | |
| ChapterList | `/syllabus/:examId/:subjectId` | `subjectId, examId` |
| TopicList | `/syllabus/:examId/:subjectId/:chapterId` | `chapterId, examId` |
| TopicDetail | `/topics/:topicId` | `topicId`; tabs as `?tab=material\|practice\|ask` |
| Tests (tab) | `/tests` | |
| Study Material (tab) | `/study-material` | |
| MaterialViewer | `/material/:itemId` | `itemId` |
| PracticeSetup | `/practice/:topicId` | `topicId` |
| PracticeSession | `/practice/session` | guarded: redirects to setup when no session |
| PracticeResult | `/practice/result` | guarded |
| MockTests | `/mocks` | |
| MockInstructions | `/mocks/:testId` | `testId` |
| MockSession | `/mocks/session` | guarded; `beforeunload` + back-button guard |
| MockResult | `/mocks/result` | guarded |
| PyqPapers | `/pyq` | |
| PyqViewer | `/pyq/:paperId` | `paperId` |
| AskAiChat | `/ask` | `?topicId=…&q=…` for deep links from a topic or a reviewed question |
| OmrScan | `/omr` | Pro gate |
| OmrResult | `/omr/result/:scanId` | `scanId` |
| OmrHistory | `/omr/history` | |
| History | `/history` | |
| StudyPlan | `/plan` | |
| Performance | `/performance` | |
| WeakTopics | `/weak-topics` | |
| Profile (tab) | `/profile` | |
| EditProfile | `/profile/edit` | |
| DeleteAccount | `/profile/delete` | |
| Settings | `/settings` | |
| HelpSupport | `/help` | |
| Notifications | `/notifications` | |
| Membership | `/membership` | `?feature=omr` (why the paywall opened) |
| Checkout | `/membership/checkout/:planId` | `planId` |
| PaymentProcessing | `/membership/processing` | `planId, orderId` in state; guarded |
| PaymentSuccess | `/membership/success` | `outcome` in state; guarded |
| PaymentHistory | `/membership/payments` | |
| *(documented on mobile, missing in code)* Streak | `/streak` | see §9 |
| — | `*` | NotFound page |

**Web layout:** the mobile bottom bar + sidebar drawer become one responsive `AppLayout`:
- ≥ 1024 px: permanent left sidebar (the 3 sections from `sidebarItems.js`), top bar with greeting, notification bell, avatar menu.
- < 1024 px: top bar with hamburger (drawer = the same sidebar) and the 5-tab bottom bar (Home, Exams, Tests, Study Material, Profile) so the site feels like the app on a phone.
- `OfflineBanner` sits above the content on every page.
- Immersive pages (`MockSession`, `PracticeSession` timed mode, material viewer) use a `FocusLayout` with no sidebar, to protect exam focus.

---

## 5. Target folder structure (web)

Already created, empty. It mirrors mobile `src/` so files can be copied across 1:1.

```
src/
├── api/               client.js, endpoints/, interceptors/
├── app/               providers, BootGate, ErrorBoundary wiring
├── assets/            images, icons, fonts
├── components/
│   ├── common/        AppIcon, BrandLogo, NoticeBanner, OfflineBanner, ProgressBar, SectionHeader, ScreenLoader (→ PageLoader) …
│   ├── forms/         TextField
│   ├── gating/        FeatureGate
│   ├── layout/        Sidebar, TopBar, BottomBar, sidebarItems
│   ├── charts/        small SVG/CSS charts (web-only folder)
│   ├── feedback/      ConfirmDialog, Skeleton, EmptyState, ErrorState, ErrorBoundary (web-only folder)
│   └── ui/            Button, Card, Chip, Badge, Avatar, Tabs, Modal (center / bottom sheet / side drawer)
├── config/            brand.js, env.js
├── constants/
├── features/          activity, aiTutor, analytics, auth, exams, history, home, legal, material,
│                      membership, mock, notifications, omr, plan, practice, profile, pyq,
│                      settings, study, support, syllabus, tests, user
│                      (each: components/ hooks/ pages/ services/ store/ utils/ as needed)
├── hooks/             useExamLoader, usePaywall, useReconnectSync, useTimeOnScreen, …
├── layouts/           route-level layout wrappers (PublicLayout, AppLayout, FocusLayout)
├── localization/      index.js, locales/en.js, locales/hi.js
├── pages/             public/ (NotFound, Landing), top-level pages
├── routes/            router.jsx, routePaths.js, guards (RequireAuth, RequireExam, RequireSession)
├── services/          alerts, analytics, media, network, notifications, storage
├── store/             index.js, middleware/, selectors/
├── styles/            tokens, fonts
├── tests/             unit/, integration/, utils/ (render helper)
├── utils/             date.js, greeting.js
└── validation/        authValidation.js
e2e/                   Playwright specs (W14)
```

Differences from mobile, on purpose:
- `screens/` → `pages/` (and `XxxScreen.jsx` → `XxxPage.jsx`).
- `navigation/` → `routes/` + `layouts/`.
- `features/courses/` (empty on mobile) is not carried over.
- Added: `app/`, `components/charts`, `components/feedback`, `layouts/`, `pages/public`, `styles/`, `tests/`, `e2e/`.
- `store/slices/` is unused: slices stay inside each feature's `store/` (same as mobile).

---

## 6. Feature inventory (carried over 1:1)

Same 29 features, tiers and proposal references as mobile `plan.md` §2. Web-specific notes:

| # | Feature | Web note |
|---|---|---|
| 1 | Splash + session restore | `BootGate`, same 0.9 s minimum |
| 2 | Login / OTP | same flow; add paste-the-OTP-code and `autocomplete="one-time-code"`; Google sign-in via Google Identity Services (real, not mocked, since web makes it easy) |
| 3 | Exam selection | multi-exam as on mobile |
| 4–5 | Home, Continue Learning | grid layout on desktop |
| 6–8 | Syllabus, progress, material viewer | PDF + HTML + video viewer; split view on desktop (tree left, content right) |
| 9–13 | Ask AI: chat, quick prompts, photo, voice, quota | voice depends on browser support |
| 14–15 | Practice, AI-generated questions | keyboard shortcuts (1–4 select, ←/→ move) |
| 16–17 | Mock tests, rank | palette side panel on desktop; `beforeunload` guard; fullscreen request optional |
| 18–19 | OMR scanner | file upload first-class, webcam capture secondary (laptops) |
| 20 | Weak topics (Pro) | same rules |
| 21–22 | Study plan / AI planner | same `planBuilder.js` |
| 23 | Streak + study time | see §9, not in mobile code yet |
| 24–25 | Analytics, history | wider charts |
| 26–27 | Membership, payments | Razorpay web checkout |
| 28 | Profile, settings | avatar via file picker + crop |
| 29 | Notifications | in-app center + Web Push |

Free/Pro gating matrix, entitlements object, quota rules, scoring and rank disclaimers are **identical** to mobile `plan.md` §3 and §5.11. `FeatureGate` + `usePaywall()` are copied; `usePaywall` swaps `navigation.navigate('Membership', {feature})` for `useNavigate()` → `/membership?feature=…`.

---

## 7. Redux state

Same 19 slices, same whitelists, same logout reset (each slice listens for `auth/logout`). `redux-persist` key names are kept. `store/index.js` changes only the storage engine and the `__DEV__` bits.

Web-only additions:
- `ui` slice is **not** needed: modal/drawer state stays local or in the router (`location.state`).
- Cross-tab sync: listen to `window.storage` for the `persist:auth` key; on logout elsewhere, run the same `logout()` and redirect.
- Bump a `PERSIST_VERSION` migration if a slice shape ever differs from mobile.

---

## 8. Non-functional requirements (web)

- **Security:** HTTPS only; no secrets in the bundle; sanitise all HTML study material with DOMPurify; CSP header; tokens per §3; payment verified server-side; `rel="noopener"` on external links; disable text selection / right-click on mock test pages is **not** done (hostile to accessibility and trivial to bypass), rely on server-anchored timers instead.
- **Performance:** route-level code splitting (`React.lazy` per page), lazy-load `react-pdf`, charts and the Razorpay script; virtualize only long lists (history, notifications); image `loading="lazy"`; Lighthouse ≥ 90 on Home; initial JS ≤ 250 kB gzip.
- **Offline:** `redux-persist` already gives cached home / syllabus / history. Optional PWA (service worker + manifest) in W13 so material and the shell load offline; AI, OMR and payments stay online-only with the `ensureOnline` guard.
- **Responsive:** design for 360 px up; test 360, 768, 1280, 1920.
- **Accessibility:** keyboard-reachable everything, visible focus, ARIA for dialogs / tabs / palette, colour contrast AA, 44 px touch targets on touch devices, Devanagari font loaded (`Noto Sans Devanagari`) and tested.
- **Browser support:** last 2 versions of Chrome, Edge, Firefox, Safari; iOS Safari 16+. Voice input is Chrome/Edge/Safari only, so it must degrade.
- **SEO:** only public pages (`/welcome`, `/terms`, `/privacy`) need it; the app itself is behind login (`noindex`).
- **Error handling:** global `ErrorBoundary` per layout, per-page empty / error / retry, `react-hot-toast` for transient errors, `ConfirmDialog` for destructive actions (replaces `CustomAlert`).
- **Analytics / monitoring:** Sentry (web) + a small event wrapper in `services/analytics` (page views, test started/submitted, paywall shown, purchase).
- **Testing:** Vitest for slices / selectors / utils (the 25 mobile unit-test files and most of the 29 integration tests port with small changes), RTL for screens, Playwright for the full loop.

---

## 9. Gaps found in the mobile app (read before copying)

I compared the mobile `phase.md` against the mobile source. These are marked **done** in `phase.md` but **do not exist in `C:\rn\EpadhAI\src`**:

| Claimed in mobile `phase.md` | What the code actually has |
|---|---|
| Phase 4C Streak screen, calendar heatmap, bars, history list, `features/study/utils/streak.js` | Not present. `features/study` only has `useStudySession`, `studyService`, `studySlice`, `sessionClock`. No Streak route in `AppStack`. |
| Phase 4C streak rule (≥ 10 min or ≥ 1 practice set), `at-risk` flag | Not present as code. |
| Phase 4D Today's Study Plan card, Study Time card, Streak card on Home | Home components are: AskAiButton, ContinueLearning, GreetingSection, HeroBanner, HomeHeader, HomeSkeleton, MotivationBanner, OmrScannerCard, PopularExams, PreparationProgress, ProgressRing, QuickActions, WeakTopicsCard. The three cards are missing. (The Study Plan **screen** does exist.) |
| Phase 4E `planStreakReminder` | Not present. Only the generic reminders in `settings/utils/reminders.js`. |
| Phase 1 / Phase 0 "global error boundary" | Listed as to-do and indeed missing. |

Possible explanations: the work lives in another branch or uncommitted files, or `phase.md` is ahead of the code. **Open question for you:** should the web build these from the plan text (recommended, in W6), and should the mobile app get them too? I treated them as **web work items** (now built in W6 for the streak, the Streak page and the three Home cards) in `phases.md` rather than "copy", because there is nothing to copy.

Also not on mobile either (carried over as the same TODOs): real Razorpay, FCM, OMR detection / answer review grid / result from server, server-side streak, real chart library, full Hindi string pass.

---

## 10. Open questions (web-specific)

1. Web = student app only, or also the admin panel? (assumed student only)
2. Token storage: will the backend set an `httpOnly` refresh cookie? Decides §3 `secureStorage`.
3. Same domain for web and API (cookies, CORS) or separate (`app.epadh.ai` / `api.epadh.ai`)?
4. Shared package for `utils/store/services` vs copied code (§1).
5. Google sign-in: real Google Identity Services on web from day one?
6. Hosting target (Vercel / Netlify / S3+CloudFront) and the environments needed.
7. Razorpay: a separate web key from the mobile one?
8. PWA / installable app in scope, or plain website?
9. **PDF CORS:** the storage that serves study PDFs must send `Access-Control-Allow-Origin` for the web origin, because pdf.js fetches the file itself. Also HLS video would need `hls.js`.
10. Brand name is still epadh.ai vs Aadi.ai: keep it in `config/brand.js` (same as mobile).
11. All open questions in mobile `plan.md` §11 still apply (study material format, OMR layout, free limits, streak rule, rank empty state, UI language).
