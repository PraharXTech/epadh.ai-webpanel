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

## W1 — Platform layer (3–4 days) — **done**, see notes at the end of this section

Ports mobile Phase 0 and the infrastructure half of Phase 1 (1A, 1B). Nothing visible to the student yet except the splash and the placeholder shell. Packages are installed (axios, redux-persist, lucide-react, dompurify, react-markdown, vitest, testing-library, prettier).

Install: `axios redux-persist lucide-react dompurify react-markdown` and dev `vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom prettier prettier-plugin-tailwindcss`.

Work items:

- [x] Env: `.env.development`, `.env.production`, `.env.example` with `VITE_API_BASE_URL`, `VITE_USE_MOCK_API`, `VITE_APP_VERSION`
- [x] `config/env.js` (adapt), `config/brand.js` (copy, keep `BRAND`, `SUPPORT`, `LEGAL_LAST_UPDATED`)
- [x] Decide token storage (plan.md §3 / §10 q2) and write `services/storage/secureStorage.js` with the same three exports
- [x] `api/client.js`: axios instance, bearer interceptor, single-flight refresh queue, `getErrorMessage`, `setSessionExpiredHandler`. Copy the logic, swap storage
- [x] `store/index.js` with `redux-persist` on localStorage, all slices registered as their phase lands, `serializableCheck` ignored actions kept, **cross-tab logout** via the `storage` event
- [x] `services/network/network.js` on `navigator.onLine` (same exports); `OfflineBanner` comes in W2
- [x] Localization: copy `localization/` (`index.js`, `locales/en.js`, `locales/hi.js`), keep the "both files have the same keys" test
- [x] Toast service: `services/alerts/alertStore.js` kept as a thin wrapper over `react-hot-toast` (`showAlert(title, message, actions, opts)` → toast for info, `ConfirmDialog` for choices). `<Toaster />` mounted once in `app/`
- [x] Router: `routes/router.jsx` (`createBrowserRouter`), `routes/routePaths.js` (single table of paths from plan.md §4), guards `RequireAuth`, `RequireExam`, `RequireSession` (redirect when a guarded in-flow page is opened directly), exported `router` for `navigate()` outside React (replaces `navigationRef`, `goHome()`)
- [x] Layouts: `PublicLayout`, `AppLayout` (sidebar + top bar + mobile bottom bar), `FocusLayout`
- [x] Sidebar: rebuild `navigation/sidebar/sidebarItems.js` as `components/layout/sidebarItems.js` with `path` instead of `tab`/`screen`; `SidebarContent`, `SidebarProvider` (drawer state for < 1024 px)
- [x] `app/BootGate.jsx` (splash, min 0.9 s, runs `bootstrapSession`) and `app/Providers.jsx` (Redux Provider, PersistGate, RouterProvider, Toaster, ErrorBoundary)
- [x] `components/feedback/ErrorBoundary.jsx` (missing on mobile too) and `pages/public/NotFoundPage.jsx`
- [x] Theme tokens in `src/styles/tokens.css` using Tailwind v4 `@theme` (brand blue `#2563eb`, semantic colours used in `sidebarItems`, radii, shadows) and **Noto Sans Devanagari** loaded
- [x] Vitest config, `tests/utils/render.jsx` (port of `test-utils/render.jsx`: store + router + providers), jest-dom setup
- [x] Prettier + Tailwind class sorting, `npm run test`, `npm run format`, a CI script (`lint`, `test`, `build`)
- [x] Decide shared-package vs copy for `utils/store/services` (plan.md §1) and record the decision here

Mobile files for this phase:

**Copy as is (pure JS)** (10)

*api*

- [x] `api/client.js`
- [x] `api/endpoints/auth.js`

*config*

- [x] `config/brand.js`

*localization*

- [x] `localization/index.js`
- [x] `localization/locales/en.js`
- [x] `localization/locales/hi.js`

*services*

- [x] `services/alerts/alertStore.js`
- [x] `services/network/ensureOnline.js`

*utils*

- [x] `utils/date.js`
- [x] `utils/greeting.js`

**Adapt (native module → web API, same exports)** (4)

*config*

- [x] `config/env.js`

*services*

- [x] `services/network/network.js` — replace `@react-native-community/netinfo`
- [x] `services/storage/secureStorage.js` — replace `react-native-keychain`

*store*

- [x] `store/index.js` — replace `@react-native-async-storage/async-storage`

