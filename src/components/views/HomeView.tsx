import React, { useState, useEffect } from 'react';
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
  SlidersHorizontal, 
  ExternalLink, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  Globe, 
  Server, 
  UserCheck 
} from 'lucide-react';
import { Logo } from '../Logo';
import { AudioPlayer } from '../AudioPlayer';
import { 
  VOICES_CATALOG, 
  SUPPORTED_LANGUAGES, 
  USE_CASE_PRESETS, 
  UseCasePreset, 
  getVoiceForUseCaseAndGender 
} from '../../data/voices';
import { Voice, GeneratedAudioItem, VoiceUseCase, SupportedLanguageCode, VoiceGender } from '../../types';
import { 
  generateSpeechAudio, 
  getStoredGeminiKey, 
  setStoredGeminiKey, 
  validateTtsInput,
  stopVoicePreview,
  unlockAudioContext
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
  const [currentLangCode, setCurrentLangCode] = useState<SupportedLanguageCode>('bn');
  const [selectedGender, setSelectedGender] = useState<VoiceGender>('male');
  const [text, setText] = useState<string>('অসাধারণ সুযোগ! এই বৈশাখে পেয়ে যান ৭০% পর্যন্ত বিশেষ ছাড়! স্টক সীমিত, এখনই অর্ডার করুন আপনার পছন্দের গ্যাজেট!');
  const [speed, setSpeed] = useState<number>(1.0);
  const [toneIndex, setToneIndex] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedAudio, setGeneratedAudio] = useState<GeneratedAudioItem | null>(null);
  

  // Validation
  const [textError, setTextError] = useState<string | null>(null);

  // Dropdown states
  const [isVoiceDropdownOpen, setIsVoiceDropdownOpen] = useState<boolean>(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState<boolean>(false);

  // Gemini API Key modal state
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [showKeyPassword, setShowKeyPassword] = useState<boolean>(false);
  const [showQuotaNotice, setShowQuotaNotice] = useState<boolean>(false);

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

  // Language selection
  const handleSelectLanguage = (langOpt: typeof SUPPORTED_LANGUAGES[0]) => {
    setCurrentLangCode(langOpt.code);
    setSelectedLanguage(langOpt.nativeName);
    setIsLangDropdownOpen(false);

    const currentPreset = USE_CASE_PRESETS.find(p => p.id === selectedUseCase) || USE_CASE_PRESETS[0];
    setText(currentPreset.samples[langOpt.code]);
    setTextError(null);
  };

  // Category-specific tone mapping
  const categoryToneMap: Record<VoiceUseCase, number> = {
    ad: 3,         // নাটকীয় (Expressive) - জোরালো ও এনার্জেটিক বিজ্ঞাপন
    news: 2,       // গম্ভীর (Deep) - পেশাদার স্টুডিও সংবাদ ও বুলেটিন
    product: 1,    // উষ্ণ (Warm) - আধুনিক টেক রিভিউ ও শোকেস
    kids: 3,       // নাটকীয় (Expressive) - চঞ্চল কার্টুন চরিত্র ও রূপকথা
    woodcutter: 3, // নাটকীয় (Expressive) - আবেগঘন ও নাটকীয় লোকগাথা
    podcast: 1,    // উষ্ণ (Warm) - আন্তরিক ও প্রাণবন্ত কথকতা
    general: 0,    // সাধারণ (Normal)
  };

  // Preset selection (Ad, News, Product, Kids, Woodcutter, Podcast)
  const handleSelectPreset = (preset: UseCasePreset) => {
    setSelectedUseCase(preset.id);
    setText(preset.samples[currentLangCode]);
    setTextError(null);

    // Pick matching gender voice for this preset
    const targetVoice = getVoiceForUseCaseAndGender(preset.id, selectedGender);
    setSelectedVoice(targetVoice);

    // Synchronize tone to match this category
    setToneIndex(categoryToneMap[preset.id] ?? 0);
  };

  // Direct Male / Female gender switcher for active category
  const handleSelectGender = (gender: VoiceGender) => {
    setSelectedGender(gender);
    const targetVoice = getVoiceForUseCaseAndGender(selectedUseCase, gender);
    setSelectedVoice(targetVoice);

    // Keep tone synchronized to current category
    setToneIndex(categoryToneMap[selectedUseCase] ?? 0);
  };

  // Generate Voice for the exact text (up to 25,000 characters)
  const handleGenerate = async () => {
    unlockAudioContext();
    const validation = validateTtsInput(text);
    if (!validation.isValid) {
      const msg = validation.errorMessage || 'অনুগ্রহ করে বক্সে কিছু টেক্সট লিখুন';
      setTextError(msg);
      return;
    }

    setTextError(null);
    setIsGenerating(true);
    stopVoicePreview();

    try {
      const result = await generateSpeechAudio({
        text: text.trim(),
        voice: selectedVoice,
        speed,
        tone: toneOptions[toneIndex].label,
        useCase: selectedUseCase,
        languageCode: currentLangCode,
        languageLabel: selectedLanguage,
        gender: selectedGender,
        geminiApiKey: getStoredGeminiKey() || undefined,
      });

      if (result.item) {
        setGeneratedAudio(result.item);
      }
      if (result.quotaExhausted && !hasApiKey) {
        setShowQuotaNotice(true);
      }
    } catch {
      setTextError('ভয়েস তৈরিতে সমস্যা হয়েছে, পুনরায় চেষ্টা করুন');
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
      setShowQuotaNotice(false);
    } else {
      setStoredGeminiKey('');
      setHasApiKey(false);
    }
    setShowKeyModal(false);
  };

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="w-full flex flex-col items-center pb-24 md:pb-10 pt-1 sm:pt-2">
      <div className="w-full max-w-[460px] md:max-w-4xl px-3 sm:px-6">
        
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
                  <span>কী সক্রিয়</span>
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

        {/* Permanent API Key Setup Modal */}
        {showKeyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
            <div className="liquid-glass-card rounded-3xl p-5 w-full max-w-md border border-cyan-500/30 shadow-2xl relative">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/20 flex items-center justify-center border border-cyan-400/30">
                    <Key className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-white">Google Gemini API Key স্থায়ী সেটআপ</h3>
                    <p className="text-[10px] text-cyan-300">একবার দিলেই এই ডিভাইসে সারা জীবনের জন্য স্থায়ী থাকবে</p>
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
                    <span className="font-medium">আপনার এপিআই কী স্থায়ীভাবে সক্রিয় আছে</span>
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

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 mb-3 text-[11px] text-neutral-300 flex items-start gap-2">
                <Server className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white">স্থায়ী সেভ গ্যারান্টি:</span>
                  <p className="mt-0.5 text-neutral-400 leading-relaxed">
                    একবার সেভ করলেই ব্রাউজারের লোকাল স্টোরেজে আজীবন জমা থাকবে। বারবার দেওয়ার কোনো প্রয়োজন নেই।
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
                    স্থায়ীভাবে সংরক্ষিত থাকবে
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
              AI VOICE STUDIO · 25,000 CHARACTERS · MALE & FEMALE
            </span>
            
            {/* Desktop API Key Button */}
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => setShowKeyModal(true)}
                className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border transition-colors cursor-pointer ${
                  hasApiKey
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    : 'bg-white/5 border-white/10 text-neutral-200 hover:text-white hover:border-cyan-400/30'
                }`}
              >
                <Key className="w-3 h-3 text-cyan-400" />
                <span>{hasApiKey ? 'Gemini কী স্থায়ীভাবে সক্রিয়' : 'Gemini কী সেটআপ (আজীবন স্থায়ী)'}</span>
              </button>
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight leading-snug">
            তোমার শব্দ এখন <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-300 to-indigo-300">প্রাকৃতিক জীবন্ত কণ্ঠে</span>
          </h1>
          <p className="text-[11px] sm:text-xs text-neutral-300 mt-0.5">
            বাংলা, হিন্দি ও ইংরেজি—প্রতিটি কাজের জন্য ছেলে ও মেয়ে উভয় কণ্ঠের খাঁটি এআই ভয়েস।
          </p>

          {/* 3 Primary Language Pills */}
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

        {/* USE-CASE PRESETS MENU */}
        <section className="mb-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-neutral-300">
              ক্যাটাগরি নির্বাচন করুন:
            </span>
            <button
              type="button"
              onClick={onNavigateToVoices}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 cursor-pointer transition-colors px-2.5 py-0.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/25"
            >
              <span>সব মডেলগুলো দেখুন</span>
              <span className="text-xs">→</span>
            </button>
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
                      : 'liquid-glass-card-subteil text-neutral-300 hover:text-white hover:border-white/20 bg-white/5 border border-white/5'
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

        {/* TEXT INPUT PANEL (Up to 25,000 characters) */}
        <section className="liquid-glass-card rounded-2xl p-3 sm:p-4 mb-3 relative border border-cyan-500/20">
          <div className="flex items-center justify-between mb-2 text-white">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-xs sm:text-sm">
                টেক্সট লিখুন (সর্বোচ্চ ২৫,০০০ অক্ষর)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-400/20">
                {currentLangCode === 'bn' ? 'বাংলা' : currentLangCode === 'hi' ? 'हिन्दी' : 'English'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-cyan-300 font-mono">
              <span>{wordCount.toLocaleString()} শব্দ</span>
              <span>·</span>
              <span>{text.length.toLocaleString()}/25,000 অক্ষর</span>
            </div>
          </div>

          <div className={`liquid-glass-input rounded-xl p-2.5 mb-2.5 relative transition-all ${
            textError ? 'border-red-500/60 ring-2 ring-red-500/20' : 'focus-within:border-cyan-400/40'
          }`}>
            <textarea
              rows={5}
              maxLength={25000}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (textError) setTextError(null);
              }}
              placeholder="এখানে আপনার যেকোনো স্ক্রিপ্ট লিখুন বা পেস্ট করুন (বিজ্ঞাপন, সংবাদ, প্রোডাক্ট বা গল্প)..."
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

          {/* Voice Controls: Language & Gender Selector side by side, plus Model Dropdown */}
          <div className="space-y-2 mb-2.5">
            {/* Row 1: Language and Gender Selector side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Language Selection (যেখানে বাংলা চেঞ্জ করা যায়) */}
              <div className="relative">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] text-neutral-400 font-medium flex items-center gap-1">
                    <Globe className="w-3 h-3 text-cyan-400" />
                    <span>ভাষা (Language):</span>
                  </label>
                  <span className="text-[10px] text-cyan-300 font-mono">
                    {currentLangCode === 'bn' ? 'বাংলা' : currentLangCode === 'hi' ? 'हिन्दी' : 'English'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsLangDropdownOpen(!isLangDropdownOpen);
                    setIsVoiceDropdownOpen(false);
                  }}
                  className="w-full liquid-glass-button h-10 px-3 rounded-xl flex items-center justify-between text-xs text-neutral-200 border border-white/10 hover:border-cyan-400/30"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span>{SUPPORTED_LANGUAGES.find(l => l.code === currentLangCode)?.flag}</span>
                    <span className="truncate font-medium">{selectedLanguage}</span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 shrink-0 transition-transform ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isLangDropdownOpen && (
                  <div className="absolute top-16 left-0 right-0 z-30 liquid-glass-card rounded-xl p-1.5 max-h-56 overflow-y-auto space-y-1 shadow-2xl border border-cyan-500/30">
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

              {/* Voice Gender Switcher (ছেলে ও মেয়ে অপশন - সরাসরি ভাষা পরিবর্তনের পাশে) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] text-neutral-400 font-medium flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-cyan-400" />
                    <span>কণ্ঠের ধরন (Voice Gender):</span>
                  </label>
                  <span className="text-[10px] text-cyan-300 font-medium">
                    {selectedGender === 'male' ? 'ছেলে কণ্ঠ' : 'মেয়ে কণ্ঠ'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1 bg-black/50 p-1 rounded-xl border border-white/10 h-10 items-center">
                  <button
                    type="button"
                    onClick={() => handleSelectGender('male')}
                    className={`h-full rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      selectedGender === 'male'
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/30 font-bold border border-cyan-400/50'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <span>👦</span>
                    <span>ছেলে (Male)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectGender('female')}
                    className={`h-full rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      selectedGender === 'female'
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md shadow-pink-500/30 font-bold border border-pink-400/50'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <span>👧</span>
                    <span>মেয়ে (Female)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Row 2: Selected Voice Model for this category + dropdown */}
            <div className="relative">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] text-neutral-400 font-medium flex items-center gap-1">
                  <Mic className="w-3 h-3 text-cyan-400" />
                  <span>কণ্ঠ মডেল (Active Voice Model):</span>
                </label>
                <span className="text-[10px] text-neutral-400 truncate">
                  ক্যাটাগরি: <span className="text-cyan-300 font-medium">{USE_CASE_PRESETS.find(p => p.id === selectedUseCase)?.title || 'ক্যাটাগরি'}</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsVoiceDropdownOpen(!isVoiceDropdownOpen);
                  setIsLangDropdownOpen(false);
                }}
                className="w-full liquid-glass-button h-10 px-3 rounded-xl flex items-center justify-between text-xs text-neutral-200 border border-white/10 hover:border-cyan-400/30"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="text-base">{selectedVoice.avatar}</span>
                  <span className="font-semibold text-white truncate">{selectedVoice.bengaliName}</span>
                  <span className="text-neutral-400 truncate">({selectedVoice.name})</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
                    selectedVoice.gender === 'male'
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-400/25'
                      : 'bg-pink-500/15 text-pink-300 border border-pink-400/25'
                  }`}>
                    {selectedVoice.useCaseLabel}
                  </span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 shrink-0 transition-transform ${isVoiceDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isVoiceDropdownOpen && (
                <div className="absolute top-16 left-0 right-0 z-30 liquid-glass-card rounded-xl p-1.5 max-h-64 overflow-y-auto space-y-1 shadow-2xl border border-cyan-500/30">
                  {VOICES_CATALOG.filter(v => v.gender === selectedGender).map((v) => (
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
                          <p className="truncate font-medium text-white">{v.bengaliName} ({v.name})</p>
                          <p className="text-[10px] text-cyan-300/80 truncate">{v.useCaseLabel}</p>
                          <p className="text-[9.5px] text-neutral-400 truncate">{v.bengaliDescription}</p>
                        </div>
                      </div>
                      {selectedVoice.id === v.id && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dynamic Category Tone Strip */}
            <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-[11px] flex items-center justify-between">
              <span className="text-neutral-300 truncate">
                <strong className="text-cyan-300">{selectedVoice.bengaliName} ({selectedGender === 'male' ? 'ছেলে' : 'মেয়ে'})</strong>: {selectedVoice.bengaliDescription}
              </span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ml-2 ${
                selectedGender === 'male'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                  : 'bg-pink-500/20 text-pink-300 border border-pink-400/30'
              }`}>
                {toneOptions[toneIndex]?.label.split(' ')[0]} টোন
              </span>
            </div>
          </div>

          {/* Speed & Tone Controls */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="liquid-glass-card-subtle rounded-xl p-2 flex flex-col justify-between bg-white/5 border border-white/5">
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

            <div className="liquid-glass-card-subtle rounded-xl p-2 flex flex-col justify-between bg-white/5 border border-white/5">
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
                <span>ভয়েস প্রস্তুত হচ্ছে...</span>
              </div>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white text-white" />
                <span>ভয়েস জেনারেট করুন ({selectedGender === 'male' ? 'ছেলে কণ্ঠ' : 'মেয়ে কণ্ঠ'})</span>
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

          {/* Quota Exhaustion Helper Banner */}
          {showQuotaNotice && !hasApiKey && (
            <div className="mt-3 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start justify-between gap-3 animate-fade-in text-xs">
              <div className="flex items-start gap-2.5 text-amber-200/90 leading-relaxed">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-300">শেয়ার্ড কোটা সীমাবদ্ধ — ফরম্যান্ট-প্রিজার্ভড ইঞ্জিন সক্রিয়</p>
                  <p className="text-[11px] text-neutral-300 mt-1">
                    আপনার অডিও সফলভাবে ফরম্যান্ট-সংরক্ষিত ন্যাচারাল ইঞ্জিনের মাধ্যমে প্রস্তুত হয়েছে। আনলিমিটেড স্টুডিও কোয়ালিটির জন্য যেকোনো সময় বিনামূল্যে নিজস্ব Gemini API Key যুক্ত করতে পারেন।
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowKeyModal(true)}
                    className="mt-2.5 px-3 py-1 bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/40 rounded-lg text-amber-200 font-medium cursor-pointer transition-colors inline-flex items-center gap-1.5"
                  >
                    <Key className="w-3 h-3 text-amber-300" />
                    <span>ফ্রি Gemini API Key সেট করুন</span>
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQuotaNotice(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white cursor-pointer"
                title="বন্ধ করুন"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </section>

      </div>
    </div>
  );
};
