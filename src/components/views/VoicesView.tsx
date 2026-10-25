import React, { useState } from 'react';
import { Search, Play, Check, ArrowRight, Sparkles, Square, UserCheck } from 'lucide-react';
import { VOICES_CATALOG } from '../../data/voices';
import { Voice, VoiceUseCase, SupportedLanguageCode, VoiceGender } from '../../types';
import { playRealVoicePreview, stopVoicePreview } from '../../services/audioService';

interface VoicesViewProps {
  selectedVoice: Voice;
  onSelectVoice: (voice: Voice) => void;
  onNavigateHome: () => void;
  selectedUseCase?: VoiceUseCase;
  onSelectUseCase?: (uc: VoiceUseCase) => void;
  currentLanguageCode?: SupportedLanguageCode;
}

export const VoicesView: React.FC<VoicesViewProps> = ({
  selectedVoice,
  onSelectVoice,
  onNavigateHome,
  selectedUseCase,
  onSelectUseCase,
  currentLanguageCode = 'bn',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [activeGender, setActiveGender] = useState<'all' | VoiceGender>('all');
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);

  const filterTabs = [
    { id: 'all', label: 'সব মডেল (All)' },
    { id: 'ad', label: '📢 বিজ্ঞাপন (Ad)' },
    { id: 'news', label: '🎙️ সংবাদ (News)' },
    { id: 'product', label: '📦 প্রোডাক্ট (Product)' },
    { id: 'kids', label: '🧸 শিশুদের কার্টুন (Kids)' },
    { id: 'woodcutter', label: '🪓 কাঠুরের গল্প (Story)' },
    { id: 'podcast', label: '🎧 পডকাস্ট (Podcast)' },
  ];

  const filteredVoices = VOICES_CATALOG.filter((voice) => {
    const matchesCategory = activeFilter === 'all' || voice.useCase === activeFilter;
    const matchesGender = activeGender === 'all' || voice.gender === activeGender;
    const matchesSearch = 
      voice.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voice.bengaliName.includes(searchTerm) ||
      (voice.hindiName && voice.hindiName.includes(searchTerm)) ||
      voice.categoryLabel.includes(searchTerm) ||
      voice.useCaseLabel.includes(searchTerm);
    return matchesCategory && matchesGender && matchesSearch;
  });

  const handlePlaySample = async (voice: Voice) => {
    if (playingVoiceId === voice.id) {
      stopVoicePreview();
      setPlayingVoiceId(null);
      setPreviewLoading(false);
      return;
    }

    setPlayingVoiceId(voice.id);
    setPreviewLoading(true);

    const sampleText = voice.sampleTexts[currentLanguageCode] || voice.sampleTexts.bn;

    await playRealVoicePreview({
      text: sampleText,
      voice,
      languageCode: currentLanguageCode,
      useCase: voice.useCase,
      onStart: () => {
        setPreviewLoading(false);
      },
      onEnd: () => {
        setPlayingVoiceId(null);
        setPreviewLoading(false);
      },
      onError: () => {
        setPlayingVoiceId(null);
        setPreviewLoading(false);
      },
    });
  };

  return (
    <div className="w-full flex flex-col items-center pb-24 md:pb-10 pt-2">
      <div className="w-full max-w-[460px] md:max-w-4xl lg:max-w-5xl px-4 sm:px-6">
        
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 font-medium">
              Google Gemini AI Neural Speech Studio
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">
            ভয়েস মডেল ও লাইব্রেরি (ছেলে ও মেয়ে উভয় অপশন)
          </h1>
          <p className="text-xs text-neutral-400">
            বিজ্ঞাপন, সংবাদ, প্রোডাক্ট, কার্টুন, লোকগাথা ও পডকাস্ট—প্রতিটি বিষয়ের জন্য আলাদা ছেলে ও মেয়ে কণ্ঠ বেছে নিন।
          </p>
        </div>

        {/* Gender Filter Buttons */}
        <div className="flex items-center justify-between gap-2 mb-3 bg-black/40 p-1.5 rounded-2xl border border-white/10">
          <div className="flex items-center gap-1.5 text-xs text-neutral-300 pl-1">
            <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold text-white">জেন্ডার ফিল্টার:</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveGender('all')}
              className={`px-3 py-1 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                activeGender === 'all'
                  ? 'bg-white/20 text-white font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              সবগুলো
            </button>
            <button
              onClick={() => setActiveGender('male')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                activeGender === 'male'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <span>👦</span>
              <span>ছেলে (Male)</span>
            </button>
            <button
              onClick={() => setActiveGender('female')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                activeGender === 'female'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <span>👧</span>
              <span>মেয়ে (Female)</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-3.5">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="বিজ্ঞাপন, সংবাদ, প্রোডাক্ট, কার্টুন, ছেলে বা মেয়ের নাম খুঁজুন..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full liquid-glass-input h-11 pl-10 pr-4 rounded-2xl text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                activeFilter === tab.id
                  ? 'liquid-glass-button bg-cyan-500/20 text-cyan-200 border-cyan-400/50 shadow-md font-semibold'
                  : 'bg-white/5 text-neutral-400 hover:text-white border border-white/5 hover:border-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Voice Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredVoices.map((voice) => {
            const isSelected = selectedVoice.id === voice.id;
            const isPlaying = playingVoiceId === voice.id;

            return (
              <div
                key={voice.id}
                className={`liquid-glass-card rounded-2xl p-4 transition-all flex flex-col justify-between ${
                  isSelected ? 'border-cyan-400/50 bg-cyan-500/10 shadow-lg shadow-cyan-950/40' : 'hover:border-white/20'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between mb-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/15 flex items-center justify-center text-2xl shadow-inner">
                        {voice.avatar}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm sm:text-base text-white">
                            {voice.bengaliName} ({voice.name})
                          </h3>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                            voice.gender === 'male'
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30'
                              : 'bg-pink-500/20 text-pink-300 border-pink-400/30'
                          }`}>
                            {voice.gender === 'male' ? 'ছেলে' : 'মেয়ে'}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          {voice.useCaseLabel} · Gemini AI
                        </p>
                      </div>
                    </div>

                    {/* Real AI Preview Audition Button */}
                    <button
                      onClick={() => handlePlaySample(voice)}
                      className={`w-9 h-9 rounded-xl liquid-glass-button flex items-center justify-center transition-colors cursor-pointer ${
                        isPlaying ? 'bg-cyan-500/30 text-cyan-200 border-cyan-400/60 shadow-[0_0_12px_rgba(56,189,248,0.4)]' : 'text-neutral-200'
                      }`}
                      title={isPlaying ? 'বিরতি দিন' : 'নমুনা শুনুন'}
                    >
                      {isPlaying ? (
                        previewLoading ? (
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-cyan-300 rounded-full animate-spin" />
                        ) : (
                          <Square className="w-3.5 h-3.5 fill-cyan-300 text-cyan-300" />
                        )
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-white text-white ml-0.5" />
                      )}
                    </button>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-neutral-300 mb-2 leading-relaxed">
                    {voice.bengaliDescription}
                  </p>

                  {/* Sample transcript quote */}
                  <div className="bg-black/40 rounded-xl p-2.5 border border-white/5 text-[11px] text-neutral-300 italic mb-3">
                    "{voice.sampleTexts[currentLanguageCode] || voice.sampleTexts.bn}"
                  </div>
                </div>

                {/* Card Action footer */}
                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <span className="text-[11px] text-cyan-300 font-mono flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    <span>24 kHz WAV অডিও</span>
                  </span>

                  <button
                    onClick={() => {
                      onSelectVoice(voice);
                      if (onSelectUseCase) onSelectUseCase(voice.useCase);
                      onNavigateHome();
                    }}
                    className={`liquid-glass-button px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                      isSelected ? 'bg-cyan-500/25 text-cyan-200 border-cyan-400/50' : 'text-white'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-cyan-400" />
                        <span>নির্বাচিত মডেল</span>
                      </>
                    ) : (
                      <>
                        <span>মডেল ব্যবহার করুন</span>
                        <ArrowRight className="w-3 h-3" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