**Rewrite markup (React Native → DOM + Tailwind, keep the logic)** (1)

- [x] `screens/SplashScreen.jsx` → `pages/SplashPage.jsx`


**Done when:** the app boots to a splash, then the public shell, hits a mock API through the real client, a logout in one tab logs out the other, lint + test + build pass in CI. (Met locally: 234 tests pass, lint has 0 errors, build passes. Not done: a hosted CI pipeline file, since there is no repo or host yet; `npm run ci` runs the same three steps.)

**W1 notes and deliberate differences**

- **Copied ahead of schedule:** all 108 pure-JS files were copied in W1 (not only the ones listed above), because copying is free and it let the whole store boot. The per-phase lists still show them under their feature phase, ticked. Their *logic* is untouched; Prettier 3 reflowed 26 of them (formatting only, spot-checked).
- **Unit tests:** all 25 mobile unit-test files were ported to `src/tests/unit` (212 tests, all pass). Changes: `jest` is aliased to `vi` in `tests/setup.js`; Jest-style `require('@/…')` calls became ES imports; `session.test.js` checks `localStorage` instead of the Keychain mock. New web tests (22): route guards, app boot, token storage, network, cross-tab logout.
- **No `SidebarProvider`:** the drawer state lives in `AppLayout`, because on the web the hamburger is in the same layout (mobile needed a context to reach the Home header).
- **`SplashScreen` became `pages/SplashPage.jsx`** and is rendered by `BootGate`, not by a route.
- **Every route exists** in `routes/router.jsx` and renders `PlaceholderPage` until its phase lands (the `phase` is shown on each placeholder).
- **Token storage** is the temporary fallback described in plan.md section 3 (access token in memory, refresh token in `localStorage`). Revisit before production (open question 2).
- **Shared package vs copy:** decided **copy** for now (plan.md section 1).
- **ESLint:** `react-hooks/purity`, `react-hooks/refs` and `react-hooks/set-state-in-effect` are warnings, not errors, because three copied hooks (`plan/hooks.js`, `omr/hooks/useOmrResult.js`, `aiTutor/hooks/useVoiceInput.js`) were written for looser mobile lint rules. Fix them when W10, W11 and W7 port those features. The 3 warnings are the only lint output.
- **Bundle:** the main chunk is about 520 kB (170 kB gzip) because every slice and the icon set load up front. Route-level code splitting is W13.
- **Prettier** uses the mobile config (single quotes, trailing commas, `arrowParens: avoid`) plus the Tailwind class-sorting plugin, so copied and new code look the same.

---

## W2 — Shared UI kit and common components (3–4 days) — **done**, see notes at the end of this section

Ports the mobile `components/` tree and the unfinished mobile Phase 0 "shared UI kit".

- [x] Build the kit once, then reuse: `Button, Card, Chip, Badge, Avatar, Tabs (+ TabPanel), Modal, ConfirmDialog, Skeleton, EmptyState, ErrorState, ProgressBar, ScreenHeader` (the text field is `forms/TextField`, see notes)
- [x] `AlertHost` + `CustomAlert` collapse into `app/AlertHost` + `components/feedback/ConfirmDialog` + toasts (mobile `customAlert.test.jsx` ported to the new behaviour as `tests/integration/alertHost.test.jsx`)
- [x] `FeatureGate` and `usePaywall()` (navigates to `/membership?feature=…`)
- [x] `OfflineBanner` wired to `useNetwork` (done in W1)
- [x] Icon helper: `AppIcon` maps the mobile string ids to `lucide-react` components (all 75 icons verified to exist)
- [x] `components/charts/`: `BarChart` and `Ring` (DOM and SVG, no chart library). A line chart is not built; add it in W10 if the Performance page needs one
- [x] Storybook is **not** planned; the dev-only `/dev/ui` route shows every component instead
- [ ] Eyeball the `/dev/ui` gallery at 360 / 768 / 1280 px in a real browser (not done: verified by 48 automated tests and by the dev server compiling every module, not by looking at it)

Mobile files for this phase:

**Adapt (not a pure copy after all)** (1)

- [x] `hooks/usePaywall.js` — the mobile hook took a `navigation` argument, so it was rewritten around `useNavigate()`; it is listed as "copy" in the W1 count only because it has no native import

**Rewrite markup (React Native → DOM + Tailwind, keep the logic)** (13)

*components*

