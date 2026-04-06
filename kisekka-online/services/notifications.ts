/**
 * Push notification service.
 *
 * Handles:
 *   1. Requesting permissions + getting Expo push token
 *   2. Storing the token on the user's Firestore document
 *   3. Sending notifications via the Expo Push API (client-side for MVP)
 *
 * Notification types and their nav payloads:
 *   follow  → { type: 'follow',   userId: string }
 *   post    → { type: 'post',     postId: string }
 *   payment → { type: 'payment',  postId: string }
 */

import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

const EXPO_PUSH_API = 'https://exp.host/--/expoapi/v2/push/send';

// Configure how notifications are shown when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false, // We show our own in-app Toast instead
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ── Token registration ────────────────────────────────────────────────────────

/**
 * Request notification permissions and store the Expo push token on the user's
 * Firestore document. Safe to call multiple times — skips silently if already
 * granted or if running on a simulator (token unavailable).
 */
export async function registerForPushNotifications(userId: string): Promise<void> {
  // Expo push tokens require a physical device (not a simulator)
  if (!Constants.isDevice) return;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return;

  const tokenData = await Notifications.getExpoPushTokenAsync();
  const token = tokenData.data;

  await updateDoc(doc(db, 'users', userId), { expoPushToken: token });
}

// ── Sending notifications (client-side, MVP) ──────────────────────────────────

interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

async function sendPush(messages: PushMessage[]): Promise<void> {
  if (messages.length === 0) return;
  try {
    await fetch(EXPO_PUSH_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messages.length === 1 ? messages[0] : messages),
    });
  } catch (err) {
    // Non-critical — never block the caller
    console.warn('[notifications] Push send failed:', err);
  }
}

/**
 * Notify a user that someone followed them.
 * @param targetToken  - expoPushToken of the user being followed
 * @param followerShopName - shop name of the follower
 * @param followerId   - uid of the follower (for nav on tap)
 */
export function sendFollowNotification(
  targetToken: string,
  followerShopName: string,
  followerId: string
): void {
  // Fire-and-forget — never block the follow action
  sendPush([{
    to: targetToken,
    title: 'New follower',
    body: `${followerShopName} started following you`,
    data: { type: 'follow', userId: followerId },
  }]).catch(() => {});
}

/**
 * Notify all followers that a new post was created.
 * Caps at NOTIFICATION_FOLLOWER_CAP (50) per spec.
 * @param tokens        - array of expoPushTokens (already capped by caller)
 * @param authorShopName
 * @param description   - post description (truncated to 50 chars)
 * @param postId
 */
export function sendNewPostNotifications(
  tokens: string[],
  authorShopName: string,
  description: string,
  postId: string
): void {
  const body = description.length > 50
    ? description.slice(0, 50) + '…'
    : description;

  const messages: PushMessage[] = tokens.map((to) => ({
    to,
    title: authorShopName,
    body: `just posted: ${body}`,
    data: { type: 'post', postId },
  }));

  sendPush(messages).catch(() => {});
}

/**
 * Notify the payer that their announcement is now live.
 * Called from Cloud Function via Admin SDK — this client-side version is
 * kept as a fallback for local testing only.
 */
export function sendPaymentConfirmedNotification(
  targetToken: string,
  postId: string
): void {
  sendPush([{
    to: targetToken,
    title: 'Kisekka Online',
    body: 'Your announcement is now live! 🎉',
    data: { type: 'payment', postId },
  }]).catch(() => {});
}
