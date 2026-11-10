import { useCallback, useEffect, useRef, useState } from 'react';
import { showAlert } from '@/services/alerts/alertStore';
import {
  cancelListening,
  isVoiceSupported,
  requestMicPermission,
  startListening,
  stopListening,
  teardownVoice,
} from '../services/voiceService';

const LOCALES = { hi: 'hi-IN', en: 'en-IN' };

const warn = message =>
  showAlert('Voice assistant', message, null, { tone: 'warning', icon: 'mic' });

// Drives the voice overlay (plan.md section 5.10): ask permission once, listen, show a live
// transcript, and hand the final text back for the normal send flow to use (a recognised
// question is sent exactly like a typed one).
//
// Web changes from mobile: a browser may not support speech recognition at all (Firefox), so
// `supported` lets the UI hide the microphone with an explanation; the recognizer stops by
// itself when the speaker pauses (`onEnd`); and the permission text points at the browser.
export default function useVoiceInput() {
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [lang, setLang] = useState('hi');
  const [transcript, setTranscript] = useState('');
  const langRef = useRef(lang);
  useEffect(() => {
    langRef.current = lang;
  });

  const supported = isVoiceSupported();

  const begin = useCallback(async overrideLang => {
    setListening(true);
    try {
      await startListening(LOCALES[overrideLang ?? langRef.current], {
        onPartial: setTranscript,
        onFinal: setTranscript,
        onError: message => {
          setListening(false);
          warn(message);
        },
        onEnd: () => setListening(false),
      });
    } catch {
      setListening(false);
      warn("Couldn't start listening. Please try again.");
    }
  }, []);

  const openOverlay = useCallback(async () => {
    if (!isVoiceSupported()) {
      warn(
        "Voice input isn't supported in this browser. Please use Chrome, Edge or Safari, or type your question.",
      );
      return;
    }
    const granted = await requestMicPermission();
    if (!granted) {
      warn(
        'epadh.ai needs microphone permission to hear your question. Allow it from the lock icon in the address bar, then try again.',
      );
      return;
    }
    setTranscript('');
    setOpen(true);
    begin();
  }, [begin]);

  const stop = useCallback(async () => {
    setListening(false);
    try {
      await stopListening();
    } catch {
      // Nothing was listening; safe to ignore.
    }
  }, []);

  const resume = useCallback(() => begin(), [begin]);

  const switchLang = useCallback(
    async nextLang => {
      setLang(nextLang);
      await stop();
      setTranscript('');
      begin(nextLang);
    },
    [begin, stop],
  );

  const close = useCallback(async () => {
    setOpen(false);
    setListening(false);
    try {
      await cancelListening();
    } catch {
      // Nothing was listening; safe to ignore.
    }
  }, []);

  // Releases the listener when the chat page itself is left, not on every overlay open / close.
  useEffect(() => {
    return () => {
      teardownVoice();
    };
  }, []);

  return {
    supported,
    open,
    listening,
    lang,
    transcript,
    setTranscript,
    openOverlay,
    stop,
    resume,
    switchLang,
    close,
  };
}
