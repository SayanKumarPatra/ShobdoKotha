import React from 'react';
import { Home, Mic, User } from 'lucide-react';
import { ActiveTab } from '../types';

interface BottomNavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, setActiveTab }) => {
  return (
    // Solid dark frosted-blur bottom bar container: content cleanly blurs behind it with zero bleed-through
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-black/90 backdrop-blur-2xl border-t border-white/10 px-4 py-2 pb-5 md:hidden select-none">
      <div className="max-w-[420px] mx-auto flex items-center justify-around">
        
        {/* 1. হোম (Home) */}
        <button
          type="button"
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center py-1.5 px-5 rounded-2xl transition-all duration-200 cursor-pointer ${
            activeTab === 'home'
              ? 'text-white font-semibold bg-white/15 border border-white/20'
              : 'text-neutral-400 hover:text-white active:scale-95'
          }`}
        >
          <Home className={`w-5 h-5 mb-0.5 ${activeTab === 'home' ? 'text-white' : 'text-neutral-400'}`} />
          <span className="text-[11px] tracking-tight">হোম</span>
        </button>

        {/* 2. ভয়েসেস (Voices) */}
        <button
          type="button"
          onClick={() => setActiveTab('voices')}
          className={`flex flex-col items-center justify-center py-1.5 px-5 rounded-2xl transition-all duration-200 cursor-pointer ${
            activeTab === 'voices'
              ? 'text-white font-semibold bg-white/15 border border-white/20'
              : 'text-neutral-400 hover:text-white active:scale-95'
          }`}
        >
          <Mic className={`w-5 h-5 mb-0.5 ${activeTab === 'voices' ? 'text-white' : 'text-neutral-400'}`} />
          <span className="text-[11px] tracking-tight">ভয়েসেস</span>
        </button>

        {/* 3. আমার অ্যাকাউন্ট (My Account) */}
        <button
          type="button"
          onClick={() => setActiveTab('account')}
          className={`flex flex-col items-center justify-center py-1.5 px-5 rounded-2xl transition-all duration-200 cursor-pointer ${
            activeTab === 'account'
              ? 'text-white font-semibold bg-white/15 border border-white/20'
              : 'text-neutral-400 hover:text-white active:scale-95'
          }`}
        >
          <User className={`w-5 h-5 mb-0.5 ${activeTab === 'account' ? 'text-white' : 'text-neutral-400'}`} />
          <span className="text-[11px] tracking-tight">অ্যাকাউন্ট</span>
        </button>
      </div>
    </nav>
  );
};
