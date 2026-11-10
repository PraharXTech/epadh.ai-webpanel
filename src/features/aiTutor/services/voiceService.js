// Web replacement for the mobile @react-native-voice/voice wrapper (plan.md section 5.10).
// Same exports, so the rest of the app only deals with start / stop and a few callbacks.
// Built on the browser's Web Speech API: Chrome, Edge and Safari have it; Firefox does not.
// `locale` is 'hi-IN' or 'en-IN'.
//
// Two things to know:
//   - Chrome and Edge send the audio to the browser maker's speech service, so listening needs
//     an internet connection and the student should be told so (the 'network' error below).
//   - The recognizer stops by itself when the speaker pauses, so `onEnd` is a new callback the
//     overlay uses to flip its microphone button back.
const Recognition =
  typeof window === 'undefined'
    ? undefined
    : (window.SpeechRecognition ?? window.webkitSpeechRecognition);

export const isVoiceSupported = () => Boolean(Recognition);

const ERROR_MESSAGES = {
  'no-speech': "Kuch sunayi nahi diya. Please try again and speak a little louder.",
  'audio-capture': 'No microphone was found. Please connect one and try again.',
  'not-allowed':
    'epadh.ai needs microphone permission to hear your question. Allow it from the lock icon in the address bar.',
  'service-not-allowed':
    'epadh.ai needs microphone permission to hear your question. Allow it from the lock icon in the address bar.',
  network:
    'Voice needs an internet connection (your browser sends the audio to its speech service).',
  'language-not-supported':
    'This browser cannot recognise that language. Try the other language, or type your question.',
};

let active = null; // the running recognizer

// Asks for the microphone. Resolves true when allowed. The permission prompt shows now, with an
// explanation, instead of in the middle of starting to listen.
export const requestMicPermission = async () => {
  if (!navigator.mediaDevices?.getUserMedia) {
    return false;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => track.stop()); // only the permission was wanted
    return true;
  } catch {
    return false;
  }
};

const textOf = results =>
  Array.from(results)
    .map(result => result[0].transcript)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

export const startListening = async (
  locale,
  { onPartial, onFinal, onError, onEnd } = {},
) => {
  if (!Recognition) {
    throw new Error('Voice input is not supported in this browser.');
  }
  active?.abort();

  const recognizer = new Recognition();
  recognizer.lang = locale;
  recognizer.interimResults = true;
  recognizer.continuous = false;
  recognizer.maxAlternatives = 1;

  recognizer.onresult = event => {
    const text = textOf(event.results);
    const isFinal = event.results[event.results.length - 1].isFinal;
    (isFinal ? onFinal : onPartial)?.(text);
  };
  recognizer.onerror = event => {
    if (event.error === 'aborted') {
      return; // we stopped it ourselves
    }
    onError?.(
      ERROR_MESSAGES[event.error] ?? 'Could not hear you, please try again.',
    );
  };
  recognizer.onend = () => {
    if (active === recognizer) {
      active = null;
    }
    onEnd?.();
  };

  active = recognizer;
  recognizer.start();
};

// stop() delivers what was heard so far; abort() throws it away.
export const stopListening = async () => {
  active?.stop();
};
export const cancelListening = async () => {
  active?.abort();
  active = null;
};

export const teardownVoice = async () => {
  active?.abort();
  active = null;
};
