// Real-browser smoke test. Run it against a running dev server:
//   npm run dev            (in one terminal)
//   npm run e2e            (in another)
// Why it exists: jsdom (Vitest) hid a bug that blanked the whole app in a real browser
// (a CommonJS default import that only breaks under Vite's browser dev server). This test
// loads the real app in a real browser and fails on any console error.
//
// Browser: uses the Microsoft Edge or Google Chrome already installed (no download).
// Override with BROWSER=chrome|msedge. Server: BASE_URL (default http://localhost:5173).
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const BASE = process.env.BASE_URL ?? 'http://localhost:5173';
const CHANNEL = process.env.BROWSER ?? 'msedge';

const browser = await chromium.launch({
  channel: CHANNEL,
  headless: true,
  args: [
    '--use-fake-device-for-media-stream',
    '--use-fake-ui-for-media-stream',
  ],
});
let failures = 0;
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `  ${detail}`}`);
  if (!ok) failures += 1;
};

const journey = async (label, width, height) => {
  const page = await (
    await browser.newContext({
      viewport: { width, height },
      permissions: ['microphone'],
    })
  ).newPage();
  const errors = [];
  page.on('console', m => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', e => errors.push(e.message));

  // logged out: the app must render and send us to the login page
  await page.goto(BASE + '/syllabus', { waitUntil: 'networkidle' });
  await page.getByLabel('Mobile number').waitFor({ timeout: 8000 });
  check(
    `${label}: logged-out visit lands on /login`,
    new URL(page.url()).pathname === '/login',
  );

  // login -> OTP -> exam -> Home
  await page.getByLabel('Mobile number').fill('9876543210');
  await page.getByRole('button', { name: 'Send OTP' }).click();
  await page.getByLabel('6-digit verification code').fill('123456');
  await page.getByRole('button', { name: /Verify & Login/ }).click();
  await page.getByRole('checkbox', { name: /UPSSSC PET/ }).click();
  await page.getByRole('button', { name: /Continue \(1 selected\)/ }).click();
  await page.waitForURL(`${BASE}/`, { timeout: 8000 });
  check(`${label}: login, OTP and exam choice reach Home`, true);

  // a reload keeps the session and the exam
  await page.reload({ waitUntil: 'networkidle' });
  await page
    .getByRole('region', { name: 'Welcome' })
    .waitFor({ timeout: 8000 });
  check(
    `${label}: reload keeps the session`,
    new URL(page.url()).pathname === '/',
  );

  // ---- W4: syllabus drill-down, article, PDF, video, deep link
  // (the PDF and the video are public sample files, so these checks need internet access)
  await page.goto(BASE + '/syllabus', { waitUntil: 'networkidle' });
  await page.getByRole('link', { name: /Quantitative Aptitude/ }).click();
  await page.getByRole('link', { name: /Number System/ }).click();
  await page
    .getByRole('link', { name: /Types of Numbers/ })
    .first()
    .click();
  await page
    .getByRole('button', { name: /Mark as complete/ })
    .waitFor({ timeout: 8000 });
  check(
    `${label}: syllabus drills down to a topic`,
    page.url().endsWith('/topics/t-number-types'),
  );

  await page
    .getByRole('button', { name: /^Types of Numbers – Quick Revision/ })
    .click();
  await page
    .getByRole('heading', { name: 'Types of Numbers', level: 2 })
    .waitFor({ timeout: 8000 });
  const fontSize = () =>
    page
      .locator('.material-html')
      .evaluate(el => parseFloat(getComputedStyle(el).fontSize));
  const before = await fontSize();
  await page.getByRole('button', { name: 'Larger text' }).click();
  const after = await fontSize();
  check(
    `${label}: article opens and the text size changes`,
    after > before,
    `${before} -> ${after}`,
  );
  await page.goBack();

  await page
    .getByRole('button', { name: /^Number System – Complete Notes/ })
    .click();
  let pdfOk = true;
  try {
    await page.getByLabel(/Page 1 of \d+/).waitFor({ timeout: 25000 });
    await page.waitForFunction(
      () =>
        [...document.querySelectorAll('canvas')].some(canvas => {
          const data = canvas
            .getContext('2d')
            .getImageData(0, 0, canvas.width, canvas.height).data;
          for (let i = 0; i < data.length; i += 4)
            if (data[i] < 200) return true;
          return false;
        }),
      null,
      { timeout: 25000 },
    );
  } catch {
    pdfOk = false;
  }
  check(`${label}: PDF opens and a page is painted`, pdfOk);

  await page.goto(BASE + '/study-material', { waitUntil: 'networkidle' });
  await page
    .getByRole('button', { name: /^Percentage – Concept & Questions/ })
    .click();
  await page.locator('video').waitFor({ timeout: 8000 });
  const videoReady = await page
    .waitForFunction(
      () => document.querySelector('video')?.readyState >= 1,
      null,
      {
        timeout: 25000,
      },
    )
    .then(
      () => true,
      () => false,
    );
  check(`${label}: video loads`, videoReady);

  // a deep link opened cold (nothing cached) loads its own data
  await page.evaluate(() => window.localStorage.removeItem('persist:syllabus'));
  await page.goto(BASE + '/topics/t-number-types', {
    waitUntil: 'networkidle',
  });
  await page
    .getByRole('heading', { name: 'Types of Numbers' })
    .waitFor({ timeout: 8000 });
  check(`${label}: deep link to a topic works after a reload`, true);

  // ---- W5: practice test (keyboard answer, leave guard, reload resume, result, timed test)
  await page.goto(BASE + '/practice/t-percentage', {
    waitUntil: 'networkidle',
  });
  await page.getByRole('button', { name: /Start practice/ }).click();
  await page.getByText(/Question 1 of/).waitFor({ timeout: 8000 });
  await page.keyboard.press('2');
  const explained = await page
    .getByText(/Correct!|Not quite/)
    .waitFor({ timeout: 3000 })
    .then(
      () => true,
      () => false,
    );
  check(`${label}: a keyboard answer shows its explanation`, explained);

  await page.getByRole('button', { name: 'Leave test' }).click();
  const prompted = await page
    .getByRole('dialog', { name: 'Leave this test?' })
    .waitFor({ timeout: 3000 })
    .then(
      () => true,
      () => false,
    );
  check(`${label}: leaving asks first`, prompted);
  await page.getByRole('button', { name: 'Stay' }).click();

  await page.reload({ waitUntil: 'networkidle' });
  await page.getByText(/Question 1 of/).waitFor({ timeout: 8000 });
  check(
    `${label}: a reload mid-test resumes it`,
    page.url().endsWith('/practice/session'),
  );

  const lastIndex = 10;
  for (let i = 1; i < lastIndex; i += 1) {
    await page
      .getByRole('button', { name: /Next|Skip/ })
      .first()
      .click();
  }
  await page.getByRole('button', { name: 'Finish', exact: true }).click();
  const confirm = page.getByRole('dialog', { name: 'Finish practice?' });
  await confirm.waitFor({ timeout: 3000 });
  await confirm.getByRole('button', { name: 'Finish' }).click();
  await page
    .getByRole('heading', { name: 'Result' })
    .waitFor({ timeout: 8000 });
  check(
    `${label}: finishing shows the result`,
    page.url().endsWith('/practice/result'),
  );

  await page.getByRole('button', { name: 'New test' }).click();
  await page.getByRole('radio', { name: /Timed test/ }).click();
  await page.getByRole('radio', { name: '5' }).click();
  await page.getByRole('button', { name: /Start test/ }).click();
  const timerText = await page
    .getByRole('timer')
    .textContent({ timeout: 8000 })
    .catch(() => '');
  check(
    `${label}: a timed test shows its countdown`,
    /0[45]:\d\d/.test(timerText),
    timerText,
  );
  await page.getByRole('button', { name: 'Leave test' }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Leave', exact: true })
    .click();

  // ---- W6: Home dashboard, study plan / time / streak cards, the Streak page
  const overflows = () =>
    page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page
    .getByRole('region', { name: "Today's study plan" })
    .waitFor({ timeout: 8000 });
  const homeCards = await Promise.all(
    [
      page.getByRole('region', { name: 'Your preparation progress' }),
      page.getByRole('region', { name: 'Continue learning' }),
      page.getByRole('link', { name: /Study Time/ }),
      page.getByRole('link', { name: /Streak/ }),
    ].map(locator => locator.isVisible()),
  );
  check(`${label}: Home shows its cards`, homeCards.every(Boolean));
  check(`${label}: Home does not scroll sideways`, !(await overflows()));
  // the practice set finished earlier in this run counts as today's study
  const streakText = await page
    .getByRole('link', { name: /Streak/ })
    .innerText();
  check(
    `${label}: today's practice set started a streak`,
    /1\s*day/.test(streakText),
    streakText.replace(/\s+/g, ' '),
  );
  await page.getByRole('link', { name: /Streak/ }).click();
  await page
    .getByRole('heading', { name: 'Streak', level: 1 })
    .waitFor({ timeout: 8000 });
  const calendar = await page
    .getByRole('region', { name: 'Study calendar' })
    .isVisible();
  check(`${label}: the Streak page shows the calendar`, calendar);
  check(`${label}: Streak page does not scroll sideways`, !(await overflows()));

  // ---- W7: Ask epadh.ai (quick prompt, typed question, photo through the file chooser and crop,
  // reload keeps the chat, voice overlay, running out of questions)
  await page.goto(BASE + '/ask?topicId=t-percentage&topicName=Percentage', {
    waitUntil: 'networkidle',
  });
  await page.getByText(/Hi, main epadh.ai hoon/).waitFor({ timeout: 8000 });
  await page.getByRole('button', { name: 'मुख्य परीक्षा बिंदु बताओ' }).click();
  await page.getByText(/ke mukhya exam points/).waitFor({ timeout: 8000 });
  check(
    `${label}: a quick prompt gets a formatted answer`,
    (await page.locator('.chat-md br').count()) > 0,
  );

  const question = page.getByLabel('Your question');
  await question.fill('Percentage ka shortcut batao');
  await question.press('Enter');
  await page
    .getByText(/Percentage ka shortcut/)
    .first()
    .waitFor({ timeout: 5000 });
  check(`${label}: a typed question is sent with Enter`, true);

  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser', { timeout: 5000 }),
    page.getByRole('button', { name: 'Ask with a photo' }).click(),
  ]);
  await chooser.setFiles(
    fileURLToPath(
      new URL('../src/assets/images/herobanner.webp', import.meta.url),
    ),
  );
  const crop = page.getByRole('dialog', { name: 'Crop your doubt' });
  await crop.waitFor({ timeout: 8000 });
  await crop.getByRole('button', { name: 'Use photo' }).click();
  const preview = page.getByRole('dialog', { name: 'Send this photo?' });
  await preview.waitFor({ timeout: 8000 });
  await preview.getByRole('button', { name: 'Send to epadh.ai' }).click();
  await page
    .getByRole('img', { name: 'Photo you sent' })
    .waitFor({ timeout: 5000 });
  await page.getByText(/Photo mil gayi/).waitFor({ timeout: 8000 });
  check(`${label}: a photo goes through file chooser, crop and preview`, true);

  await page.reload({ waitUntil: 'networkidle' });
  const kept = await page
    .getByRole('img', { name: 'Photo you sent' })
    .waitFor({ timeout: 8000 })
    .then(
      () => true,
      () => false,
    );
  check(`${label}: a reload keeps the chat and its photo`, kept);

  await page.getByRole('button', { name: 'Ask by voice' }).click();
  const voiceOpened = await page
    .getByRole('dialog', { name: 'Voice question' })
    .waitFor({ timeout: 4000 })
    .then(
      () => true,
      () => false,
    );
  check(`${label}: the voice overlay opens`, voiceOpened);
  if (voiceOpened) {
    await page
      .getByRole('dialog', { name: 'Voice question' })
      .getByRole('button', { name: 'Cancel' })
      .click();
  }

  for (let i = 0; i < 12; i += 1) {
    if (
      /^0\//.test(
        await page
          .getByText(/left today/)
          .first()
          .innerText(),
      )
    )
      break;
    await question.fill(`sawal ${i}`);
    await question.press('Enter');
    await page.waitForTimeout(1500);
  }
  await page.getByRole('button', { name: /^0\/\d+ left today/ }).click();
  const upgrade = await page
    .getByRole('dialog', { name: "You've used today's free questions" })
    .waitFor({ timeout: 4000 })
    .then(
      () => true,
      () => false,
    );
  check(`${label}: running out of questions offers Pro`, upgrade);
  await page.keyboard.press('Escape');

  // ---- W8: Tests hub, mock tests (list, instructions, timed session, result), PYQ papers
  const noSideways = () =>
    page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    );
  const acceptDialog = dialog => dialog.accept(); // the "leave this site?" prompt of a reload
  page.on('dialog', acceptDialog);

  await page.goto(BASE + '/tests', { waitUntil: 'networkidle' });
  await page.getByText('Recommended for You').waitFor({ timeout: 8000 });
  check(
    `${label}: the Tests hub lists tests of every kind`,
    (await page
      .getByRole('button', { name: /Quantitative Aptitude Mock Test/ })
      .count()) > 0 &&
      (await page.getByRole('button', { name: /Types of Numbers/ }).count()) >
        0,
  );
  check(`${label}: the Tests hub does not scroll sideways`, await noSideways());

  await page.goto(BASE + '/mocks', { waitUntil: 'networkidle' });
  await page
    .getByRole('group', { name: 'Test type' })
    .waitFor({ timeout: 8000 });
  check(
    `${label}: the Mock Tests list does not scroll sideways`,
    await noSideways(),
  );
  await page
    .getByRole('group', { name: 'Test type' })
    .getByRole('button', { name: /Subject Wise/ })
    .click();
  await page.getByRole('button', { name: /Reasoning Mock Test/ }).click();
  await page.getByRole('button', { name: 'Start test' }).click();
  await page.getByRole('timer').waitFor({ timeout: 8000 });
  check(
    `${label}: a mock test starts with a countdown`,
    /^\d\d:\d\d$/.test((await page.getByRole('timer').innerText()).trim()),
  );
  check(
    `${label}: the mock session does not scroll sideways`,
    await noSideways(),
  );

  // answer with the keyboard, then reload in the middle: the attempt and its answer survive
  await page.keyboard.press('b');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('c');
  await page.keyboard.press('m');
  const closePrompt = await page.evaluate(() => {
    const event = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(event);
    return event.defaultPrevented;
  });
  check(`${label}: closing the tab in a test asks first`, closePrompt);
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByText(/Question 2 of 25/).waitFor({ timeout: 8000 });
  check(
    `${label}: a reload keeps the attempt, the answer and the mark`,
    (await page
      .getByRole('radio', { name: /^C/ })
      .getAttribute('aria-checked')) === 'true' &&
      (await page
        .getByRole('button', { name: 'Marked', exact: true })
        .count()) === 1,
  );

  await page.getByRole('button', { name: 'Leave test' }).click();
  const leaveAsk = await page
    .getByRole('dialog', { name: 'Leave this test?' })
    .waitFor({ timeout: 4000 })
    .then(
      () => true,
      () => false,
    );
  check(`${label}: leaving a test asks first`, leaveAsk);
  await page.getByRole('button', { name: 'Stay' }).click();

  // answer the rest and submit through the summary
  for (let i = 0; i < 23; i += 1) {
    await page.keyboard.press('a');
    await page.keyboard.press('ArrowRight');
  }
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  const summary = page.getByRole('dialog', { name: 'Submit test?' });
  await summary.waitFor({ timeout: 4000 });
  check(
    `${label}: the summary counts answered and marked`,
    /Answered/.test(await summary.innerText()) &&
      /Marked/.test(await summary.innerText()),
  );
  await summary.getByRole('button', { name: 'Confirm & submit' }).click();
  await page.waitForURL(/\/mocks\/result$/, { timeout: 8000 });
  await page.getByText(/Accuracy \d+%/).waitFor({ timeout: 8000 });
  check(`${label}: submitting opens the result with a score`, true);
  check(
    `${label}: a rank or its explanation is shown`,
    (await page.getByRole('region', { name: 'Rank' }).count()) === 1,
  );
  await page.getByRole('button', { name: 'Wrong', exact: true }).click();
  await page.getByRole('button', { name: 'Unattempted', exact: true }).click();
  check(`${label}: the result does not scroll sideways`, await noSideways());
  await page.getByRole('button', { name: 'Done' }).click();
  await page.waitForURL(url => !/\/mocks\/result$/.test(url.pathname), {
    timeout: 5000,
  });
  check(`${label}: Done leaves the result`, true);

  await page.goto(BASE + '/pyq', { waitUntil: 'networkidle' });
  await page.getByLabel('Search papers').waitFor({ timeout: 8000 });
  await page
    .getByRole('button', { name: 'Open UPSSSC PET 2022 – Shift 1' })
    .waitFor({ timeout: 8000 });
  check(
    `${label}: the papers list does not scroll sideways`,
    await noSideways(),
  );
  await page.getByLabel('Search papers').fill('2019');
  await page.getByRole('button', { name: 'Open UPSSSC PET 2019' }).click();
  await page.waitForURL(/\/membership\?feature=advancedMocks/, {
    timeout: 5000,
  });
  check(`${label}: a Pro paper sends a Free student to Membership`, true);
  await page.goto(BASE + '/pyq', { waitUntil: 'networkidle' });
  await page
    .getByRole('button', { name: 'Open UPSSSC PET 2022 – Shift 1' })
    .click();
  await page.waitForURL(/\/pyq\/pet-2022-s1$/, { timeout: 5000 });
  let paperOk = true;
  try {
    await page.getByLabel(/Page 1 of \d+/).waitFor({ timeout: 25000 });
  } catch {
    paperOk = false;
  }
  check(`${label}: a paper opens in the PDF viewer (needs internet)`, paperOk);
  check(
    `${label}: the viewer offers the answer key and the mock shortcut`,
    (await page.getByRole('button', { name: 'Answer key' }).count()) === 1 &&
      (await page
        .getByRole('link', { name: 'Attempt this paper as a test' })
        .count()) === 1,
  );
  check(
    `${label}: the paper viewer does not scroll sideways`,
    await noSideways(),
  );
  page.off('dialog', acceptDialog);

  // no sideways scrolling
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  check(`${label}: no horizontal scroll`, !overflow);
  check(
    `${label}: no console errors`,
    errors.length === 0,
    JSON.stringify(errors),
  );
  await page.context().close();
};

try {
  await journey('phone 393px', 393, 852);
  await journey('desktop 1280px', 1280, 800);
} finally {
  await browser.close();
}
if (failures) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('\nAll smoke checks passed');
