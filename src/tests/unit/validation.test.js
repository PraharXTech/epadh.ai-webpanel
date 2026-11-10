import { validateMobile, validateOtp } from '@/validation/authValidation';

describe('auth validation', () => {
  it('accepts Indian mobile numbers only', () => {
    expect(validateMobile('9876543210')).toBeNull();
    expect(validateMobile('1234567890')).not.toBeNull();
    expect(validateMobile('98765')).not.toBeNull();
  });

  it('needs exactly 6 digits for the OTP', () => {
    expect(validateOtp('123456')).toBeNull();
    expect(validateOtp('12345')).not.toBeNull();
    expect(validateOtp('12345a')).not.toBeNull();
  });
});
