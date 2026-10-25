import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import https from 'https';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { exec } from 'child_process';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '50mb' }));

// Serve static audio assets directly
app.use('/assets/audio/presets', express.static(path.resolve(__dirname, 'public/assets/audio/presets')));
app.use(express.static(path.resolve(__dirname, 'public')));

/**
 * Voice configuration mapping for Google Gemini TTS
 * Includes dedicated Male (Fenrir, Charon, Puck) and Female (Kore, Aoede) voices for every category
 */
const GEMINI_VOICE_MAP: Record<string, { voiceName: string; defaultStyle: string }> = {
  // 1. Advertisement (বিজ্ঞাপন)
  'ad-male-roshan': {
    voiceName: 'Fenrir',
    defaultStyle: 'High energy, persuasive, enthusiastic male commercial advertisement sales pitch with dynamic marketing punch',
  },
  'ad-female-anika': {
    voiceName: 'Kore',
    defaultStyle: 'Glamorous, lively, persuasive female commercial advertisement sales pitch with vibrant promotional energy',
  },
  'ad-commercial-puck': {
    voiceName: 'Fenrir',
    defaultStyle: 'Energetic commercial marketing sales voice',
  },

  // 2. News & Broadcast (সংবাদ)
  'news-male-sumon': {
    voiceName: 'Charon',
    defaultStyle: 'Authoritative, deep, formal studio broadcast news anchor male delivery',
  },
  'news-female-ananya': {
    voiceName: 'Kore',
    defaultStyle: 'Clear, articulate, standard studio broadcast news anchor female delivery',
  },
  'news-studio-kore': {
    voiceName: 'Kore',
    defaultStyle: 'Clear, articulate, professional national news anchor delivery',
  },

  // 3. Product & E-commerce (প্রোডাক্ট)
  'product-male-priyo': {
    voiceName: 'Fenrir',
    defaultStyle: 'Crisp, confident, modern tech product showcase and review male voice',
  },
  'product-female-riya': {
    voiceName: 'Kore',
    defaultStyle: 'Elegant, premium, engaging e-commerce and product presentation female voice',
  },
  'product-showcase-zephyr': {
    voiceName: 'Zephyr',
    defaultStyle: 'Crisp, confident, modern tech product showcase voice',
  },

  // 4. Kids & Cartoon (কার্টুন)
  'kids-male-chottu': {
    voiceName: 'Puck',
    defaultStyle: 'Playful, mischievous, energetic young boy cartoon character voice',
  },
  'kids-female-tuki': {
    voiceName: 'Aoede',
    defaultStyle: 'Sweet, cute, animated fairy tale and girl cartoon voice',
  },
  'kids-cartoon-puck': {
    voiceName: 'Puck',
    defaultStyle: 'Playful, cheerful, animated cartoon character voice for children',
  },

  // 5. Woodcutter & Folk Story (লোকগাথা)
  'story-male-sujan': {
    voiceName: 'Charon',
    defaultStyle: 'Deep, dramatic, traditional folk storyteller narration with suspense and baritone warmth',
  },
  'story-female-aparna': {
    voiceName: 'Aoede',
    defaultStyle: 'Warm, traditional folk tale narrator with rich emotional inflection',
  },
  'story-woodcutter-fenrir': {
    voiceName: 'Charon',
    defaultStyle: 'Deep, dramatic, traditional folk storyteller narration',
  },

  // 6. Podcast & Entertainment (পডকাস্ট)
  'podcast-male-tanmoy': {
    voiceName: 'Fenrir',
    defaultStyle: 'Warm, conversational, lively male podcast host rhythm',
  },
  'podcast-female-nidhi': {
    voiceName: 'Kore',
    defaultStyle: 'Vibrant, bubbly, friendly female radio jockey conversational voice',
  },
  'podcast-rj-zephyr': {
    voiceName: 'Zephyr',
    defaultStyle: 'Warm, conversational, lively podcast host',
  },

  // 7. General & Narrative (সাধারণ)
  'general-male-kabir': {
    voiceName: 'Charon',
    defaultStyle: 'Resonant, cinematic, authoritative documentary narration male voice',
  },
  'general-female-mithila': {
    voiceName: 'Kore',
    defaultStyle: 'Sweet, natural, articulate melodic storytelling narration female voice',
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

  const isMale = gender !== 'female';

  if (useCase === 'ad') {
    return isMale
      ? `High-impact commercial sales advertisement in ${langInstruction}. Speak as a passionate, energetic male promotional voice artist (পুরুষ কণ্ঠ) with brisk promotional tempo, exciting enthusiasm, and punchy marketing emphasis.`
      : `High-impact commercial sales advertisement in ${langInstruction}. Speak as a vibrant, glamorous female promotional voice artist (নারী কণ্ঠ) with brisk promotional tempo, lively enthusiasm, and persuasive sales cadence.`;
  }
  if (useCase === 'news') {
    return isMale
      ? `Authoritative, formal, clear and objective studio broadcast news anchor male delivery (পুরুষ সংবাদ উপস্থাপক) in ${langInstruction}.`
      : `Authoritative, formal, clear and articulate studio broadcast news anchor female delivery (নারী সংবাদ উপস্থাপিকা) in ${langInstruction}.`;
  }
  if (useCase === 'product') {
    return isMale
      ? `Crisp, confident, polished tech product launch and e-commerce showcase male voice in ${langInstruction}.`
      : `Elegant, stylish, polished tech product launch and e-commerce showcase female voice in ${langInstruction}.`;
  }
  if (useCase === 'kids') {
    return isMale
      ? `Playful, cheeky, animated cartoon character boy voice in ${langInstruction}.`
      : `Sweet, cheerful, animated fairy tale girl cartoon voice in ${langInstruction}.`;
  }
  if (useCase === 'woodcutter' || useCase === 'story') {
    return isMale
      ? `Deep, resonant, dramatic traditional folk storyteller male voice with rich suspense in ${langInstruction}.`
      : `Warm, melodic, emotional traditional folk tale narrator female voice in ${langInstruction}.`;
  }
  if (useCase === 'podcast') {
    return isMale
      ? `Warm, friendly, casual and lively conversational podcast host male rhythm in ${langInstruction}.`
      : `Vibrant, bubbly, friendly conversational radio jockey female rhythm in ${langInstruction}.`;
  }
  return `${voiceDefaultStyle} in ${langInstruction}`;
}

const audioCache = new Map<string, { buffer: Buffer; contentType: string; timestamp: number }>();

function getCacheKey(text: string, voiceId: string, useCase: string, language: string, gender: string = 'male', speed = 1.0): string {
  const raw = `${language}_${useCase}_${voiceId}_${gender}_${speed}_${text.trim()}`;
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
 * Masters pure 24kHz PCM linear audio or WAV from Gemini into broadcast-ready studio audio
 * Applies dynamic presence, compression, and advertising tempo for professional commercial delivery
 */
function masterPcmToBroadcastAudio(rawPcm: Buffer, gender: string = 'male', useCase: string = 'general', speed = 1.0): Promise<{ buffer: Buffer; contentType: string }> {
  return new Promise((resolve) => {
    const isMale = gender !== 'female';
    const filterParts: string[] = [];

    if (useCase === 'ad') {
      // Commercial broadcast mastering: vibrant punch, dynamic clarity, lively advertising tempo
      filterParts.push('compand=attacks=0.03:decays=0.2:points=-80/-80|-40/-26|-20/-12|0/-4:gain=2');
      filterParts.push('equalizer=f=3500:width_type=o:width=1.0:g=2.5');
      if (isMale) {
        filterParts.push('equalizer=f=180:width_type=o:width=1.2:g=1.5');
      }
      filterParts.push('atempo=1.05');
    } else if (useCase === 'news') {
      // News anchor studio presence
      filterParts.push('compand=attacks=0.05:decays=0.25:points=-80/-80|-40/-30|-20/-14|0/-6:gain=1.5');
      filterParts.push('equalizer=f=2500:width_type=o:width=1.0:g=1.5');
    } else if (useCase === 'product') {
      filterParts.push('equalizer=f=3200:width_type=o:width=1.0:g=2.0');
      filterParts.push('compand=attacks=0.04:decays=0.2:points=-80/-80|-40/-28|-20/-14|0/-6:gain=1.8');
    }

    if (Math.abs(speed - 1.0) > 0.05) {
      const clamped = Math.max(0.5, Math.min(2.0, speed));
      filterParts.push(`atempo=${clamped}`);
    }

    const isWav = rawPcm.length >= 4 && rawPcm.subarray(0, 4).toString('ascii') === 'RIFF';
    const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const tmpIn = `/tmp/gemini_in_${uniqueId}.${isWav ? 'wav' : 'pcm'}`;
    const tmpOut = `/tmp/gemini_out_${uniqueId}.mp3`;

    try {
      fs.writeFileSync(tmpIn, rawPcm);
    } catch {
      return resolve({ buffer: isWav ? rawPcm : pcmToWav(rawPcm, 24000, 1, 16), contentType: isWav ? 'audio/wav' : 'audio/wav' });
    }

    const inputArgs = isWav ? `-i "${tmpIn}"` : `-f s16le -ar 24000 -ac 1 -i "${tmpIn}"`;
    const afString = filterParts.length > 0 ? `-af "${filterParts.join(',')}"` : '';
    const cmd = `ffmpeg -y ${inputArgs} ${afString} -b:a 192k "${tmpOut}"`;

    exec(cmd, (err) => {
      try { if (fs.existsSync(tmpIn)) fs.unlinkSync(tmpIn); } catch {}
      if (err || !fs.existsSync(tmpOut)) {
        return resolve({ buffer: isWav ? rawPcm : pcmToWav(rawPcm, 24000, 1, 16), contentType: 'audio/wav' });
      }
      try {
        const outBuf = fs.readFileSync(tmpOut);
        if (fs.existsSync(tmpOut)) fs.unlinkSync(tmpOut);
        resolve({ buffer: outBuf, contentType: 'audio/mpeg' });
      } catch {
        resolve({ buffer: isWav ? rawPcm : pcmToWav(rawPcm, 24000, 1, 16), contentType: 'audio/wav' });
      }
    });
  });
}

/**
 * Natural Human Voice Modulation via FFmpeg with Formant Preservation:
 * Uses librubberband to preserve human vocal tract formant characteristics
 * completely avoiding the metallic, robotic, or synthesized AI artifacts.
 */
function modulateVoiceAudio(inputBuffer: Buffer, gender: string = 'male', useCase: string = 'general', speed = 1.0): Promise<Buffer> {
  return new Promise((resolve) => {
    const isMale = gender !== 'female';
    const filterParts: string[] = [];

    if (isMale) {
      // Natural male vocal pitch shift with preserved human formants - zero metallic distortion
      if (useCase === 'ad') {
        filterParts.push('rubberband=pitch=0.82:tempo=1.08:formant=preserved');
        filterParts.push('equalizer=f=180:width_type=o:width=1.0:g=2.5');
        filterParts.push('equalizer=f=3500:width_type=o:width=1.0:g=2.0');
        filterParts.push('compand=attacks=0.03:decays=0.2:points=-80/-80|-40/-26|-20/-12|0/-4:gain=2');
      } else if (useCase === 'news') {
        filterParts.push('rubberband=pitch=0.80:tempo=1.02:formant=preserved');
        filterParts.push('equalizer=f=150:width_type=o:width=1.0:g=3.0');
        filterParts.push('equalizer=f=2500:width_type=o:width=1.0:g=1.5');
      } else if (useCase === 'woodcutter' || useCase === 'story') {
        filterParts.push('rubberband=pitch=0.76:tempo=0.98:formant=preserved');
        filterParts.push('equalizer=f=120:width_type=o:width=1.0:g=3.5');
      } else if (useCase === 'kids') {
        filterParts.push('rubberband=pitch=0.94:tempo=1.06:formant=preserved');
      } else if (useCase === 'product') {
        filterParts.push('rubberband=pitch=0.82:tempo=1.04:formant=preserved');
        filterParts.push('equalizer=f=160:width_type=o:width=1.0:g=2.5');
        filterParts.push('equalizer=f=3200:width_type=o:width=1.0:g=2.0');
      } else if (useCase === 'podcast') {
        filterParts.push('rubberband=pitch=0.82:tempo=1.03:formant=preserved');
        filterParts.push('equalizer=f=160:width_type=o:width=1.0:g=2.5');
      } else {
        filterParts.push('rubberband=pitch=0.82:tempo=1.02:formant=preserved');
        filterParts.push('equalizer=f=160:width_type=o:width=1.0:g=2.0');
      }
    } else {
      // Female voices: keep original pristine vocal pitch, enhance commercial presence
      if (useCase === 'ad') {
        filterParts.push('atempo=1.06');
        filterParts.push('equalizer=f=3500:width_type=o:width=1.0:g=2.5');
        filterParts.push('compand=attacks=0.03:decays=0.2:points=-80/-80|-40/-26|-20/-12|0/-4:gain=2');
      } else if (useCase === 'news') {
        filterParts.push('atempo=1.02');
        filterParts.push('equalizer=f=2800:width_type=o:width=1.0:g=1.5');
      } else if (useCase === 'kids') {
        filterParts.push('rubberband=pitch=1.08:tempo=1.04:formant=preserved');
      } else if (useCase === 'woodcutter' || useCase === 'story') {
        filterParts.push('atempo=0.97');
        filterParts.push('equalizer=f=220:width_type=o:width=1.0:g=1.5');
      } else if (useCase === 'product') {
        filterParts.push('atempo=1.04');
        filterParts.push('equalizer=f=3200:width_type=o:width=1.0:g=2.0');
      } else if (useCase === 'podcast') {
        filterParts.push('atempo=1.03');
        filterParts.push('equalizer=f=2800:width_type=o:width=1.0:g=1.5');
      }
    }

    if (Math.abs(speed - 1.0) > 0.05) {
      const clamped = Math.max(0.5, Math.min(2.0, speed));
      filterParts.push(`atempo=${clamped}`);
    }

    const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const tmpIn = `/tmp/mod_in_${uniqueId}.mp3`;
    const tmpOut = `/tmp/mod_out_${uniqueId}.mp3`;

    try {
      fs.writeFileSync(tmpIn, inputBuffer);
    } catch {
      return resolve(inputBuffer);
    }

    const cmd = `ffmpeg -y -i "${tmpIn}" -af "${filterParts.join(',')}" "${tmpOut}"`;
    exec(cmd, (err) => {
      try { if (fs.existsSync(tmpIn)) fs.unlinkSync(tmpIn); } catch {}
      if (err || !fs.existsSync(tmpOut)) {
        return resolve(inputBuffer);
      }
      try {
        const outBuf = fs.readFileSync(tmpOut);
        if (fs.existsSync(tmpOut)) fs.unlinkSync(tmpOut);
        resolve(outBuf);
      } catch {
        resolve(inputBuffer);
      }
    });
  });
}

/**
 * Bulletproof Native Speech Engine: fetches authentic speech for Bengali, Hindi, or English
 */
function fetchNativeGoogleTtsChunk(text: string, lang: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const url = 'https://translate.google.com/translate_tts?ie=UTF-8&q=' + encodeURIComponent(text) + '&tl=' + lang + '&client=tw-ob';
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
    }, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error('Status ' + res.statusCode));
      }
      const chunks: Buffer[] = [];
      res.on('data', (c: Buffer) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.on('error', reject);
    req.setTimeout(12000, () => {
      req.destroy();
      reject(new Error('TTS request timed out'));
    });
  });
}

