import React from 'react';
import { Home, Mic, User } from 'lucide-react';
import { ActiveTab } from '../types';

interface BottomNavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, setActiveTab }) => {
  return (
    // Frosted dark liquid glass bottom bar with clean blur and subtle cyan specular rim
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-black/90 backdrop-blur-2xl border-t border-cyan-500/20 px-4 py-2 pb-5 md:hidden select-none shadow-[0_-10px_35px_rgba(0,0,0,0.9)]">
      <div className="max-w-[420px] mx-auto flex items-center justify-around">
        
        {/* 1. হোম (Home) */}
        <button
          type="button"
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center py-1.5 px-5 rounded-2xl transition-all duration-200 cursor-pointer ${
            activeTab === 'home'
              ? 'text-cyan-200 font-semibold bg-gradient-to-b from-cyan-500/20 to-blue-600/15 border border-cyan-400/40 shadow-[0_0_18px_rgba(56,189,248,0.3)]'
              : 'text-neutral-400 hover:text-white active:scale-95'
          }`}
        >
          <Home className={`w-5 h-5 mb-0.5 ${activeTab === 'home' ? 'text-cyan-300 drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]' : 'text-neutral-400'}`} />
          <span className="text-[11px] tracking-tight">হোম</span>
        </button>

        {/* 2. ভয়েসেস (Voices) */}
        <button
          type="button"
          onClick={() => setActiveTab('voices')}
          className={`flex flex-col items-center justify-center py-1.5 px-5 rounded-2xl transition-all duration-200 cursor-pointer ${
            activeTab === 'voices'
              ? 'text-cyan-200 font-semibold bg-gradient-to-b from-cyan-500/20 to-blue-600/15 border border-cyan-400/40 shadow-[0_0_18px_rgba(56,189,248,0.3)]'
              : 'text-neutral-400 hover:text-white active:scale-95'
          }`}
        >
          <Mic className={`w-5 h-5 mb-0.5 ${activeTab === 'voices' ? 'text-cyan-300 drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]' : 'text-neutral-400'}`} />
          <span className="text-[11px] tracking-tight">ভয়েসেস</span>
        </button>

        {/* 3. আমার অ্যাকাউন্ট (My Account) */}
        <button
          type="button"
          onClick={() => setActiveTab('account')}
          className={`flex flex-col items-center justify-center py-1.5 px-5 rounded-2xl transition-all duration-200 cursor-pointer ${
            activeTab === 'account'
              ? 'text-cyan-200 font-semibold bg-gradient-to-b from-cyan-500/20 to-blue-600/15 border border-cyan-400/40 shadow-[0_0_18px_rgba(56,189,248,0.3)]'
              : 'text-neutral-400 hover:text-white active:scale-95'
          }`}
        >
          <User className={`w-5 h-5 mb-0.5 ${activeTab === 'account' ? 'text-cyan-300 drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]' : 'text-neutral-400'}`} />
          <span className="text-[11px] tracking-tight">অ্যাকাউন্ট</span>
        </button>
      </div>
    </nav>
  );
};
