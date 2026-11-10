import { useEffect, useId, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import useGoBack from '@/hooks/useGoBack';
import AppIcon from '@/components/common/AppIcon';
import Button from '@/components/ui/Button';
import { PATHS } from '@/routes/routePaths';
import {
  selectAuthError,
  selectAuthStatus,
} from '@/store/selectors/authSelectors';
import { validateOtp } from '@/validation/authValidation';
import AuthLayout from '../components/AuthLayout';
import OtpInput from '../components/OtpInput';
import useCountdown from '../hooks/useCountdown';
import { OTP_LENGTH, OTP_RESEND_SECONDS } from '../services/authService';
import { clearAuthError, sendOtp, verifyOtp } from '../store/authSlice';

// `/login/otp` only makes sense right after "Send OTP": the number arrives in router state.
// Opened directly (a bookmark, a reload after the state was lost) it goes to the login page.
export default function OtpPage() {
  const { state } = useLocation();
  if (!state?.mobile) {
    return <Navigate to={PATHS.login} replace />;
  }
  return <OtpForm mobile={state.mobile} />;
}

function OtpForm({ mobile }) {
  const dispatch = useDispatch();
  const status = useSelector(selectAuthStatus);
  const authError = useSelector(selectAuthError);
  const { seconds, restart } = useCountdown(OTP_RESEND_SECONDS);
  const errorId = useId();

  const [otp, setOtp] = useState('');
  const [localError, setLocalError] = useState(null);

  const loading = status === 'loading';
  const error = localError ?? authError;

  // Drop any stale error from the previous page when this one opens.
  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  const handleChange = value => {
    setOtp(value);
    setLocalError(null);
    if (authError) {
      dispatch(clearAuthError());
    }
  };

  const handleVerify = event => {
    event.preventDefault();
    const invalid = validateOtp(otp, OTP_LENGTH);
    setLocalError(invalid);
    if (!invalid) {
      dispatch(verifyOtp({ mobile, otp }));
    }
  };

  const handleResend = () => {
    setOtp('');
    restart();
    dispatch(sendOtp({ mobile }));
  };

  // "Change" returns to the login page (history back, or a fresh visit to /login).
  const changeNumber = useGoBack(PATHS.login);

  return (
    <AuthLayout showBack>
      <h1 className="text-xl font-extrabold text-slate-900">Verify OTP</h1>
      <p className="mt-1 text-sm text-slate-600">
        Enter the {OTP_LENGTH}-digit code sent to
      </p>
      <p className="mb-5 flex items-center">
        <span className="text-sm font-bold text-slate-900">+91 {mobile}</span>
        <button
          type="button"
          onClick={() => changeNumber()}
          className="ml-3 text-sm font-semibold text-blue-600 hover:underline">
          Change
        </button>
      </p>

      <form onSubmit={handleVerify} noValidate>
        <OtpInput
          value={otp}
          onChange={handleChange}
          length={OTP_LENGTH}
          hasError={Boolean(error)}
          errorId={errorId}
        />

        {error ? (
          <p
            id={errorId}
            role="alert"
            className="mt-3 text-center text-sm text-red-500">
            {error}
          </p>
        ) : null}

        <Button
          type="submit"
          size="lg"
          fullWidth
          className="mt-5"
          loading={loading}
          disabled={otp.length < OTP_LENGTH}>
          Verify &amp; Login
          <AppIcon name="arrow-right" color="currentColor" size={20} />
        </Button>
      </form>

      <div className="mt-4 flex items-center justify-center text-sm text-slate-600">
        {seconds > 0 ? (
          <p aria-live="off">
            Resend OTP in{' '}
            <span className="font-bold text-slate-900">
              00:{String(seconds).padStart(2, '0')}
            </span>
          </p>
        ) : (
          <>
            <span>Didn&apos;t receive the code?&nbsp;</span>
            <button
              type="button"
              onClick={handleResend}
              className="font-bold text-blue-600 hover:underline">
              Resend OTP
            </button>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
