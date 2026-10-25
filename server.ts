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

const GEMINI_VOICE_MAP: Record<string, { voiceName: string; defaultStyle: string }> = {
  'ad-commercial-puck': {
    voiceName: 'Puck',
    defaultStyle: 'Energetic, enthusiastic and persuasive commercial marketing ad voice in natural Bengali',
  },
  'story-woodcutter-fenrir': {
    voiceName: 'Fenrir',
    defaultStyle: 'Deep, dramatic, traditional folk storyteller narration in clear evocative Bengali',
  },
  'news-studio-kore': {
    voiceName: 'Kore',
    defaultStyle: 'Clear, articulate, professional national news anchor with standard Bengali pronunciation',
  },
  'podcast-rj-zephyr': {
    voiceName: 'Zephyr',
    defaultStyle: 'Warm, conversational, lively podcast host and audio conversationalist',
  },
  'kids-fairy-puck': {
    voiceName: 'Puck',
    defaultStyle: 'Playful, cheerful, lively child storytelling voice',
  },
  'charon-documentary': {
    voiceName: 'Charon',
    defaultStyle: 'Authoritative, resonant, deep documentary narrator',
  },
  'ananya-female-bn': {
    voiceName: 'Kore',
    defaultStyle: 'Sweet, natural, articulate studio narration in standard Bengali',
  },
  'shubho-male-bn': {
    voiceName: 'Fenrir',
    defaultStyle: 'Authoritative, clear, natural male studio narrator in Bengali',
  },
};

app.post('/api/tts/generate', async (req, res) => {
  try {
    const { 
      text, 
      voiceId = 'ananya-female-bn', 
      useCase = 'general', 
      speed = 1.0, 
      cartesiaKey, 
      geminiApiKey 
    } = req.body || {};

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Text transcript is required' });
    }

    const cleanText = text.trim();

    // 1. Optional Cartesia override if provided
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
          return res.send(Buffer.from(cartesiaAudio));
        }
      } catch (e) {
        console.warn('Custom Cartesia failed, falling back to Gemini TTS:', e);
      }
    }

    // 2. Resolve Gemini API Key (from request or process.env)
    const effectiveGeminiKey = geminiApiKey || process.env.GEMINI_API_KEY;

    if (!effectiveGeminiKey) {
      return res.status(200).json({
        fallback: true,
        requiresKey: true,
        message: 'No GEMINI_API_KEY found. Switched to browser neural speech.',
      });
    }

    const ai = new GoogleGenAI({
      apiKey: effectiveGeminiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

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
      return res.status(200).json({
        fallback: true,
        message: 'Gemini TTS returned no audio data. Switched to browser neural speech.',
      });
    }

    const audioBuffer = Buffer.from(base64Data, 'base64');
    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Content-Length', audioBuffer.length.toString());
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.send(audioBuffer);
  } catch (error) {
    console.error('Server TTS error:', error);
    return res.status(200).json({
      fallback: true,
      message: 'TTS generation server error, client fallback engaged.',
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
