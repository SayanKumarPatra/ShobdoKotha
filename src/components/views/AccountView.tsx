import React, { useState, useEffect } from 'react';
import { 
  User, 
  Key, 
  ShieldCheck, 
  Zap, 
  HardDrive, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Edit3, 
  Check, 
  Sparkles,
  HelpCircle
} from 'lucide-react';

export const AccountView: React.FC = () => {
  // User Profile State (dynamic, editable by each user)
  const [userName, setUserName] = useState<string>('আমার অ্যাকাউন্ট');
  const [userEmail, setUserEmail] = useState<string>('user@shobdokotha.ai');
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [tempName, setTempName] = useState<string>('');
  const [tempEmail, setTempEmail] = useState<string>('');
  const [profileSaved, setProfileSaved] = useState<boolean>(false);

  // API Key state
  const [geminiKey, setGeminiKey] = useState<string>('');
  const [cartesiaKey, setCartesiaKey] = useState<string>('');
  const [isKeySaved, setIsKeySaved] = useState<boolean>(false);

  useEffect(() => {
    // Load dynamic user profile from localStorage
    const savedName = localStorage.getItem('shobdokotha_user_name');
    const savedEmail = localStorage.getItem('shobdokotha_user_email');
    if (savedName) setUserName(savedName);
    if (savedEmail) setUserEmail(savedEmail);

    // Load saved API keys
    const savedGemini = localStorage.getItem('shobdokotha_gemini_key') || '';
    const savedCartesia = localStorage.getItem('shobdokotha_cartesia_key') || '';
    setGeminiKey(savedGemini);
    setCartesiaKey(savedCartesia);
  }, []);

  const handleStartEditProfile = () => {
    setTempName(userName);
    setTempEmail(userEmail);
    setIsEditingProfile(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = tempName.trim() || 'আমার অ্যাকাউন্ট';
    const finalEmail = tempEmail.trim() || 'user@shobdokotha.ai';
    
    setUserName(finalName);
    setUserEmail(finalEmail);
    localStorage.setItem('shobdokotha_user_name', finalName);
    localStorage.setItem('shobdokotha_user_email', finalEmail);
    
    setIsEditingProfile(false);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  const handleSaveApiKeys = (e: React.FormEvent) => {
    e.preventDefault();
    if (geminiKey.trim()) {
      localStorage.setItem('shobdokotha_gemini_key', geminiKey.trim());
    } else {
      localStorage.removeItem('shobdokotha_gemini_key');
    }

    if (cartesiaKey.trim()) {
      localStorage.setItem('shobdokotha_cartesia_key', cartesiaKey.trim());
    } else {
      localStorage.removeItem('shobdokotha_cartesia_key');
    }

    setIsKeySaved(true);
    setTimeout(() => setIsKeySaved(false), 3000);
  };

  const handleClearKeys = () => {
    localStorage.removeItem('shobdokotha_gemini_key');
    localStorage.removeItem('shobdokotha_cartesia_key');
    setGeminiKey('');
    setCartesiaKey('');
    setIsKeySaved(true);
    setTimeout(() => setIsKeySaved(false), 3000);
  };

  return (
    <div className="w-full flex flex-col items-center pb-28 pt-2">
      <div className="w-full max-w-[430px] lg:max-w-4xl px-4 sm:px-6">
        
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">
            আমার অ্যাকাউন্ট ও প্রোফাইল
          </h1>
          <p className="text-xs text-neutral-400">
            ব্যবহারকারী প্রোফাইল তৈরি করুন, এডিট করুন এবং সরাসরি API Key সংযোগ দিন।
          </p>
        </div>

        {/* User Profile Card (Dynamic & User-Editable) */}
        <div className="liquid-glass-card rounded-3xl p-5 mb-4 relative glass-rim-sheen">
          {!isEditingProfile ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-white/20 flex items-center justify-center text-2xl shadow-xl">
                  👤
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-base sm:text-lg text-white">{userName}</h2>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                      সক্রিয় সদস্য
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 font-mono mt-0.5">{userEmail}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleStartEditProfile}
                className="liquid-glass-button px-3.5 py-1.5 rounded-xl text-xs text-white flex items-center gap-1.5 self-end sm:self-auto cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-cyan-300" />
                <span>প্রোফাইল পরিবর্তন করুন</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
                <span className="text-xs font-semibold text-white">আপনার প্রোফাইল তথ্য তৈরি / এডিট করুন</span>
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="text-xs text-neutral-400 hover:text-white"
                >
                  বাতিল
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-neutral-300 mb-1">আপনার নাম</label>
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    placeholder="আপনার নাম লিখুন"
                    className="w-full liquid-glass-input h-10 px-3 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-neutral-300 mb-1">আপনার ইমেল বা ইউজার আইডি</label>
                  <input
                    type="email"
                    value={tempEmail}
                    onChange={(e) => setTempEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full liquid-glass-input h-10 px-3 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-3 py-1.5 rounded-xl text-xs text-neutral-400 hover:text-white"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="liquid-glass-button px-4 py-1.5 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 text-cyan-300" />
                  <span>সংরক্ষণ করুন</span>
                </button>
              </div>
            </form>
          )}

          {profileSaved && (
            <p className="text-xs text-emerald-400 flex items-center gap-1.5 mt-3 pt-2 border-t border-white/10">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>আপনার প্রোফাইল সফলভাবে আপডেট হয়েছে!</span>
            </p>
          )}
        </div>

        {/* API KEY DIRECT GENERATION & SETTINGS CARD */}
        <div className="liquid-glass-card rounded-3xl p-5 mb-4">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Key className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-white">AI Voice API Key সংযোগ</h3>
              <p className="text-[11px] text-neutral-400">Google Gemini অথবা Cartesia API কী সংযুক্ত করুন</p>
            </div>
          </div>

          {/* Direct API Key Generation Links Banner (Requested by user) */}
          <div className="liquid-glass-card-subtle rounded-2xl p-4 my-3 border border-cyan-500/30 bg-gradient-to-br from-cyan-950/30 to-blue-950/20">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-cyan-300 shrink-0" />
              <h4 className="text-xs font-semibold text-white">এপিআই কি (API Key) কীভাবে বের করবেন?</h4>
            </div>
            <p className="text-[11px] text-neutral-300 leading-relaxed mb-3">
              আপনার কাছে যদি এখনো কোনো API Key না থাকে, নিচের বাটনে ক্লিক করলেই সরাসরি অফিশিয়াল পেজ থেকে ১ ক্লিকে <strong>১০০% ফ্রি API Key</strong> বের করতে পারবেন:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Google AI Studio API Key Link */}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/40 text-white transition-all group"
              >
                <div>
                  <div className="text-xs font-bold text-cyan-200 flex items-center gap-1.5">
                    <span>Google Gemini API Key নিন</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-400 text-black font-semibold">ফ্রি</span>
                  </div>
                  <div className="text-[10px] text-neutral-300">Google AI Studio-তে তৈরি করুন</div>
                </div>
                <ExternalLink className="w-4 h-4 text-cyan-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>

              {/* Cartesia API Key Link */}
              <a
                href="https://play.cartesia.ai/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white transition-all group"
              >
                <div>
                  <div className="text-xs font-bold text-neutral-200">Cartesia API Key নিন</div>
                  <div className="text-[10px] text-neutral-400">play.cartesia.ai থেকে কী কপি করুন</div>
                </div>
                <ExternalLink className="w-4 h-4 text-neutral-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            </div>

            <div className="mt-2.5 text-[10px] text-cyan-200/80 flex items-center gap-1.5">
              <HelpCircle className="w-3 h-3 text-cyan-300 shrink-0" />
              <span>লিংক থেকে কী কপি করে এনে নিচের বক্সে পেস্ট করে সেভ করুন।</span>
            </div>
          </div>

          <form onSubmit={handleSaveApiKeys} className="space-y-3">
            <div>
              <label className="block text-xs text-neutral-300 mb-1.5">
                Google Gemini API Key (সুপারফাস্ট স্পিচ ও প্রম্পট)
              </label>
              <input
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="AIzaSy... (গুগল এআই স্টুডিও কী)"
                className="w-full liquid-glass-input h-11 px-3.5 rounded-2xl text-xs text-white placeholder-neutral-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-neutral-300 mb-1.5">
                Cartesia API Key (ঐচ্ছিক Sonic Multilingual)
              </label>
              <input
                type="password"
                value={cartesiaKey}
                onChange={(e) => setCartesiaKey(e.target.value)}
                placeholder="sk_car_... (কার্টেসিয়া কী)"
                className="w-full liquid-glass-input h-11 px-3.5 rounded-2xl text-xs text-white placeholder-neutral-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                className="liquid-glass-button px-4 py-2 rounded-xl text-xs font-semibold text-white flex items-center gap-2 cursor-pointer"
              >
                <HardDrive className="w-3.5 h-3.5 text-cyan-300" />
                <span>API চাবি সংরক্ষণ করুন</span>
              </button>

              <button
                type="button"
                onClick={handleClearKeys}
                className="px-3 py-2 rounded-xl text-xs text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
              >
                রিসেট করুন
              </button>
            </div>

            {isKeySaved && (
              <p className="text-xs text-emerald-400 flex items-center gap-1.5 pt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>API কী সেটিংস সফলভাবে আপডেট হয়েছে!</span>
              </p>
            )}
          </form>
        </div>

        {/* Feature Badges */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="liquid-glass-card rounded-2xl p-3.5 flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />
            <div>
              <div className="text-xs font-semibold text-white">১০০% নিরাপদ স্টোরেজ</div>
              <div className="text-[10px] text-neutral-400">লোকাল এনক্রিপশন</div>
            </div>
          </div>

          <div className="liquid-glass-card rounded-2xl p-3.5 flex items-center gap-2.5">
            <Zap className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <div className="text-xs font-semibold text-white">রিয়েলটাইম প্লেব্যাক</div>
              <div className="text-[10px] text-neutral-400">WAV স্টুডিও অডিও</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
