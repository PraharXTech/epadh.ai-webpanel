import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT_MS } from '@/config/env';
import { AUTH_ENDPOINTS } from '@/api/endpoints/auth';
import {
  clearTokens,
  loadTokens,
  saveTokens,
} from '@/services/storage/secureStorage';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
});

// The store registers this so a dead session logs the user out
// without the API layer importing the store (avoids a circular import).
let onSessionExpired = () => {};
export const setSessionExpiredHandler = handler => {
  onSessionExpired = handler;
};

// Turns any failure into an Error with a user-facing message.
export const getErrorMessage = error => {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.code === 'ECONNABORTED') {
    return 'Request timed out. Please try again.';
  }
  if (error?.message === 'Network Error') {
    return 'No internet connection. Please check your network.';
  }
  return error?.message ?? 'Something went wrong. Please try again.';
};

apiClient.interceptors.request.use(async config => {
  const tokens = await loadTokens();
  if (tokens?.accessToken) {
    config.headers.Authorization = `Bearer ${tokens.accessToken}`;
  }
  return config;
});

// One refresh at a time; requests that hit 401 meanwhile wait for its result.
let refreshPromise = null;

const refreshAccessToken = async () => {
  const tokens = await loadTokens();
  if (!tokens?.refreshToken) {
    throw new Error('No refresh token');
  }
  // Plain axios call so this request skips the interceptors below.
  const { data } = await axios.post(
    `${API_BASE_URL}${AUTH_ENDPOINTS.refresh}`,
    { refreshToken: tokens.refreshToken },
    { timeout: API_TIMEOUT_MS },
  );
  await saveTokens({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken ?? tokens.refreshToken,
  });
  return data.accessToken;
};

apiClient.interceptors.response.use(
  response => response,
  async error => {
    const original = error.config;
    const isAuthCall = original?.url?.startsWith('/auth/');

    if (error.response?.status !== 401 || original?._retried || isAuthCall) {
      return Promise.reject(error);
    }
    original._retried = true;

    try {
      refreshPromise = refreshPromise ?? refreshAccessToken();
      const accessToken = await refreshPromise;
      original.headers.Authorization = `Bearer ${accessToken}`;
      return apiClient(original);
    } catch (refreshError) {
      await clearTokens();
      onSessionExpired();
      return Promise.reject(error);
    } finally {
      refreshPromise = null;
    }
  },
);
