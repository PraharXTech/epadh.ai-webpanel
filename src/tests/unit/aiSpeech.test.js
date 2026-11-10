// The two speech services run on browser APIs jsdom does not have (speechSynthesis,
// SpeechRecognition, getUserMedia). Each test installs a small fake of the API, then loads the
// service fresh: the services decide what the browser supports when they are first imported.
afterEach(() => {
  vi.resetModules();
  delete window.speechSynthesis;
  delete window.SpeechRecognition;
  delete window.webkitSpeechRecognition;
  delete globalThis.SpeechSynthesisUtterance;
  vi.useRealTimers();
});

describe('ttsService (speechSynthesis)', () => {
  let spoken;
  let voices;
  let synth;

  const install = () => {
    spoken = [];
    voices = [
      { lang: 'en-US', name: 'US' },
      { lang: 'hi-IN', name: 'Hindi' },
      { lang: 'en-IN', name: 'India English' },
    ];
    globalThis.SpeechSynthesisUtterance = class {
      constructor(text) {
        this.text = text;
      }
    };
    synth = {
      speak: vi.fn(utterance => spoken.push(utterance)),
      cancel: vi.fn(() => {
        spoken.length = 0;
      }),
      getVoices: vi.fn(() => voices),
      addEventListener: vi.fn(),
    };
    window.speechSynthesis = synth;
  };
  const load = () => import('@/features/aiTutor/services/ttsService');

  describe('chunkText', () => {
    it('keeps a short text whole', async () => {
      install();
      const { chunkText } = await load();
      expect(chunkText('Hello there.')).toEqual(['Hello there.']);
    });

    it('splits at sentence ends and packs sentences up to about 180 characters', async () => {
      install();
      const { chunkText } = await load();
      const sentence =
        'Yeh ek sentence hai jo kaafi lamba hai aur kuch bol raha hai. ';
      const text = sentence.repeat(10);
      const chunks = chunkText(text);
      expect(chunks.length).toBeGreaterThan(2);
      chunks.forEach(chunk => {
        expect(chunk.length).toBeLessThanOrEqual(190);
        expect(chunk.endsWith('.')).toBe(true);
      });
      expect(chunks.join(' ').replace(/\s+/g, ' ')).toBe(
        text.trim().replace(/\s+/g, ' '),
      );
    });

    it('treats the Hindi full stop as a sentence end', async () => {
      install();
      const { chunkText } = await load();
      expect(chunkText('पहला वाक्य। दूसरा वाक्य।'.repeat(1))).toEqual([
        'पहला वाक्य। दूसरा वाक्य।',
      ]);
    });

    it('a single very long sentence stays in one piece (nothing to split on)', async () => {
      install();
      const { chunkText } = await load();
      const long = 'a'.repeat(400);
      expect(chunkText(long)).toEqual([long]);
    });
  });

  it('reports whether the browser can speak', async () => {
    install();
    expect((await load()).isTtsSupported()).toBe(true);
    vi.resetModules();
    delete window.speechSynthesis;
    expect((await load()).isTtsSupported()).toBe(false);
  });

  it('speaks in the requested language with a matching voice', async () => {
    install();
    const { speak } = await load();
    await speak('Namaste. Aap kaise hain.', 'hi-IN');
    expect(spoken).toHaveLength(1);
    expect(spoken[0].lang).toBe('hi-IN');
    expect(spoken[0].voice).toBe(voices[1]);
  });

  it('falls back to a voice of the same language, then to the browser default', async () => {
    install();
    const { speak } = await load();
    voices.splice(1, 1); // no hi-IN voice left
    await speak('Hello.', 'en-GB');
    expect(spoken[0].voice).toBe(voices[0]); // an en-* voice (en-US is first)

    spoken.length = 0;
    await speak('Namaste.', 'hi-IN');
    expect(spoken[0].voice).toBeUndefined(); // none: the browser picks
  });

  it('cuts off what is being said before it starts something new', async () => {
    install();
    const { speak } = await load();
    await speak('Pehla jawab.');
    await speak('Doosra jawab.');
    expect(synth.cancel).toHaveBeenCalledTimes(2);
    expect(spoken.map(u => u.text)).toEqual(['Doosra jawab.']);
  });

  it('reads markdown marks as plain words', async () => {
    install();
    const { speak } = await load();
    await speak('**Mukhya** baat:\n• pehla\n- doosra');
    expect(spoken.map(u => u.text).join(' ')).toBe(
      'Mukhya baat:. pehla. doosra',
    );
  });

  it('long answers are spoken as several pieces, and the end is announced once, after the last', async () => {
    install();
    const { speak, onSpeechEnd } = await load();
    const ended = vi.fn();
    onSpeechEnd(ended);
    await speak(
      'Yeh ek sentence hai jo kaafi lamba hai aur kuch bol raha hai. '.repeat(
        10,
      ),
    );
    expect(spoken.length).toBeGreaterThan(2);
    spoken[0].onend?.();
    expect(ended).not.toHaveBeenCalled();
    spoken[spoken.length - 1].onend();
    expect(ended).toHaveBeenCalledTimes(1);
  });

  it('stopping cancels the speech, announces the end, and silences a pending reply', async () => {
    install();
    const { speak, stopSpeaking, onSpeechEnd } = await load();
    const ended = vi.fn();
    onSpeechEnd(ended);
    await speak('Hello.');
    const last = spoken[0];
    stopSpeaking();
    expect(synth.cancel).toHaveBeenCalled();
    expect(ended).toHaveBeenCalledTimes(1);
    last.onend(); // the browser may still call it: it is stale now
    expect(ended).toHaveBeenCalledTimes(1);
  });

  it("a newer reply makes the older one's end event stale", async () => {
    install();
    const { speak, onSpeechEnd } = await load();
    const ended = vi.fn();
    onSpeechEnd(ended);
    await speak('Pehla.');
    const old = spoken[0];
    await speak('Doosra.');
    old.onend?.();
    expect(ended).not.toHaveBeenCalled();
    spoken[0].onend();
    expect(ended).toHaveBeenCalledTimes(1);
  });

  it('an error while speaking ends it quietly', async () => {
    install();
    const { speak, onSpeechEnd } = await load();
    const ended = vi.fn();
    onSpeechEnd(ended);
    await speak('Hello.');
    spoken[0].onerror();
    expect(ended).toHaveBeenCalledTimes(1);
  });

  it('waits for voices that load late, but not forever', async () => {
    install();
    voices.length = 0;
    vi.useFakeTimers();
    const { speak } = await load();
    const pending = speak('Hello.', 'hi-IN');
    await vi.advanceTimersByTimeAsync(1000); // no "voiceschanged": gives up and speaks
    await pending;
    expect(spoken).toHaveLength(1);
    expect(spoken[0].voice).toBeUndefined();
  });

  it('unsubscribing from the end event works', async () => {
    install();
    const { speak, onSpeechEnd } = await load();
    const ended = vi.fn();
    const off = onSpeechEnd(ended);
    off();
    await speak('Hello.');
    spoken[0].onend();
    expect(ended).not.toHaveBeenCalled();
  });

  it('does nothing in a browser without speech synthesis', async () => {
    const { speak, stopSpeaking } = await load();
    await expect(speak('Hello.')).resolves.toBeUndefined();
    expect(() => stopSpeaking()).not.toThrow();
  });
});

