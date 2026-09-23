const DEFAULT_SETTINGS = {
  lang: 'es-AR',
  rate: 0.92,
  pitch: 1,
  volume: 1,
};

let cachedVoice = null;
let voicesListenerInstalled = false;

function speechSynthesisInstance() {
  return typeof window !== 'undefined' ? window.speechSynthesis : null;
}

function availableVoices() {
  return speechSynthesisInstance()?.getVoices?.() || [];
}

function isSpanish(voice) {
  return String(voice?.lang || '').toLowerCase().startsWith('es');
}

function isArgentineSpanish(voice) {
  return String(voice?.lang || '').toLowerCase() === 'es-ar';
}

export function getAvailableSpanishVoices() {
  return availableVoices().filter(isSpanish);
}

export function getPreferredVoice() {
  const voices = availableVoices();
  const elena = voices.find((voice) => isArgentineSpanish(voice) && /elena/i.test(voice.name)) || null;
  cachedVoice = cachedVoice && voices.includes(cachedVoice) && isArgentineSpanish(cachedVoice) && /elena/i.test(cachedVoice.name)
    ? cachedVoice
    : elena;
  return cachedVoice;
}

function installVoicesListener() {
  const synthesis = speechSynthesisInstance();
  if (!synthesis || voicesListenerInstalled) return;
  voicesListenerInstalled = true;
  synthesis.addEventListener?.('voiceschanged', () => {
    cachedVoice = null;
    const voice = getPreferredVoice();
    if (import.meta.env.DEV && voice) {
      console.debug('[Azul TTS] Preferred voice:', {
        name: voice.name,
        lang: voice.lang,
        localService: voice.localService,
      });
    }
  });
}

export function isSupported() {
  return Boolean(speechSynthesisInstance() && typeof window.SpeechSynthesisUtterance === 'function');
}

export function speak(text, options = {}) {
  const synthesis = speechSynthesisInstance();
  if (!synthesis || typeof window.SpeechSynthesisUtterance !== 'function') return null;
  installVoicesListener();
  synthesis.cancel();
  const { onstart, onend, onerror, ...speechSettings } = options;
  const normalizedText = String(text || '').trim();
  const utterance = new window.SpeechSynthesisUtterance(normalizedText);
  const settings = { ...DEFAULT_SETTINGS, ...speechSettings };
  const acronymLetterSequence = /\bB\s+B\s+V\s+A\b|\bBBVA\b|\bbeh-beh-úve-a\b/i.test(normalizedText);
  utterance.lang = settings.lang;
  utterance.rate = acronymLetterSequence ? 0.91 : settings.rate;
  utterance.pitch = acronymLetterSequence ? 0.96 : settings.pitch;
  utterance.volume = settings.volume;
  const voice = getPreferredVoice();
  if (!voice) return null;
  utterance.voice = voice;
  utterance.onstart = onstart;
  utterance.onend = onend;
  utterance.onerror = onerror;
  synthesis.speak(utterance);
  return utterance;
}

export function stop() {
  speechSynthesisInstance()?.cancel?.();
}

export function createBrowserSpeechPlayer({ onPlaying, onFinished } = {}) {
  let activeUtterance = null;

  const finish = (reason) => {
    activeUtterance = null;
    onFinished?.(reason);
  };

  return {
    play(text) {
      const speechText = String(text || '').trim();
      if (!speechText || !isSupported()) return;
      stop();
      const utterance = speak(speechText, {
        onstart: () => onPlaying?.(true),
        onend: () => finish('ended'),
        onerror: () => finish('error'),
      });
      if (!utterance) return;
      activeUtterance = utterance;
    },
    stop() {
      stop();
      finish('cancelled');
    },
  };
}
