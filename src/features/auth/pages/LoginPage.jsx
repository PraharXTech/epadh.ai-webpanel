import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import AppIcon from '@/components/common/AppIcon';
import TextField from '@/components/forms/TextField';
import Button from '@/components/ui/Button';
import { PATHS } from '@/routes/routePaths';
import {
  selectAuthError,
  selectAuthStatus,
} from '@/store/selectors/authSelectors';
import { validateMobile } from '@/validation/authValidation';
import AuthLayout from '../components/AuthLayout';
import CountryCode from '../components/CountryCode';
import GoogleButton from '../components/GoogleButton';
import { clearAuthError, googleLogin, sendOtp } from '../store/authSlice';

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const status = useSelector(selectAuthStatus);
  const authError = useSelector(selectAuthError);

  const [mobile, setMobile] = useState('');
  const [mobileError, setMobileError] = useState(null);
  const [method, setMethod] = useState(null); // 'otp' | 'google'

  const loading = status === 'loading';

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  const handleSendOtp = async event => {
    event.preventDefault();
    const invalid = validateMobile(mobile);
    setMobileError(invalid);
    if (invalid) {
      return;
    }
    setMethod('otp');
    const number = mobile.trim();
    const result = await dispatch(sendOtp({ mobile: number }));
    if (sendOtp.fulfilled.match(result)) {
      // `from` rides along so that after login the student lands on the page they wanted.
      navigate(PATHS.otp, {
        state: { mobile: number, from: location.state?.from },
      });
    }
  };

  const handleGoogle = credential => {
    setMethod('google');
    dispatch(googleLogin({ idToken: credential }));
  };

  return (
    <AuthLayout>
      <div className="flex items-center">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100">
          <AppIcon name="smartphone" color="#2563eb" size={24} />
        </span>
        <div className="ml-3 flex-1">
          <h1 className="text-xl font-extrabold text-slate-900">
            Welcome Back!
          </h1>
          <p className="text-sm text-slate-500">
            Login to continue your learning journey
          </p>
        </div>
      </div>

      <form onSubmit={handleSendOtp} noValidate className="mt-5">
        <TextField
          label="Mobile number"
          prefix={<CountryCode />}
          placeholder="Enter your mobile number"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          maxLength={10}
          autoFocus
          value={mobile}
          onChange={event => {
            setMobile(event.target.value.replace(/\D/g, ''));
            setMobileError(null);
          }}
          error={mobileError}
        />

        {authError ? (
          <p role="alert" className="mt-3 text-center text-sm text-red-500">
            {authError}
          </p>
        ) : null}

        <Button
          type="submit"
          size="lg"
          fullWidth
          className="mt-4"
          loading={loading && method === 'otp'}
          disabled={loading}>
          Send OTP
        </Button>
      </form>

      <div className="my-4 flex items-center">
        <span className="h-px flex-1 bg-slate-300" />
        <span className="mx-4 text-sm text-slate-500">or continue with</span>
        <span className="h-px flex-1 bg-slate-300" />
      </div>

      <GoogleButton
        onPress={() => handleGoogle()}
        onCredential={handleGoogle}
        loading={loading && method === 'google'}
      />

      <p className="mt-4 text-center text-xs leading-5 text-slate-500">
        By continuing, you agree to our{' '}
        <Link to={PATHS.terms} className="font-semibold text-blue-600">
          Terms &amp; Conditions
        </Link>{' '}
        and{' '}
        <Link to={PATHS.privacy} className="font-semibold text-blue-600">
          Privacy Policy
        </Link>
        .
      </p>
    </AuthLayout>
  );
}
