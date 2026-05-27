import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { ListSkeleton } from '@components/ui';
import { friendsService } from '@api/services';
import { UserRow } from './UserRow';
import { FriendActionButton } from './FriendActionButton';

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 300;

/**
 * Search bar + results list, used on the Friends page.
 * Re-uses the shared FriendActionButton so the action stays consistent with
 * every other place that lists users.
 */
export const FriendSearch = () => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    if (query.length < MIN_QUERY_LENGTH) {
      setDebouncedQuery('');
      return;
    }
    const timeout = setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [query]);

  const { data: results = [], isFetching } = useQuery({
    queryKey: ['friend-search', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery) return [];
      const response = await friendsService.search(debouncedQuery);
      return response.data ?? [];
    },
    enabled: debouncedQuery.length >= MIN_QUERY_LENGTH,
  });

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search
          size={18}
          strokeWidth={2}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          aria-hidden="true"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('friends.searchPlaceholder')}
          className="w-full rounded-2xl border border-white/20 bg-white/80 py-3 pl-10 pr-4 text-sm shadow-sm backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-strava-orange dark:border-gray-700/40 dark:bg-gray-900/70 dark:text-gray-50"
        />
      </div>

      {query.length > 0 && query.length < MIN_QUERY_LENGTH && (
        <p className="px-1 text-xs text-gray-500 dark:text-gray-400">{t('friends.searchHint')}</p>
      )}

      {debouncedQuery && (
        <div className="space-y-2">
          {isFetching && results.length === 0 && <ListSkeleton count={3} />}
          {!isFetching && results.length === 0 && (
            <p className="px-1 text-sm text-gray-500 dark:text-gray-400">
              {t('friends.searchEmpty')}
            </p>
          )}
          {results.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              action={<FriendActionButton userId={user.id} state={user.friendshipState} compact />}
            />
          ))}
        </div>
      )}
    </div>
  );
};
