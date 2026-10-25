import { GoogleGenAI } from '@google/genai';
import crypto from 'crypto';

const GEMINI_VOICE_MAP: Record<string, { voiceName: string; defaultStyle: string }> = {
  'ad-commercial-puck': {
    voiceName: 'Puck',
    defaultStyle: 'Energetic, enthusiastic and persuasive commercial marketing ad voice',
  },
  'news-studio-kore': {
    voiceName: 'Kore',
    defaultStyle: 'Clear, articulate, professional national news anchor delivery',
  },
  'product-showcase-zephyr': {
    voiceName: 'Zephyr',
    defaultStyle: 'Crisp, confident, modern tech product showcase and review voice',
  },
  'kids-cartoon-puck': {
    voiceName: 'Puck',
    defaultStyle: 'Playful, cheerful, animated cartoon character voice for children',
  },
  'story-woodcutter-fenrir': {
    voiceName: 'Fenrir',
    defaultStyle: 'Deep, dramatic, traditional folk storyteller narration with emotional suspense',
  },
  'podcast-rj-zephyr': {
    voiceName: 'Zephyr',
    defaultStyle: 'Warm, conversational, lively podcast host and audio conversationalist',
  },
  'charon-documentary': {
    voiceName: 'Charon',
    defaultStyle: 'Authoritative, resonant, deep documentary narrator',
  },
  'ananya-female-bn': {
    voiceName: 'Kore',
    defaultStyle: 'Sweet, natural, articulate melodic narration in standard pronunciation',
  },
};

/**
 * Builds rich, language-specific style prompts for Gemini Speech
 */
function buildStylePrompt(language: string = 'bn', useCase: string = 'general', voiceDefaultStyle: string): string {
  const lang = (language || 'bn').toLowerCase();
  let langInstruction = 'fluent, authentic native Bengali (Bangla) pronunciation with natural diction';
  if (lang.startsWith('hi')) {
    langInstruction = 'fluent, authentic native Hindi pronunciation with clear Devanagari diction';
  } else if (lang.startsWith('en')) {
    langInstruction = 'fluent, natural, clear and engaging English pronunciation';
  }

  if (useCase === 'ad') {
    return `High energy, persuasive, enthusiastic commercial advertisement sales pitch in ${langInstruction}`;
  }
  if (useCase === 'news') {
    return `Authoritative, formal, clear and objective studio broadcast news anchor delivery in ${langInstruction}`;
  }
  if (useCase === 'product') {
    return `Crisp, elegant, polished product launch and e-commerce showcase presentation in ${langInstruction}`;
  }
  if (useCase === 'kids') {
    return `Playful, cheerful, animated, expressive cartoon character and children's story voice in ${langInstruction}`;
  }
  if (useCase === 'woodcutter' || useCase === 'story') {
    return `Dramatic, emotional, evocative traditional folk storyteller narrative in ${langInstruction}`;
  }
  if (useCase === 'podcast') {
    return `Warm, friendly, casual and lively conversational podcast host rhythm in ${langInstruction}`;
  }
  return `${voiceDefaultStyle} in ${langInstruction}`;
}

/**
 * Global audio cache across warm serverless container invocations
 */
const vercelAudioCache = new Map<string, { buffer: Buffer; timestamp: number }>();

function getCacheKey(text: string, voiceId: string, useCase: string, language: string): string {
  const raw = `${language}_${useCase}_${voiceId}_${text.trim()}`;
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function pcmToWav(pcmBuffer: Buffer, sampleRate = 24000, channels = 1, bitDepth = 16): Buffer {
  const byteRate = sampleRate * channels * (bitDepth / 8);
  const blockAlign = channels * (bitDepth / 8);
  const header = Buffer.alloc(44);

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcmBuffer.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitDepth, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcmBuffer.length, 40);

  return Buffer.concat([header, pcmBuffer]);
}

