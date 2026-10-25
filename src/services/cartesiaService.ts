import { Voice, VoiceUseCase } from '../types';

export interface CartesiaVoiceConfig {
  voiceId: string;
  modelId: string;
  language: string;
}

// Pre-mapped Cartesia voice IDs matching our character presets
export const CARTESIA_VOICE_MAP: Record<string, string> = {
  'ad-commercial-puck': 'b7d50908-b47d-442d-85f8-842ebc2b7407', // Energetic Commercial
  'story-woodcutter-fenrir': 'ee7ea9f8-c0c1-498c-9f7b-af1277817629', // Deep Storyteller
  'news-studio-kore': 'f114a467-c40a-4db8-964d-aaba01609cfa', // Studio News Anchor
  'podcast-rj-zephyr': '2ee87190-8f84-4925-97da-e52547f9462c', // Friendly Host
  'kids-fairy-puck': 'ecd55675-29f4-4a4b-85d6-a5113dbb60fc', // Playful Child / Fairy Tale
  'charon-documentary': 'a0e99841-438c-4a64-b679-ae501e7d6091', // Resonant Documentary
  'ananya-female-bn': '79a125e8-cd45-4c13-8a67-188112f4dd22', // Natural Studio Female
  'shubho-male-bn': 'a0e99841-438c-4a64-b679-ae501e7d6091', // Natural Studio Male
};

export const DEFAULT_CARTESIA_VOICE_ID = '48b9e1de-e2fa-4914-8b32-31c437813548';

/**
 * Retrieve stored Cartesia API key from localStorage or env
 */
export function getStoredCartesiaKey(): string | null {
  try {
    const key = 
      localStorage.getItem('shobdokotha_cartesia_key') || 
      localStorage.getItem('cartesia_api_key') ||
      (import.meta as any).env?.VITE_CARTESIA_API_KEY ||
      '';
    return key.trim() || null;
  } catch (e) {
    console.warn('Unable to access localStorage for Cartesia key:', e);
    return null;
  }
}

/**
 * Saves Cartesia key to localStorage
 */
export function setStoredCartesiaKey(key: string): void {
  try {
    const trimmed = key.trim();
    if (trimmed) {
      localStorage.setItem('shobdokotha_cartesia_key', trimmed);
    } else {
      localStorage.removeItem('shobdokotha_cartesia_key');
    }
  } catch (e) {
    console.warn('Unable to save Cartesia key to localStorage:', e);
  }
}

export class CartesiaError extends Error {
  status?: number;
  code?: string;
  userMessage: string;

  constructor(message: string, userMessage: string, status?: number, code?: string) {
    super(message);
    this.name = 'CartesiaError';
    this.userMessage = userMessage;
    this.status = status;
    this.code = code;
  }
}

/**
 * Validates text input for TTS generation
 */
export function validateTtsInput(text: string): { isValid: boolean; errorMessage?: string } {
  const trimmed = text ? text.trim() : '';
  if (!trimmed) {
    return {
      isValid: false,
      errorMessage: 'অনুগ্রহ করে কিছু টেক্সট লিখুন। খালি টেক্সটে ভয়েস তৈরি করা সম্ভব নয়। (Please enter text to generate speech)',
    };
  }

  if (trimmed.length > 5000) {
    return {
      isValid: false,
      errorMessage: 'টেক্সটের দৈর্ঘ্য অনেক বেশি (সর্বোচ্চ ৫০০০ অক্ষর অনুমোদিত)। অনুগ্রহ করে টেক্সট সংক্ষেপ করুন।',
    };
  }

  return { isValid: true };
}

/**
 * Calculate accurate duration of audio buffer
 */
async function getAudioDurationFromBlob(blob: Blob, estimatedDurationSec: number): Promise<number> {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      const audioCtx = new AudioContextClass();
      const arrayBuffer = await blob.arrayBuffer();
      const decodedData = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
      const exactDuration = Math.round(decodedData.duration * 10) / 10;
      await audioCtx.close();
      if (exactDuration > 0) {
        return exactDuration;
      }
    }
  } catch (e) {
    console.debug('Direct AudioContext duration decode skipped, using estimated duration:', e);
  }
  return estimatedDurationSec;
}

/**
 * Call Cartesia TTS API (/tts/bytes) directly or via proxy
 */
