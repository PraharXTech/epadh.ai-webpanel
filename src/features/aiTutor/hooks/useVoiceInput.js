import { useCallback, useEffect, useRef, useState } from 'react';
import { showAlert } from '@/services/alerts/alertStore';
import {
  cancelListening,
  requestMicPermission,
  startListening,
  stopListening,
  teardownVoice,
} from '../services/voiceService';

const LOCALES = { hi: 'hi-IN', en: 'en-IN' };

// Drives the voice overlay (plan.md §5.10): ask permission once, listen, show a
// live transcript, and hand the final text back for the normal send flow to use
// (a recognised question is sent exactly like a typed one).
export default function useVoiceInput() {
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [lang, setLang] = useState('hi');
  const [transcript, setTranscript] = useState('');
  const langRef = useRef(lang);
  langRef.current = lang;

  const begin = useCallback(async overrideLang => {
    setListening(true);
    try {
      await startListening(LOCALES[overrideLang ?? langRef.current], {
        onPartial: setTranscript,
        onFinal: setTranscript,
        onError: message => {
          setListening(false);
          showAlert('Voice assistant', message, null, {
            tone: 'warning',
            icon: 'mic',
          });
        },
      });
    } catch {
      setListening(false);
      showAlert(
        'Voice assistant',
        "Couldn't start listening. Please try again.",
        null,
        { tone: 'warning', icon: 'mic' },
      );
    }
  }, []);

  const openOverlay = useCallback(async () => {
    const granted = await requestMicPermission();
    if (!granted) {
      showAlert(
        'Voice assistant',
        'epadh.ai needs microphone permission to hear your question. You can allow it from phone Settings.',
        null,
        { tone: 'warning', icon: 'mic' },
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

  // Releases the native listener when the chat screen itself is left, not on every
  // overlay open/close (the overlay is cheap to reopen within the same screen visit).
  useEffect(() => {
    return () => {
      teardownVoice();
    };
  }, []);

  return {
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
