import { useCallback, useEffect, useState } from 'react';
import { friendsService } from '@api/services';
import type { Friend } from '@types';

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 300;

/**
 * Debounced friend search with a persistent id→Friend cache so that previously
 * selected friends stay resolvable even after the search results change.
 */
export const useFriendSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [cache, setCache] = useState<Map<number, Friend>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  const search = useCallback(async (query: string) => {
    setIsLoading(true);
    try {
      const response = await friendsService.search(query);
      if (response.success && response.data) {
        const data = response.data;
        setFriends(data);
        setCache((prev) => {
          const next = new Map(prev);
          data.forEach((f: Friend) => next.set(f.id, f));
          return next;
        });
      }
    } catch (error) {
      console.error('Failed to search users:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (searchQuery.length < MIN_QUERY_LENGTH) return;
    const timeoutId = setTimeout(() => void search(searchQuery), DEBOUNCE_MS);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, search]);

  /** Merges current search results with already-selected friends from the cache. */
  const combineWithSelected = useCallback(
    (selectedIds: number[]): Friend[] => {
      const map = new Map<number, Friend>();
      friends.forEach((f) => map.set(f.id, f));
      selectedIds.forEach((id) => {
        const cached = cache.get(id);
        if (cached) map.set(cached.id, cached);
      });
      return Array.from(map.values());
    },
    [friends, cache]
  );

  return {
    searchQuery,
    setSearchQuery,
    isLoading,
    combineWithSelected,
  };
};
