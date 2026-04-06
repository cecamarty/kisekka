import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { sendFollowNotification } from './notifications';

function followDocId(followerId: string, followingId: string) {
  return `${followerId}_${followingId}`;
}

export async function followUser(followerId: string, followingId: string, followerShopName: string): Promise<void> {
  const batch = writeBatch(db);

  batch.set(doc(db, 'follows', followDocId(followerId, followingId)), {
    followerId,
    followingId,
    createdAt: serverTimestamp(),
  });

  // Increment counters on both user documents atomically
  const { increment } = await import('firebase/firestore');
  batch.update(doc(db, 'users', followerId),  { followingCount: increment(1) });
  batch.update(doc(db, 'users', followingId), { followersCount: increment(1) });

  await batch.commit();

  // Send push notification to the followed user (fire-and-forget)
  getDoc(doc(db, 'users', followingId)).then((snap) => {
    const token = snap.data()?.expoPushToken as string | undefined;
    if (token) {
      sendFollowNotification(token, followerShopName, followerId);
    }
  }).catch(() => {});
}

export async function unfollowUser(followerId: string, followingId: string): Promise<void> {
  const batch = writeBatch(db);

  batch.delete(doc(db, 'follows', followDocId(followerId, followingId)));

  const { increment } = await import('firebase/firestore');
  batch.update(doc(db, 'users', followerId),  { followingCount: increment(-1) });
  batch.update(doc(db, 'users', followingId), { followersCount: increment(-1) });

  await batch.commit();
}

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'follows', followDocId(followerId, followingId)));
  return snap.exists();
}

export async function fetchFollowingIds(uid: string): Promise<string[]> {
  const q = query(collection(db, 'follows'), where('followerId', '==', uid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data().followingId as string);
}

/** Fetch the expoPushTokens of all users that follow `uid`. Capped at `cap`. */
export async function fetchFollowerTokens(uid: string, cap: number): Promise<string[]> {
  const q = query(collection(db, 'follows'), where('followingId', '==', uid));
  const snap = await getDocs(q);
  const followerIds = snap.docs.slice(0, cap).map((d) => d.data().followerId as string);

  const tokenFetches = followerIds.map((id) =>
    getDoc(doc(db, 'users', id)).then((s) => s.data()?.expoPushToken as string | undefined)
  );
  const results = await Promise.all(tokenFetches);
  return results.filter((t): t is string => Boolean(t));
}
