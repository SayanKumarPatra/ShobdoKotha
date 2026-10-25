import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Square,
  Trash2, 
  Mic, 
  Gauge, 
  Sparkles, 
  ChevronDown, 
  Check, 
  Key, 
  X, 
  SlidersHorizontal,
  ExternalLink,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  Globe,
  Volume2,
  Server
} from 'lucide-react';
import { Logo } from '../Logo';
import { AudioPlayer } from '../AudioPlayer';
import { VOICES_CATALOG, SUPPORTED_LANGUAGES, USE_CASE_PRESETS, UseCasePreset } from '../../data/voices';
import { Voice, GeneratedAudioItem, VoiceUseCase, SupportedLanguageCode } from '../../types';
import { 
  generateSpeechAudio, 
  getStoredGeminiKey, 
  setStoredGeminiKey, 
  validateTtsInput,
  playRealVoicePreview,
  stopVoicePreview
} from '../../services/audioService';

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
  // Map selectedLanguage to 3 primary supported codes
  const getLanguageCode = (nameOrCode: string): SupportedLanguageCode => {
    const s = nameOrCode.toLowerCase();
    if (s.includes('hi') || s.includes('हिन्द')) return 'hi';
    if (s.includes('en') || s.includes('engl')) return 'en';
    return 'bn';
  };

  const [currentLangCode, setCurrentLangCode] = useState<SupportedLanguageCode>('bn');
  const [text, setText] = useState<string>('অসাধারণ সুযোগ! এই বৈশাখে পেয়ে যান ৭০% পর্যন্ত বিশেষ ছাড়! স্টক সীমিত, এখনই অর্ডার করুন আপনার পছন্দের গ্যাজেট!');
  const [speed, setSpeed] = useState<number>(1.0);
  const [toneIndex, setToneIndex] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedAudio, setGeneratedAudio] = useState<GeneratedAudioItem | null>(null);
  
  // Audition states
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);

  // Validation and Error states
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [textError, setTextError] = useState<string | null>(null);

  // Dropdown states
  const [isVoiceDropdownOpen, setIsVoiceDropdownOpen] = useState<boolean>(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState<boolean>(false);

  // Gemini API Key modal state
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [showKeyPassword, setShowKeyPassword] = useState<boolean>(false);

  useEffect(() => {
    const savedGemini = getStoredGeminiKey();
    if (savedGemini) {
      setHasApiKey(true);
      setApiKeyInput(savedGemini);
    }
  }, []);

  const toneOptions = [
    { label: 'সাধারণ (Normal)', value: 'normal' },
    { label: 'উষ্ণ (Warm)', value: 'warm' },
    { label: 'গম্ভীর (Deep)', value: 'deep' },
    { label: 'নাটকীয় (Expressive)', value: 'expressive' },
  ];

  // When language changes, update text and state
  const handleSelectLanguage = (langOpt: typeof SUPPORTED_LANGUAGES[0]) => {
    setCurrentLangCode(langOpt.code);
    setSelectedLanguage(langOpt.nativeName);
    setIsLangDropdownOpen(false);

    // Update text according to active use-case preset in new language
    const currentPreset = USE_CASE_PRESETS.find(p => p.id === selectedUseCase) || USE_CASE_PRESETS[0];
    setText(currentPreset.samples[langOpt.code]);
    setTextError(null);
    setErrorMessage(null);
  };

  // Handle Preset selection (Ad, News, Product, Kids Cartoon, Woodcutter, Podcast)
  const handleSelectPreset = (preset: UseCasePreset) => {
    setSelectedUseCase(preset.id);
    setText(preset.samples[currentLangCode]);
    setTextError(null);
    setErrorMessage(null);

    const recVoice = VOICES_CATALOG.find((v) => v.id === preset.recommendedVoiceId);
    if (recVoice) {
      setSelectedVoice(recVoice);
    }
  };

  // Real AI Voice Audition Preview
  const handlePlayVoicePreview = async (voice: Voice) => {
    if (previewingVoiceId === voice.id) {
      stopVoicePreview();
      setPreviewingVoiceId(null);
      setPreviewLoading(false);
      return;
    }

    setPreviewingVoiceId(voice.id);
    setPreviewLoading(true);

    const sampleToPlay = voice.sampleTexts[currentLangCode] || voice.sampleTexts.bn;

    await playRealVoicePreview({
      text: sampleToPlay,
      voice,
      languageCode: currentLangCode,
      useCase: voice.useCase,
      onStart: () => {
        setPreviewLoading(false);
      },
      onEnd: () => {
        setPreviewingVoiceId(null);
        setPreviewLoading(false);
      },
      onError: (err) => {
        setPreviewingVoiceId(null);
        setPreviewLoading(false);
        setErrorMessage(err.message || 'ভয়েস প্রিভিউ প্লে করতে সমস্যা হয়েছে।');
      },
    });
  };

  // Generate Voice for the exact text using Google Gemini TTS
  const handleGenerate = async () => {
    const validation = validateTtsInput(text);
    if (!validation.isValid) {
      const msg = validation.errorMessage || 'অনুগ্রহ করে বক্সে কিছু টেক্সট লিখুন';
      setTextError(msg);
      setErrorMessage(msg);
      return;
    }

    setTextError(null);
    setErrorMessage(null);
    setIsGenerating(true);
    stopVoicePreview();
    setPreviewingVoiceId(null);

    try {
      const result = await generateSpeechAudio({
        text: text.trim(),
        voice: selectedVoice,
        speed,
        tone: toneOptions[toneIndex].label,
        useCase: selectedUseCase,
        languageCode: currentLangCode,
        languageLabel: selectedLanguage,
        geminiApiKey: getStoredGeminiKey() || undefined,
      });

      setGeneratedAudio(result);
      setErrorMessage(null);
    } catch (error: any) {
      console.error('Speech generation error:', error);
      setErrorMessage(error?.message || 'ভয়েস জেনারেট করতে সমস্যা হয়েছে, পুনরায় চেষ্টা করুন।');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = apiKeyInput.trim();
    if (cleanKey) {
      setStoredGeminiKey(cleanKey);
      setHasApiKey(true);
      setErrorMessage(null);
    } else {
      setStoredGeminiKey('');
      setHasApiKey(false);
    }
    setShowKeyModal(false);
  };

  return (
    <div className="w-full flex flex-col items-center pb-24 md:pb-10 pt-1 sm:pt-2">
      <div className="w-full max-w-[440px] md:max-w-4xl px-3 sm:px-6">
        
        {/* Mobile Top Header */}
        <header className="flex items-center justify-between py-1.5 mb-2 md:hidden">
          <Logo size="md" showSubtitle={true} />
          <div className="flex items-center gap-1.5">
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
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Gemini কী সক্রিয়</span>
                </>
              ) : (
                <>
                  <Key className="w-3 h-3 text-cyan-400" />
                  <span>Gemini কী</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* Google Gemini API Key Modal (Works locally & on Vercel) */}
        {showKeyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
            <div className="liquid-glass-card rounded-3xl p-5 w-full max-w-md border border-cyan-500/30 shadow-2xl relative">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/20 flex items-center justify-center border border-cyan-400/30">
                    <Key className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-white">Google Gemini API Key কনফিগারেশন</h3>
                    <p className="text-[10px] text-cyan-300">লোকাল ও Vercel হোস্ট উভয়ের জন্য প্রযোজ্য</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowKeyModal(false)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Stored Key Status Banner */}
              {hasApiKey && (
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between mb-3 text-xs">
                  <div className="flex items-center gap-2 text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-medium">আপনার Google Gemini API কী সংযুক্ত আছে</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setApiKeyInput('');
                      setStoredGeminiKey('');
                      setHasApiKey(false);
                    }}
                    className="text-[11px] text-red-400 hover:text-red-300 underline font-medium cursor-pointer ml-2 shrink-0"
                  >
                    মুছে ফেলুন
                  </button>
                </div>
              )}

              {/* Direct API Key Generation Link */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/40 to-blue-950/40 border border-cyan-400/30 mb-3.5">
                <p className="text-xs font-semibold text-cyan-200 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>১ ক্লিকে ১০০% ফ্রি Gemini API Key নিন:</span>
                </p>
                <p className="text-[11px] text-neutral-300 leading-relaxed mb-2.5">
                  Google AI Studio থেকে সরাসরি আপনার নিজস্ব ফ্রি API Key তৈরি করুন এবং নিচে পেস্ট করুন:
                </p>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25"
                >
                  <span>👉 Google AI Studio থেকে ফ্রি API Key তৈরি করুন</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Vercel Deployment Instructions */}
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 mb-3 text-[11px] text-neutral-300 flex items-start gap-2">
                <Server className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white">Vercel ডেপ্লয়মেন্টের জন্য:</span>
                  <p className="mt-0.5 text-neutral-400 leading-relaxed">
                    Vercel ড্যাশবোর্ডে Environment Variables-এ <code className="text-cyan-300 bg-white/10 px-1 py-0.5 rounded">GEMINI_API_KEY</code> যুক্ত করলে স্বয়ংক্রিয়ভাবে সবার জন্য কাজ করবে। অথবা ব্রাউজারে এখানে কি দিলে আপনার নিজস্ব কি ব্যবহার হবে।
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveKey} className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-neutral-300">
                      Google Gemini API Key পেস্ট করুন:
                    </label>
                    <span className="text-[11px] text-cyan-300 font-mono">
                      (AIzaSy...)
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={showKeyPassword ? 'text' : 'password'}
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder="AIzaSy... আপনার গুগল এপিআই কি দিন"
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
                  <span className="text-[11px] text-neutral-400">
                    নিরাপদে ব্রাউজারে সংরক্ষিত থাকবে
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
                      className="px-4 py-1.5 rounded-xl text-black bg-cyan-400 hover:bg-cyan-300 text-xs font-semibold cursor-pointer shadow-md"
                    >
                      সংরক্ষণ করুন
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <section className="py-2 mb-2 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 mb-1">
            <span className="text-[10px] sm:text-[11px] font-semibold tracking-wider text-cyan-400/90 font-mono">
              AI VOICE STUDIO · BENGALI, HINDI & ENGLISH
            </span>
            
            {/* API Key Action Buttons for Desktop */}
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => setShowKeyModal(true)}
                className="flex items-center gap-1.5 text-xs text-neutral-200 hover:text-white px-3 py-1 rounded-full bg-white/5 border border-white/10 hover:border-cyan-400/30 transition-colors cursor-pointer"
              >
                <Key className="w-3 h-3 text-cyan-400" />
                <span>{hasApiKey ? 'Google Gemini কী সক্রিয়' : 'Google Gemini কী যোগ করুন'}</span>
              </button>
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight leading-snug">
            তোমার শব্দ এখন <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-300 to-indigo-300">প্রাকৃতিক জীবন্ত কণ্ঠে</span>
          </h1>
          <p className="text-[11px] sm:text-xs text-neutral-300 mt-0.5">
            বাংলা, হিন্দি ও ইংরেজি—বিজ্ঞাপন, সংবাদ, প্রোডাক্ট ও শিশুদের কার্টুনের জন্য খাঁটি উচ্চারণের এআই ভয়েস।
          </p>

          {/* 3 Dedicated Primary Language Pills */}
          <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[11px] text-neutral-400 font-medium mr-1 shrink-0 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>ভাষা:</span>
            </span>
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isActive = currentLangCode === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => handleSelectLanguage(lang)}
                  className={`px-3 py-1 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/60 shadow-[0_0_12px_rgba(56,189,248,0.3)] font-semibold'
                      : 'bg-white/5 text-neutral-300 hover:text-white border border-white/10 hover:border-white/20'
                  }`}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.nativeName}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* USE-CASE PRESETS MENU: Explicitly requested by user:
            বিজ্ঞাপন, সংবাদ, প্রোডাক্ট, শিশুদের কার্টুন, কাঠুরে ও পডকাস্ট */}
        <section className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-neutral-300">
              কাজের ধরণ নির্বাচন করুন (Select Use Case):
            </span>
            <span className="text-[10px] text-cyan-300 font-medium">
              ক্লিক করলেই স্ক্রিপ্ট ও মডেল সেট হবে
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1.5">
            {USE_CASE_PRESETS.map((preset) => {
              const isSelected = selectedUseCase === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`p-2 rounded-xl text-left flex flex-col justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-b from-cyan-500/25 via-blue-600/20 to-cyan-500/10 text-cyan-200 border border-cyan-400/60 shadow-[0_0_15px_rgba(56,189,248,0.25)]'
                      : 'liquid-glass-card-subtle text-neutral-300 hover:text-white hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-base">{preset.icon}</span>
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#38bdf8]"></span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold leading-tight truncate">{preset.title}</p>
                    <p className="text-[9px] text-neutral-400 truncate mt-0.5">{preset.badge}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* TEXT INPUT PANEL */}
        <section className="liquid-glass-card rounded-2xl p-3 sm:p-4 mb-3 relative border border-cyan-500/20">
          <div className="flex items-center justify-between mb-2 text-white">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-xs sm:text-sm">
                টেক্সট লিখুন বা এডিট করুন
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-400/20">
                {currentLangCode === 'bn' ? 'বাংলা' : currentLangCode === 'hi' ? 'हिन्दी' : 'English'}
              </span>
            </div>
            <span className="text-[11px] text-cyan-300/80 font-mono">
              {text.length}/5000
            </span>
          </div>

          <div className={`liquid-glass-input rounded-xl p-2.5 mb-2.5 relative transition-all ${
            textError ? 'border-red-500/60 ring-2 ring-red-500/20' : 'focus-within:border-cyan-400/40'
          }`}>
            <textarea
              rows={4}
              maxLength={5000}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (textError) setTextError(null);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="এখানে আপনার যেকোনো টেক্সট লিখুন বা পেস্ট করুন..."
              className="w-full bg-transparent text-white placeholder-neutral-500 text-xs sm:text-sm focus:outline-none resize-none leading-relaxed"
              style={{ fontFamily: currentLangCode === 'bn' ? 'var(--font-bengali)' : 'inherit' }}
            />
            {textError && (
              <div className="flex items-center gap-1.5 text-[11px] text-red-300 font-medium pt-1 pb-0.5">
                <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span>{textError}</span>
              </div>
            )}
            <div className="flex justify-between items-center mt-1 pt-1 border-t border-white/5">
              <span className="text-[10px] text-neutral-400 truncate pr-2">
                মডেল: <strong className="text-cyan-300">{selectedVoice.bengaliName} ({selectedVoice.name})</strong> · {selectedVoice.useCaseLabel}
              </span>
              <button
                type="button"
                onClick={() => {
                  setText('');
                  setTextError(null);
                }}
                className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white px-2 py-0.5 rounded hover:bg-white/5 cursor-pointer shrink-0"
              >
                <Trash2 className="w-3 h-3" />
                <span>মুছুন</span>
              </button>
            </div>
          </div>

          {/* Voice & Language Dropdowns */}
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
                  <Mic className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">{selectedVoice.bengaliName} ({selectedVoice.name})</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 shrink-0 transition-transform ${isVoiceDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isVoiceDropdownOpen && (
                <div className="absolute top-11 left-0 right-0 z-30 liquid-glass-card rounded-xl p-1.5 max-h-60 overflow-y-auto space-y-1 shadow-2xl border border-cyan-500/30">
                  {VOICES_CATALOG.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => {
                        setSelectedVoice(v);
                        setSelectedUseCase(v.useCase);
                        setIsVoiceDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                        selectedVoice.id === v.id ? 'bg-cyan-500/20 text-white font-semibold border border-cyan-400/30' : 'text-neutral-300 hover:bg-white/5'
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
                  <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">{selectedLanguage}</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 shrink-0 transition-transform ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isLangDropdownOpen && (
                <div className="absolute top-11 left-0 right-0 z-30 liquid-glass-card rounded-xl p-1.5 max-h-56 overflow-y-auto space-y-1 shadow-2xl border border-cyan-500/30">
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => handleSelectLanguage(lang)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                        currentLangCode === lang.code ? 'bg-cyan-500/20 text-white font-semibold border border-cyan-400/30' : 'text-neutral-300 hover:bg-white/5'
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <span>{lang.flag}</span>
                        <span className="truncate">{lang.nativeName}</span>
                      </span>
                      {currentLangCode === lang.code && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
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
                  <Gauge className="w-3 h-3 text-cyan-400" />
                  <span>গতি (Speed)</span>
                </span>
                <span className="font-mono text-cyan-300 font-semibold">{speed.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div className="liquid-glass-card-subtle rounded-xl p-2 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[11px] text-neutral-300 mb-1">
                <span className="flex items-center gap-1">
                  <SlidersHorizontal className="w-3 h-3 text-cyan-400" />
                  <span>টোন (Tone)</span>
                </span>
                <span className="text-cyan-300 font-medium">{toneOptions[toneIndex].label.split(' ')[0]}</span>
              </div>
              <input
                type="range"
                min="0"
                max={toneOptions.length - 1}
                step="1"
                value={toneIndex}
                onChange={(e) => setToneIndex(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>

          {/* Error and Rate-Limit Notice Banner */}
          {errorMessage && (
            <div className="p-3 rounded-xl border mb-3 flex items-start justify-between gap-2.5 transition-all bg-amber-500/10 border-amber-400/40 text-amber-200">
              <div className="flex items-start gap-2.5 text-xs min-w-0">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <div className="min-w-0">
                  <p className="font-semibold text-xs leading-relaxed">{errorMessage}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setShowKeyModal(true)}
                      className="px-2.5 py-1 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-black text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Key className="w-3 h-3" />
                      <span>Google Gemini কী দিন</span>
                    </button>
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-cyan-300 underline hover:text-cyan-200 flex items-center gap-0.5"
                    >
                      <span>Google AI Studio থেকে ফ্রি কী নিন</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
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
                : 'bg-gradient-to-r from-cyan-500 via-blue-600 to-cyan-500 hover:from-cyan-400 hover:via-blue-500 hover:to-cyan-400 text-white shadow-[0_0_25px_rgba(56,189,248,0.35)] hover:shadow-[0_0_35px_rgba(56,189,248,0.55)] active:scale-[0.99] border border-cyan-400/50'
            }`}
          >
            {isGenerating ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>উচ্চমানের ভয়েস প্রস্তুত হচ্ছে...</span>
              </div>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white text-white" />
                <span>ভয়েস জেনারেট করুন (Generate Voice)</span>
                <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
              </>
            )}
          </button>

          {/* Generated Audio Player */}
          {generatedAudio && (
            <div className="mt-4 animate-fade-in">
              <AudioPlayer 
                item={generatedAudio} 
                onRegenerate={handleGenerate} 
                autoPlay={true}
              />
            </div>
          )}
        </section>

        {/* Real AI Voice Audition Samples */}
        <section className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
              <span>মডেলের নমুনা শুনুন ({currentLangCode === 'bn' ? 'বাংলা' : currentLangCode === 'hi' ? 'हिन्दी' : 'English'}):</span>
            </h2>
            <button
              onClick={onNavigateToVoices}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 cursor-pointer"
            >
              সবগুলো মডেল লাইব্রেরি →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {VOICES_CATALOG.slice(0, 4).map((voice) => {
              const isSelected = selectedVoice.id === voice.id;
              const isPlayingPreview = previewingVoiceId === voice.id;

              return (
                <div
                  key={voice.id}
                  onClick={() => {
                    setSelectedVoice(voice);
                    setSelectedUseCase(voice.useCase);
                  }}
                  className={`liquid-glass-card rounded-xl p-2.5 flex items-center justify-between cursor-pointer transition-all ${
                    isSelected ? 'border-cyan-400/50 bg-cyan-950/20 shadow-[0_0_15px_rgba(56,189,248,0.15)]' : 'hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-lg">{voice.avatar}</span>
                    <div className="min-w-0">
                      <p className="font-semibold text-xs text-white truncate">
                        {voice.bengaliName} ({voice.name})
                      </p>
                      <p className="text-[10px] text-neutral-400 truncate">
                        {voice.useCaseLabel} · {voice.categoryLabel}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayVoicePreview(voice);
                    }}
                    className={`w-8 h-8 rounded-lg liquid-glass-button flex items-center justify-center text-white shrink-0 cursor-pointer transition-all ${
                      isPlayingPreview ? 'bg-cyan-500/30 border-cyan-400 shadow-[0_0_10px_rgba(56,189,248,0.4)]' : 'hover:border-cyan-400/40'
                    }`}
                    title={isPlayingPreview ? 'থামুন' : 'খাঁটি এআই ভয়েস শুনুন'}
                  >
                    {isPlayingPreview ? (
                      previewLoading ? (
                        <div className="w-3 h-3 border-2 border-white/30 border-t-cyan-300 rounded-full animate-spin" />
                      ) : (
                        <Square className="w-3 h-3 fill-cyan-300 text-cyan-300" />
                      )
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
