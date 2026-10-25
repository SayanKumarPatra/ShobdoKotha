import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ 
  className = '', 
  size = 'md',
  showSubtitle = true 
}) => {
  const isLarge = size === 'lg';
  const isSmall = size === 'sm';

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Minimal audio waveform symbol with subtle cyan/purple gradient */}
      <div className="flex items-center gap-[3px] h-7 shrink-0">
        <span className="w-[3px] h-3.5 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
        <span className="w-[3.5px] h-6 bg-gradient-to-b from-cyan-300 to-indigo-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
        <span className="w-[3.5px] h-7 bg-gradient-to-b from-blue-400 to-purple-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
        <span className="w-[3.5px] h-5 bg-gradient-to-b from-indigo-300 to-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '450ms' }} />
        <span className="w-[3px] h-3 bg-gradient-to-b from-purple-400 to-blue-400 rounded-full animate-pulse" style={{ animationDelay: '600ms' }} />
      </div>

      {/* Brand Name Lockup */}
      <div className="flex flex-col leading-none">
        <div className={`flex items-baseline font-bold tracking-tight ${
          isLarge ? 'text-2xl' : isSmall ? 'text-lg' : 'text-xl'
        }`}>
          {/* Bengali part: শব্দ */}
          <span className="text-white font-extrabold tracking-wide" style={{ fontFamily: 'var(--font-bengali)' }}>
            শব্দ
          </span>
          {/* English part: Kotha */}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-cyan-300 font-semibold" style={{ fontFamily: 'var(--font-english)' }}>
            Kotha
          </span>
        </div>
        
        {showSubtitle && (
          <span className="text-[10px] sm:text-[11px] font-normal tracking-wider text-neutral-400 mt-0.5" style={{ fontFamily: 'var(--font-english)' }}>
            AI Voice Studio
          </span>
        )}
      </div>
    </div>
  );
};
