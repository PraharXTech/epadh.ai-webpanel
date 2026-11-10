export const AUTH_ENDPOINTS = {
  sendOtp: '/auth/otp/send',
  verifyOtp: '/auth/otp/verify',
  register: '/auth/register',
  google: '/auth/google', // web: POST { idToken } from Google Identity Services
  refresh: '/auth/refresh',
  logout: '/auth/logout',
};
