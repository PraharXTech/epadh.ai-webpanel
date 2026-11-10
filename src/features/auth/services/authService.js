// Mock auth layer. Set USE_MOCK_API=false in src/config/env.js and fill in the
// real branches below once the backend exists:
//   sendOtp   -> POST /auth/otp/send
//   verifyOtp -> POST /auth/otp/verify
// While mocked, any 6-digit OTP is accepted, except 000000 (simulates a wrong code).
import { apiClient } from '@/api/client';
import { AUTH_ENDPOINTS } from '@/api/endpoints/auth';
import { USE_MOCK_API } from '@/config/env';

const delay = (ms = 700) => new Promise(resolve => setTimeout(resolve, ms));

export const OTP_LENGTH = 6;
export const OTP_RESEND_SECONDS = 30;

const mockSession = mobile => ({
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  user: { id: 'u1', name: 'Abhishek', mobile },
});

export const sendOtp = async ({ mobile }) => {
  if (!USE_MOCK_API) {
    await apiClient.post(AUTH_ENDPOINTS.sendOtp, { mobile });
    return { mobile };
  }
  await delay();
  return { mobile };
};

// A number seen for the first time gets an account created by the backend.
export const verifyOtp = async ({ mobile, otp }) => {
  if (!USE_MOCK_API) {
    const { data } = await apiClient.post(AUTH_ENDPOINTS.verifyOtp, {
      mobile,
      otp,
    });
    return data;
  }
  await delay();
  if (otp === '000000') {
    throw new Error('Incorrect OTP. Please try again.');
  }
  return mockSession(mobile);
};

export const loginWithGoogle = async () => {
  await delay();
  return mockSession(null);
};
