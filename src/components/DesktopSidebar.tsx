import React from 'react';
import { Home, Mic, Clock, User, Sparkles, Volume2, Settings } from 'lucide-react';
import { Logo } from './Logo';
import { ActiveTab } from '../types';

interface DesktopSidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({ activeTab, setActiveTab }) => {
  return (
    <aside className="hidden md:flex flex-col justify-between w-64 lg:w-72 h-screen sticky top-0 liquid-glass-card border-r border-white/15 p-6 shrink-0 z-30">
      <div>
        {/* ShobdoKotha Logo */}
        <div className="pb-6 border-b border-white/10 mb-6">
          <Logo size="lg" showSubtitle={true} />
        </div>

        {/* Navigation items */}
        <nav className="space-y-2">
          {/* Home */}
          <button
            onClick={() => setActiveTab('home')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
              activeTab === 'home'
                ? 'liquid-glass-button bg-white/15 text-white border-white/30 shadow-lg'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Home className={`w-4 h-4 ${activeTab === 'home' ? 'text-cyan-300' : 'text-neutral-400'}`} />
            <span>হোম</span>
          </button>

          {/* Voice Library */}
          <button
            onClick={() => setActiveTab('voices')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
              activeTab === 'voices'
                ? 'liquid-glass-button bg-white/15 text-white border-white/30 shadow-lg'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Mic className={`w-4 h-4 ${activeTab === 'voices' ? 'text-cyan-300' : 'text-neutral-400'}`} />
            <span>ভয়েস লাইব্রেরি</span>
          </button>

          {/* History */}
          <button
            onClick={() => setActiveTab('history')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
              activeTab === 'history'
                ? 'liquid-glass-button bg-white/15 text-white border-white/30 shadow-lg'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Clock className={`w-4 h-4 ${activeTab === 'history' ? 'text-cyan-300' : 'text-neutral-400'}`} />
            <span>প্রজন্মের ইতিহাস</span>
          </button>

          {/* My Account */}
          <button
            onClick={() => setActiveTab('account')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
              activeTab === 'account'
                ? 'liquid-glass-button bg-white/15 text-white border-white/30 shadow-lg'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <User className={`w-4 h-4 ${activeTab === 'account' ? 'text-cyan-300' : 'text-neutral-400'}`} />
            <span>আমার অ্যাকাউন্ট</span>
          </button>
        </nav>
      </div>

      {/* Bottom Info Widget */}
      <div className="liquid-glass-card-subtle rounded-2xl p-4 border border-white/10">
        <div className="flex items-center gap-2 mb-1.5">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-white">ShobdoKotha AI</span>
        </div>
        <p className="text-[11px] text-neutral-400 leading-relaxed mb-3">
          বিশুদ্ধ ব্ল্যাক লিকুইড গ্লাসমরফিজম ডিজাইন ও ৫০+ ভাষার নিউরাল ভয়েস রূপান্তর।
        </p>
        <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono pt-2 border-t border-white/10">
          <span>v2.4 Studio</span>
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            সংযুক্ত
          </span>
        </div>
      </div>
    </aside>
  );
};
