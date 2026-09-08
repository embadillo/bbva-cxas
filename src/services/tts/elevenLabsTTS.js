import { runtime } from '../../config/runtime';
import { cleanTextForTTS } from './speechNormalization';

export function createElevenLabsPlayer({ onPlaying, onFinished } = {}) {
  let requestId = 0;
  let controller = null;
  let audio = null;
  const objectUrls = new Set();

  const stop = () => {
    requestId += 1;
    controller?.abort();
    controller = null;
    if (audio) { audio.pause(); audio.src = ''; audio = null; }
    objectUrls.forEach((url) => URL.revokeObjectURL(url));
    objectUrls.clear();
    onFinished?.();
  };

  const play = async (text) => {
    const speechText = cleanTextForTTS(text, { locale: 'es-AR', currency: 'ARS' });
    if (!speechText || !runtime.ttsEndpoint) return;
    stop();
    const currentId = requestId;
    controller = new AbortController();
    onPlaying?.(true);
    try {
      const response = await fetch(runtime.ttsEndpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: speechText }), signal: controller.signal,
      });
      if (!response.ok) throw new Error(`TTS HTTP ${response.status}`);
      const url = URL.createObjectURL(await response.blob());
      objectUrls.add(url);
      if (currentId !== requestId) return;
      audio = new Audio(url);
      audio.onended = () => { URL.revokeObjectURL(url); objectUrls.delete(url); audio = null; onFinished?.(); };
      audio.onerror = () => { URL.revokeObjectURL(url); objectUrls.delete(url); audio = null; onFinished?.(); };
      await audio.play();
    } catch (error) {
      if (error.name !== 'AbortError') console.warn('[BBVA TTS] unavailable', error.message);
      onFinished?.();
    } finally {
      controller = null;
    }
  };

  return { play, stop };
}