export async function callCartesiaTtsApi({
  text,
  voice,
  apiKey,
  speed = 1.0,
  languageCode,
}: {
  text: string;
  voice: Voice;
  apiKey: string;
  speed?: number;
  languageCode?: string;
}): Promise<{ blob: Blob; audioUrl: string; duration: number }> {
  // 1. Validate API Key
  const cleanKey = apiKey ? apiKey.trim() : '';
  if (!cleanKey) {
    throw new CartesiaError(
      'Cartesia API Key is missing',
      'Cartesia API Key পাওয়া যায়নি। অনুগ্রহ করে আপনার Cartesia API Key যোগ করুন।',
      401,
      'MISSING_KEY'
    );
  }

  // 2. Validate Text
  const validation = validateTtsInput(text);
  if (!validation.isValid) {
    throw new CartesiaError(
      validation.errorMessage || 'Invalid text input',
      validation.errorMessage || 'অনুগ্রহ করে বৈধ টেক্সট প্রদান করুন।',
      400,
      'INVALID_TEXT'
    );
  }

  const cleanText = text.trim();
  const cartesiaVoiceId = CARTESIA_VOICE_MAP[voice.id] || DEFAULT_CARTESIA_VOICE_ID;
  const lang = languageCode || (voice.langCode ? voice.langCode.split('-')[0] : 'bn');

  const payload = {
    model_id: 'sonic-multilingual',
    transcript: cleanText,
    voice: {
      mode: 'id',
      id: cartesiaVoiceId,
    },
    output_format: {
      container: 'wav',
      encoding: 'pcm_s16le',
      sample_rate: 44100,
    },
    language: lang,
  };

  let response: Response | null = null;
  let usedProxy = false;

  // Try server proxy first to avoid browser CORS issues
  try {
    const proxyResp = await fetch('/api/cartesia/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: cleanText,
        voiceId: voice.id,
        apiKey: cleanKey,
        language: lang,
      }),
    });

    // If proxy answered (either 200 ok or formatted error response)
    if (proxyResp.status !== 404 && proxyResp.status !== 502) {
      response = proxyResp;
      usedProxy = true;
    }
  } catch (proxyError) {
    console.warn('Backend proxy unavailable, falling back to direct client fetch:', proxyError);
  }

  // If proxy was unavailable (e.g. purely static export), fallback to direct fetch
  if (!response) {
    try {
      response = await fetch('https://api.cartesia.ai/tts/bytes', {
        method: 'POST',
        headers: {
          'X-API-Key': cleanKey,
          'Cartesia-Version': '2024-06-10',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (networkError: any) {
      console.error('Network request to Cartesia failed:', networkError);
      throw new CartesiaError(
        networkError.message || 'Network error connecting to Cartesia API',
        'Cartesia সার্ভারের সাথে সংযোগ করা যায়নি। ব্রাউজার CORS বা ইন্টারনেট পরীক্ষা করুন।',
        0,
        'NETWORK_ERROR'
      );
    }
  }

  // 3. Gracefully handle HTTP Error Statuses
  if (!response.ok) {
    let errorDetail = '';
    let parsedUserMsg: string | null = null;
    try {
      const textBody = await response.text();
      try {
        const jsonBody = JSON.parse(textBody);
        if (jsonBody.userMessage) parsedUserMsg = jsonBody.userMessage;
        errorDetail = jsonBody.error || textBody;
      } catch {
        errorDetail = textBody;
      }
    } catch {
      errorDetail = response.statusText;
    }

    if (response.status === 401) {
      throw new CartesiaError(
        `Cartesia 401: ${errorDetail}`,
        parsedUserMsg || 'ভুল Cartesia API Key! অনুগ্রহ করে play.cartesia.ai থেকে সঠিক কী কপি করে দিন। (Invalid API Key)',
        401,
        'INVALID_API_KEY'
      );
    }

    if (response.status === 402 || response.status === 429) {
      throw new CartesiaError(
        `Cartesia Quota / Rate Limit (${response.status}): ${errorDetail}`,
        parsedUserMsg || 'Cartesia ব্যালেন্স বা কোটা শেষ হয়ে গেছে (Quota Exceeded)। অনুগ্রহ করে play.cartesia.ai চেক করুন।',
        response.status,
        'QUOTA_EXCEEDED'
      );
    }

    if (response.status === 400) {
      throw new CartesiaError(
        `Cartesia 400 Bad Request: ${errorDetail}`,
        parsedUserMsg || `অনুরোধে সমস্যা হয়েছে (${errorDetail.slice(0, 100)})`,
        400,
        'BAD_REQUEST'
      );
    }

    throw new CartesiaError(
      `Cartesia API error (${response.status}): ${errorDetail}`,
      parsedUserMsg || `ভয়েস জেনারেশনে ত্রুটি ঘটেছে (Error ${response.status})`,
      response.status,
      'API_ERROR'
    );
  }

  // 4. Extract and store audio binary response
  const rawBlob = await response.blob();
  const wavBlob = new Blob([rawBlob], { type: 'audio/wav' });

  // Calculate duration
  const wordCount = cleanText.split(/\s+/).length || 1;
  const estimatedDuration = Math.max(2.5, Math.round((wordCount * 0.45 + cleanText.length * 0.03) / speed));
  const finalDuration = await getAudioDurationFromBlob(wavBlob, estimatedDuration);

  const audioUrl = URL.createObjectURL(wavBlob);

  return {
    blob: wavBlob,
    audioUrl,
    duration: finalDuration,
  };
}
