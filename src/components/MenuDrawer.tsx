import React from 'react';
import { X, Home, Mic, User, ExternalLink, Sparkles, Globe } from 'lucide-react';
import { Logo } from './Logo';
import { ActiveTab } from '../types';

interface MenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const MenuDrawer: React.FC<MenuDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Blurred Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity" 
      />

      {/* Drawer Content */}
      <div className="relative w-72 sm:w-80 h-full liquid-glass-card border-r border-white/20 p-5 flex flex-col justify-between shadow-2xl ml-auto animate-slide-left z-10">
        <div>
          {/* Top Bar with Logo & Close */}
          <div className="flex items-center justify-between pb-5 border-b border-white/10 mb-6">
            <Logo size="sm" showSubtitle={true} />
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl liquid-glass-button flex items-center justify-center text-neutral-300 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Nav List */}
          <div className="space-y-2">
            <button
              onClick={() => {
                setActiveTab('home');
                onClose();
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'home'
                  ? 'bg-white/15 text-white border border-white/20'
                  : 'text-neutral-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Home className="w-4 h-4 text-cyan-300" />
              <span>হোম পেজ</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('voices');
                onClose();
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'voices'
                  ? 'bg-white/15 text-white border border-white/20'
                  : 'text-neutral-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Mic className="w-4 h-4 text-cyan-300" />
              <span>ভয়েস লাইব্রেরি</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('account');
                onClose();
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'account'
                  ? 'bg-white/15 text-white border border-white/20'
                  : 'text-neutral-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <User className="w-4 h-4 text-cyan-300" />
              <span>আমার অ্যাকাউন্ট</span>
            </button>
          </div>

          {/* Studio Specs Card */}
          <div className="liquid-glass-card-subtle rounded-2xl p-3.5 mt-8 border border-white/10">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-white mb-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>শব্দকথা ইঞ্জিন</span>
            </div>
            <div className="space-y-1.5 text-[11px] text-neutral-400">
              <div className="flex justify-between">
                <span>মডেল:</span>
                <span className="text-neutral-200">Sonic Multilingual</span>
              </div>
              <div className="flex justify-between">
                <span>স্যাম্পল রেট:</span>
                <span className="text-neutral-200">44,100 Hz</span>
              </div>
              <div className="flex justify-between">
                <span>সাপোর্টেড ভাষা:</span>
                <span className="text-cyan-300">৫০+ ভাষা</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 text-center">
          <p className="text-[10px] text-neutral-400">
            শব্দKotha © 2026 AI Voice Studio
          </p>
        </div>
      </div>
    </div>
  );
};
