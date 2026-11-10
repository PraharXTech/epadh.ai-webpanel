// Real-browser smoke test. Run it against a running dev server:
//   npm run dev            (in one terminal)
//   npm run e2e            (in another)
// Why it exists: jsdom (Vitest) hid a bug that blanked the whole app in a real browser
// (a CommonJS default import that only breaks under Vite's browser dev server). This test
// loads the real app in a real browser and fails on any console error.
//
// Browser: uses the Microsoft Edge or Google Chrome already installed (no download).
// Override with BROWSER=chrome|msedge. Server: BASE_URL (default http://localhost:5173).
import { chromium } from 'playwright-core';

const BASE = process.env.BASE_URL ?? 'http://localhost:5173';
const CHANNEL = process.env.BROWSER ?? 'msedge';

const browser = await chromium.launch({ channel: CHANNEL, headless: true });
let failures = 0;
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `  ${detail}`}`);
  if (!ok) failures += 1;
};

const journey = async (label, width, height) => {
  const page = await (
    await browser.newContext({ viewport: { width, height } })
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
  await page.getByRole('heading', { name: 'Home' }).waitFor({ timeout: 8000 });
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
  await page.getByRole('button', { name: 'Leave' }).click();

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
