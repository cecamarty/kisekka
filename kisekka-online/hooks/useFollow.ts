import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { followUser, unfollowUser, isFollowing } from '../services/follows';


interface UseFollowResult {
  following: boolean;
  loading: boolean;
  toggle: () => Promise<void>;
}

export function useFollow(targetUserId: string): UseFollowResult {
  const { user, userProfile } = useAuth();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    if (!user || user.uid === targetUserId) {
      setLoading(false);
      return;
    }
    isFollowing(user.uid, targetUserId)
      .then(setFollowing)
      .finally(() => setLoading(false));
  }, [user, targetUserId]);

  const toggle = useCallback(async () => {
    if (!user) return;
    // Optimistic update
    const next = !following;
    setFollowing(next);
    try {
      if (next) {
        await followUser(user.uid, targetUserId, userProfile?.shopName ?? '');
      } else {
        await unfollowUser(user.uid, targetUserId);
      }
    } catch {
      // Revert on failure
      setFollowing(!next);
    }
  }, [user, targetUserId, following]);

  return { following, loading, toggle };
}