export default async function handler(req: any, res: any) {
  // CORS Headers for Vercel deployments
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      text, 
      voiceId = 'ad-commercial-puck', 
      useCase = 'general', 
      language = 'bn',
      geminiApiKey 
    } = req.body || {};

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ 
        error: 'Text transcript is required',
        userMessage: 'অনুগ্রহ করে ভয়েস তৈরির জন্য টেক্সট লিখুন।' 
      });
    }

    const cleanText = text.trim();
    const cleanLang = (language || 'bn').toLowerCase().startsWith('hi') 
      ? 'hi' 
      : (language || 'bn').toLowerCase().startsWith('en') 
        ? 'en' 
        : 'bn';

    // 1. Check in-memory cache
    const cacheKey = getCacheKey(cleanText, voiceId, useCase, cleanLang);
    const cached = vercelAudioCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < 1000 * 60 * 60 * 24)) {
      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('Content-Length', cached.buffer.length.toString());
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('X-Cache', 'HIT');
      return res.status(200).send(cached.buffer);
    }

    // 2. Resolve Gemini API Key (Vercel env var or client user key)
    const effectiveGeminiKey = (geminiApiKey && typeof geminiApiKey === 'string' && geminiApiKey.trim())
      ? geminiApiKey.trim()
      : (process.env.GEMINI_API_KEY || '').trim();

    if (!effectiveGeminiKey) {
      return res.status(401).json({
        requiresKey: true,
        error: 'No Gemini API key available on Vercel',
        userMessage: 'কোনো Gemini API Key পাওয়া যায়নি। দয়া করে আপনার নিজস্ব ফ্রি Gemini API Key প্রদান করুন অথবা Vercel-এ GEMINI_API_KEY সেট করুন।',
      });
    }

    const ai = new GoogleGenAI({
      apiKey: effectiveGeminiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'shobdokotha-voice-studio',
        },
      },
    });

    const voiceMapping = GEMINI_VOICE_MAP[voiceId] || GEMINI_VOICE_MAP['ad-commercial-puck'];
    const stylePrompt = buildStylePrompt(cleanLang, useCase, voiceMapping.defaultStyle);

    const ttsResponse = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: cleanText,
              speechMetadata: {
                style: stylePrompt,
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceMapping.voiceName },
          },
        },
      },
    });

    const base64Data = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Data) {
      return res.status(502).json({
        error: 'Gemini TTS did not return audio data',
        userMessage: 'অডিও তৈরি হতে সমস্যা হয়েছে, অনুগ্রহ করে আবার চেষ্টা করুন।',
      });
    }

    const rawBuffer = Buffer.from(base64Data, 'base64');
    
    // Ensure WAV RIFF header
    let wavBuffer: Buffer;
    if (rawBuffer.length >= 4 && rawBuffer.toString('utf8', 0, 4) === 'RIFF') {
      wavBuffer = rawBuffer;
    } else {
      wavBuffer = pcmToWav(rawBuffer, 24000, 1, 16);
    }

    vercelAudioCache.set(cacheKey, { buffer: wavBuffer, timestamp: Date.now() });

    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Content-Length', wavBuffer.length.toString());
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('X-Cache', 'MISS');
    return res.status(200).send(wavBuffer);
  } catch (error: any) {
    const errorMsg = error?.message || '';
    const isQuota = typeof errorMsg === 'string' && (errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED') || errorMsg.includes('Quota exceeded'));

    console.error('Vercel API TTS error:', errorMsg);

    return res.status(isQuota ? 429 : 500).json({
      isQuota,
      error: errorMsg,
      userMessage: isQuota 
        ? 'ফ্রি এপিআই কোটা সাময়িক পূর্ণ হয়েছে (RPM লিমিট)। কয়েক সেকেন্ড পর আবার চেষ্টা করুন, অথবা আনলিমিটেড ভয়েস পেতে আপনার নিজস্ব ফ্রি Gemini API Key দিন।'
        : 'ভয়েস জেনারেট করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।',
    });
  }
}
