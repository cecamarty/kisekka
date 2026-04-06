/**
 * Firebase initialisation.
 * All credentials come from environment variables — never hardcode keys.
 *
 * Firestore Security Rules (set in Firebase Console):
 *   rules_version = '2';
 *   service cloud.firestore {
 *     match /databases/{database}/documents {
 *       match /users/{userId} {
 *         allow read: if request.auth != null;
 *         allow write: if request.auth != null && request.auth.uid == userId;
 *       }
 *     }
 *   }
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { initializeAuth, getAuth, Auth } from 'firebase/auth';
// getReactNativePersistence is in the RN build of @firebase/auth but not typed in the
// main firebase/auth d.ts. Require it directly to bypass the type gap.
import type { Persistence } from 'firebase/auth';
// getReactNativePersistence is in the RN build of @firebase/auth but not typed in the
// main firebase/auth d.ts. Require it directly to bypass the type gap.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getReactNativePersistence } = require('@firebase/auth') as {
  getReactNativePersistence: (storage: unknown) => Persistence;
};
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Prevent duplicate initialisation on hot reload
const app: FirebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Use AsyncStorage for persistence — the web default (indexedDB) doesn't
// exist in React Native, so without this auth is memory-only and clears on reload.
const auth: Auth = getApps().length === 1
  ? initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })
  : getAuth(app);
const db: Firestore = getFirestore(app);

export { app, auth, db, firebaseConfig };
