import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Download, RotateCcw, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { GeneratedAudioItem } from '../types';

interface AudioPlayerProps {
  item: GeneratedAudioItem;
  onRegenerate?: () => void;
  className?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ item, onRegenerate, className = '' }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(item.duration || 0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
    };
  }, [item.audioUrl]);

  // Handle Play/Pause
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      // Play real audio buffer
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        // Fallback to browser speech only if audio element failed
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utter = new SpeechSynthesisUtterance(item.text);
          utter.rate = item.speed;
          utter.pitch = item.voice.pitch;
          utter.lang = item.voice.langCode;
          utter.onend = () => setIsPlaying(false);
          utter.onerror = () => setIsPlaying(false);
          window.speechSynthesis.speak(utter);
          setIsPlaying(true);
        }
      });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = parseFloat(e.target.value);
    setCurrentTime(target);
    if (audioRef.current) {
      audioRef.current.currentTime = target;
    }
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = item.audioUrl;
    a.download = `shobdokotha_${item.voice.name.toLowerCase()}_${Date.now()}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`liquid-glass-card rounded-2xl p-4 sm:p-5 text-white ${className}`}>
      {/* Hidden audio element for real audio control */}
      <audio ref={audioRef} src={item.audioUrl} preload="auto" />

      {/* Header Info */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/15 flex items-center justify-center text-xl shadow-inner">
            {item.voice.avatar}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-white">{item.voice.bengaliName} ({item.voice.name})</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-cyan-300 border border-white/10">
                {item.voice.categoryLabel}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              {item.speed}x গতি · {item.tone}
            </p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1.5">
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              title="পুনরায় তৈরি করুন"
              className="p-2 rounded-xl text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handleDownload}
            title="অডিও ডাউনলোড করুন"
            className="p-2 rounded-xl text-cyan-300 hover:text-cyan-200 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/20 transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Live Audio Visualizer Wave Bars */}
      <div className="h-10 my-3 flex items-center justify-center gap-1 px-2 bg-black/40 rounded-xl border border-white/5 overflow-hidden">
        {Array.from({ length: 32 }).map((_, i) => {
          const barHeight = isPlaying 
            ? Math.max(15, (Math.sin(i * 0.4 + currentTime * 8) * 0.5 + 0.5) * 85)
            : Math.max(12, Math.sin(i * 0.3) * 20 + 25);
          const isPassed = (i / 32) * 100 <= progressPercent;

          return (
            <div
              key={i}
              className={`w-[4px] rounded-full transition-all duration-75 ${
                isPassed 
                  ? 'bg-gradient-to-t from-cyan-400 to-blue-300' 
                  : 'bg-white/20'
              }`}
              style={{ height: `${barHeight}%` }}
            />
          );
        })}
      </div>

      {/* Progress scrubber & time */}
      <div className="space-y-1.5">
        <div className="relative flex items-center">
          <input
            type="range"
            min="0"
            max={duration || 10}
            step="0.05"
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        <div className="flex justify-between text-[11px] text-neutral-400 font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Playback Controls Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
        <button
          onClick={() => {
            if (audioRef.current) {
              audioRef.current.muted = !isMuted;
              setIsMuted(!isMuted);
            }
          }}
          className="text-neutral-400 hover:text-white transition-colors"
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* Central Play/Pause Liquid Button */}
        <button
          onClick={togglePlay}
          className="liquid-glass-button px-6 py-2 rounded-full flex items-center gap-2 text-white font-medium text-sm group"
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4 fill-white" />
              <span>বিরতি</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>চালিয়ে শুনুন</span>
            </>
          )}
        </button>

        <span className="text-[11px] text-neutral-400 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>44.1 kHz WAV</span>
        </span>
      </div>
    </div>
  );
};
