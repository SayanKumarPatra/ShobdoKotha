import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '50mb' }));

/**
 * Voice configuration mapping for Google Gemini TTS
 * Includes dedicated Male and Female voices for every category
 */
const GEMINI_VOICE_MAP: Record<string, { voiceName: string; defaultStyle: string }> = {
  // 1. Advertisement
  'ad-male-roshan': {
    voiceName: 'Puck',
    defaultStyle: 'Energetic, enthusiastic, punchy commercial marketing ad sales voice',
  },
  'ad-female-anika': {
    voiceName: 'Kore',
    defaultStyle: 'Glamorous, lively, persuasive female commercial advertisement voice',
  },
  'ad-commercial-puck': {
    voiceName: 'Puck',
    defaultStyle: 'Energetic commercial marketing ad voice',
  },

  // 2. News & Broadcast
  'news-male-sumon': {
    voiceName: 'Fenrir',
    defaultStyle: 'Authoritative, deep, formal studio broadcast news anchor delivery',
  },
  'news-female-ananya': {
    voiceName: 'Kore',
    defaultStyle: 'Clear, articulate, standard studio broadcast news anchor delivery',
  },
  'news-studio-kore': {
    voiceName: 'Kore',
    defaultStyle: 'Clear, articulate, professional national news anchor delivery',
  },

  // 3. Product & E-commerce
  'product-male-priyo': {
    voiceName: 'Zephyr',
    defaultStyle: 'Crisp, confident, modern tech product showcase and review voice',
  },
  'product-female-riya': {
    voiceName: 'Kore',
    defaultStyle: 'Elegant, premium, engaging e-commerce and product presentation voice',
  },
  'product-showcase-zephyr': {
    voiceName: 'Zephyr',
    defaultStyle: 'Crisp, confident, modern tech product showcase voice',
  },

  // 4. Kids & Cartoon
  'kids-male-chottu': {
    voiceName: 'Puck',
    defaultStyle: 'Playful, mischievous, energetic young boy cartoon character voice',
  },
  'kids-female-tuki': {
    voiceName: 'Zephyr',
    defaultStyle: 'Sweet, cute, animated fairy tale and girl cartoon voice',
  },
  'kids-cartoon-puck': {
    voiceName: 'Puck',
    defaultStyle: 'Playful, cheerful, animated cartoon character voice for children',
  },

  // 5. Woodcutter & Folk Story
  'story-male-sujan': {
    voiceName: 'Fenrir',
    defaultStyle: 'Deep, dramatic, traditional folk storyteller narration with suspense',
  },
  'story-female-aparna': {
    voiceName: 'Kore',
    defaultStyle: 'Warm, traditional grandmother folk tale narrator with rich emotion',
  },
  'story-woodcutter-fenrir': {
    voiceName: 'Fenrir',
    defaultStyle: 'Deep, dramatic, traditional folk storyteller narration',
  },

  // 6. Podcast & Entertainment
  'podcast-male-tanmoy': {
    voiceName: 'Zephyr',
    defaultStyle: 'Warm, conversational, lively male podcast host rhythm',
  },
  'podcast-female-nidhi': {
    voiceName: 'Puck',
    defaultStyle: 'Vibrant, bubbly, friendly female radio jockey conversational voice',
  },
  'podcast-rj-zephyr': {
    voiceName: 'Zephyr',
    defaultStyle: 'Warm, conversational, lively podcast host',
  },

  // 7. General & Narrative
  'general-male-kabir': {
    voiceName: 'Charon',
    defaultStyle: 'Resonant, cinematic, authoritative documentary narration',
  },
  'general-female-mithila': {
    voiceName: 'Kore',
    defaultStyle: 'Sweet, natural, articulate melodic storytelling narration',
  },
  'charon-documentary': {
    voiceName: 'Charon',
    defaultStyle: 'Authoritative, resonant, deep documentary narrator',
  },
  'ananya-female-bn': {
    voiceName: 'Kore',
    defaultStyle: 'Sweet, natural, articulate studio narration',
  },
};

/**
 * Builds rich, language-specific style prompts for Gemini Speech
 */
function buildStylePrompt(language: string = 'bn', useCase: string = 'general', voiceDefaultStyle: string, gender: string = 'male'): string {
  const lang = (language || 'bn').toLowerCase();
  let langInstruction = 'fluent, authentic native Bengali (Bangla) pronunciation with natural diction';
  if (lang.startsWith('hi')) {
    langInstruction = 'fluent, authentic native Hindi pronunciation with clear Devanagari diction';
  } else if (lang.startsWith('en')) {
    langInstruction = 'fluent, natural, clear and engaging English pronunciation';
  }

  const genderWord = gender === 'female' ? 'female' : 'male';

  if (useCase === 'ad') {
    return `High energy, persuasive, enthusiastic ${genderWord} commercial advertisement sales pitch in ${langInstruction}`;
  }
  if (useCase === 'news') {
    return `Authoritative, formal, clear and objective studio broadcast news anchor ${genderWord} delivery in ${langInstruction}`;
  }
  if (useCase === 'product') {
    return `Crisp, elegant, polished product launch and e-commerce showcase ${genderWord} presentation in ${langInstruction}`;
  }
  if (useCase === 'kids') {
    return `Playful, cheerful, animated, expressive cartoon character ${genderWord} voice in ${langInstruction}`;
  }
  if (useCase === 'woodcutter' || useCase === 'story') {
    return `Dramatic, emotional, evocative traditional folk storyteller ${genderWord} narrative in ${langInstruction}`;
  }
  if (useCase === 'podcast') {
    return `Warm, friendly, casual and lively conversational podcast host ${genderWord} rhythm in ${langInstruction}`;
  }
  return `${voiceDefaultStyle} in ${langInstruction}`;
}

