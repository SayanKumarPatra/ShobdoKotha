import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Download, RotateCcw, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { GeneratedAudioItem } from '../types';

interface AudioPlayerProps {
  item: GeneratedAudioItem;
  onRegenerate?: () => void;
  className?: string;
  autoPlay?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ 
  item, 
  onRegenerate, 
  className = '',
  autoPlay = false 
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(item.duration || 0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    setAutoplayBlocked(false);

    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
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

    const onPlayEvent = () => {
      setIsPlaying(true);
      setAutoplayBlocked(false);
    };

    const onPauseEvent = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('play', onPlayEvent);
    audio.addEventListener('pause', onPauseEvent);

    if (autoPlay) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setAutoplayBlocked(false);
          })
          .catch((err) => {
            console.log('Autoplay prevented by browser:', err);
            setAutoplayBlocked(true);
          });
      }
    }

    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('play', onPlayEvent);
      audio.removeEventListener('pause', onPauseEvent);
      audio.pause();
    };
  }, [item.id, item.audioUrl, autoPlay]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play()
        .then(() => {
          setIsPlaying(true);
          setAutoplayBlocked(false);
        })
        .catch((err) => console.warn('Audio playback error:', err));
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
    const isWav = item.audioUrl.toLowerCase().includes('.wav');
    a.download = `shobdokotha_${item.voice.name.toLowerCase()}_${Date.now()}.${isWav ? 'wav' : 'mp3'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`liquid-glass-card rounded-2xl p-4 sm:p-5 text-white shadow-2xl border border-cyan-500/30 ${className}`}>
      {/* Real audio element */}
      <audio ref={audioRef} src={item.audioUrl} preload="auto" playsInline />

      {/* Autoplay blocked alert helper */}
      {autoplayBlocked && !isPlaying && (
        <div className="mb-3 p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-between text-xs animate-pulse">
          <span className="text-cyan-200 font-medium">✨ আপনার ভয়েস প্রস্তুত! শুনতে নিচে ক্লিক করুন:</span>
          <button
            onClick={togglePlay}
            className="px-3 py-1 bg-cyan-400 text-black font-semibold rounded-lg text-[11px] hover:bg-cyan-300 transition-colors"
          >
            ▶ প্লে করুন
          </button>
        </div>
      )}

      {/* Header Info */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-400/30 flex items-center justify-center text-xl shadow-inner">
            {item.voice.avatar}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm text-white">
                {item.voice.bengaliName} ({item.voice.name})
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 font-medium">
                Gemini 3.8 Neural Speech
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              {item.speed}x গতি · {item.tone} · {item.voice.useCaseLabel} · {item.language}
            </p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1.5">
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              title="পুনরায় তৈরি করুন"
              className="p-2 rounded-xl text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handleDownload}
            title="WAV অডিও ডাউনলোড করুন"
            className="p-2 rounded-xl text-cyan-300 hover:text-cyan-200 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/20 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Live Audio Visualizer Wave Bars */}
      <div className="h-11 my-3 flex items-center justify-center gap-1 px-2 bg-black/50 rounded-xl border border-cyan-500/20 overflow-hidden">
        {Array.from({ length: 32 }).map((_, i) => {
          const barHeight = isPlaying 
            ? Math.max(18, (Math.sin(i * 0.4 + currentTime * 8) * 0.5 + 0.5) * 90)
            : Math.max(12, Math.sin(i * 0.3) * 20 + 25);
          const isPassed = (i / 32) * 100 <= progressPercent;

          return (
            <div
              key={i}
              className={`w-[4px] rounded-full transition-all duration-75 ${
                isPassed 
                  ? 'bg-gradient-to-t from-cyan-400 via-blue-400 to-indigo-300 shadow-[0_0_8px_rgba(56,189,248,0.5)]' 
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
            max={duration > 0 ? duration : 10}
            step="0.05"
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyan-400"
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
          className="text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
        </button>

        {/* Central Play/Pause Liquid Glowing Button */}
        <button
          onClick={togglePlay}
          className="px-7 py-2.5 rounded-full flex items-center gap-2.5 text-white font-semibold text-sm bg-gradient-to-r from-cyan-500 via-blue-600 to-cyan-500 hover:from-cyan-400 hover:via-blue-500 hover:to-cyan-400 shadow-[0_0_20px_rgba(56,189,248,0.4)] hover:shadow-[0_0_30px_rgba(56,189,248,0.6)] transition-all cursor-pointer active:scale-95"
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4 fill-white" />
              <span>বিরতি (Pause)</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white ml-0.5" />
              <span>চালিয়ে শুনুন (Play Voice)</span>
            </>
          )}
        </button>

        <span className="text-[11px] text-cyan-300 font-medium flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>WAV অডিও</span>
        </span>
      </div>
    </div>
  );
};
