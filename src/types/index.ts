export type VoiceCategory = 
  | 'all'
  | 'male'
  | 'female'
  | 'child'
  | 'friendly'
  | 'story';

export type VoiceUseCase = 
  | 'ad'          // বিজ্ঞাপন / কমার্শিয়াল
  | 'woodcutter'  // কাঠুরের গল্প ও লোকগাথা
  | 'news'        // সংবাদ ও উপস্থাপনা
  | 'podcast'     // পডকাস্ট ও বিনোদন
  | 'kids'        // শিশুতোষ ও রূপকথা
  | 'general';    // সাধারণ কথকতা

export interface Voice {
  id: string;
  name: string;
  bengaliName: string;
  gender: 'male' | 'female' | 'child';
  category: VoiceCategory;
  categoryLabel: string;
  useCase: VoiceUseCase;
  useCaseLabel: string;
  language: string;
  langCode: string;
  avatar: string;
  description: string;
  bengaliDescription: string;
  sampleText: string;
  pitch: number;
  rate: number;
  isPopular?: boolean;
}

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export interface GeneratedAudioItem {
  id: string;
  text: string;
  voice: Voice;
  language: string;
  speed: number;
  tone: string;
  useCase?: VoiceUseCase;
  createdAt: string;
  duration: number; // in seconds
  audioUrl: string;
  blobSize?: number;
}

export type ActiveTab = 'home' | 'voices' | 'account';
