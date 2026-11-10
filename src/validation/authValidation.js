export const validateMobile = value =>
  /^[6-9]\d{9}$/.test(value.trim())
    ? null
    : 'Enter a valid 10-digit mobile number';

export const validateOtp = (value, length = 6) =>
  new RegExp(`^\\d{${length}}$`).test(value)
    ? null
    : `Enter the ${length}-digit OTP`;
