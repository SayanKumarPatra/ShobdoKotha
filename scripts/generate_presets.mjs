import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, '../public/assets/audio/presets');
fs.mkdirSync(outDir, { recursive: true });

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const presets = [
  // Bengali
  { file: 'ad_bn.wav', voice: 'Puck', lang: 'bn', text: 'অসাধারণ সুযোগ! এই বৈশাখে পেয়ে যান ৭০% পর্যন্ত বিশেষ ছাড়! স্টক সীমিত, এখনই অর্ডার করুন আপনার পছন্দের গ্যাজেট!', style: 'Energetic commercial advertisement voice in natural fluent Bengali' },
  { file: 'news_bn.wav', voice: 'Kore', lang: 'bn', text: 'শব্দকথা জাতীয় সংবাদে স্বাগত। দেশের প্রযুক্তি খাতে নতুন দিগন্ত উন্মোচন করে যাত্রা শুরু করল কৃত্রিম বুদ্ধিমত্তা চালিত আধুনিক ভয়েস স্টুডিও।', style: 'Authoritative, clear broadcast news anchor delivery in standard Bengali' },
  { file: 'product_bn.wav', voice: 'Zephyr', lang: 'bn', text: 'পরিচয় করিয়ে দিচ্ছি আমাদের নতুন ফ্ল্যাগশিপ প্রোডাক্টের সাথে। আল্ট্রা-ফাস্ট স্পিড, অল-ডে ব্যাটারি ব্যাকআপ এবং এয়ারক্রাফট-গ্রেড প্রিমিয়াম মেটালিক ফিনিশ—সবকিছু নিখুঁতভাবে আপনার জন্য প্রস্তুত।', style: 'Crisp, confident modern tech product showcase in fluent Bengali' },
  { file: 'kids_bn.wav', voice: 'Puck', lang: 'bn', text: 'এক বনে ছিল ছোট্ট এক মিষ্টি খরগোশ আর এক দুষ্টু শিয়াল ছানা। তারা প্রতিদিন মেঘের দেশে লুকোচুরি খেলত আর মজার মজার গান গাইত!', style: 'Playful, cheerful animated cartoon voice in expressive Bengali' },
  { file: 'woodcutter_bn.wav', voice: 'Fenrir', lang: 'bn', text: 'এক নদীর ধারে বাস করত এক সৎ গরিব কাঠুরে। একদিন বনে কাঠ কাটতে গিয়ে হাত ফসকে তার লোহার কুঠারটি গভীর নদীতে পড়ে গেল। কাঠুরে কাঁদতে লাগল...', style: 'Dramatic, deep traditional folk storyteller in emotional Bengali' },
  { file: 'podcast_bn.wav', voice: 'Zephyr', lang: 'bn', text: 'হ্যালো বন্ধুরা! কেমন আছো সবাই? আজকের শব্দকথা পডকাস্টে আমরা জানব দারুণ কিছু অজানা গল্প। হেডফোনটা লাগিয়ে নাও আর শুরু করা যাক!', style: 'Warm, conversational lively podcast host in natural Bengali' },

  // Hindi
  { file: 'ad_hi.wav', voice: 'Puck', lang: 'hi', text: 'धमाकेदार महा-ऑफर! इस उत्सव के मौके पर पाएं 70% तक की विशेष छूट। स्टॉक सीमित है, तुरंत अपना पसंदीदा ऑर्डर बुक करें!', style: 'Energetic commercial advertisement voice in natural fluent Hindi' },
  { file: 'news_hi.wav', voice: 'Kore', lang: 'hi', text: 'शब्दकथा राष्ट्रीय समाचार में आपका स्वागत है। तकनीक के क्षेत्र में एक नई क्रांति, अब एआई से बनेगी स्वाभाविक और स्पष्ट आवाज़।', style: 'Authoritative broadcast news anchor delivery in fluent Hindi' },
  { file: 'product_hi.wav', voice: 'Zephyr', lang: 'hi', text: 'पेश है हमारा नया फ्लैगशिप प्रोडक्ट। अल्ट्रा-फास्ट स्पीड, पूरे दिन चलने वाली बैटरी और शानदार प्रीमियम मैटेलिक फिनिश—सब कुछ आपकी सुविधा के लिए।', style: 'Crisp product showcase presentation in fluent Hindi' },
  { file: 'kids_hi.wav', voice: 'Puck', lang: 'hi', text: 'एक सुंदर जंगल में रहता था एक नन्हा प्यारा खरगोश और एक शरारती बंदर। वे दोनों रोज़ बादलों के संग लुका-छिपी खेलते और मीठे फल खाते!', style: 'Playful cartoon voice in expressive Hindi' },
  { file: 'woodcutter_hi.wav', voice: 'Fenrir', lang: 'hi', text: 'एक नदी के किनारे रहता था एक गरीब और ईमानदार लकड़हारा। एक दिन जंगल में लकड़ी काटते समय उसकी कुल्हाड़ी गहरी नदी में गिर गई...', style: 'Dramatic folk storyteller in emotional Hindi' },
  { file: 'podcast_hi.wav', voice: 'Zephyr', lang: 'hi', text: 'नमस्ते दोस्तों! कैसे हैं आप सब? आज के शब्दकथा पॉডকাस्ट में हम बात करेंगे कुछ बेहद दिलचस्प और अनसुनी कहानियों पर। तो बने रहिए हमारे साथ!', style: 'Warm, conversational podcast host in natural Hindi' },

  // English
  { file: 'ad_en.wav', voice: 'Puck', lang: 'en', text: 'Unbelievable festive offer! Get up to 70% off on all premium collections. Stock is limited, order yours right now!', style: 'Energetic commercial advertisement voice in natural clear English' },
  { file: 'news_en.wav', voice: 'Kore', lang: 'en', text: 'Welcome to ShobdoKotha Broadcast News. Today marks a revolutionary leap in regional artificial intelligence speech synthesis.', style: 'Authoritative, clear broadcast news anchor delivery in standard English' },
  { file: 'product_en.wav', voice: 'Zephyr', lang: 'en', text: 'Introducing our all-new flagship product. Engineered with ultra-fast speed, all-day battery life, and a stunning aircraft-grade metallic finish.', style: 'Crisp, modern tech product launch presentation in clear English' },
  { file: 'kids_en.wav', voice: 'Puck', lang: 'en', text: 'Once upon a time in an enchanted rainbow forest, a cheerful little bunny and a baby fox set off on a wondrous flying adventure!', style: 'Playful, cheerful animated cartoon voice in expressive English' },
  { file: 'woodcutter_en.wav', voice: 'Fenrir', lang: 'en', text: 'Deep beside a flowing river lived a poor, honest woodcutter. One day, his iron axe slipped from his hands and plunged into the deep currents...', style: 'Dramatic folk storyteller in emotional English' },
  { file: 'podcast_en.wav', voice: 'Zephyr', lang: 'en', text: 'Hey everyone, welcome back to the podcast! Today we’re diving into some fascinating untold stories. Grab your headphones and let’s dive in!', style: 'Warm, conversational lively podcast host in natural English' },
];

