import React, { useState, useEffect } from 'react';
import { Trash2, Clock, Music, ArrowRight, Download, Sparkles } from 'lucide-react';
import { GeneratedAudioItem } from '../../types';
import { getAudioHistory, deleteHistoryItem, clearAllHistory } from '../../services/audioService';
import { AudioPlayer } from '../AudioPlayer';

interface HistoryViewProps {
  onNavigateHome: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onNavigateHome }) => {
  const [history, setHistory] = useState<GeneratedAudioItem[]>([]);

  useEffect(() => {
    setHistory(getAudioHistory());
  }, []);

  const handleDelete = (id: string) => {
    deleteHistoryItem(id);
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearAll = () => {
    if (window.confirm('আপনি কি সমস্ত ইতিহাস মুছে ফেলতে চান?')) {
      clearAllHistory();
      setHistory([]);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('bn-BD', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="w-full flex flex-col items-center pb-28 pt-2">
      <div className="w-full max-w-[430px] lg:max-w-4xl px-4 sm:px-6">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">
              প্রজন্মের ইতিহাস
            </h1>
            <p className="text-xs text-neutral-400">
              আপনার তৈরি করা পূর্ববর্তী সমস্ত অডিও রেকর্ড ও অডিও ফাইল।
            </p>
          </div>

          {history.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-3 py-1.5 rounded-xl liquid-glass-button text-xs text-red-300 hover:text-red-200 border-red-500/20 flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>সব মুছুন</span>
            </button>
          )}
        </div>

        {/* Empty State */}
        {history.length === 0 ? (
          <div className="liquid-glass-card rounded-3xl p-8 text-center flex flex-col items-center justify-center my-8">
            <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400 mb-4">
              <Clock className="w-8 h-8 text-cyan-400" />
            </div>
            <h3 className="text-base font-semibold text-white mb-1">এখনো কোনো অডিও তৈরি করা হয়নি</h3>
            <p className="text-xs text-neutral-400 max-w-xs mb-5">
              হোম পেজে টেক্সট লিখে "ভয়েস জেনারেট করুন" বাটনে ক্লিক করলেই আপনার অডিও ফাইল এখানে সংরক্ষিত হবে।
            </p>
            <button
              onClick={onNavigateHome}
              className="liquid-glass-button px-5 py-2.5 rounded-2xl text-xs font-semibold text-white flex items-center gap-2 group"
            >
              <span>প্রথম ভয়েস তৈরি করুন</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item) => (
              <div key={item.id} className="liquid-glass-card rounded-3xl p-4 sm:p-5 relative group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-lg">
                      {item.voice.avatar}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs sm:text-sm text-white">
                          {item.voice.bengaliName} ({item.voice.name})
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-neutral-300 border border-white/10">
                          {item.voice.categoryLabel}
                        </span>
                      </div>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {formatDate(item.createdAt)} · {item.speed}x গতি · {item.tone}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 rounded-lg text-neutral-500 hover:text-red-400 transition-colors"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Text excerpt */}
                <div className="bg-black/40 rounded-2xl p-3 border border-white/5 mb-3 text-xs text-neutral-300 leading-relaxed font-normal">
                  "{item.text}"
                </div>

                {/* Built-in Audio Player */}
                <AudioPlayer item={item} />
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
