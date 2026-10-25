import React, { useState } from 'react';
import { Search, Play, Pause, Check, Volume2, ArrowRight, Sparkles } from 'lucide-react';
import { VOICES_CATALOG } from '../../data/voices';
import { Voice, VoiceCategory, VoiceUseCase } from '../../types';

interface VoicesViewProps {
  selectedVoice: Voice;
  onSelectVoice: (voice: Voice) => void;
  onNavigateHome: () => void;
  selectedUseCase?: VoiceUseCase;
  onSelectUseCase?: (uc: VoiceUseCase) => void;
}

export const VoicesView: React.FC<VoicesViewProps> = ({
  selectedVoice,
  onSelectVoice,
  onNavigateHome,
  selectedUseCase,
  onSelectUseCase,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);

  const filterTabs = [
    { id: 'all', label: 'সব মডেল' },
    { id: 'ad', label: '📢 বিজ্ঞাপন স্পেশাল' },
    { id: 'woodcutter', label: '🪓 কাঠুরের গল্প' },
    { id: 'news', label: '🎙️ সংবাদ বুলেটিন' },
    { id: 'podcast', label: '🎧 পডকাস্ট আরজে' },
    { id: 'kids', label: '🧸 ছোটদের গল্প' },
  ];

  const filteredVoices = VOICES_CATALOG.filter((voice) => {
    const matchesFilter = activeFilter === 'all' || voice.useCase === activeFilter;
    const matchesSearch = 
      voice.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voice.bengaliName.includes(searchTerm) ||
      voice.language.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voice.categoryLabel.includes(searchTerm) ||
      voice.useCaseLabel.includes(searchTerm);
    return matchesFilter && matchesSearch;
  });

  const handlePlaySample = (voice: Voice) => {
    if (playingVoiceId === voice.id) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setPlayingVoiceId(null);
      return;
    }

    setPlayingVoiceId(voice.id);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(voice.sampleText);
      utter.pitch = voice.pitch;
      utter.rate = voice.rate;
      utter.lang = voice.langCode;
      
      const voices = window.speechSynthesis.getVoices();
      const matched = voices.find(v => v.lang.startsWith(voice.langCode.split('-')[0])) || voices[0];
      if (matched) utter.voice = matched;

      utter.onend = () => setPlayingVoiceId(null);
      utter.onerror = () => setPlayingVoiceId(null);
      window.speechSynthesis.speak(utter);
    } else {
      setTimeout(() => setPlayingVoiceId(null), 3000);
    }
  };

  return (
    <div className="w-full flex flex-col items-center pb-28 pt-2">
      <div className="w-full max-w-[430px] md:max-w-4xl lg:max-w-5xl px-4 sm:px-6">
        
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">
            ভয়েস মডেল ও লাইব্রেরি
          </h1>
          <p className="text-xs text-neutral-400">
            বিজ্ঞাপন, কাঠুরের গল্প, সংবাদ কিংবা পডকাস্ট—আপনার প্রয়োজনীয় কাজের জন্য সঠিক মডেলটি নির্বাচন করুন।
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-3.5">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="বিজ্ঞাপন, কাঠুরে, সংবাদ বা কণ্ঠের নাম খুঁজুন..."
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
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                activeFilter === tab.id
                  ? 'liquid-glass-button bg-cyan-500/20 text-cyan-200 border-cyan-400/40 shadow-md font-semibold'
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
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 font-medium">
                            {voice.useCaseLabel}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          {voice.language} · {voice.categoryLabel}
                        </p>
                      </div>
                    </div>

                    {/* Preview Audition Button */}
                    <button
                      onClick={() => handlePlaySample(voice)}
                      className={`w-9 h-9 rounded-xl liquid-glass-button flex items-center justify-center transition-colors ${
                        isPlaying ? 'bg-cyan-500/30 text-cyan-200 border-cyan-400/60' : 'text-neutral-200'
                      }`}
                      title={isPlaying ? 'বিরতি দিন' : 'নমুনা শুনুন'}
                    >
                      {isPlaying ? (
                        <Pause className="w-3.5 h-3.5 fill-cyan-300 text-cyan-300" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-white text-white ml-0.5" />
                      )}
                    </button>
                  </div>

                  {/* Bengali description */}
                  <p className="text-xs text-neutral-300 mb-2 leading-relaxed">
                    {voice.bengaliDescription}
                  </p>

                  {/* Sample transcript quote */}
                  <div className="bg-black/40 rounded-xl p-2.5 border border-white/5 text-[11px] text-neutral-300 italic mb-3">
                    "{voice.sampleText}"
                  </div>
                </div>

                {/* Card Action footer */}
                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <span className="text-[11px] text-neutral-400 font-mono">
                    স্যাম্পল রেট: 44.1 kHz
                  </span>

                  <button
                    onClick={() => {
                      onSelectVoice(voice);
                      if (onSelectUseCase) onSelectUseCase(voice.useCase);
                      onNavigateHome();
                    }}
                    className={`liquid-glass-button px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 ${
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
