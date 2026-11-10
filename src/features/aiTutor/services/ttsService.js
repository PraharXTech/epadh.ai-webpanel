// Web replacement for the mobile react-native-tts wrapper. AI replies can be spoken aloud when
// the student turns the speaker toggle on in the chat header (plan.md section 5.10).
// Same exports; built on the browser's speechSynthesis (all current browsers).
//
// Long text is read in sentence-sized pieces: Chrome silently stops a single utterance after
// roughly 15 seconds, so one long answer would be cut off.
const synth =
  typeof window === 'undefined' ? undefined : window.speechSynthesis;

export const isTtsSupported = () => Boolean(synth);

const listeners = new Set();
const notifyEnd = () => listeners.forEach(listener => listener());

// Strips the markdown marks so the voice does not read out "star star".
const forSpeech = text =>
  text
    .replace(/\*\*/g, '')
    .replace(/[*_`#>]/g, '')
    .replace(/^[•-]\s*/gm, '')
    .replace(/\n+/g, '. ');

const MAX_CHUNK = 180;

// Splits at sentence ends, packing sentences up to MAX_CHUNK characters.
export const chunkText = text => {
  const sentences = text.match(/[^.!?।]+[.!?।]*\s*/g) ?? [text];
  const chunks = [];
  let current = '';
  sentences.forEach(sentence => {
    if (current && (current + sentence).length > MAX_CHUNK) {
      chunks.push(current.trim());
      current = '';
    }
    current += sentence;
  });
  if (current.trim()) {
    chunks.push(current.trim());
  }
  return chunks;
};

// Voices load asynchronously in Chrome: wait for them once, but never hang.
const loadVoices = () =>
  new Promise(resolve => {
    const now = synth.getVoices();
    if (now.length) {
      resolve(now);
      return;
    }
    const done = () => resolve(synth.getVoices());
    synth.addEventListener('voiceschanged', done, { once: true });
    setTimeout(done, 800);
  });

const pickVoice = (voices, locale) => {
  const language = locale.split('-')[0];
  return (
    voices.find(v => v.lang === locale) ??
    voices.find(v => v.lang.startsWith(language)) ??
    null
  );
};

let token = 0; // a newer speak() or a stop() invalidates the one in progress

export const speak = async (text, locale = 'hi-IN') => {
  if (!synth) {
    return;
  }
  synth.cancel();
  token += 1;
  const mine = token;

  const voice = pickVoice(await loadVoices(), locale);
  if (mine !== token) {
    return; // stopped or replaced while the voices loaded
  }

  const chunks = chunkText(forSpeech(text));
  chunks.forEach((chunk, index) => {
    const utterance = new SpeechSynthesisUtterance(chunk);
    utterance.lang = locale;
    if (voice) {
      utterance.voice = voice; // falls back to the browser's default voice when none matches
    }
    if (index === chunks.length - 1) {
      utterance.onend = () => mine === token && notifyEnd();
    }
    utterance.onerror = () => mine === token && notifyEnd();
    synth.speak(utterance);
  });
};

export const stopSpeaking = () => {
  token += 1;
  synth?.cancel();
  notifyEnd();
};

// Calls `callback` when speech finishes or is stopped. Returns the unsubscribe function.
export const onSpeechEnd = callback => {
  listeners.add(callback);
  return () => listeners.delete(callback);
};
