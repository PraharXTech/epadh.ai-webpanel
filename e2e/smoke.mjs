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
