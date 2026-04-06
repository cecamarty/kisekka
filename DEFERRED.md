# Deferred Features

Things intentionally skipped during Expo Go development. Pick these up when moving to a custom dev client or production build.

---

## Google Sign-In

**Why deferred:** `expo-auth-session`'s Google provider requires platform-specific OAuth client IDs (`iosClientId`, `androidClientId`) and a custom URI scheme registered in `app.config`. The custom URI scheme breaks Expo Go. The button is currently rendered as disabled on the Welcome screen.

**What's needed to enable it:**
- Create a Google Cloud project (or use the existing Firebase one)
- Add an iOS OAuth 2.0 client ID → register the bundle ID + URL scheme in `app.config.ts`
- Add an Android OAuth 2.0 client ID → register the package name + SHA-1 fingerprint
- Add a Web OAuth 2.0 client ID (used by Firebase to verify the token)
- Set env vars: `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
- Re-enable the button in `screens/auth/WelcomeScreen.tsx` and restore `GoogleAuthHandler.tsx`

**Files already in place:** `screens/auth/GoogleAuthHandler.tsx`, `services/auth.tsx` (`signInWithGoogle`), `app/navigation.tsx` (`GoogleAuth` route)

---
