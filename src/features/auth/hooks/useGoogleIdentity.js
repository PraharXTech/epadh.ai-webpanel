import { useEffect, useRef, useState } from 'react';

const SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

let scriptPromise = null;

// Loads Google Identity Services once per page. Resolves with `window.google`.
const loadScript = () => {
  if (window.google?.accounts?.id) {
    return Promise.resolve(window.google);
  }
  scriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => {
      scriptPromise = null; // allow a retry after a network failure
      reject(new Error('Could not load Google sign-in.'));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
};

// Renders Google's own sign-in button into `containerRef` and calls
// `onCredential(idToken)` when the student signs in. Web-only: mobile has no real Google
// sign-in. `status`: 'idle' (not loaded yet, or not enabled) | 'ready' | 'failed'.
export default function useGoogleIdentity({ clientId, enabled, onCredential }) {
  const containerRef = useRef(null);
  const callbackRef = useRef(onCredential);
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    callbackRef.current = onCredential;
  });

  useEffect(() => {
    if (!enabled || !clientId) {
      return undefined;
    }
    let cancelled = false;
    loadScript()
      .then(google => {
        if (cancelled || !containerRef.current) {
          return;
        }
        google.accounts.id.initialize({
          client_id: clientId,
          callback: response => callbackRef.current?.(response.credential),
        });
        google.accounts.id.renderButton(containerRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text: 'continue_with',
          width: containerRef.current.offsetWidth || 320,
        });
        setStatus('ready');
      })
      .catch(() => !cancelled && setStatus('failed'));
    return () => {
      cancelled = true;
    };
  }, [clientId, enabled]);

  return { containerRef, status };
}
