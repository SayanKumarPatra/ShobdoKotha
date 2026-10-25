import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '10mb' }));

// Initialize Google Gemini AI SDK for authentic studio speech synthesis
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Voice mapping to Gemini and Cartesia
const GEMINI_VOICE_MAP: Record<string, { voiceName: string; defaultStyle: string }> = {
  // 1. বিজ্ঞাপন / অ্যাডভার্টাইজ
  'ad-commercial-puck': {
    voiceName: 'Puck',
    defaultStyle: 'Energetic, enthusiastic and persuasive commercial marketing ad voice in natural Bengali',
  },
  // 2. গল্প ও কাঠুরে (Storyteller)
  'story-woodcutter-fenrir': {
    voiceName: 'Fenrir',
    defaultStyle: 'Deep, dramatic, traditional folk storyteller narration in clear evocative Bengali',
  },
  // 3. সংবাদ ও স্টুডিও
  'news-studio-kore': {
    voiceName: 'Kore',
    defaultStyle: 'Clear, articulate, professional national news anchor with standard Bengali pronunciation',
  },
  // 4. পডকাস্ট ও আরজে
  'podcast-rj-zephyr': {
    voiceName: 'Zephyr',
    defaultStyle: 'Warm, conversational, lively podcast host and audio conversationalist',
  },
  // 5. শিশুতোষ ও কার্টুন
  'kids-fairy-puck': {
    voiceName: 'Puck',
    defaultStyle: 'Playful, cheerful, lively child storytelling voice',
  },
  // 6. গম্ভীর ও নাটকীয়
  'charon-documentary': {
    voiceName: 'Charon',
    defaultStyle: 'Authoritative, resonant, deep documentary narrator',
  },
  // General voices
  'ananya-female-bn': {
    voiceName: 'Kore',
    defaultStyle: 'Sweet, natural, articulate studio narration in standard Bengali',
  },
  'shubho-male-bn': {
    voiceName: 'Fenrir',
    defaultStyle: 'Authoritative, clear, natural male studio narrator in Bengali',
  },
  'sumi-friendly-bn': {
    voiceName: 'Zephyr',
    defaultStyle: 'Warm, friendly, compassionate conversational voice',
  },
  'tanveer-story-bn': {
    voiceName: 'Fenrir',
    defaultStyle: 'Deep, dramatic folk tale narrator',
  },
  'arian-child-bn': {
    voiceName: 'Puck',
    defaultStyle: 'Energetic, playful child storytelling voice',
  },
  'barun-radio-bn': {
    voiceName: 'Puck',
    defaultStyle: 'Upbeat commercial radio jockey',
  },
  'sarah-en-us': {
    voiceName: 'Kore',
    defaultStyle: 'Articulate, professional American English studio voice',
  },
  'rahul-en-in': {
    voiceName: 'Fenrir',
    defaultStyle: 'Modern Indian English tech presentation voice',
  },
};

app.post('/api/tts/generate', async (req, res) => {
  try {
    const { text, voiceId = 'ananya-female-bn', useCase = 'general', speed = 1.0, cartesiaKey } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Text transcript is required' });
    }

    const cleanText = text.trim();

    // 1. Check if user provided custom Cartesia key and wants Cartesia
    if (cartesiaKey && typeof cartesiaKey === 'string' && cartesiaKey.startsWith('sk_car_')) {
      try {
        const cartesiaResp = await fetch('https://api.cartesia.ai/tts/bytes', {
          method: 'POST',
          headers: {
            'X-API-Key': cartesiaKey.trim(),
            'Cartesia-Version': '2024-06-10',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model_id: 'sonic-3.6',
            transcript: cleanText,
            voice: { mode: 'id', id: '48b9e1de-e2fa-4914-8b32-31c437813548' },
            output_format: { container: 'wav', encoding: 'pcm_s16le', sample_rate: 44100 },
            language: 'bn',
          }),
        });

        if (cartesiaResp.ok) {
          const cartesiaAudio = await cartesiaResp.arrayBuffer();
          res.setHeader('Content-Type', 'audio/wav');
          res.setHeader('Content-Length', cartesiaAudio.byteLength.toString());
          res.setHeader('Cache-Control', 'public, max-age=3600');
          return res.end(Buffer.from(cartesiaAudio));
        }
      } catch (e) {
        console.warn('Custom Cartesia failed, proceeding to Gemini TTS:', e);
      }
    }

    // 2. Primary Google Gemini Flash Lite TTS
    const voiceMapping = GEMINI_VOICE_MAP[voiceId] || GEMINI_VOICE_MAP['ananya-female-bn'];
    let stylePrompt = voiceMapping.defaultStyle;

    if (useCase === 'ad') {
      stylePrompt = 'Lively, energetic, punchy and persuasive commercial advertisement tone in natural clear Bengali';
    } else if (useCase === 'story' || useCase === 'woodcutter') {
      stylePrompt = 'Dramatic, traditional, evocative Bengali folk storyteller narration with emotional depth';
    } else if (useCase === 'news') {
      stylePrompt = 'Formal, clear, objective broadcast studio news anchor tone in standard Bengali';
    } else if (useCase === 'podcast') {
      stylePrompt = 'Casual, friendly, engaging podcast host tone with conversational rhythm';
    } else if (useCase === 'kids') {
      stylePrompt = 'Sweet, animated, playful fairy-tale narrator voice for children';
    }

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
      throw new Error('Gemini TTS returned no audio data');
    }

    const audioBuffer = Buffer.from(base64Data, 'base64');
    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Content-Length', audioBuffer.length.toString());
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.end(audioBuffer);
  } catch (error) {
    console.error('TTS Generation error in server:', error);
    return res.status(500).json({ error: 'Failed to generate voice speech' });
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
