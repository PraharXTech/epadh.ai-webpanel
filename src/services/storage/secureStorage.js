// Web replacement for the mobile Keychain wrapper. Same three exports.
//
// SECURITY NOTE (plan.md section 3 / open question 2). A browser has no Keychain, and
// anything JavaScript can read, an XSS bug can steal. So:
//   - the access token lives in memory only (gone on reload, re-issued by the refresh call);
//   - the refresh token is the long-lived secret. The target design is an httpOnly,
//     Secure, SameSite cookie set by the backend, in which case this file never sees it.
//   - until the backend does that, the refresh token is kept in localStorage as a
//     TEMPORARY fallback. Replace this before production.
const REFRESH_KEY = 'epadhai.refresh';

let cache = null; // { accessToken, refreshToken }

const readRefresh = () => {
  try {
    return window.localStorage.getItem(REFRESH_KEY);
  } catch {
    return null; // storage blocked (private mode, policy): session simply will not survive a reload
  }
};

const writeRefresh = value => {
  try {
    if (value) {
      window.localStorage.setItem(REFRESH_KEY, value);
    } else {
      window.localStorage.removeItem(REFRESH_KEY);
    }
  } catch {
    // ignored, see readRefresh
  }
};

export const saveTokens = async ({ accessToken, refreshToken }) => {
  cache = { accessToken, refreshToken };
  writeRefresh(refreshToken);
};

// After a reload only the refresh token exists; `accessToken` is null until the API
// client's 401 -> refresh path fetches a new one.
export const loadTokens = async () => {
  if (cache) {
    return cache;
  }
  const refreshToken = readRefresh();
  if (!refreshToken) {
    return null;
  }
  cache = { accessToken: null, refreshToken };
  return cache;
};

export const clearTokens = async () => {
  cache = null;
  writeRefresh(null);
};