- [x] `components/common/AlertHost.jsx` → `app/AlertHost.jsx`
- [x] `components/common/AppIcon.jsx`
- [x] `components/common/BrandLogo.jsx`
- [x] `components/common/CustomAlert.jsx` → `components/feedback/ConfirmDialog.jsx`
- [x] `components/common/NoticeBanner.jsx`
- [x] `components/common/OfflineBanner.jsx`
- [x] `components/common/ProgressBar.jsx`
- [x] `components/common/ScreenHeader.jsx`
- [x] `components/common/ScreenLoader.jsx`
- [x] `components/common/SectionHeader.jsx`
- [x] `components/forms/TextField.jsx`
- [x] `components/gating/FeatureGate.jsx` (no React Native in it, copied unchanged)

*screens*

- [x] `screens/PlaceholderScreen.jsx` → `pages/PlaceholderPage.jsx` (done in W1)

**New on the web (no mobile equivalent):** `components/ui/{Button, Card, Chip, Badge, Avatar, Tabs, Modal}.jsx`, `components/feedback/{EmptyState, ErrorState, Skeleton}.jsx`, `components/charts/{BarChart, Ring}.jsx`, `pages/dev/UiGalleryPage.jsx`.

**Done when:** a dev-only UI gallery page shows every component in light layout at 360 / 768 / 1280 px, with keyboard focus visible and dialogs trapping focus. (Dialog focus trapping, Escape, focus restore, tab keyboard navigation and ARIA wiring are covered by tests. The three-width visual check is the one open item above.)

**W2 notes and deliberate differences**

- **One text input, `forms/TextField`:** the plan listed both `ui/Input` and `TextField`. They are the same thing, so there is only `TextField`. It requires a `label` (visible, or `hideLabel` for screen readers only), wires `aria-invalid` / `aria-describedby` to the error text, and takes `type="password"` for the show/hide toggle (mobile used `secureTextEntry`).
- **`PageHeader` is `ScreenHeader`:** same name as mobile. Back goes one step in history, or Home when the page was opened directly (no history).
- **`BottomSheet` / `Drawer` are `Modal` with a `placement`** (`center`, `bottom`, `right`). `bottom` is a sheet on phones and a centered dialog from 640 px up. The W4 material sheets reuse it.
- **Alerts:** a plain notice (one OK button, nothing to run) is now a **toast**; only a real choice opens a `ConfirmDialog`. `showAlert()` callers do not change.
- **`Modal` is hand-rolled** (portal, focus trap, Escape, scroll lock, focus restore) instead of the native `<dialog>`, because jsdom does not implement `showModal()` and the tests need to run.
- **`usePaywall()` has no `navigation` argument** any more.
- **Test setup** now stubs `matchMedia` (jsdom lacks it; `react-hot-toast` calls it).
- **Bundle size** is unchanged (about 521 kB / 171 kB gzip): the gallery is behind `import.meta.env.DEV` and is not in the production build.

---

## W3 — Auth, session and exam selection (3–4 days) — **done**, see notes at the end of this section

Ports mobile Phase 1. Mobile status was "done except FCM"; web does the same and **adds the real Google sign-in wiring** (plan.md §10 q5).

