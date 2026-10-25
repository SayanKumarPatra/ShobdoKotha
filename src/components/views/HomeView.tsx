import React, { useState, useRef } from 'react';
import { 
  Menu, 
  ArrowRight, 
  Play, 
  Headphones, 
  Zap, 
  Globe, 
  Sliders, 
  Crown, 
  FileText, 
  Trash2, 
  Mic, 
  Gauge, 
  Sparkles,
  ChevronDown,
  Volume2,
  Check,
  Radio,
  BookOpen,
  Megaphone
} from 'lucide-react';
import { Logo } from '../Logo';
import { StudioMicrophone } from '../StudioMicrophone';
import { AudioPlayer } from '../AudioPlayer';
import { VOICES_CATALOG, SUPPORTED_LANGUAGES, USE_CASE_PRESETS, UseCasePreset } from '../../data/voices';
import { Voice, VoiceCategory, GeneratedAudioItem, VoiceUseCase } from '../../types';
import { generateSpeechAudio } from '../../services/audioService';

interface HomeViewProps {
  onOpenMenu: () => void;
  onNavigateToVoices: () => void;
  onNavigateToHistory: () => void;
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
  onNavigateToHistory,
  onNavigateToAccount,
  selectedVoice,
  setSelectedVoice,
  selectedLanguage,
  setSelectedLanguage,
  selectedUseCase,
  setSelectedUseCase,
}) => {
  const [text, setText] = useState<string>('এক নদীর ধারে বাস করত এক সৎ কাঠুরে। একদিন বনে কাঠ কাটতে গিয়ে তার লোহার কুঠারটি গভীর নদীতে পড়ে গেল...');
  const [speed, setSpeed] = useState<number>(1.0);
  const [toneIndex, setToneIndex] = useState<number>(0);
  const [activeCategory, setActiveCategory] = useState<VoiceCategory>('all');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedAudio, setGeneratedAudio] = useState<GeneratedAudioItem | null>(null);
  const [activePreviewVoiceId, setActivePreviewVoiceId] = useState<string | null>(null);
  
  // Dropdown states
  const [isVoiceDropdownOpen, setIsVoiceDropdownOpen] = useState<boolean>(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState<boolean>(false);

  const textPanelRef = useRef<HTMLDivElement | null>(null);

  const toneOptions = [
    { label: 'সাধারণ', value: 'normal' },
    { label: 'উষ্ণ', value: 'warm' },
    { label: 'গম্ভীর', value: 'deep' },
    { label: 'নাটকীয়', value: 'expressive' },
  ];

  const categoryFilters: { id: VoiceCategory; label: string }[] = [
    { id: 'all', label: 'সব কণ্ঠ' },
    { id: 'male', label: 'পুরুষ কণ্ঠ' },
    { id: 'female', label: 'নারী কণ্ঠ' },
    { id: 'child', label: 'শিশু কণ্ঠ' },
    { id: 'friendly', label: 'বন্ধুত্বপূর্ণ' },
    { id: 'story', label: 'গল্প' },
  ];

  const filteredVoices = VOICES_CATALOG.filter((voice) => {
    if (activeCategory === 'all') return true;
    return voice.category === activeCategory;
  });

  // Handle Preset selection (Ad, Woodcutter Story, News, etc.)
  const handleSelectPreset = (preset: UseCasePreset) => {
    setSelectedUseCase(preset.id);
    setText(preset.sampleText);
    const recVoice = VOICES_CATALOG.find((v) => v.id === preset.recommendedVoiceId);
    if (recVoice) {
      setSelectedVoice(recVoice);
    }
  };

  // Smooth scroll to editor
  const handleStartNow = () => {
    if (textPanelRef.current) {
      textPanelRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const textarea = textPanelRef.current.querySelector('textarea');
      if (textarea) textarea.focus();
    }
  };

  // Play sample voice demo cleanly using speech synthesis (NO buzz / hum)
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

  // Voice Generation Handler
  const handleGenerate = async () => {
    if (!text.trim()) {
      alert('অনুগ্রহ করে কিছু টেক্সট লিখুন');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateSpeechAudio({
        text,
        voice: selectedVoice,
        speed,
        tone: toneOptions[toneIndex].label,
        useCase: selectedUseCase,
      });
      setGeneratedAudio(result);
    } catch (error) {
      console.error('Generation failed:', error);
      alert('ভয়েস তৈরিতে সমস্যা হয়েছে, দয়া করে পুনরায় চেষ্টা করুন।');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center pb-28 pt-2">
      {/* Container expands naturally on desktop, perfectly sized on mobile */}
      <div className="w-full max-w-[430px] md:max-w-4xl lg:max-w-5xl px-4 sm:px-6 liquid-water-refraction">
        
        {/* ========================================================= */}
        {/* SECTION 1: TOP HEADER                                     */}
        {/* ========================================================= */}
        <header className="flex items-center justify-between py-3 mb-2 md:hidden">
          <Logo size="md" showSubtitle={true} />
          <button
            onClick={onOpenMenu}
            aria-label="Open Navigation Menu"
            className="w-11 h-11 rounded-2xl liquid-glass-button flex items-center justify-center text-white/90 hover:text-white"
          >
            <Menu className="w-5 h-5 stroke-[2.2]" />
          </button>
        </header>

        {/* ========================================================= */}
        {/* SECTION 2: HERO AREA                                      */}
        {/* ========================================================= */}
        <section className="relative pt-2 pb-5 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

          <div className="grid grid-cols-12 gap-3 items-center">
            {/* Left Content Column */}
            <div className="col-span-8 sm:col-span-8 pr-1">
              <div className="mb-2">
                <span className="text-[10px] sm:text-[11px] font-semibold tracking-widest uppercase text-neutral-400 font-mono">
                  TURN YOUR WORDS INTO VOICE
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-tight mb-2 tracking-tight">
                তোমার লেখা
                <br />
                এখন <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-white drop-shadow-[0_0_15px_rgba(56,189,248,0.4)]">জীবন্ত কণ্ঠ</span>
              </h1>

              <div className="text-xs sm:text-[13px] text-neutral-300 font-medium mb-1.5 flex items-center gap-1.5 flex-wrap">
                <span>Text to Speech</span>
                <span className="text-neutral-500">·</span>
                <span>AI Voice</span>
                <span className="text-neutral-500">·</span>
                <span>Natural Sound</span>
              </div>

              <p className="text-[11.5px] sm:text-xs text-neutral-400 leading-relaxed max-w-sm">
                বাংলা, ইংরেজি এবং ৫০+ ভাষায় একদম নিখুঁত, মানবিক ও স্পষ্ট AI কণ্ঠ তৈরি করুন। বিজ্ঞাপন, গল্প কিংবা সংবাদ—সবকিছুর জন্য আলাদা মডেল।
              </p>
            </div>

            {/* Right Side: Studio Microphone Visual */}
            <div className="col-span-4 sm:col-span-4 flex justify-end items-center relative">
              <StudioMicrophone isPlaying={isGenerating || activePreviewVoiceId !== null} />
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* DEDICATED USE-CASE PRESETS (এডভারটাইজ, কাঠুরে, সংবাদ)    */}
        {/* ========================================================= */}
        <section className="mb-5">
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>উদ্দেশ্য ভিত্তিক স্পেশাল ভয়েস মডেল (ক্লিক করে টেস্ট করুন):</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {USE_CASE_PRESETS.map((preset) => {
              const isSelected = selectedUseCase === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`p-2.5 rounded-2xl text-left transition-all relative overflow-hidden group cursor-pointer ${
                    isSelected
                      ? 'liquid-glass-button bg-cyan-500/20 border-cyan-400/50 shadow-[0_0_20px_rgba(56,189,248,0.25)]'
                      : 'liquid-glass-card-subtle hover:border-white/25 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">{preset.icon}</span>
                    <span className="text-xs font-bold text-white truncate">{preset.title}</span>
                  </div>
                  <p className="text-[10px] text-neutral-400 line-clamp-2 leading-tight">
                    {preset.description}
                  </p>
                  {isSelected && (
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 3: TWO MAIN GLASS BUTTONS                         */}
        {/* ========================================================= */}
        <section className="grid grid-cols-2 gap-3 mb-5">
          <button
            onClick={handleStartNow}
            className="liquid-glass-button h-13 px-3 rounded-2xl flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/20 shadow-inner group-hover:scale-105 transition-transform">
                <Play className="w-3.5 h-3.5 fill-white text-white ml-0.5" />
              </div>
              <span className="text-xs sm:text-[13px] font-semibold text-white whitespace-nowrap">
                এখনই শুরু করুন
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-neutral-300 group-hover:translate-x-1 transition-transform shrink-0" />
          </button>

          <button
            onClick={() => handlePlayVoicePreview(selectedVoice)}
            className="liquid-glass-button h-13 px-3 rounded-2xl flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/20 shadow-inner group-hover:scale-105 transition-transform">
                <Headphones className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs sm:text-[13px] font-semibold text-white whitespace-nowrap">
                {activePreviewVoiceId ? 'বিরতি দিন' : 'ডেমো শুনুন'}
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-neutral-300 group-hover:translate-x-1 transition-transform shrink-0" />
          </button>
        </section>

        {/* ========================================================= */}
        {/* SECTION 4: FOUR FEATURE CARDS                             */}
        {/* ========================================================= */}
        <section className="grid grid-cols-4 gap-2 mb-5">
          <div className="liquid-glass-card rounded-2xl p-2.5 flex flex-col sm:flex-row items-center gap-1.5 text-center sm:text-left">
            <div className="w-7 h-7 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
              <Zap className="w-3.5 h-3.5 text-white fill-white" />
            </div>
            <span className="text-[10px] sm:text-[11px] font-medium text-neutral-200 leading-tight">
              Ultra Realistic AI
            </span>
          </div>

          <div className="liquid-glass-card rounded-2xl p-2.5 flex flex-col sm:flex-row items-center gap-1.5 text-center sm:text-left">
            <div className="w-7 h-7 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
              <Globe className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-[10px] sm:text-[11px] font-medium text-neutral-200 leading-tight">
              50+ Languages
            </span>
          </div>

          <div className="liquid-glass-card rounded-2xl p-2.5 flex flex-col sm:flex-row items-center gap-1.5 text-center sm:text-left">
            <div className="w-7 h-7 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
              <Sliders className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-[10px] sm:text-[11px] font-medium text-neutral-200 leading-tight">
              Easy Customization
            </span>
          </div>

          <div className="liquid-glass-card rounded-2xl p-2.5 flex flex-col sm:flex-row items-center gap-1.5 text-center sm:text-left">
            <div className="w-7 h-7 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
              <Crown className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-[10px] sm:text-[11px] font-medium text-neutral-200 leading-tight">
              High Quality Audio
            </span>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 5: TEXT INPUT PANEL & CORE CONTROLS               */}
        {/* ========================================================= */}
        <section ref={textPanelRef} className="liquid-glass-card rounded-3xl p-4 sm:p-5 mb-5 relative glass-rim-sheen">
          <div className="flex items-center justify-between mb-3 text-white">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-neutral-300" />
              <span className="font-semibold text-sm">টেক্সট লিখুন</span>
            </div>
            <span className="text-xs text-neutral-400 font-mono">
              {text.length}/5000
            </span>
          </div>

          <div className="liquid-glass-input rounded-2xl p-3 mb-4 relative focus-within:border-cyan-400/40 transition-colors">
            <textarea
              rows={4}
              maxLength={5000}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="এখানে আপনার লেখা লিখুন..."
              className="w-full bg-transparent text-white placeholder-neutral-500 text-sm focus:outline-none resize-none leading-relaxed"
              style={{ fontFamily: 'var(--font-bengali)' }}
            />
            <div className="flex justify-end mt-1">
              <button
                type="button"
                onClick={() => setText('')}
                className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white px-2 py-1 rounded-lg hover:bg-white/5 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </button>
            </div>
          </div>

          {/* ========================================================= */}
          {/* SECTION 6: VOICE AND LANGUAGE SELECTORS                   */}
          {/* ========================================================= */}
          <div className="grid grid-cols-2 gap-3 mb-3 relative">
            {/* 1. কণ্ঠ নির্বাচন */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsVoiceDropdownOpen(!isVoiceDropdownOpen);
                  setIsLangDropdownOpen(false);
                }}
                className="w-full liquid-glass-button h-11 px-3 rounded-2xl flex items-center justify-between text-xs text-neutral-200"
              >
                <div className="flex items-center gap-2 truncate">
                  <Mic className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span className="truncate">{selectedVoice.bengaliName} ({selectedVoice.useCaseLabel})</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 shrink-0 transition-transform ${isVoiceDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isVoiceDropdownOpen && (
                <div className="absolute top-12 left-0 right-0 z-30 liquid-glass-card rounded-2xl p-2 max-h-60 overflow-y-auto space-y-1 shadow-2xl">
                  {VOICES_CATALOG.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => {
                        setSelectedVoice(v);
                        setIsVoiceDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors ${
                        selectedVoice.id === v.id ? 'bg-white/15 text-white font-semibold' : 'text-neutral-300 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span>{v.avatar}</span>
                        <div className="truncate">
                          <p className="truncate">{v.bengaliName} ({v.name})</p>
                          <p className="text-[10px] text-cyan-300">{v.useCaseLabel}</p>
                        </div>
                      </div>
                      {selectedVoice.id === v.id && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 2. বাংলা (Bangla) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsLangDropdownOpen(!isLangDropdownOpen);
                  setIsVoiceDropdownOpen(false);
                }}
                className="w-full liquid-glass-button h-11 px-3 rounded-2xl flex items-center justify-between text-xs text-neutral-200"
              >
                <div className="flex items-center gap-2 truncate">
                  <Globe className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span className="truncate">{selectedLanguage}</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 shrink-0 transition-transform ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isLangDropdownOpen && (
                <div className="absolute top-12 left-0 right-0 z-30 liquid-glass-card rounded-2xl p-2 max-h-56 overflow-y-auto space-y-1 shadow-2xl">
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        setSelectedLanguage(lang.nativeName);
                        setIsLangDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors ${
                        selectedLanguage === lang.nativeName ? 'bg-white/15 text-white font-semibold' : 'text-neutral-300 hover:bg-white/5'
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

          {/* ========================================================= */}
          {/* SECTION 7: CUSTOMIZATION CONTROLS                         */}
          {/* ========================================================= */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="liquid-glass-card-subtle rounded-2xl p-2.5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-neutral-300 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-neutral-400" />
                  <span>গতি</span>
                </div>
                <span className="font-mono text-[11px] text-white font-medium">{speed.toFixed(1)}x</span>
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

            <div className="liquid-glass-card-subtle rounded-2xl p-2.5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-neutral-300 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-neutral-400" />
                  <span>টোন</span>
                </div>
                <span className="text-[11px] text-white font-medium">{toneOptions[toneIndex].label}</span>
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

          {/* ========================================================= */}
          {/* SECTION 8: GENERATE BUTTON                                */}
          {/* ========================================================= */}
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/30 via-sky-400/15 to-blue-600/30 blur-xl rounded-2xl opacity-75 group-hover:opacity-100 transition-opacity -z-10" />

            <button
              type="button"
              disabled={isGenerating}
              onClick={handleGenerate}
              className={`w-full liquid-glass-button h-13 rounded-2xl flex items-center justify-center gap-2 text-white font-semibold text-sm sm:text-base shadow-2xl relative overflow-hidden group border border-white/25 hover:border-cyan-400/50 ${
                isGenerating ? 'opacity-80 cursor-wait' : 'cursor-pointer'
              }`}
            >
              <div className="absolute top-0 left-0 w-16 h-full bg-gradient-to-r from-cyan-400/20 to-transparent pointer-events-none" />
              <div className="absolute top-0 right-0 w-16 h-full bg-gradient-to-l from-blue-400/20 to-transparent pointer-events-none" />
              <div className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full duration-1000 transition-transform pointer-events-none" />

              {isGenerating ? (
                <div className="flex items-center gap-2.5">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>প্রাকৃতিক মানবিক কণ্ঠে তৈরি হচ্ছে...</span>
                </div>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white text-white" />
                  <span>ভয়েস জেনারেট করুন</span>
                  <Sparkles className="w-4 h-4 text-cyan-300" />
                </>
              )}
            </button>
          </div>

          {/* Generated Audio Player */}
          {generatedAudio && (
            <div className="mt-4 animate-fade-in">
              <AudioPlayer 
                item={generatedAudio} 
                onRegenerate={handleGenerate} 
              />
            </div>
          )}
        </section>

        {/* ========================================================= */}
        {/* SECTION 9: VOICE CATEGORY FILTERS                         */}
        {/* ========================================================= */}
        <section className="mb-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categoryFilters.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-150 ${
                  activeCategory === cat.id
                    ? 'liquid-glass-button bg-white/15 text-white border-white/30 shadow-md'
                    : 'bg-white/5 text-neutral-400 hover:text-white border border-white/5 hover:border-white/10'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 10: POPULAR VOICES (🔥 জনপ্রিয় কণ্ঠসমূহ)          */}
        {/* ========================================================= */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white flex items-center gap-1.5">
              <span>🔥</span>
              <span>জনপ্রিয় কণ্ঠসমূহ ও ক্যাটাগরি</span>
            </h2>
            <button
              onClick={onNavigateToVoices}
              className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              সবগুলো দেখুন →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {filteredVoices.slice(0, 4).map((voice) => {
              const isSelected = selectedVoice.id === voice.id;
              const isPlayingPreview = activePreviewVoiceId === voice.id;

              return (
                <div
                  key={voice.id}
                  onClick={() => setSelectedVoice(voice)}
                  className={`liquid-glass-card rounded-2xl p-3 flex items-center justify-between cursor-pointer transition-all ${
                    isSelected ? 'border-cyan-400/40 bg-white/10 shadow-lg' : 'hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xl shrink-0">
                      {voice.avatar}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs sm:text-sm text-white truncate">
                          {voice.bengaliName}
                        </span>
                        <span className="text-[10px] bg-cyan-400/20 text-cyan-300 px-1.5 py-0.5 rounded-full border border-cyan-400/30">
                          {voice.useCaseLabel}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                        {voice.language} · {voice.categoryLabel}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayVoicePreview(voice);
                    }}
                    className="w-9 h-9 rounded-xl liquid-glass-button flex items-center justify-center text-white/90 hover:text-white shrink-0"
                    title="নমুনা শুনুন"
                  >
                    {isPlayingPreview ? (
                      <div className="w-3 h-3 bg-cyan-400 rounded-sm animate-pulse" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-white text-white ml-0.5" />
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
