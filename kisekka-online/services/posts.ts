import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  increment,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Post } from '../types/post';

// ── Post CRUD ─────────────────────────────────────────────────────────────────

export async function createPost(
  data: Omit<Post, 'id' | 'createdAt' | 'viewCount' | 'whatsappTapCount' | 'saveCount'>,
  presetId?: string
): Promise<string> {
  const postsRef = collection(db, 'posts');
  const docRef = presetId ? doc(postsRef, presetId) : doc(postsRef);
  await setDoc(docRef, {
    ...data,
    viewCount: 0,
    whatsappTapCount: 0,
    saveCount: 0,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function fetchRecentPosts(postLimit = 100): Promise<Post[]> {
  const q = query(
    collection(db, 'posts'),
    where('status', '==', 'active'),
    orderBy('createdAt', 'desc'),
    limit(postLimit)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Post));
}

export async function fetchPost(postId: string): Promise<Post | null> {
  const snap = await getDoc(doc(db, 'posts', postId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Post;
}

export async function fetchUserPosts(userId: string): Promise<Post[]> {
  const q = query(
    collection(db, 'posts'),
    where('authorId', '==', userId),
    where('status', '==', 'active'),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Post));
}

/** Soft delete — sets status to 'deleted', filters from all queries automatically. */
export async function deletePost(postId: string): Promise<void> {
  await updateDoc(doc(db, 'posts', postId), { status: 'deleted' });
}

/** Edit post — description and categories only; post type and media are immutable. */
export async function editPost(
  postId: string,
  updates: { description: string; categories: string[] }
): Promise<void> {
  await updateDoc(doc(db, 'posts', postId), {
    description: updates.description,
    categories: updates.categories,
  });
}

// ── WhatsApp tap tracking ─────────────────────────────────────────────────────
// Intentionally NOT async — callers must never await this.
// Fire the Firestore write and immediately return so the WhatsApp deep link
// opens without any delay. This is the most important metric in the app.

export function incrementWhatsappTap(postId: string): void {
  updateDoc(doc(db, 'posts', postId), { whatsappTapCount: increment(1) }).catch(
    (err) => console.warn('[WhatsApp tap] Firestore increment failed:', err)
  );
}

// ── Save / unsave ─────────────────────────────────────────────────────────────

export async function savePost(userId: string, postId: string): Promise<void> {
  await Promise.all([
    setDoc(doc(db, 'saved', userId, 'posts', postId), {
      postId,
      savedAt: serverTimestamp(),
    }),
    updateDoc(doc(db, 'posts', postId), { saveCount: increment(1) }),
  ]);
}

export async function unsavePost(userId: string, postId: string): Promise<void> {
  await Promise.all([
    deleteDoc(doc(db, 'saved', userId, 'posts', postId)),
    updateDoc(doc(db, 'posts', postId), { saveCount: increment(-1) }),
  ]);
}

export async function fetchSavedPostIds(userId: string): Promise<string[]> {
  const snap = await getDocs(collection(db, 'saved', userId, 'posts'));
  return snap.docs.map((d) => d.id);
}

/**
 * Fetch full Post objects for a user's saved posts.
 * Posts that have been deleted return null from fetchPost — callers should
 * handle the null to show a "no longer available" placeholder.
 */
export async function fetchSavedPosts(userId: string): Promise<(Post | null)[]> {
  const ids = await fetchSavedPostIds(userId);
  return Promise.all(ids.map((id) => fetchPost(id)));
}

// ── Reporting ─────────────────────────────────────────────────────────────────

const REPORT_REASONS = [
  'Spam',
  'Misleading or false information',
  'Offensive content',
  'Counterfeit parts',
  'Other',
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];
export { REPORT_REASONS };

export async function reportPost(
  postId: string,
  reporterId: string,
  reason: ReportReason
): Promise<void> {
  await addDoc(collection(db, 'reports'), {
    postId,
    reporterId,
    reason,
    createdAt: serverTimestamp(),
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Generate a stable post ID before uploading media, so R2 paths are stable. */
export function generatePostId(): string {
  return doc(collection(db, 'posts')).id;
}
