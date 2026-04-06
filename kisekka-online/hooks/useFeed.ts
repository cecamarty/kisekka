import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { fetchRecentPosts, fetchSavedPostIds } from '../services/posts';
import { fetchFollowingIds } from '../services/follows';
import { Post } from '../types/post';
import { FEED_FETCH_LIMIT } from '../constants/limits';

export type FeedFilter = 'all' | 'listing' | 'looking_for' | 'announcement';

interface UseFeedResult {
  posts: Post[];
  loading: boolean;
  refresh: () => Promise<void>;
  savedPostIds: Set<string>;
}

// ── Scoring algorithm (single source of truth — easy to tune here) ────────────

function scorePost(
  post: Post,
  userCategories: string[],
  followingIds: string[],
  now: number
): number {
  const hoursSincePosted   = (now - post.createdAt.toMillis()) / 3_600_000;
  const recencyScore       = Math.max(0, 1 - hoursSincePosted / 72);

  const categoryMatchScore = post.categories.some((c) =>
    userCategories.includes(c)
  ) ? 1 : 0;

  const followBoost    = followingIds.includes(post.authorId) ? 1 : 0;

  const engagementScore = Math.min(
    1,
    (post.whatsappTapCount * 3 + post.saveCount * 2 + post.viewCount * 0.1) / 100
  );

  return (
    recencyScore       * 1   +
    categoryMatchScore * 2   +
    followBoost        * 3   +
    engagementScore    * 1.5
  );
}

/** Filter posts that have passed their expiresAt timestamp (announcement expiry). */
function isNotExpired(post: Post, now: number): boolean {
  if (!post.expiresAt) return true;
  return post.expiresAt.toMillis() > now;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useFeed(): UseFeedResult {
  const { user, userProfile } = useAuth();
  const [posts, setPosts]           = useState<Post[]>([]);
  const [savedPostIds, setSaved]    = useState<Set<string>>(new Set());
  const [loading, setLoading]       = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [rawPosts, followingIds, savedIds] = await Promise.all([
        fetchRecentPosts(FEED_FETCH_LIMIT),
        fetchFollowingIds(user.uid),
        fetchSavedPostIds(user.uid),
      ]);

      const userCategories = userProfile?.categories ?? [];
      const now = Date.now();

      const scored = rawPosts
        // Filter out posts whose expiresAt has passed (client-side expiry check)
        .filter((p) => isNotExpired(p, now))
        .map((p) => ({ post: p, score: scorePost(p, userCategories, followingIds, now) }))
        .sort((a, b) => b.score - a.score)
        .map(({ post }) => post);

      setPosts(scored);
      setSaved(new Set(savedIds));
    } catch (err) {
      console.warn('[useFeed] Failed to load feed:', err);
    } finally {
      setLoading(false);
    }
  }, [user, userProfile]);

  useEffect(() => { load(); }, [load]);

  return { posts, loading, refresh: load, savedPostIds };
}

// ── Client-side filter (applied on already-scored array) ─────────────────────

export function filterPosts(posts: Post[], filter: FeedFilter): Post[] {
  if (filter === 'all') return posts;
  return posts.filter((p) => p.type === filter);
}
