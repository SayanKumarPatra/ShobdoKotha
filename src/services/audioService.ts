import { GeneratedAudioItem, Voice, VoiceUseCase, SupportedLanguageCode } from '../types';

export function getStoredGeminiKey(): string | null {
  try {
    const key = localStorage.getItem('shobdokotha_gemini_key') || '';
    return key.trim() || null;
  } catch {
    return null;
  }
}

export function setStoredGeminiKey(key: string): void {
  try {
    const trimmed = key.trim();
    if (trimmed) {
      localStorage.setItem('shobdokotha_gemini_key', trimmed);
    } else {
      localStorage.removeItem('shobdokotha_gemini_key');
    }
  } catch (e) {
    console.warn('Could not store Gemini key in localStorage', e);
  }
}

/**
 * Validates text input before speech generation
 */
export function validateTtsInput(text: string): { isValid: boolean; errorMessage?: string } {
  const trimmed = text ? text.trim() : '';
  if (!trimmed) {
    return {
      isValid: false,
      errorMessage: 'অনুগ্রহ করে কিছু টেক্সট লিখুন। টেক্সট ছাড়া ভয়েস তৈরি করা সম্ভব নয়।',
    };
  }

  if (trimmed.length > 5000) {
    return {
      isValid: false,
      errorMessage: 'টেক্সটের দৈর্ঘ্য অনেক বেশি (সর্বোচ্চ ৫০০০ অক্ষর অনুমোদিত)। অনুগ্রহ করে সংক্ষেপ করুন।',
    };
  }

  return { isValid: true };
}

// Client-side cache for voice preview blobs to prevent repeat API calls
const previewBlobCache = new Map<string, string>();
let currentPreviewAudio: HTMLAudioElement | null = null;

/**
 * Plays a real AI voice audition clip directly using Gemini TTS audio
 */
export async function playRealVoicePreview({
  text,
  voice,
  languageCode = 'bn',
  useCase = 'general',
  onStart,
  onEnd,
  onError,
}: {
  text: string;
  voice: Voice;
  languageCode: SupportedLanguageCode;
  useCase?: VoiceUseCase;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: Error) => void;
}): Promise<void> {
  // Stop any currently playing preview
  if (currentPreviewAudio) {
    currentPreviewAudio.pause();
    currentPreviewAudio.currentTime = 0;
    currentPreviewAudio = null;
  }

  const cleanText = text.trim();
  const cacheKey = `${languageCode}_${useCase}_${voice.id}_${cleanText}`;

  try {
    let audioUrl = previewBlobCache.get(cacheKey);

    if (!audioUrl) {
      const effectiveKey = getStoredGeminiKey();
      const response = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: cleanText,
          voiceId: voice.id,
          useCase: useCase || voice.useCase || 'general',
          language: languageCode,
          geminiApiKey: effectiveKey || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const msg = errorData.userMessage || errorData.error || 'প্রিভিউ অডিও আনতে সমস্যা হয়েছে';
        throw new Error(msg);
      }

      const blob = await response.blob();
      audioUrl = URL.createObjectURL(blob);
      previewBlobCache.set(cacheKey, audioUrl);
    }

    const audio = new Audio(audioUrl);
    currentPreviewAudio = audio;

    audio.onplay = () => {
      if (onStart) onStart();
    };

    audio.onended = () => {
      if (currentPreviewAudio === audio) {
        currentPreviewAudio = null;
      }
      if (onEnd) onEnd();
    };

    audio.onerror = () => {
      if (currentPreviewAudio === audio) {
        currentPreviewAudio = null;
      }
      if (onError) onError(new Error('অডিও প্লে করতে ব্যর্থ হয়েছে'));
    };

    await audio.play();
  } catch (err: any) {
    console.warn('Real preview failed:', err);
    if (onError) onError(err);
  }
}

/**
 * Quick speaker sound test using real voice audition
 */
export function playAudiblePreview(text: string, voice?: Voice): void {
  const defaultVoice = voice || {
    id: 'news-studio-kore',
    name: 'Ananya',
    bengaliName: 'অনন্যা',
    gender: 'female',
    category: 'female',
    categoryLabel: 'নারী কণ্ঠ',
    useCase: 'news',
    useCaseLabel: 'সংবাদ ও বুলেটিন',
    avatar: '👩‍💼',
    description: 'Articulate news voice',
    bengaliDescription: 'পেশাদার সংবাদ উপস্থাপিকা',
    sampleTexts: { bn: text, hi: text, en: text },
    pitch: 1.05,
    rate: 1.0,
  } as Voice;

  playRealVoicePreview({
    text: text || 'শব্দকথা স্টুডিওতে আপনার সাউন্ড সফলভাবে কাজ করছে।',
    voice: defaultVoice,
    languageCode: 'bn',
    useCase: 'news',
  });
}

/**
 * Stops any active preview audio
 */
export function stopVoicePreview(): void {
  if (currentPreviewAudio) {
    currentPreviewAudio.pause();
    currentPreviewAudio.currentTime = 0;
    currentPreviewAudio = null;
  }
}

/**
 * Generate real speech audio via Google Gemini API
 */
export async function generateSpeechAudio({
  text,
  voice,
  speed = 1.0,
  tone = 'সাধারণ',
  useCase = 'general',
  languageCode = 'bn',
  languageLabel = 'বাংলা (Bengali)',
  geminiApiKey,
}: {
  text: string;
  voice: Voice;
  speed: number;
  tone: string;
  useCase?: VoiceUseCase;
  languageCode: SupportedLanguageCode;
  languageLabel?: string;
  geminiApiKey?: string;
}): Promise<GeneratedAudioItem> {
  const cleanText = text.trim();
  const effectiveKey = geminiApiKey || getStoredGeminiKey();

  const response = await fetch('/api/tts/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: cleanText,
      voiceId: voice.id,
      useCase: useCase || voice.useCase || 'general',
      language: languageCode,
      speed,
      geminiApiKey: effectiveKey || undefined,
    }),
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    const userMsg = errorJson.userMessage || errorJson.error || 'ভয়েস জেনারেট করতে সমস্যা হয়েছে, অনুগ্রহ করে পুনরায় চেষ্টা করুন।';
    const err = new Error(userMsg);
    (err as any).isQuota = errorJson.isQuota;
    (err as any).requiresKey = errorJson.requiresKey;
    throw err;
  }

  const contentType = response.headers.get('Content-Type') || '';
  if (!contentType.includes('audio')) {
    const json = await response.json().catch(() => ({}));
    throw new Error(json.userMessage || 'সার্ভার থেকে সঠিক অডিও ডেটা পাওয়া যায়নি।');
  }

  const blob = await response.blob();
  const audioUrl = URL.createObjectURL(blob);
  
  const wordCount = cleanText.split(/\s+/).length || 1;
  const durationSec = Math.max(2.5, Math.round((wordCount * 0.45 + cleanText.length * 0.035) / speed));

  const item: GeneratedAudioItem = {
    id: 'gemini_' + Date.now(),
    text: cleanText,
    voice,
    language: languageLabel || 'বাংলা (Bengali)',
    languageCode,
    speed,
    tone,
    useCase,
    createdAt: new Date().toISOString(),
    duration: durationSec,
    audioUrl,
    blobSize: blob.size,
    engine: 'gemini',
  };

  saveToHistory(item);
  return item;
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
