import React, { useState } from 'react';
import { VOICES_CATALOG, SUPPORTED_LANGUAGES } from './data/voices';
import { ActiveTab, Voice, VoiceUseCase } from './types';
import { HomeView } from './components/views/HomeView';
import { VoicesView } from './components/views/VoicesView';
import { AccountView } from './components/views/AccountView';
import { BottomNavigation } from './components/BottomNavigation';
import { MenuDrawer } from './components/MenuDrawer';
import { DesktopSidebar } from './components/DesktopSidebar';
import { Sparkles } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [selectedVoice, setSelectedVoice] = useState<Voice>(VOICES_CATALOG[0]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>(SUPPORTED_LANGUAGES[0].nativeName);
  const [selectedUseCase, setSelectedUseCase] = useState<VoiceUseCase>('general');
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-black text-white relative selection:bg-cyan-500/30 selection:text-cyan-100 flex flex-col antialiased overflow-x-hidden">
      
      {/* Liquid Glass Background Ambient Glows & Shiny Blue Caustics */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Top luminous cyan/blue ambient orb */}
        <div className="absolute -top-36 left-1/2 -translate-x-1/2 w-[650px] h-[450px] bg-gradient-to-b from-cyan-500/18 via-blue-600/12 to-transparent rounded-full blur-[110px]" />
        
        {/* Center-left iridescent indigo glow */}
        <div className="absolute top-1/3 -left-28 w-[380px] h-[380px] bg-blue-600/10 rounded-full blur-[120px]" />

        {/* Bottom-right ocean water caustic reflection */}
        <div className="absolute -bottom-24 right-5 w-[480px] h-[360px] bg-cyan-600/12 rounded-full blur-[110px]" />
      </div>

      {/* Slide-over menu for mobile */}
      <MenuDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <div className="flex-1 flex w-full relative z-10">
        {/* Left Desktop Sidebar (automatically shown on desktop) */}
        <DesktopSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Main Content Area: Naturally responsive for all devices with clean, crisp background */}
        <main className="flex-1 flex flex-col min-w-0 min-h-screen">
          
          {/* Desktop Top Header Bar (No manual toggles, just clear branding & active workspace indicator) */}
          <div className="hidden md:flex items-center justify-between px-8 py-3.5 border-b border-white/10 liquid-glass-card-subtle sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-white">
                {activeTab === 'home' && 'শব্দকথা · টেক্সট টু স্পিচ স্টুডিও'}
                {activeTab === 'voices' && 'শব্দকথা · ভয়েস লাইব্রেরি ও মডেলসমূহ'}
                {activeTab === 'account' && 'শব্দকথা · অ্যাকাউন্ট ও সেটিংস'}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-neutral-400">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-cyan-300">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Gemini 3.8 Neural Speech</span>
              </span>
            </div>
          </div>

          {/* Primary View Area */}
          <div className="flex-1 w-full flex justify-center p-0">
            {activeTab === 'home' && (
              <HomeView
                onOpenMenu={() => setIsMenuOpen(true)}
                onNavigateToVoices={() => setActiveTab('voices')}
                onNavigateToAccount={() => setActiveTab('account')}
                selectedVoice={selectedVoice}
                setSelectedVoice={setSelectedVoice}
                selectedLanguage={selectedLanguage}
                setSelectedLanguage={setSelectedLanguage}
                selectedUseCase={selectedUseCase}
                setSelectedUseCase={setSelectedUseCase}
              />
            )}
            {activeTab === 'voices' && (
              <VoicesView
                selectedVoice={selectedVoice}
                onSelectVoice={setSelectedVoice}
                onNavigateHome={() => setActiveTab('home')}
                selectedUseCase={selectedUseCase}
                onSelectUseCase={setSelectedUseCase}
              />
            )}
            {activeTab === 'account' && <AccountView />}
          </div>

          {/* Sticky Mobile Bottom Navigation for phone screen widths */}
          <BottomNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
        </main>
      </div>

    </div>
  );
}
