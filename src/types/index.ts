export type VoiceCategory = 
  | 'all'
  | 'male'
  | 'female'
  | 'child'
  | 'friendly'
  | 'story';

export type VoiceGender = 'male' | 'female';

export type VoiceUseCase = 
  | 'ad'          // বিজ্ঞাপন / কমার্শিয়াল
  | 'news'        // সংবাদ ও উপস্থাপনা
  | 'product'     // প্রোডাক্ট ও ই-কমার্স
  | 'kids'        // শিশুদের কার্টুন ও রূপকথা
  | 'woodcutter'  // কাঠুরের গল্প ও লোকগাথা
  | 'podcast'     // পডকাস্ট ও আরজে
  | 'general';    // সাধারণ কথকতা

export interface Voice {
  id: string;
  name: string;
  bengaliName: string;
  hindiName?: string;
  englishName?: string;
  gender: VoiceGender;
  category: VoiceCategory;
  categoryLabel: string;
  useCase: VoiceUseCase;
  useCaseLabel: string;
  avatar: string;
  description: string;
  bengaliDescription: string;
  sampleTexts: {
    bn: string;
    hi: string;
    en: string;
  };
  pitch: number;
  rate: number;
  isPopular?: boolean;
}

export type SupportedLanguageCode = 'bn' | 'hi' | 'en';

export interface LanguageOption {
  code: SupportedLanguageCode;
  fullCode: string;
  name: string;
  nativeName: string;
  flag: string;
}

export interface GeneratedAudioItem {
  id: string;
  text: string;
  voice: Voice;
  language: string;
  languageCode: SupportedLanguageCode;
  speed: number;
  tone: string;
  useCase?: VoiceUseCase;
  createdAt: string;
  duration: number; // in seconds
  audioUrl: string;
  blobSize?: number;
  engine?: 'gemini' | 'browser' | 'neural' | 'edge';
}

export type ActiveTab = 'home' | 'voices' | 'account';