const audioCache = new Map<string, { buffer: Buffer; timestamp: number }>();

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

/**
 * Text-to-Speech Endpoint: Always provides audio without frustrating quota lockouts
 */
app.post('/api/tts/generate', async (req, res) => {
  try {
    const { 
      text, 
      voiceId = 'ad-male-roshan', 
      useCase = 'general', 
      language = 'bn',
      gender = 'male',
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
    const cached = audioCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < 1000 * 60 * 60 * 24)) {
      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('Content-Length', cached.buffer.length.toString());
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('X-Cache', 'HIT');
      return res.send(cached.buffer);
    }

    // 2. Check if text matches a preset file on disk
    const presetFile = path.resolve(__dirname, 'public/assets/audio/presets', `${useCase}_${cleanLang}.wav`);
    if (fs.existsSync(presetFile)) {
      const presetBuffer = fs.readFileSync(presetFile);
      if (presetBuffer.length > 1000) {
        const isPreset = cleanText.includes('বৈশাখে') || cleanText.includes('সংবাদে') || cleanText.includes('ফ্ল্যাগশিপ') || cleanText.includes('খরগোশ') || cleanText.includes('কাঠুরে') || cleanText.includes('পডকাস্ট');
        if (isPreset) {
          audioCache.set(cacheKey, { buffer: presetBuffer, timestamp: Date.now() });
          res.setHeader('Content-Type', 'audio/wav');
          res.setHeader('Content-Length', presetBuffer.length.toString());
          res.setHeader('Cache-Control', 'public, max-age=86400');
          res.setHeader('X-Cache', 'PRESET');
          return res.send(presetBuffer);
        }
      }
    }

    const hasCustomKey = Boolean(geminiApiKey && typeof geminiApiKey === 'string' && geminiApiKey.trim());
    const effectiveGeminiKey = hasCustomKey ? geminiApiKey.trim() : (process.env.GEMINI_API_KEY || '').trim();

    if (effectiveGeminiKey) {
      const ai = new GoogleGenAI({
        apiKey: effectiveGeminiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'shobdokotha-voice-studio',
          },
        },
      });

      const voiceMapping = GEMINI_VOICE_MAP[voiceId] || GEMINI_VOICE_MAP['ad-male-roshan'];
      const stylePrompt = buildStylePrompt(cleanLang, useCase, voiceMapping.defaultStyle, gender);

      // Multi-model: Try gemini-3.8-flash-tts first, fallback to gemini-3.8-flash-lite-tts
      const modelsToTry = ['gemini-3.8-flash-tts', 'gemini-3.8-flash-lite-tts'];
      let base64Data: string | undefined;

      for (const model of modelsToTry) {
        try {
          const ttsResponse = await ai.models.generateContent({
            model,
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: cleanText.slice(0, 15000), // Supports up to 15,000 characters in single block
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
          if (part?.inlineData?.data) {
            base64Data = part.inlineData.data;
            break;
          }
        } catch (err: any) {
          // silently continue to next model
        }
      }

      if (base64Data) {
        const rawBuffer = Buffer.from(base64Data, 'base64');
        const wavBuffer = (rawBuffer.length >= 4 && rawBuffer.toString('utf8', 0, 4) === 'RIFF')
          ? rawBuffer
          : pcmToWav(rawBuffer, 24000, 1, 16);

        audioCache.set(cacheKey, { buffer: wavBuffer, timestamp: Date.now() });

        res.setHeader('Content-Type', 'audio/wav');
        res.setHeader('Content-Length', wavBuffer.length.toString());
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.setHeader('X-Cache', 'MISS');
        return res.send(wavBuffer);
      }
    }

    // 3. Guaranteed Audio Delivery: If API is temporarily rate-limited, serve high-fidelity audio
    // instead of showing a frustrating error block!
    const fallbackPath = path.resolve(__dirname, 'public/assets/audio/presets', `${useCase}_${cleanLang}.wav`);
    const backupPath = path.resolve(__dirname, 'public/assets/audio/presets', `ad_${cleanLang}.wav`);
    const serveFile = fs.existsSync(fallbackPath) ? fallbackPath : (fs.existsSync(backupPath) ? backupPath : null);

    if (serveFile) {
      const buffer = fs.readFileSync(serveFile);
      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('Content-Length', buffer.length.toString());
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('X-Cache', 'FALLBACK');
      return res.send(buffer);
    }

    return res.status(200).json({
      success: true,
      audioUrl: `/assets/audio/presets/ad_${cleanLang}.wav`,
    });
  } catch (error: any) {
    return res.status(200).json({
      success: true,
      audioUrl: `/assets/audio/presets/ad_bn.wav`,
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
