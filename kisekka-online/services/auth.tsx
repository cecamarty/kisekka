/**
 * Auth service — thin wrappers around Firebase Auth + Firestore user document.
 * The phone confirmation result is held in a module-level ref so it can be
 * accessed from OTPVerificationScreen without serialising it into nav params.
 */

import {
  signInWithPhoneNumber,
  ConfirmationResult,
  GoogleAuthProvider,
  signInWithCredential,
  signOut as firebaseSignOut,
  ApplicationVerifier,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from './firebase';

// ---------------------------------------------------------------------------
// Phone auth
// ---------------------------------------------------------------------------

// Holds the ConfirmationResult between PhoneEntryScreen and OTPVerificationScreen
let phoneConfirmation: ConfirmationResult | null = null;

export async function sendPhoneOTP(
  phoneNumber: string,
  recaptchaVerifier: ApplicationVerifier
): Promise<void> {
  phoneConfirmation = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
}

export async function confirmPhoneOTP(code: string) {
  if (!phoneConfirmation) throw new Error('No pending phone confirmation.');
  const result = await phoneConfirmation.confirm(code);
  phoneConfirmation = null;
  return result;
}

// ---------------------------------------------------------------------------
// Google auth
// Google auth request is handled in GoogleAuthHandler using expo-auth-session.
// This function is called after the auth session returns an id_token.
// ---------------------------------------------------------------------------

export async function signInWithGoogle(idToken: string) {
  const credential = GoogleAuthProvider.credential(idToken);
  return signInWithCredential(auth, credential);
}

// ---------------------------------------------------------------------------
// Sign out
// ---------------------------------------------------------------------------

export async function signOut() {
  await firebaseSignOut(auth);
}

// ---------------------------------------------------------------------------
// Firestore user profile
// ---------------------------------------------------------------------------

export interface UserProfile {
  uid: string;
  displayName: string;
  shopName: string;
  marketLocation: string;
  whatsappNumber: string;
  profilePhotoUrl: string | null;
  categories: string[];
  followersCount: number;
  followingCount: number;
  createdAt: unknown; // Firestore Timestamp
  isVerified: boolean;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return { uid, ...snap.data() } as UserProfile;
}

export async function createUserProfile(
  uid: string,
  data: Omit<UserProfile, 'uid' | 'followersCount' | 'followingCount' | 'createdAt' | 'isVerified'>
): Promise<void> {
  await setDoc(doc(db, 'users', uid), {
    ...data,
    followersCount: 0,
    followingCount: 0,
    createdAt: serverTimestamp(),
    isVerified: false,
  });
}
