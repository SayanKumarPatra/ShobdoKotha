import React from 'react';

interface StudioMicrophoneProps {
  isPlaying?: boolean;
  className?: string;
}

export const StudioMicrophone: React.FC<StudioMicrophoneProps> = ({ isPlaying = false, className = '' }) => {
  return (
    <div className={`relative flex items-center justify-center select-none pointer-events-none ${className}`}>
      {/* Subtle back-lighting glow when playing */}
      <div 
        className={`absolute inset-0 bg-cyan-500/10 rounded-full blur-3xl transition-opacity duration-700 ${
          isPlaying ? 'opacity-90 scale-110' : 'opacity-25'
        }`} 
      />

      {/* Acoustic wave rings when audio is playing */}
      {isPlaying && (
        <>
          <div className="absolute w-36 h-36 border border-cyan-400/20 rounded-full animate-ping duration-1000" />
          <div className="absolute w-48 h-48 border border-cyan-300/10 rounded-full animate-pulse" />
        </>
      )}

      {/* Realistic Condenser Studio Microphone with Shock Mount */}
      <div className="relative w-36 h-48 sm:w-44 sm:h-56 flex items-center justify-center">
        {/* We use an image container that crops the microphone from the asset or displays the studio mic */}
        <div className="relative w-full h-full overflow-hidden rounded-2xl flex items-center justify-center">
          <img 
            src="/assets/aistudio/image_998e457c.png" 
            alt="Professional Studio Condenser Microphone"
            referrerPolicy="no-referrer"
            className="w-[280%] max-w-none h-[280%] object-cover object-[82%_17%] drop-shadow-[0_15px_30px_rgba(0,0,0,0.9)] contrast-[1.08] brightness-[1.02]"
            onError={(e) => {
              // Graceful SVG fallback if image cannot be clipped
              const target = e.currentTarget;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                const fallback = parent.querySelector('.mic-fallback');
                if (fallback) (fallback as HTMLElement).style.display = 'flex';
              }
            }}
          />

          {/* Fallback Vector Studio Microphone if needed */}
          <div className="mic-fallback hidden absolute inset-0 items-center justify-center flex-col">
            <div className="w-16 h-28 rounded-full border border-white/20 bg-gradient-to-b from-neutral-800 via-neutral-900 to-black p-2 shadow-2xl flex flex-col items-center justify-between">
              <div className="w-12 h-14 rounded-t-full border border-white/10 bg-neutral-900 grid grid-cols-4 gap-1 p-1">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="bg-white/10 rounded-full" />
                ))}
              </div>
              <div className="w-8 h-8 rounded-full border border-white/10 bg-neutral-800 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-cyan-400/80 animate-pulse" />
              </div>
            </div>
            <div className="w-20 h-1 bg-white/20 rounded-full mt-2" />
          </div>
        </div>
      </div>
    </div>
  );
};