describe('voiceService (SpeechRecognition)', () => {
  let recognizer;
  const install = () => {
    recognizer = null;
    window.webkitSpeechRecognition = class {
      constructor() {
        recognizer = this;
        this.start = vi.fn();
        this.stop = vi.fn();
        this.abort = vi.fn();
      }
    };
  };
  const load = () => import('@/features/aiTutor/services/voiceService');
  const result = (transcript, isFinal) => {
    const item = [{ transcript }];
    item.isFinal = isFinal;
    return item;
  };

  it('knows whether the browser supports it (Firefox does not)', async () => {
    expect((await load()).isVoiceSupported()).toBe(false);
    vi.resetModules();
    install();
    expect((await load()).isVoiceSupported()).toBe(true);
    vi.resetModules();
    delete window.webkitSpeechRecognition;
    window.SpeechRecognition = class {};
    expect((await load()).isVoiceSupported()).toBe(true);
  });

  it('refuses to start where there is no speech recognition', async () => {
    const { startListening } = await load();
    await expect(startListening('hi-IN', {})).rejects.toThrow(/not supported/);
  });

  it('listens in the chosen language with live results', async () => {
    install();
    const { startListening } = await load();
    await startListening('hi-IN', {});
    expect(recognizer.lang).toBe('hi-IN');
    expect(recognizer.interimResults).toBe(true);
    expect(recognizer.continuous).toBe(false);
    expect(recognizer.start).toHaveBeenCalled();
  });

  it('sends interim text as partial and the finished text as final', async () => {
    install();
    const { startListening } = await load();
    const onPartial = vi.fn();
    const onFinal = vi.fn();
    await startListening('en-IN', { onPartial, onFinal });

    recognizer.onresult({ results: [result('percent', false)] });
    expect(onPartial).toHaveBeenLastCalledWith('percent');
    recognizer.onresult({ results: [result('percentage kya', true)] });
    expect(onFinal).toHaveBeenCalledWith('percentage kya');
  });

  it('joins several results into one sentence', async () => {
    install();
    const { startListening } = await load();
    const onFinal = vi.fn();
    await startListening('en-IN', { onFinal });
    recognizer.onresult({
      results: [result(' percentage ', true), result('kya  hota hai', true)],
    });
    expect(onFinal).toHaveBeenCalledWith('percentage kya hota hai');
  });

  it.each([
    ['no-speech', /Kuch sunayi nahi diya/],
    ['audio-capture', /No microphone/],
    ['not-allowed', /microphone permission/],
    ['service-not-allowed', /microphone permission/],
    ['network', /internet connection/],
    ['language-not-supported', /cannot recognise that language/],
    ['something-new', /Could not hear you/],
  ])(
    'turns the "%s" error into words the student can act on',
    async (code, message) => {
      install();
      const { startListening } = await load();
      const onError = vi.fn();
      await startListening('hi-IN', { onError });
      recognizer.onerror({ error: code });
      expect(onError).toHaveBeenCalledWith(expect.stringMatching(message));
    },
  );

  it('does not report its own abort as an error', async () => {
    install();
    const { startListening } = await load();
    const onError = vi.fn();
    await startListening('hi-IN', { onError });
    recognizer.onerror({ error: 'aborted' });
    expect(onError).not.toHaveBeenCalled();
  });

  it('tells the caller when the browser stops listening by itself', async () => {
    install();
    const { startListening } = await load();
    const onEnd = vi.fn();
    await startListening('hi-IN', { onEnd });
    recognizer.onend();
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it('starting again stops the previous listener first', async () => {
    install();
    const { startListening } = await load();
    await startListening('hi-IN', {});
    const first = recognizer;
    await startListening('en-IN', {});
    expect(first.abort).toHaveBeenCalled();
    expect(recognizer).not.toBe(first);
  });

  it('stop keeps what was heard; cancel throws it away; teardown releases it', async () => {
    install();
    const { startListening, stopListening, cancelListening, teardownVoice } =
      await load();
    await startListening('hi-IN', {});
    await stopListening();
    expect(recognizer.stop).toHaveBeenCalled();
    expect(recognizer.abort).not.toHaveBeenCalled();

    await cancelListening();
    expect(recognizer.abort).toHaveBeenCalledTimes(1);
    await cancelListening(); // nothing running: harmless

    await startListening('hi-IN', {});
    const running = recognizer;
    await teardownVoice();
    expect(running.abort).toHaveBeenCalled();
  });

  describe('microphone permission', () => {
    afterEach(() => {
      delete navigator.mediaDevices;
    });

    it('is granted when the browser allows the microphone, and the test stream is released', async () => {
      const stop = vi.fn();
      Object.defineProperty(navigator, 'mediaDevices', {
        value: {
          getUserMedia: vi
            .fn()
            .mockResolvedValue({ getTracks: () => [{ stop }, { stop }] }),
        },
        configurable: true,
      });
      const { requestMicPermission } = await load();
      await expect(requestMicPermission()).resolves.toBe(true);
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
        audio: true,
      });
      expect(stop).toHaveBeenCalledTimes(2);
    });

    it('is refused when the student says no', async () => {
      Object.defineProperty(navigator, 'mediaDevices', {
        value: {
          getUserMedia: vi
            .fn()
            .mockRejectedValue(new DOMException('no', 'NotAllowedError')),
        },
        configurable: true,
      });
      const { requestMicPermission } = await load();
      await expect(requestMicPermission()).resolves.toBe(false);
    });

    it('is refused where the browser has no media access at all', async () => {
      const { requestMicPermission } = await load();
      await expect(requestMicPermission()).resolves.toBe(false);
    });
  });
});
