# Kisekka Online — Claude Instructions

## What This Project Is

Kisekka Online is a community marketplace mobile app for Kisekka Market in Kampala, Uganda — the city's largest spare parts hub. It is a **leads generator, not a transaction platform**. Conversations close on WhatsApp and phone; the app surfaces inventory, announcements, and social presence. See `Kisekka_Online_Living_Document.md` for full product context.

## App Root

All app code lives in `kisekka-online/`. Run commands from there unless otherwise noted.

## Stack

- **Expo SDK 54** — managed workflow, Expo Go during development
- **React Native 0.81** with new architecture enabled
- **Firebase 12** — Firestore, Firebase Auth (phone number primary)
- **React Navigation 7** — native stack
- **TypeScript** throughout
- **Inter** font family via `@expo-google-fonts/inter`
- Design system in `constants/theme.tsx` — primary `#1A73E8`

## Expo Go Constraint

**Stay Expo Go compatible until explicitly told otherwise.** This means:
- No native modules that require `expo prebuild` / bare workflow
- No custom URI schemes (breaks Google OAuth in Expo Go)
- If a feature genuinely requires native code, implement it as a graceful stub, note it in `DEFERRED.md`, and flag it to the user

## Project Structure

```
kisekka-online/
  App.tsx                   # Entry — loads fonts, renders AuthProvider + RootNavigation
  app/
    navigation.tsx           # Root navigator — AuthStack / OnboardingStack / AppStack
  screens/
    auth/                    # WelcomeScreen, PhoneEntryScreen, OTPVerificationScreen, GoogleAuthHandler
    onboarding/              # ProfileSetupScreen
    app/                     # HomeScreen (placeholder, grows each phase)
  hooks/
    useAuth.tsx              # Auth context — user, userProfile, loading, refreshProfile
  services/
    firebase.tsx             # Firebase init with AsyncStorage persistence
    auth.tsx                 # Auth helpers: phone OTP, Google sign-in, Firestore profile CRUD
  constants/
    theme.tsx                # Colors, Typography, Spacing, BorderRadius, shared button styles
  store/                     # Global state (Zustand or Context — TBD per phase)
  components/                # Shared UI components
  assets/                    # Images, icons
```

## Auth Flow

```
App load → useAuth resolves (loading spinner)
  ├── not authed              → AuthStack (Welcome → PhoneEntry → OTPVerification)
  ├── authed, no profile doc  → OnboardingStack (ProfileSetupScreen)
  └── authed + profile doc    → AppStack (Home)
```

- Auth persistence uses `AsyncStorage` via `getReactNativePersistence` — sessions survive reloads
- Navigation is driven entirely by `useAuth` state, never by manual `navigate()` after sign-in

## Firestore Schema (Phase 1)

```
users/{userId}
  displayName       string
  shopName          string
  marketLocation    string
  whatsappNumber    string
  profilePhotoUrl   string | null
  categories        string[]
  followersCount    number  (default 0)
  followingCount    number  (default 0)
  createdAt         Timestamp
  isVerified        boolean (default false)
```

Security rules: authenticated read for any user; write only by owner.

## Environment Variables

All credentials use `EXPO_PUBLIC_` prefix in a `.env` file — never hardcoded.

```
EXPO_PUBLIC_FIREBASE_API_KEY
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
EXPO_PUBLIC_FIREBASE_PROJECT_ID
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
EXPO_PUBLIC_FIREBASE_APP_ID
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID      # deferred — Google Sign-In not yet active
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID  # deferred
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID      # deferred
```

## Phase 2 — Feed, Posts & Media (complete)

New in Phase 2:
- `types/post.ts` — `Post`, `PostType`, `PostStatus`, `SavedPost`
- `constants/categories.ts` — single source of truth for CATEGORIES array
- `services/posts.ts` — Firestore CRUD, `incrementWhatsappTap` (fire-and-forget), save/unsave
- `services/r2.ts` — R2 upload via `expo-file-system/legacy` + `crypto-js` AWS Sig V4
- `services/follows.ts` — follow/unfollow with `writeBatch` for atomic counter updates
- `hooks/useFeed.ts` — fetch + score (recency × 1, category × 2, follow × 3, engagement × 1.5) + `filterPosts`
- `hooks/useFollow.ts` — optimistic follow state for a target user
- `components/ui/` — `Avatar`, `SkeletonBox`, `PostTypeBadge`
- `components/feed/` — `FilterBar`, `PostCard`, `PostCardSkeleton`
- New screens: `HomeScreen` (real feed), `DiscoverScreen`, `CreatePostScreen`, `PostDetailScreen`, `ProfileScreen`, `EditProfileScreen`
- Navigation: bottom tabs (Home / Discover / ➕ Create / Profile), `CreatePost` as modal, `PostDetail` / `UserProfile` / `EditProfile` as push screens

**WhatsApp tap tracking rule:** always call `incrementWhatsappTap(post.id)` (sync, fire-and-forget) THEN `Linking.openURL(...)`. Never reverse the order. Never await the increment.

**R2 upload:** uses `expo-file-system/legacy`'s `createUploadTask` + `FileSystemUploadType.BINARY_CONTENT` with AWS Sig V4 headers computed by `crypto-js`. `UNSIGNED-PAYLOAD` avoids hashing the file body on device.

## Deferred Features

See `DEFERRED.md` for features intentionally skipped. Update it whenever something is shelved.

## Code Conventions

- Functional components + hooks only — no class components
- TypeScript strict — no `any` unless unavoidable, and comment why
- Comments explain *why*, not *what*
- No hardcoded strings for UI copy — keep them in the component for now (i18n is future scope)
- Keep screens focused — extract reusable UI into `components/`
- No speculative abstractions — build for what is needed now

## Design Principles (from living document)

- Clean, modern UI — Instagram/Facebook familiarity
- No public pricing display
- No in-app chat
- Demand-side posting model
- Private responses — leads go to WhatsApp/DM, not public feed