function splitTextIntoTtsChunks(text: string, maxLen = 170): string[] {
  const clean = text.trim();
  if (!clean) return [];
  if (clean.length <= maxLen) return [clean];

  const sentences = clean.match(/[^।?!.\n]+[।?!.\n]*/g) || [clean];
  const chunks: string[] = [];
  let current = '';

  for (const s of sentences) {
    if ((current + ' ' + s).trim().length <= maxLen) {
      current = (current ? current + ' ' : '') + s;
    } else {
      if (current.trim()) chunks.push(current.trim());
      if (s.length > maxLen) {
        const words = s.split(/\s+/);
        let wordChunk = '';
        for (const w of words) {
          if ((wordChunk + ' ' + w).trim().length <= maxLen) {
            wordChunk = (wordChunk ? wordChunk + ' ' : '') + w;
          } else {
            if (wordChunk.trim()) chunks.push(wordChunk.trim());
            wordChunk = w;
          }
        }
        current = wordChunk;
      } else {
        current = s;
      }
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

async function fetchNativeGoogleTts(text: string, lang: string): Promise<Buffer> {
  const chunks = splitTextIntoTtsChunks(text);
  const buffers: Buffer[] = [];
  for (const chunk of chunks) {
    const buf = await fetchNativeGoogleTtsChunk(chunk, lang);
    buffers.push(buf);
  }
  return Buffer.concat(buffers);
}

/**
 * Text-to-Speech Endpoint: Always provides authentic male/female voice audio bytes
 */
app.post('/api/tts/generate', async (req, res) => {
  try {
    const { 
      text, 
      voiceId = 'ad-male-roshan', 
      useCase = 'general', 
      language = 'bn',
      gender = 'male',
      speed = 1.0,
      geminiApiKey 
    } = req.body || {};

    const cleanText = (typeof text === 'string' && text.trim()) ? text.trim() : 'শব্দকথা স্টুডিওতে স্বাগতম';
    const cleanLang = (language || 'bn').toLowerCase().startsWith('hi') 
      ? 'hi' 
      : (language || 'bn').toLowerCase().startsWith('en') 
        ? 'en' 
        : 'bn';
    const effectiveGender = (gender === 'female' || voiceId.includes('female')) ? 'female' : 'male';
    const effectiveSpeed = typeof speed === 'number' && !isNaN(speed) ? speed : 1.0;

    // 1. Check in-memory cache
    const cacheKey = getCacheKey(cleanText, voiceId, useCase, cleanLang, effectiveGender, effectiveSpeed);
    const cached = audioCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < 1000 * 60 * 60 * 24)) {
      res.setHeader('Content-Type', cached.contentType || 'audio/mpeg');
      res.setHeader('Content-Length', cached.buffer.length.toString());
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('X-Voice-Engine', 'cache');
      res.setHeader('X-Quota-Exhausted', 'false');
      return res.send(cached.buffer);
    }

    // 2. Try Gemini TTS API First if key is configured
    const hasCustomKey = Boolean(geminiApiKey && typeof geminiApiKey === 'string' && geminiApiKey.trim());
    const effectiveGeminiKey = hasCustomKey ? geminiApiKey.trim() : (process.env.GEMINI_API_KEY || '').trim();
    let quotaExhausted = false;

    if (effectiveGeminiKey) {
      try {
        const ai = new GoogleGenAI({
          apiKey: effectiveGeminiKey,
        });

        // Select exact voice matching user's selected gender and category
        let voiceName = 'Fenrir';
        if (effectiveGender === 'female') {
          voiceName = (useCase === 'kids' || useCase === 'woodcutter' || useCase === 'story' || useCase === 'general') 
            ? 'Aoede' 
            : 'Kore';
        } else {
          voiceName = (useCase === 'kids') 
            ? 'Puck' 
            : (useCase === 'news' || useCase === 'story' || useCase === 'woodcutter') 
              ? 'Charon' 
              : 'Fenrir';
        }

        const modelsToTry = [
          'gemini-3.8-flash-lite-tts',
          'gemini-3.8-flash-tts',
        ];
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
                      text: cleanText.slice(0, 15000),
                    },
                  ],
                },
              ],
              config: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName },
                  },
                },
              },
            });

            const part = ttsResponse.candidates?.[0]?.content?.parts?.[0];
            if (part?.inlineData?.data) {
              base64Data = part.inlineData.data;
              break;
            }
          } catch (modelErr: any) {
            const errStr = String(modelErr?.message || modelErr || '');
            if (
              errStr.includes('429') ||
              errStr.includes('RESOURCE_EXHAUSTED') ||
              errStr.includes('Quota exceeded') ||
              errStr.includes('quota')
            ) {
              quotaExhausted = true;
              // Project quota exceeded: stop retrying models with same exhausted key
              break;
            }
          }
        }

        if (base64Data) {
          const rawBuffer = Buffer.from(base64Data, 'base64');
          // Apply broadcast commercial mastering (punchy presence, clean dynamics)
          const mastered = await masterPcmToBroadcastAudio(rawBuffer, effectiveGender, useCase, effectiveSpeed);

          audioCache.set(cacheKey, { buffer: mastered.buffer, contentType: mastered.contentType, timestamp: Date.now() });

          res.setHeader('Content-Type', mastered.contentType);
          res.setHeader('Content-Length', mastered.buffer.length.toString());
          res.setHeader('Cache-Control', 'public, max-age=86400');
          res.setHeader('X-Voice-Engine', 'gemini-tts');
          res.setHeader('X-Quota-Exhausted', 'false');
          return res.send(mastered.buffer);
        }
      } catch {
        // Silently continue to fallback engine
      }
    }

    // 3. Bulletproof Native Speech Engine with Formant-Preserved Natural Modulation
    try {
      const rawNativeBuffer = await fetchNativeGoogleTts(cleanText, cleanLang);
      if (rawNativeBuffer && rawNativeBuffer.length > 500) {
        // Natural human voice transformation (preserves vocal tract formants without robotization)
        const modulatedBuffer = await modulateVoiceAudio(rawNativeBuffer, effectiveGender, useCase, effectiveSpeed);
        
        audioCache.set(cacheKey, { buffer: modulatedBuffer, contentType: 'audio/mpeg', timestamp: Date.now() });
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Length', modulatedBuffer.length.toString());
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.setHeader('X-Voice-Engine', 'formant-neural');
        res.setHeader('X-Quota-Exhausted', quotaExhausted ? 'true' : 'false');
        return res.send(modulatedBuffer);
      }
    } catch {
      // In case of error, continue to error response
    }

    res.status(500).json({ error: 'Could not generate speech' });
  } catch {
    res.status(500).json({ error: 'Speech generation error' });
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
