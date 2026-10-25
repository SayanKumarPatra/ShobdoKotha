import React from 'react';
import { Home, Mic, Clock, User } from 'lucide-react';
import { ActiveTab } from '../types';

interface BottomNavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="fixed bottom-3 left-3 right-3 z-40 max-w-[410px] mx-auto md:hidden select-none">
      {/* Radiant liquid water ambient backlight aura */}
      <div className="absolute -inset-2 bg-gradient-to-t from-cyan-500/35 via-sky-400/20 to-transparent blur-2xl rounded-full -z-10 pointer-events-none animate-pulse" style={{ animationDuration: '3.5s' }} />
      <div className="absolute -inset-1 bg-cyan-400/20 blur-lg rounded-full -z-10 pointer-events-none" />

      {/* Floating Apple Liquid Water Glass Container */}
      <div className="apple-liquid-water-nav rounded-[28px] p-2 flex items-center justify-around">
        
        {/* 1. হোম (Home) */}
        <button
          type="button"
          onClick={() => setActiveTab('home')}
          className={`relative flex flex-col items-center justify-center py-2 px-4 rounded-[20px] transition-all duration-300 cursor-pointer ${
            activeTab === 'home'
              ? 'text-white scale-[1.03]'
              : 'text-neutral-400 hover:text-neutral-200 active:scale-95'
          }`}
        >
          {activeTab === 'home' && (
            <div className="apple-liquid-glow-pill absolute inset-0 rounded-[20px] -z-10 animate-fade-in" />
          )}
          <Home className={`w-5 h-5 mb-0.5 transition-transform duration-200 ${activeTab === 'home' ? 'text-cyan-200 drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]' : 'text-neutral-400'}`} />
          <span className={`text-[10.5px] font-medium tracking-tight ${activeTab === 'home' ? 'text-white font-semibold drop-shadow-[0_0_4px_rgba(255,255,255,0.6)]' : 'text-neutral-400'}`}>
            হোম
          </span>
        </button>

        {/* 2. ভয়েসেস (Voices) */}
        <button
          type="button"
          onClick={() => setActiveTab('voices')}
          className={`relative flex flex-col items-center justify-center py-2 px-4 rounded-[20px] transition-all duration-300 cursor-pointer ${
            activeTab === 'voices'
              ? 'text-white scale-[1.03]'
              : 'text-neutral-400 hover:text-neutral-200 active:scale-95'
          }`}
        >
          {activeTab === 'voices' && (
            <div className="apple-liquid-glow-pill absolute inset-0 rounded-[20px] -z-10 animate-fade-in" />
          )}
          <Mic className={`w-5 h-5 mb-0.5 transition-transform duration-200 ${activeTab === 'voices' ? 'text-cyan-200 drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]' : 'text-neutral-400'}`} />
          <span className={`text-[10.5px] font-medium tracking-tight ${activeTab === 'voices' ? 'text-white font-semibold drop-shadow-[0_0_4px_rgba(255,255,255,0.6)]' : 'text-neutral-400'}`}>
            ভয়েসেস
          </span>
        </button>

        {/* 3. ইতিহাস (History) */}
        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`relative flex flex-col items-center justify-center py-2 px-4 rounded-[20px] transition-all duration-300 cursor-pointer ${
            activeTab === 'history'
              ? 'text-white scale-[1.03]'
              : 'text-neutral-400 hover:text-neutral-200 active:scale-95'
          }`}
        >
          {activeTab === 'history' && (
            <div className="apple-liquid-glow-pill absolute inset-0 rounded-[20px] -z-10 animate-fade-in" />
          )}
          <Clock className={`w-5 h-5 mb-0.5 transition-transform duration-200 ${activeTab === 'history' ? 'text-cyan-200 drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]' : 'text-neutral-400'}`} />
          <span className={`text-[10.5px] font-medium tracking-tight ${activeTab === 'history' ? 'text-white font-semibold drop-shadow-[0_0_4px_rgba(255,255,255,0.6)]' : 'text-neutral-400'}`}>
            ইতিহাস
          </span>
        </button>

        {/* 4. আমার অ্যাকাউন্ট (My Account) */}
        <button
          type="button"
          onClick={() => setActiveTab('account')}
          className={`relative flex flex-col items-center justify-center py-2 px-4 rounded-[20px] transition-all duration-300 cursor-pointer ${
            activeTab === 'account'
              ? 'text-white scale-[1.03]'
              : 'text-neutral-400 hover:text-neutral-200 active:scale-95'
          }`}
        >
          {activeTab === 'account' && (
            <div className="apple-liquid-glow-pill absolute inset-0 rounded-[20px] -z-10 animate-fade-in" />
          )}
          <User className={`w-5 h-5 mb-0.5 transition-transform duration-200 ${activeTab === 'account' ? 'text-cyan-200 drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]' : 'text-neutral-400'}`} />
          <span className={`text-[10.5px] font-medium tracking-tight ${activeTab === 'account' ? 'text-white font-semibold drop-shadow-[0_0_4px_rgba(255,255,255,0.6)]' : 'text-neutral-400'}`}>
            আমার অ্যাকাউন্ট
          </span>
        </button>
      </div>
    </nav>
  );
};
