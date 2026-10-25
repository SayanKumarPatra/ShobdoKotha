import React, { useState, useEffect } from 'react';
import { User, Key, ShieldCheck, Zap, HardDrive, Bell, CheckCircle2, AlertCircle } from 'lucide-react';
import { getAudioHistory } from '../../services/audioService';

export const AccountView: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [historyCount, setHistoryCount] = useState<number>(0);
  const [totalCharacters, setTotalCharacters] = useState<number>(0);

  useEffect(() => {
    const savedKey = localStorage.getItem('shobdokotha_cartesia_key') || '';
    setApiKey(savedKey);

    const history = getAudioHistory();
    setHistoryCount(history.length);
    const chars = history.reduce((acc, cur) => acc + (cur.text?.length || 0), 0);
    setTotalCharacters(chars);
  }, []);

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('shobdokotha_cartesia_key', apiKey.trim());
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleResetDefaultKey = () => {
    localStorage.removeItem('shobdokotha_cartesia_key');
    setApiKey('');
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="w-full flex flex-col items-center pb-28 pt-2">
      <div className="w-full max-w-[430px] lg:max-w-4xl px-4 sm:px-6">
        
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">
            আমার অ্যাকাউন্ট
          </h1>
          <p className="text-xs text-neutral-400">
            ব্যবহারকারী প্রোফাইল, ভয়েস জেনারেশন কোটা ও API সংযোগ সেটিংস।
          </p>
        </div>

        {/* User Profile Card */}
        <div className="liquid-glass-card rounded-3xl p-5 mb-4 relative glass-rim-sheen">
          <div className="flex items-center gap-3.5 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-white/20 flex items-center justify-center text-2xl shadow-xl">
              🎙️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base sm:text-lg text-white">Sayan Kumar Patra</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  সক্রিয় সদস্য
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-mono mt-0.5">sayankumarpatra2006@gmail.com</p>
            </div>
          </div>

          {/* Quota Progress */}
          <div className="liquid-glass-card-subtle rounded-2xl p-3.5 mb-2">
            <div className="flex items-center justify-between text-xs text-neutral-300 mb-2">
              <span className="font-medium">মাসিক ক্যারেক্টার কোটা</span>
              <span className="font-mono text-cyan-300 font-semibold">{totalCharacters.toLocaleString()} / 50,000</span>
            </div>
            <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden border border-white/10">
              <div 
                className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, Math.max(5, (totalCharacters / 50000) * 100))}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-neutral-400 mt-1.5">
              <span>মোট তৈরি করা অডিও: {historyCount} টি</span>
              <span>পুনর্নবীকরণ: ১লা পরবর্তী মাস</span>
            </div>
          </div>
        </div>

        {/* Cartesia TTS API Settings Card */}
        <div className="liquid-glass-card rounded-3xl p-5 mb-4">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Key className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-white">Cartesia Text-to-Speech API</h3>
              <p className="text-[11px] text-neutral-400">উচ্চ ক্ষমতাসম্পন্ন আল্ট্রা-রিয়েলিস্টিক ভয়েস মডেল সংযোগ</p>
            </div>
          </div>

          {/* API notice */}
          <div className="bg-cyan-500/10 border border-cyan-400/20 rounded-2xl p-3 my-3 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-cyan-300 shrink-0 mt-0.5" />
            <p className="text-[11px] text-neutral-300 leading-relaxed">
              সিস্টেমে ডিফল্ট Cartesia API কী কনফিগার করা আছে। কোনো কারণে এক্সটার্নাল API কী অনুপলব্ধ হলে ব্রাউজার স্বয়ংক্রিয়ভাবে স্টুডিও নিউরাল ইঞ্জিনের মাধ্যমে ১০০% নিখুঁত WAV অডিও তৈরি করবে।
            </p>
          </div>

          <form onSubmit={handleSaveApiKey} className="space-y-3">
            <div>
              <label className="block text-xs text-neutral-300 mb-1.5">
                Cartesia API Key (কাস্টম কী)
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk_car_... (ঐচ্ছিক)"
                className="w-full liquid-glass-input h-11 px-3.5 rounded-2xl text-xs text-white placeholder-neutral-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                className="liquid-glass-button px-4 py-2 rounded-xl text-xs font-semibold text-white flex items-center gap-2"
              >
                <HardDrive className="w-3.5 h-3.5" />
                <span>চাবি সংরক্ষণ করুন</span>
              </button>

              <button
                type="button"
                onClick={handleResetDefaultKey}
                className="px-3 py-2 rounded-xl text-xs text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
              >
                ডিফল্ট কী পুনরুদ্ধার
              </button>
            </div>

            {isSaved && (
              <p className="text-xs text-emerald-400 flex items-center gap-1.5 pt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>API সেটিংস সফলভাবে আপডেট হয়েছে!</span>
              </p>
            )}
          </form>
        </div>

        {/* Feature Badges */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="liquid-glass-card rounded-2xl p-3.5 flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />
            <div>
              <div className="text-xs font-semibold text-white">এন্ড-টু-এন্ড এনক্রিপশন</div>
              <div className="text-[10px] text-neutral-400">নিরাপদ স্টোরেজ</div>
            </div>
          </div>

          <div className="liquid-glass-card rounded-2xl p-3.5 flex items-center gap-2.5">
            <Zap className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <div className="text-xs font-semibold text-white">রিয়েলটাইম লেটেন্সি</div>
              <div className="text-[10px] text-neutral-400">&lt;২০০ মিলিসেকেন্ড</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
