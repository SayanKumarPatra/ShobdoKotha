import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User,
  Auth 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDocs, 
  collection, 
  query, 
  orderBy, 
  limit, 
  serverTimestamp,
  Firestore 
} from 'firebase/firestore';
import { GeneratedAudioItem } from '../types';

export const firebaseConfig = {
  apiKey: "AIzaSyCVvycrl-YqzUYVwCuEiMy3n7xCXy6uNUU",
  authDomain: "shobdokotha-a6c5f.firebaseapp.com",
  projectId: "shobdokotha-a6c5f",
  storageBucket: "shobdokotha-a6c5f.firebasestorage.app",
  messagingSenderId: "72468741258",
  appId: "1:72468741258:web:f25990eab91031f282c173",
  measurementId: "G-8H5QX0W824"
};

// Safe, defensive initialization to ensure app NEVER shows blank black screen if browser blocks storage
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let googleProvider: GoogleAuthProvider | null = null;

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: 'select_account' });
} catch (err) {
  console.warn('Firebase safe initialization warning:', err);
}

export { auth, db, googleProvider };

/**
 * Sign in using Google Popup
 */
export async function loginWithGoogle(): Promise<User | null> {
  if (!auth || !googleProvider) {
    throw new Error('Firebase Auth is not available in this environment');
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
    if (result.user) {
      await syncUserProfile(result.user);
    }
    return result.user;
  } catch (error: any) {
    console.error('Google Sign-In error:', error);
    throw error;
  }
}

/**
 * Sign out current user
 */
export async function logoutUser(): Promise<void> {
  if (!auth) return;
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign-out error:', error);
    throw error;
  }
}

/**
 * Sync user profile to Firestore
 */
export async function syncUserProfile(user: User): Promise<void> {
  if (!db) return;
  try {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      uid: user.uid,
      displayName: user.displayName || 'ব্যবহারকারী',
      email: user.email || '',
      photoURL: user.photoURL || '',
      lastLogin: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.warn('Could not sync user profile to Firestore:', err);
  }
}

/**
 * Save generated audio record to Firestore under user's library
 */
export async function saveAudioToCloud(userId: string, item: GeneratedAudioItem): Promise<void> {
  if (!db) return;
  try {
    const audioRef = doc(db, 'users', userId, 'audioHistory', item.id);
    await setDoc(audioRef, {
      id: item.id,
      text: item.text,
      voiceId: item.voice.id,
      voiceName: item.voice.bengaliName || item.voice.name,
      speed: item.speed,
      tone: item.tone,
      useCase: item.useCase || 'general',
      duration: item.duration,
      createdAt: serverTimestamp(),
      clientCreatedAt: item.createdAt,
    });
  } catch (err) {
    console.warn('Could not save audio to Firestore:', err);
  }
}

/**
 * Load user's saved audio records from Firestore
 */
export async function loadAudioFromCloud(userId: string): Promise<any[]> {
  if (!db) return [];
  try {
    const historyCol = collection(db, 'users', userId, 'audioHistory');
    const q = query(historyCol, orderBy('createdAt', 'desc'), limit(30));
    const snap = await getDocs(q);
    return snap.docs.map(doc => doc.data());
  } catch (err) {
    console.warn('Could not load audio history from Firestore:', err);
    return [];
  }
}
