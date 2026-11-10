// Web port of the mobile env.js: `__DEV__` and the emulator URL become Vite env vars.
// Values come from `.env.development` / `.env.production` (see `.env.example`).
// Only `VITE_*` variables reach the browser, so never put a secret in them.
export const ENV = import.meta.env.DEV ? 'development' : 'production';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api';
export const API_TIMEOUT_MS = 15000;

// Set VITE_USE_MOCK_API=false once the real backend is ready; services then call the API.
export const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false';

// Injected from package.json by vite.config.js (used by Help & support mail).
export const APP_VERSION = import.meta.env.VITE_APP_VERSION ?? '0.0.0';

// Google Identity Services client id (a public value, safe in the bundle). Without it the
// real Google button cannot load; with USE_MOCK_API on, the mock button is used instead.
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';
