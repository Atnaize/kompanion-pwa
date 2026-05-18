import { useCallback, useEffect, useState } from 'react';
import { friendsService } from '@api/services';
import type { Friend } from '@types';

/**
 * Loads the viewer's accepted-friends list once. Only friends can be invited
 * to a challenge, so the picker's source set is bounded — we fetch the full
 * list upfront and let FriendSelector do client-side name filtering against
 * the searchQuery passed down from the page.
 */
export const useFriendSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await friendsService.list();
        if (cancelled) return;
        if (response.success && response.data) {
          setFriends(response.data);
        }
      } catch (error) {
        console.error('Failed to load friends:', error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /** Kept for API compatibility; the friends list is stable so selected ids resolve directly. */
  const combineWithSelected = useCallback((_selectedIds: number[]): Friend[] => friends, [friends]);

  return {
    searchQuery,
    setSearchQuery,
    isLoading,
    combineWithSelected,
  };
};