- [x] Login page (mobile + OTP), OTP page (6 boxes over one real input: paste, `autocomplete="one-time-code"`, 30 s resend, change number), shared `AuthLayout` (banner on top on phones, split screen from 1024 px)
- [x] `/login/otp` without `location.state.mobile` redirects to `/login`
- [x] Session bootstrap: `bootstrapSession` thunk copied (tested by the ported `session.test.js`). The refresh-once-on-401 logic is the copied API client; no web test exercises it yet
- [x] Route flow: no token → `/login`; no exam → `/onboarding/exam`; else the app. The page the student wanted is remembered (`location.state.from`) and used after login. Tested: guards, the remembered link, and the whole login → OTP → exam → Home journey
- [x] Exam selection: searchable list, multi-exam as on mobile, first-run page with a **Log out** link (new, for a wrong account), "change exams" page at `/exams/select`
- [ ] Change exams **from Profile** (the page exists; the Profile link arrives with W12)
- [x] Logout: best-effort `POST /auth/logout` to revoke the session (new on web, mobile never did this), then tokens cleared, every slice reset on `auth/logout`, other tabs follow
- [x] Google sign-in: three modes (mock button in mock mode; Google's own button when `VITE_GOOGLE_CLIENT_ID` is set; disabled with a note when it is not). **Not tested against real Google**: the real mode is unit-tested with a stubbed `window.google`, and the backend endpoint `POST /auth/google { idToken }` is a new contract to agree with PraharX
- [x] Port: `session.test.js`, `validation.test.js`, `multiExam.test.js` (all in W1) and `examSelection*.test.jsx` → `tests/integration/examSelection.test.jsx` + `authFlow.test.jsx`

Mobile files for this phase:

**Copy as is (pure JS)** (17)

*auth*

- [x] `features/auth/hooks/useCountdown.js`
- [x] `features/auth/services/authService.js` — two web additions: `loginWithGoogle({ idToken })` real branch, `revokeSession()`
- [x] `features/auth/store/authSlice.js` — `logoutUser` now calls `revokeSession()` first
- [x] `features/auth/store/sessionThunks.js`
- [x] `features/auth/utils/confirmLogout.js`

*exams*

- [x] `features/exams/hooks/useExamFilter.js`
- [x] `features/exams/services/examService.js`
- [x] `features/exams/services/mockExamContent.js`
- [x] `features/exams/store/examSlice.js`
- [x] `features/exams/utils/examContent.js`

*hooks*

- [x] `hooks/useExamLoader.js`

*store*

- [x] `store/selectors/authSelectors.js`
- [x] `store/selectors/examSelectors.js`
- [x] `store/selectors/userSelectors.js`

*user*

- [x] `features/user/services/userService.js`
- [x] `features/user/store/userSlice.js`

*validation*

- [x] `validation/authValidation.js`

**Rewrite markup (React Native → DOM + Tailwind, keep the logic)** (9)

*auth*

- [x] `features/auth/components/AuthLayout.jsx`
- [x] `features/auth/components/CountryCode.jsx`
- [x] `features/auth/components/GoogleButton.jsx`
- [x] `features/auth/components/OtpInput.jsx`
- [x] `features/auth/screens/LoginScreen.jsx` → `features/auth/pages/LoginPage.jsx`
- [x] `features/auth/screens/OtpScreen.jsx` → `features/auth/pages/OtpPage.jsx`

*exams*

- [x] `features/exams/components/ExamCard.jsx`
- [x] `features/exams/components/ExamFilterChips.jsx`
- [x] `features/exams/screens/ExamSelectionScreen.jsx` → `features/exams/pages/ExamSelectionPage.jsx`

**New on the web:** `features/auth/hooks/useGoogleIdentity.js` (loads Google Identity Services), `tests/utils/renderWithRealStore.jsx`.

**Done when:** a new user can sign in with OTP, choose an exam, reload the tab and land on Home; logout wipes everything in all tabs; an expired token refreshes silently. (Met in automated tests with the mock services, 33 new tests. **Not checked in a real browser**: the layout of the login / OTP / exam pages, a real tab reload, and the silent token refresh against a real API.)

**W3 notes and deliberate differences**

- **OTP input is one real `<input>`** with six decorative boxes drawn over it, not six inputs. Paste, SMS autofill and screen readers just work. It has **no `maxLength`** on purpose: a browser would cut a pasted `482 915` to 6 characters before the space is stripped, losing a digit (a test found this).
- **Direct visit to `/login/otp`** (no number in router state) goes to `/login`. Back and "Change" go one step in history, or to `/login` when there is none.
- **`/exams/select` is a full page** (no sidebar or tabs), not a modal route as plan.md §4 first said: it has its own sticky Save bar, which would clash with the bottom tab bar.
- **Login and OTP skip `PublicLayout`** (they bring their own full-bleed layout), so the router lists them separately from Terms and Privacy.
- **Login banner** was a 1.6 MB PNG in the mobile app. It is a 53 KB WebP here (`src/assets/images/authbanner.webp`, converted with `sharp`). Convert the other mobile banners the same way when their pages arrive (HeroBanner, Membership).
- **Mock mode OTP rules** are unchanged from mobile: any 6 digits work, `000000` is rejected.
- **Env:** new optional `VITE_GOOGLE_CLIENT_ID` (see `.env.example`).
- **Test isolation:** the token cache is in memory, so the full-flow tests call `clearTokens()` in `beforeEach` as the real logout does.

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

- [x] `features/material/hooks/useMaterial.js`
- [x] `features/material/services/materialService.js`
- [x] `features/material/store/materialSlice.js`
- [x] `features/material/utils/format.js`

*store*

- [x] `store/selectors/materialSelectors.js`
- [x] `store/selectors/syllabusSelectors.js`

*syllabus*

- [x] `features/syllabus/hooks/useSyllabus.js`
- [x] `features/syllabus/services/syllabusService.js`
- [x] `features/syllabus/store/syllabusSlice.js`

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

- [x] `features/practice/services/practiceService.js`
- [x] `features/practice/store/practiceSlice.js`
- [x] `features/practice/utils/scoring.js`

*store*

- [x] `store/selectors/attemptStatsSelectors.js`
- [x] `store/selectors/practiceSelectors.js`

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

- [x] `features/activity/hooks/useContinueLearning.js`
- [x] `features/activity/services/activityService.js`
- [x] `features/activity/store/activitySlice.js`

*home*

- [x] `features/home/hooks/useHome.js`
- [x] `features/home/services/homeService.js`
- [x] `features/home/store/homeSlice.js`

*hooks*

- [x] `hooks/useReconnectSync.js`

*store*

- [x] `store/selectors/activitySelectors.js`
- [x] `store/selectors/homeSelectors.js`
- [x] `store/selectors/studySelectors.js`

*study*

- [x] `features/study/services/studyService.js`
- [x] `features/study/store/studySlice.js`
- [x] `features/study/utils/sessionClock.js`

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

- [x] `features/aiTutor/hooks/usePhotoDoubt.js`
- [x] `features/aiTutor/hooks/useVoiceInput.js`
- [x] `features/aiTutor/services/aiTutorService.js`
- [x] `features/aiTutor/services/doubtService.js`
- [x] `features/aiTutor/store/aiTutorSlice.js`
- [x] `features/aiTutor/utils/questionPrompt.js`
- [x] `features/aiTutor/utils/quickPrompts.js`

*store*

- [x] `store/selectors/aiTutorSelectors.js`

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

- [x] `features/mock/services/mockService.js`
- [x] `features/mock/store/mockSlice.js`
- [x] `features/mock/utils/mockTests.js`
- [x] `features/mock/utils/questionGenerator.js`
- [x] `features/mock/utils/scoring.js`

*pyq*

- [x] `features/pyq/hooks/usePyqPapers.js`
- [x] `features/pyq/services/pyqService.js`
- [x] `features/pyq/store/pyqSlice.js`
- [x] `features/pyq/utils/pyq.js`

*store*

- [x] `store/selectors/mockSelectors.js`
- [x] `store/selectors/pyqSelectors.js`

*tests*

- [x] `features/tests/utils/catalog.js`

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

- [x] `features/membership/services/membershipService.js`
- [x] `features/membership/store/membershipSlice.js`
- [x] `features/membership/utils/entitlements.js`

*store*

- [x] `store/selectors/membershipSelectors.js`

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

- [x] `features/analytics/hooks.js`
- [x] `features/analytics/utils/performance.js`

*history*

- [x] `features/history/utils/history.js`

*plan*

- [x] `features/plan/hooks.js`
- [x] `features/plan/store/planSlice.js`
- [x] `features/plan/utils/planBuilder.js`

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

- [x] `features/omr/hooks/useOmrResult.js`
- [x] `features/omr/hooks/useOmrSheet.js`
- [x] `features/omr/services/omrResultService.js`
- [x] `features/omr/services/omrService.js`
- [x] `features/omr/store/omrSlice.js`
- [x] `features/omr/utils/omrResult.js`
- [x] `features/omr/utils/omrSheet.js`

*store*

- [x] `store/selectors/omrSelectors.js`

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

- [x] `features/legal/content/privacy.js`
- [x] `features/legal/content/terms.js`

*notifications*

- [x] `features/notifications/services/notificationService.js`
- [x] `features/notifications/store/notificationsSlice.js`
- [x] `features/notifications/utils/notifications.js`

*profile*

- [x] `features/profile/hooks/useAvatarChange.js`
- [x] `features/profile/hooks/useProfileStats.js`
- [x] `features/profile/utils/profile.js`

*settings*

- [x] `features/settings/hooks/useReminderSettings.js`
- [x] `features/settings/store/settingsSlice.js`
- [x] `features/settings/utils/reminders.js`

*store*

- [x] `store/selectors/notificationSelectors.js`
- [x] `store/selectors/settingsSelectors.js`

*support*

- [x] `features/support/content/faqs.js`
- [x] `features/support/utils/support.js`

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