function pcmToWav(pcmBuffer, sampleRate = 24000, channels = 1, bitDepth = 16) {
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

async function run() {
  for (const p of presets) {
    const targetPath = path.join(outDir, p.file);
    if (fs.existsSync(targetPath) && fs.statSync(targetPath).size > 1000) {
      console.log(`Skipping already generated: ${p.file}`);
      continue;
    }

    console.log(`Generating: ${p.file}...`);
    let success = false;
    let attempts = 0;

    while (!success && attempts < 4) {
      attempts++;
      try {
        const res = await ai.models.generateContent({
          model: 'gemini-3.8-flash-tts',
          contents: [{
            role: 'user',
            parts: [{
              text: p.text,
              speechMetadata: { style: p.style }
            }]
          }],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: p.voice } }
            }
          }
        });

        const b64 = res.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (b64) {
          const raw = Buffer.from(b64, 'base64');
          const wav = raw.subarray(0, 4).toString() === 'RIFF' ? raw : pcmToWav(raw);
          fs.writeFileSync(targetPath, wav);
          console.log(`SAVED ${p.file} (${wav.length} bytes)`);
          success = true;
          // small pause
          await new Promise(r => setTimeout(r, 22000));
        } else {
          console.log(`No audio for ${p.file}`);
          break;
        }
      } catch (err) {
        console.log(`Attempt ${attempts} error for ${p.file}:`, err.message);
        const is429 = err.message && err.message.includes('429');
        if (is429) {
          console.log('Waiting 23s for rate limit to reset...');
          await new Promise(r => setTimeout(r, 23000));
        } else {
          break;
        }
      }
    }
  }
}

run();
