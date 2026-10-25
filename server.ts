import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '10mb' }));

/**
 * Voice configuration mapping for Google Gemini TTS
 */
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
 * In-memory audio cache to prevent hitting 429 rate limits for repeated scripts / previews
 */
const audioCache = new Map<string, { buffer: Buffer; timestamp: number }>();

function getCacheKey(text: string, voiceId: string, useCase: string, language: string): string {
  const raw = `${language}_${useCase}_${voiceId}_${text.trim()}`;
  return crypto.createHash('sha256').update(raw).digest('hex');
}

/**
 * Converts raw PCM audio buffer to valid RIFF WAV with proper 44-byte header
 */
function pcmToWav(pcmBuffer: Buffer, sampleRate = 24000, channels = 1, bitDepth = 16): Buffer {
  const byteRate = sampleRate * channels * (bitDepth / 8);
  const blockAlign = channels * (bitDepth / 8);
  const header = Buffer.alloc(44);

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcmBuffer.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // Subchunk 1 size (16 for PCM)
  header.writeUInt16LE(1, 20); // AudioFormat 1 = PCM
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitDepth, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcmBuffer.length, 40);

  return Buffer.concat([header, pcmBuffer]);
}

// Track temporary cooldown for environment key to prevent repeated 429 upstream rejections
let envKeyQuotaExhaustedUntil = 0;

/**
 * Google Gemini Text-to-Speech Endpoint
 * Accepts user's Google Gemini API Key directly or falls back to server environment key.
 */
app.post('/api/tts/generate', async (req, res) => {
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

    // Check in-memory cache first
    const cacheKey = getCacheKey(cleanText, voiceId, useCase, cleanLang);
    const cached = audioCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < 1000 * 60 * 60 * 24)) {
      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('Content-Length', cached.buffer.length.toString());
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('X-Cache', 'HIT');
      return res.send(cached.buffer);
    }

    const hasCustomKey = Boolean(geminiApiKey && typeof geminiApiKey === 'string' && geminiApiKey.trim());
    const effectiveGeminiKey = hasCustomKey ? geminiApiKey.trim() : (process.env.GEMINI_API_KEY || '').trim();

    if (!effectiveGeminiKey) {
      return res.status(401).json({
        requiresKey: true,
        error: 'No Gemini API key available',
        userMessage: 'কোনো Gemini API Key পাওয়া যায়নি। দয়া করে আপনার নিজস্ব ফ্রি Gemini API Key প্রদান করুন।',
      });
    }

    // Brief 25s cooldown check for shared env key if recently rate limited
    if (!hasCustomKey && Date.now() < envKeyQuotaExhaustedUntil) {
      const waitSec = Math.max(1, Math.ceil((envKeyQuotaExhaustedUntil - Date.now()) / 1000));
      return res.status(429).json({
        isQuota: true,
        waitSeconds: waitSec,
        error: 'Rate limit cooldown active',
        userMessage: `ফ্রি কোটা লিমিট চলছে। দয়া করে ${waitSec} সেকেন্ড পর আবার চেষ্টা করুন, অথবা আনলিমিটেড ভয়েস পেতে আপনার নিজস্ব ফ্রি Gemini কী দিন।`,
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

    const part = ttsResponse.candidates?.[0]?.content?.parts?.[0];
    const base64Data = part?.inlineData?.data;

    if (!base64Data) {
      return res.status(502).json({
        error: 'Gemini TTS did not return audio data',
        userMessage: 'অডিও তৈরি হতে সমস্যা হয়েছে, অনুগ্রহ করে আবার চেষ্টা করুন।',
      });
    }

    const rawBuffer = Buffer.from(base64Data, 'base64');
    
    // Check if data already has RIFF header; if raw PCM, prepend WAV header
    let wavBuffer: Buffer;
    if (rawBuffer.length >= 4 && rawBuffer.toString('utf8', 0, 4) === 'RIFF') {
      wavBuffer = rawBuffer;
    } else {
      wavBuffer = pcmToWav(rawBuffer, 24000, 1, 16);
    }

    // Cache the result
    audioCache.set(cacheKey, { buffer: wavBuffer, timestamp: Date.now() });

    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Content-Length', wavBuffer.length.toString());
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('X-Cache', 'MISS');
    return res.send(wavBuffer);
  } catch (error: any) {
    const errorMsg = error?.message || '';
    const isQuota = typeof errorMsg === 'string' && (errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED') || errorMsg.includes('Quota exceeded'));
    
    // Only set a brief 25-second cooldown for shared env key
    if (isQuota && !req.body?.geminiApiKey) {
      envKeyQuotaExhaustedUntil = Date.now() + 25 * 1000;
    }

    console.warn('TTS generation failed:', errorMsg);

    return res.status(isQuota ? 429 : 500).json({
      isQuota,
      error: errorMsg,
      userMessage: isQuota 
        ? 'ফ্রি এপিআই কোটা সাময়িক পূর্ণ হয়েছে (RPM লিমিট)। কয়েক সেকেন্ড পর আবার চেষ্টা করুন, অথবা আনলিমিটেড ভয়েস পেতে আপনার নিজস্ব ফ্রি Gemini API Key দিন।'
        : 'ভয়েস জেনারেট করতে সমস্যা হয়েছে। অনুগ্রহ করে টেক্সট চেক করে আবার চেষ্টা করুন।',
    });
  }
});

// Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`ShobdoKotha AI Voice Studio server running on http://0.0.0.0:${port}`);
  });
}

startServer();
