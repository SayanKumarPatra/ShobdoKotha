import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Trash2, 
  Mic, 
  Gauge, 
  Sparkles, 
  ChevronDown, 
  Check, 
  Key, 
  X, 
  ShieldCheck, 
  SlidersHorizontal,
  ExternalLink,
  HelpCircle,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  Globe
} from 'lucide-react';
import { Logo } from '../Logo';
import { AudioPlayer } from '../AudioPlayer';
import { VOICES_CATALOG, SUPPORTED_LANGUAGES, USE_CASE_PRESETS, UseCasePreset } from '../../data/voices';
import { Voice, GeneratedAudioItem, VoiceUseCase } from '../../types';
import { generateSpeechAudio, saveToHistory } from '../../services/audioService';
import { 
  callCartesiaTtsApi, 
  getStoredCartesiaKey, 
  setStoredCartesiaKey, 
  validateTtsInput, 
  CartesiaError 
} from '../../services/cartesiaService';

interface HomeViewProps {
  onOpenMenu: () => void;
  onNavigateToVoices: () => void;
  onNavigateToAccount: () => void;
  selectedVoice: Voice;
  setSelectedVoice: (voice: Voice) => void;
  selectedLanguage: string;
  setSelectedLanguage: (lang: string) => void;
  selectedUseCase: VoiceUseCase;
  setSelectedUseCase: (uc: VoiceUseCase) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onOpenMenu,
  onNavigateToVoices,
  onNavigateToAccount,
  selectedVoice,
  setSelectedVoice,
  selectedLanguage,
  setSelectedLanguage,
  selectedUseCase,
  setSelectedUseCase,
}) => {
  // User's editable text input
  const [text, setText] = useState<string>('এক নদীর ধারে বাস করত এক সৎ কাঠুরে। একদিন বনে কাঠ কাটতে গিয়ে তার লোহার কুঠারটি গভীর নদীতে পড়ে গেল...');
  const [speed, setSpeed] = useState<number>(1.0);
  const [toneIndex, setToneIndex] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedAudio, setGeneratedAudio] = useState<GeneratedAudioItem | null>(null);
  const [activePreviewVoiceId, setActivePreviewVoiceId] = useState<string | null>(null);
  
  // Validation and Error states
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'missing_key' | 'invalid_key' | 'quota_exceeded' | 'validation' | 'general' | null>(null);
  const [textError, setTextError] = useState<string | null>(null);

  // Dropdown states
  const [isVoiceDropdownOpen, setIsVoiceDropdownOpen] = useState<boolean>(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState<boolean>(false);

  // API Key modal state
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);

  useEffect(() => {
    const savedCartesia = getStoredCartesiaKey();
    const savedGemini = localStorage.getItem('shobdokotha_gemini_key');
    if (savedCartesia || savedGemini) {
      setHasApiKey(true);
      setApiKeyInput(savedCartesia || savedGemini || '');
    }
  }, []);

  const toneOptions = [
    { label: 'সাধারণ', value: 'normal' },
    { label: 'উষ্ণ', value: 'warm' },
    { label: 'গম্ভীর', value: 'deep' },
    { label: 'নাটকীয়', value: 'expressive' },
  ];

  // Handle Preset selection (Ad, Woodcutter, News, etc.)
  const handleSelectPreset = (preset: UseCasePreset) => {
    setSelectedUseCase(preset.id);
    setText(preset.sampleText);
    const recVoice = VOICES_CATALOG.find((v) => v.id === preset.recommendedVoiceId);
    if (recVoice) {
      setSelectedVoice(recVoice);
    }
  };

  // Play audition preview for voice
  const handlePlayVoicePreview = (voice: Voice) => {
    if (activePreviewVoiceId === voice.id) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setActivePreviewVoiceId(null);
      return;
    }

    setActivePreviewVoiceId(voice.id);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(voice.sampleText);
      utterance.pitch = voice.pitch;
      utterance.rate = voice.rate;
      utterance.lang = voice.langCode;
      
      const voices = window.speechSynthesis.getVoices();
      const matched = voices.find(v => v.lang.startsWith(voice.langCode.split('-')[0])) || voices[0];
      if (matched) utterance.voice = matched;

      utterance.onend = () => setActivePreviewVoiceId(null);
      utterance.onerror = () => setActivePreviewVoiceId(null);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setActivePreviewVoiceId(null), 3000);
    }
  };

  // Generate Voice for whatever EXACT text is in the textarea using Cartesia API
  const handleGenerate = async () => {
    // 1. Validate text input
    const validation = validateTtsInput(text);
    if (!validation.isValid) {
      const msg = validation.errorMessage || 'অনুগ্রহ করে বক্সে কিছু টেক্সট লিখুন';
      setTextError(msg);
      setErrorMessage(msg);
      setErrorType('validation');
      return;
    }

    setTextError(null);
    setErrorMessage(null);
    setErrorType(null);

    // 2. Check for stored user API key
    const storedCartesiaKey = getStoredCartesiaKey();
    const storedGeminiKey = localStorage.getItem('shobdokotha_gemini_key');

    if (!storedCartesiaKey && !storedGeminiKey) {
      setErrorMessage('ভয়েস তৈরির জন্য Cartesia API Key প্রয়োজন। আপনার API কী যোগ করতে নিচে ক্লিক করুন বা ফ্রি কী তৈরি করুন।');
      setErrorType('missing_key');
      setShowKeyModal(true);
      return;
    }

    setIsGenerating(true);
    try {
      if (storedCartesiaKey) {
        // Direct Cartesia API call with binary audio response
        const { blob, audioUrl, duration } = await callCartesiaTtsApi({
          text: text.trim(),
          voice: selectedVoice,
          apiKey: storedCartesiaKey,
          speed,
        });

        const newAudioItem: GeneratedAudioItem = {
          id: 'cartesia_' + Date.now(),
          text: text.trim(),
          voice: selectedVoice,
          language: selectedVoice.language,
          speed,
          tone: toneOptions[toneIndex].label,
          useCase: selectedUseCase,
          createdAt: new Date().toISOString(),
          duration,
          audioUrl,
          blobSize: blob.size,
        };

        saveToHistory(newAudioItem);
        setGeneratedAudio(newAudioItem);
        setErrorMessage(null);
        setErrorType(null);
      } else {
        // Fallback to Gemini server endpoint if only Gemini key is configured
        const result = await generateSpeechAudio({
          text: text.trim(),
          voice: selectedVoice,
          speed,
          tone: toneOptions[toneIndex].label,
          useCase: selectedUseCase,
          preferredEngine: 'gemini',
        });
        setGeneratedAudio(result);
        setErrorMessage(null);
        setErrorType(null);
      }
    } catch (error: any) {
      console.error('TTS Generation error:', error);
      if (error instanceof CartesiaError) {
        setErrorMessage(error.userMessage);
        if (error.code === 'INVALID_API_KEY' || error.status === 401) {
          setErrorType('invalid_key');
        } else if (error.code === 'QUOTA_EXCEEDED' || error.status === 402 || error.status === 429) {
          setErrorType('quota_exceeded');
        } else if (error.code === 'MISSING_KEY') {
          setErrorType('missing_key');
          setShowKeyModal(true);
        } else {
          setErrorType('general');
        }
      } else {
        setErrorMessage(error?.message || 'ভয়েস জেনারেট করতে সমস্যা হয়েছে, পুনরায় চেষ্টা করুন।');
        setErrorType('general');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const [showKeyPassword, setShowKeyPassword] = useState<boolean>(false);

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = apiKeyInput.trim();
    if (cleanKey) {
      setStoredCartesiaKey(cleanKey);
      if (cleanKey.startsWith('AIza')) {
        localStorage.setItem('shobdokotha_gemini_key', cleanKey);
      }
      setHasApiKey(true);
      setErrorMessage(null);
      setErrorType(null);
    } else {
      localStorage.removeItem('shobdokotha_gemini_key');
      setStoredCartesiaKey('');
      setHasApiKey(false);
    }
    setShowKeyModal(false);
  };

  return (
    <div className="w-full flex flex-col items-center pb-24 md:pb-10 pt-1 sm:pt-2">
      <div className="w-full max-w-[430px] md:max-w-4xl px-3 sm:px-6">
        
        {/* Mobile Top Header (Clean, with quick API Key button - strictly mobile only) */}
        <header className="flex items-center justify-between py-1.5 mb-2 md:hidden">
          <Logo size="md" showSubtitle={true} />
          <div className="flex items-center gap-1.5">
            <a
              href="https://play.cartesia.ai/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-1 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-[11px] text-cyan-300 font-medium flex items-center gap-1 shadow-sm"
              title="Cartesia থেকে API Key নিন"
            >
              <span>🔑 Cartesia কী</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <button
              onClick={() => setShowKeyModal(true)}
              className={`px-2.5 py-1 rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-colors ${
                hasApiKey 
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300' 
                  : 'bg-white/10 border border-white/15 text-neutral-300 hover:text-white'
              }`}
            >
              {hasApiKey ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>কী সংরক্ষিত</span>
                </>
              ) : (
                <>
                  <Key className="w-3 h-3 text-cyan-400" />
                  <span>যোগ করুন</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* API Key Modal */}
        {showKeyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
            <div className="liquid-glass-card rounded-3xl p-5 w-full max-w-md border border-white/20 shadow-2xl relative">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-cyan-400" />
                  <h3 className="font-semibold text-sm text-white">Cartesia API Key কনফিগারেশন</h3>
                </div>
                <button 
                  onClick={() => setShowKeyModal(false)}
                  className="p-1 rounded-lg text-neutral-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Stored Key Status Banner if key already exists */}
              {hasApiKey && (
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between mb-3 text-xs">
                  <div className="flex items-center gap-2 text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-medium">আপনার এপিআই কী সফলভাবে সংরক্ষিত আছে</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setApiKeyInput('');
                      setStoredCartesiaKey('');
                      localStorage.removeItem('shobdokotha_gemini_key');
                      setHasApiKey(false);
                    }}
                    className="text-[11px] text-red-400 hover:text-red-300 underline font-medium cursor-pointer ml-2 shrink-0"
                  >
                    মুছে ফেলুন
                  </button>
                </div>
              )}

              {/* Direct API Key Generation Links inside Modal */}
              <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 mb-3.5">
                <p className="text-xs font-semibold text-cyan-200 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Cartesia API Key সংগ্রহ করুন:</span>
                </p>
                <p className="text-[11px] text-neutral-300 leading-relaxed mb-2.5">
                  আল্ট্রা-রিয়েলিস্টিক ভয়েস তৈরির জন্য নিচের বাটনে ক্লিক করে Cartesia থেকে আপনার ফ্রি API Key কপি করে বক্সে পেস্ট করুন:
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <a
                    href="https://play.cartesia.ai/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20"
                  >
                    <span>👉 Cartesia API Key নিন</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium border border-white/15 transition-all flex items-center justify-center gap-1"
                  >
                    <span>Google AI Studio</span>
                    <ExternalLink className="w-3 h-3 text-neutral-400" />
                  </a>
                </div>
              </div>

              <form onSubmit={handleSaveKey} className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-neutral-300">
                      Cartesia API Key পেস্ট করুন:
                    </label>
                    <span className="text-[11px] text-neutral-400">
                      (sk_car_...)
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={showKeyPassword ? 'text' : 'password'}
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder="sk_car_... অথবা আপনার API Key"
                      className="w-full liquid-glass-input h-11 pl-3.5 pr-10 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKeyPassword(!showKeyPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white cursor-pointer"
                      title={showKeyPassword ? 'কী লুকান' : 'কী দেখুন'}
                    >
                      {showKeyPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-neutral-400">
                    *কী এই ব্রাউজারে সুরক্ষিতভাবে সংরক্ষিত থাকে।
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowKeyModal(false)}
                      className="px-3 py-1.5 rounded-xl text-xs text-neutral-400 hover:text-white cursor-pointer"
                    >
                      বাতিল
                    </button>
                    <button
                      type="submit"
                      className="liquid-glass-button px-4 py-1.5 rounded-xl text-white text-xs font-semibold cursor-pointer"
                    >
                      সংরক্ষণ করুন
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Hero Section: Compact typography, NO microphone image */}
        <section className="py-2 mb-2 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 mb-1">
            <span className="text-[10px] sm:text-[11px] font-semibold tracking-wider text-neutral-400 font-mono">
              TURN YOUR WORDS INTO VOICE
            </span>
            
            {/* API Key Action Buttons for Desktop / Tablet */}
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => setShowKeyModal(true)}
                className="flex items-center gap-1.5 text-xs text-neutral-300 hover:text-white px-3 py-1 rounded-full bg-white/5 border border-white/10 transition-colors cursor-pointer"
              >
                <Key className="w-3 h-3 text-cyan-400" />
                <span>{hasApiKey ? 'API কী কনফিগার করা' : 'এপিআই কি যোগ করুন'}</span>
              </button>
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight leading-snug">
            তোমার লেখা এখন <span className="text-cyan-300">জীবন্ত কণ্ঠে</span>
          </h1>
          <p className="text-[11px] sm:text-xs text-neutral-400 mt-0.5">
            নিচে যেকোনো লেখা লিখুন এবং বিজ্ঞাপন, কাঠুরের গল্প, সংবাদ বা পডকাস্টের জন্য ভয়েস তৈরি করুন।
          </p>

          {/* User Requested: Direct Clickable Link right beneath "API Key যোগ করুন" */}
          <div className="mt-2.5 p-2.5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-purple-950/30 border border-cyan-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 text-left">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 flex items-center justify-center shrink-0 border border-cyan-400/30 text-cyan-300">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">
                  এপিআই কি নেই? এখানে ক্লিক করলেই আপনার ফ্রি API Key জেনারেট হবে:
                </p>
                <p className="text-[10px] text-cyan-200/80">
                  Google AI Studio বা Cartesia থেকে ১ ক্লিকে আপনার ফ্রি চাবি তৈরি করুন
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-initial px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/25"
                title="এখানে ক্লিক করলে আপনার ফ্রি এপিআই কি জেনারেট হবে"
              >
                <span>👉 ফ্রি Gemini Key নিন</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <button
                onClick={() => setShowKeyModal(true)}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium border border-white/20 transition-all cursor-pointer"
              >
                কী পেস্ট করুন
              </button>
            </div>
          </div>
        </section>

        {/* USE-CASE PRESETS: Click to select model and load instant sample */}
        <section className="mb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {USE_CASE_PRESETS.map((preset) => {
              const isSelected = selectedUseCase === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-cyan-500/25 via-blue-600/20 to-cyan-500/15 text-cyan-200 border border-cyan-400/50 shadow-[0_0_15px_rgba(56,189,248,0.25)] font-semibold'
                      : 'bg-white/5 text-neutral-400 hover:text-white border border-white/5 hover:border-white/10'
                  }`}
                >
                  <span>{preset.icon}</span>
                  <span>{preset.title}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* TEXT INPUT PANEL: Prime focused workspace */}
        <section className="liquid-glass-card rounded-2xl p-3 sm:p-4 mb-3 relative">
          <div className="flex items-center justify-between mb-2 text-white">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-xs sm:text-sm">টেক্সট লিখুন (এখানে আপনার যেকোনো লেখা পেস্ট বা টাইপ করুন)</span>
            </div>
            <span className="text-[11px] text-neutral-400 font-mono">
              {text.length}/5000
            </span>
          </div>

          <div className={`liquid-glass-input rounded-xl p-2.5 mb-2.5 relative transition-all ${
            textError ? 'border-red-500/60 ring-2 ring-red-500/20' : 'focus-within:border-white/30'
          }`}>
            <textarea
              rows={4}
              maxLength={5000}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (textError) setTextError(null);
                if (errorMessage && errorType === 'validation') {
                  setErrorMessage(null);
                  setErrorType(null);
                }
              }}
              placeholder="এখানে আপনার যেকোনো লেখা লিখুন বা পেস্ট করুন..."
              className="w-full bg-transparent text-white placeholder-neutral-500 text-xs sm:text-sm focus:outline-none resize-none leading-relaxed"
              style={{ fontFamily: 'var(--font-bengali)' }}
            />
            {textError && (
              <div className="flex items-center gap-1.5 text-[11px] text-red-300 font-medium pt-1 pb-0.5">
                <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span>{textError}</span>
              </div>
            )}
            <div className="flex justify-between items-center mt-1 pt-1 border-t border-white/5">
              <span className="text-[10px] text-neutral-400">
                নির্বাচিত মডেল: {selectedVoice.bengaliName} ({selectedVoice.useCaseLabel})
              </span>
              <button
                type="button"
                onClick={() => {
                  setText('');
                  setTextError(null);
                }}
                className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white px-2 py-0.5 rounded hover:bg-white/5 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>মুছুন</span>
              </button>
            </div>
          </div>

          {/* Controls: Voice & Language Pickers */}
          <div className="grid grid-cols-2 gap-2 mb-2.5">
            {/* Voice Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsVoiceDropdownOpen(!isVoiceDropdownOpen);
                  setIsLangDropdownOpen(false);
                }}
                className="w-full liquid-glass-button h-10 px-2.5 rounded-xl flex items-center justify-between text-xs text-neutral-200"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <Mic className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span className="truncate">{selectedVoice.bengaliName}</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 shrink-0 transition-transform ${isVoiceDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isVoiceDropdownOpen && (
                <div className="absolute top-11 left-0 right-0 z-30 liquid-glass-card rounded-xl p-1.5 max-h-56 overflow-y-auto space-y-1 shadow-2xl">
                  {VOICES_CATALOG.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => {
                        setSelectedVoice(v);
                        setSelectedUseCase(v.useCase);
                        setIsVoiceDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors ${
                        selectedVoice.id === v.id ? 'bg-white/20 text-white font-semibold' : 'text-neutral-300 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span>{v.avatar}</span>
                        <div className="truncate">
                          <p className="truncate">{v.bengaliName} ({v.name})</p>
                          <p className="text-[10px] text-neutral-400">{v.useCaseLabel}</p>
                        </div>
                      </div>
                      {selectedVoice.id === v.id && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Language Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsLangDropdownOpen(!isLangDropdownOpen);
                  setIsVoiceDropdownOpen(false);
                }}
                className="w-full liquid-glass-button h-10 px-2.5 rounded-xl flex items-center justify-between text-xs text-neutral-200"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <Globe className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span className="truncate">{selectedLanguage}</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 shrink-0 transition-transform ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isLangDropdownOpen && (
                <div className="absolute top-11 left-0 right-0 z-30 liquid-glass-card rounded-xl p-1.5 max-h-56 overflow-y-auto space-y-1 shadow-2xl">
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        setSelectedLanguage(lang.nativeName);
                        setIsLangDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors ${
                        selectedLanguage === lang.nativeName ? 'bg-white/20 text-white font-semibold' : 'text-neutral-300 hover:bg-white/5'
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <span>{lang.flag}</span>
                        <span className="truncate">{lang.nativeName}</span>
                      </span>
                      {selectedLanguage === lang.nativeName && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Speed & Tone Controls */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="liquid-glass-card-subtle rounded-xl p-2 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[11px] text-neutral-300 mb-1">
                <span className="flex items-center gap-1">
                  <Gauge className="w-3 h-3 text-neutral-400" />
                  <span>গতি</span>
                </span>
                <span className="font-mono text-white">{speed.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="liquid-glass-card-subtle rounded-xl p-2 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[11px] text-neutral-300 mb-1">
                <span className="flex items-center gap-1">
                  <SlidersHorizontal className="w-3 h-3 text-neutral-400" />
                  <span>টোন</span>
                </span>
                <span className="text-white">{toneOptions[toneIndex].label}</span>
              </div>
              <input
                type="range"
                min="0"
                max={toneOptions.length - 1}
                step="1"
                value={toneIndex}
                onChange={(e) => setToneIndex(parseInt(e.target.value, 10))}
                className="w-full"
              />
            </div>
          </div>

          {/* Graceful Error and API Key Notice Banner */}
          {errorMessage && (
            <div className={`p-3 rounded-xl border mb-3 flex items-start justify-between gap-2.5 transition-all ${
              errorType === 'invalid_key' || errorType === 'missing_key'
                ? 'bg-amber-500/10 border-amber-400/40 text-amber-200'
                : 'bg-red-500/10 border-red-400/40 text-red-200'
            }`}>
              <div className="flex items-start gap-2.5 text-xs min-w-0">
                <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${
                  errorType === 'invalid_key' || errorType === 'missing_key' ? 'text-amber-400' : 'text-red-400'
                }`} />
                <div className="min-w-0">
                  <p className="font-semibold text-xs leading-relaxed">{errorMessage}</p>
                  {(errorType === 'missing_key' || errorType === 'invalid_key') && (
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => setShowKeyModal(true)}
                        className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-black text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Key className="w-3 h-3" />
                        <span>Cartesia কী যোগ করুন</span>
                      </button>
                      <a
                        href="https://play.cartesia.ai/keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-cyan-300 underline hover:text-cyan-200 flex items-center gap-0.5"
                      >
                        <span>play.cartesia.ai থেকে কী কপি করুন</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                  {errorType === 'quota_exceeded' && (
                    <a
                      href="https://play.cartesia.ai"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-1.5 text-[11px] text-cyan-300 underline hover:text-cyan-200"
                    >
                      <span>Cartesia একাউন্ট ব্যালেন্স চেক করুন</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setErrorType(null);
                }}
                className="p-1 text-neutral-400 hover:text-white rounded-lg cursor-pointer shrink-0"
                title="বন্ধ করুন"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* GENERATE BUTTON */}
          <button
            type="button"
            disabled={isGenerating}
            onClick={handleGenerate}
            className={`w-full h-12 rounded-xl flex items-center justify-center gap-2 text-white font-semibold text-sm shadow-xl transition-all cursor-pointer relative overflow-hidden ${
              isGenerating
                ? 'opacity-70 cursor-wait bg-cyan-950/40 border border-cyan-500/30'
                : 'bg-gradient-to-r from-cyan-600/35 via-blue-600/40 to-cyan-500/35 hover:from-cyan-500/50 hover:via-blue-500/55 hover:to-cyan-400/50 border border-cyan-400/40 hover:border-cyan-300/70 shadow-[0_0_25px_rgba(56,189,248,0.28)] hover:shadow-[0_0_35px_rgba(56,189,248,0.45)] active:scale-[0.99]'
            }`}
          >
            {isGenerating ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Cartesia AI ভয়েস প্রস্তুত হচ্ছে...</span>
              </div>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white text-white" />
                <span>ভয়েস জেনারেট করুন</span>
                <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              </>
            )}
          </button>

          {/* Generated Audio Player */}
          {generatedAudio && (
            <div className="mt-3">
              <AudioPlayer 
                item={generatedAudio} 
                onRegenerate={handleGenerate} 
              />
            </div>
          )}
        </section>

        {/* Quick Audition List (Tight, clean layout) */}
        <section className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold text-neutral-300">
              জনপ্রিয় মডেল নমুনা (Play করে শুনুন):
            </h2>
            <button
              onClick={onNavigateToVoices}
              className="text-[11px] text-neutral-400 hover:text-white"
            >
              সবগুলো →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {VOICES_CATALOG.slice(0, 4).map((voice) => {
              const isSelected = selectedVoice.id === voice.id;
              const isPlayingPreview = activePreviewVoiceId === voice.id;

              return (
                <div
                  key={voice.id}
                  onClick={() => {
                    setSelectedVoice(voice);
                    setSelectedUseCase(voice.useCase);
                  }}
                  className={`liquid-glass-card rounded-xl p-2.5 flex items-center justify-between cursor-pointer transition-all ${
                    isSelected ? 'border-white/30 bg-white/10' : 'hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-lg">{voice.avatar}</span>
                    <div className="min-w-0">
                      <p className="font-semibold text-xs text-white truncate">
                        {voice.bengaliName}
                      </p>
                      <p className="text-[10px] text-neutral-400 truncate">
                        {voice.useCaseLabel}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayVoicePreview(voice);
                    }}
                    className="w-8 h-8 rounded-lg liquid-glass-button flex items-center justify-center text-white shrink-0"
                    title="নমুনা শুনুন"
                  >
                    {isPlayingPreview ? (
                      <div className="w-2.5 h-2.5 bg-white rounded-xs animate-pulse" />
                    ) : (
                      <Play className="w-3 h-3 fill-white text-white ml-0.5" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

      </div>
    </div>
  );
};
