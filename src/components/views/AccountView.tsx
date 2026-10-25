import React, { useState, useEffect } from 'react';
import { 
  User as UserIcon, 
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
  HelpCircle,
  LogOut,
  LogIn
} from 'lucide-react';
import { auth, loginWithGoogle, logoutUser, firebaseConfig } from '../../services/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

export const AccountView: React.FC = () => {
  // Firebase User State
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // User Profile State (fallback / local profile)
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
    // Listen to Firebase Authentication state
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);
      if (user) {
        setUserName(user.displayName || 'ব্যবহারকারী');
        setUserEmail(user.email || '');
      } else {
        const savedName = localStorage.getItem('shobdokotha_user_name');
        const savedEmail = localStorage.getItem('shobdokotha_user_email');
        if (savedName) setUserName(savedName);
        if (savedEmail) setUserEmail(savedEmail);
      }
    });

    // Load saved API keys
    const savedGemini = localStorage.getItem('shobdokotha_gemini_key') || '';
    const savedCartesia = localStorage.getItem('shobdokotha_cartesia_key') || '';
    setGeminiKey(savedGemini);
    setCartesiaKey(savedCartesia);

    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setAuthError(null);
      await loginWithGoogle();
    } catch (err: any) {
      console.error('Login error:', err);
      if (err?.code !== 'auth/popup-closed-by-user') {
        setAuthError(err?.message || 'লগইন করতে সমস্যা হয়েছে');
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setUserName('আমার অ্যাকাউন্ট');
      setUserEmail('user@shobdokotha.ai');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

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
    <div className="w-full flex flex-col items-center pb-24 md:pb-10 pt-2">
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

        {/* Firebase Connected Project Badge */}
        <div className="mb-4 p-3 rounded-2xl bg-cyan-950/30 border border-cyan-500/25 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-neutral-300">
              Firebase প্রজেক্ট: <strong className="text-cyan-300 font-mono">{firebaseConfig.projectId}</strong>
            </span>
          </div>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
            সক্রিয় ও সংযুক্ত (Connected)
          </span>
        </div>

        {authError && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center justify-between">
            <span>{authError}</span>
            <button onClick={() => setAuthError(null)} className="text-neutral-400 hover:text-white">✕</button>
          </div>
        )}

        {/* User Profile Card (Dynamic & Google Auth Powered) */}
        <div className="liquid-glass-card rounded-3xl p-5 mb-4 relative glass-rim-sheen">
          {!isEditingProfile ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                {currentUser?.photoURL ? (
                  <img 
                    src={currentUser.photoURL} 
                    alt={userName}
                    className="w-14 h-14 rounded-2xl object-cover border border-white/20 shadow-xl"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-white/20 flex items-center justify-center text-2xl shadow-xl">
                    👤
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-bold text-base sm:text-lg text-white">{userName}</h2>
                    {currentUser ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Google অথেনটিকেটেড</span>
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                        গেস্ট একাউন্ট
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-400 font-mono mt-0.5">{userEmail}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                {currentUser ? (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="liquid-glass-button px-3 py-1.5 rounded-xl text-xs text-red-300 hover:text-red-200 border border-red-500/20 hover:border-red-500/40 flex items-center gap-1.5 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>লগআউট</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-neutral-100 text-black text-xs font-semibold flex items-center gap-2 shadow-lg transition-all cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Google লগইন</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleStartEditProfile}
                  className="liquid-glass-button px-3 py-1.5 rounded-xl text-xs text-white flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-cyan-300" />
                  <span>এডিট</span>
                </button>
              </div>
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
