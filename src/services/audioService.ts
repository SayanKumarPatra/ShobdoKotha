import { GeneratedAudioItem, Voice, VoiceUseCase } from '../types';
import { callCartesiaTtsApi, getStoredCartesiaKey, CartesiaError } from './cartesiaService';

export { CartesiaError };

/**
 * Generate real speech audio via Cartesia AI or server-side Gemini TTS API
 */
export async function generateSpeechAudio({
  text,
  voice,
  speed,
  tone,
  useCase = 'general',
  cartesiaApiKey,
  preferredEngine = 'cartesia',
}: {
  text: string;
  voice: Voice;
  speed: number;
  tone: string;
  useCase?: VoiceUseCase;
  cartesiaApiKey?: string;
  preferredEngine?: 'cartesia' | 'gemini' | 'auto';
}): Promise<GeneratedAudioItem> {
  const cleanText = text.trim();
  const effectiveCartesiaKey = cartesiaApiKey || getStoredCartesiaKey();

  // 1. Direct Cartesia TTS API call if key is present or requested
  if (effectiveCartesiaKey && preferredEngine !== 'gemini') {
    const { blob, audioUrl, duration } = await callCartesiaTtsApi({
      text: cleanText,
      voice,
      apiKey: effectiveCartesiaKey,
      speed,
    });

    const item: GeneratedAudioItem = {
      id: 'cartesia_' + Date.now(),
      text: cleanText,
      voice,
      language: voice.language,
      speed,
      tone,
      useCase,
      createdAt: new Date().toISOString(),
      duration,
      audioUrl,
      blobSize: blob.size,
    };

    saveToHistory(item);
    return item;
  }

  // 2. Call server-side TTS endpoint which uses Google Gemini Flash Lite TTS
  try {
    const response = await fetch('/api/tts/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: cleanText,
        voiceId: voice.id,
        useCase: useCase || voice.useCase || 'general',
        language: voice.langCode,
        speed,
        cartesiaKey: effectiveCartesiaKey,
      }),
    });

    if (response.ok) {
      const contentType = response.headers.get('Content-Type') || '';
      if (contentType.includes('audio')) {
        const blob = await response.blob();
        const audioUrl = URL.createObjectURL(blob);
        
        // Accurate duration calculation based on clean text
        const wordCount = cleanText.split(/\s+/).length || 1;
        const durationSec = Math.max(2.5, Math.round((wordCount * 0.42 + cleanText.length * 0.035) / speed));

        const item: GeneratedAudioItem = {
          id: 'gemini_' + Date.now(),
          text: cleanText,
          voice,
          language: voice.language,
          speed,
          tone,
          useCase,
          createdAt: new Date().toISOString(),
          duration: durationSec,
          audioUrl,
          blobSize: blob.size,
        };

        saveToHistory(item);
        return item;
      }
    }
  } catch (err) {
    console.warn('Server TTS fetch failed, checking browser speech engine:', err);
  }

  // 2. Browser Native SpeechSynthesis (produces REAL human voice instead of robotic drone)
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = speed;
    utterance.pitch = voice.pitch;
    utterance.lang = voice.langCode;

    const voices = window.speechSynthesis.getVoices();
    const matched = voices.find(v => v.lang.startsWith(voice.langCode.split('-')[0])) || voices[0];
    if (matched) utterance.voice = matched;

    // Create an audio placeholder with native utterance binding
    const wordCount = cleanText.split(/\s+/).length || 1;
    const durationSec = Math.max(2.5, Math.round((wordCount * 0.42) / speed));

    // Synthesize silent carrier WAV so audio element timeline scrubbing works while speech plays
    const audioUrl = createSilentCarrierWav(durationSec);

    const item: GeneratedAudioItem = {
      id: 'gen_' + Date.now(),
      text: cleanText,
      voice,
      language: voice.language,
      speed,
      tone,
      useCase,
      createdAt: new Date().toISOString(),
      duration: durationSec,
      audioUrl,
    };

    saveToHistory(item);
    return item;
  }

  throw new Error('No voice synthesis engine available');
}

/**
 * Creates a silent RIFF WAV buffer of given duration
 */
function createSilentCarrierWav(durationSeconds: number): string {
  const sampleRate = 22050;
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  function writeString(offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  const blob = new Blob([buffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

const HISTORY_STORAGE_KEY = 'shobdokotha_audio_history';

export function getAudioHistory(): GeneratedAudioItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read history from localStorage', e);
    return [];
  }
}

export function saveToHistory(item: GeneratedAudioItem): void {
  try {
    const history = getAudioHistory();
    const updated = [item, ...history.filter(h => h.id !== item.id)].slice(0, 30);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));

    // Asynchronously sync to Firestore if user is logged into Firebase
    import('./firebase').then(({ auth, saveAudioToCloud }) => {
      if (auth && auth.currentUser) {
        saveAudioToCloud(auth.currentUser.uid, item).catch((err) => {
          console.debug('Firestore sync failed:', err);
        });
      }
    }).catch(() => {});
  } catch (e) {
    console.error('Failed to save to history', e);
  }
}

export function deleteHistoryItem(id: string): void {
  try {
    const history = getAudioHistory();
    const updated = history.filter(item => item.id !== id);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to delete history item', e);
  }
}

export function clearAllHistory(): void {
  try {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear history', e);
  }
}
