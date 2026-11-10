import { GOOGLE_CLIENT_ID, USE_MOCK_API } from '@/config/env';
import useGoogleIdentity from '../hooks/useGoogleIdentity';

function GoogleG() {
  return (
    <svg width="22" height="22" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.9 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z"
      />
      <path
        fill="#FBBC05"
        d="M10.5 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"
      />
    </svg>
  );
}

const BUTTON =
  'flex h-12 w-full items-center justify-center gap-3 rounded-full border border-slate-200 bg-white text-[15px] font-semibold text-slate-900 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60';

// "Continue with Google". Three modes, chosen by configuration:
//   mock mode (VITE_USE_MOCK_API on)   our button calls `onPress`, like the mobile mock
//   real, client id set                Google's own button (Google Identity Services);
//                                      its ID token goes to `onCredential`
//   real, no client id                 disabled, with a note, instead of failing silently
export default function GoogleButton({ onPress, onCredential, loading }) {
  const real = !USE_MOCK_API && Boolean(GOOGLE_CLIENT_ID);
  const { containerRef, status } = useGoogleIdentity({
    clientId: GOOGLE_CLIENT_ID,
    enabled: real,
    onCredential,
  });

  if (loading) {
    return (
      <button type="button" disabled aria-busy="true" className={BUTTON}>
        <span
          aria-hidden="true"
          className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"
        />
        Signing in…
      </button>
    );
  }

  if (USE_MOCK_API) {
    return (
      <button type="button" onClick={onPress} className={BUTTON}>
        <GoogleG />
        Continue with Google
      </button>
    );
  }

  if (!real) {
    return (
      <div>
        <button type="button" disabled className={BUTTON}>
          <GoogleG />
          Continue with Google
        </button>
        <p className="mt-1 text-center text-xs text-slate-500">
          Google sign-in is not set up yet. Use your mobile number.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div ref={containerRef} className="flex min-h-11 justify-center" />
      {status === 'failed' ? (
        <p role="alert" className="mt-1 text-center text-xs text-red-500">
          Could not load Google sign-in. Check your connection or use your
          mobile number.
        </p>
      ) : null}
    </div>
  );
}
