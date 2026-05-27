import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Rss, Users } from 'lucide-react';
import { EmptyState, EndOfList, ListSkeleton } from '@components/ui';
import { feedService } from '@api/services';
import { useInfiniteScroll } from '@hooks/useInfiniteScroll';
import type { FeedPage as FeedPageData } from '@types';
import { feedRenderers } from './renderers';

const PAGE_SIZE = 20;

interface FeedListProps {
  /**
   * Caps the number of pages fetched — when set, infinite scroll is disabled
   * and the list shows at most `maxItems` entries. Used by the dashboard
   * embed; omit on the dedicated Feed page so users can scroll back forever.
   */
  maxItems?: number;
}

/**
 * Shared feed list: query + renderers + infinite scroll. Mounted standalone on
 * the Feed page and embedded on the Dashboard. Owns the `['feed']` query key
 * so both views share a single React Query cache.
 */
export const FeedList = ({ maxItems }: FeedListProps) => {
  const { t } = useTranslation();

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery<
    FeedPageData,
    Error
  >({
    queryKey: ['feed'],
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      const response = await feedService.list({
        cursor: pageParam as string | undefined,
        limit: PAGE_SIZE,
      });
      return (response.data ?? { events: [], nextCursor: null }) as FeedPageData;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const infiniteScrollEnabled = maxItems === undefined;

  const loadMore = useCallback(() => {
    if (infiniteScrollEnabled && hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [infiniteScrollEnabled, hasNextPage, isFetchingNextPage, fetchNextPage]);
  const sentinelRef = useInfiniteScroll(loadMore, { rootMargin: '200px' });

  const allEvents = data?.pages.flatMap((p) => p.events) ?? [];
  const events = maxItems ? allEvents.slice(0, maxItems) : allEvents;

  if (isLoading) {
    return <ListSkeleton count={maxItems ?? 4} />;
  }

  if (events.length === 0) {
    return (
      <EmptyState
        icon={<Rss size={32} strokeWidth={1.5} aria-hidden="true" />}
        title={t('feed.empty.title')}
        description={t('feed.empty.description')}
      >
        <Link
          to="/friends"
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-strava-orange px-4 py-2 text-sm font-medium text-white shadow-md hover:bg-strava-orange-dark"
        >
          <Users size={14} strokeWidth={2} />
          {t('feed.empty.action')}
        </Link>
      </EmptyState>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event) => {
        const Renderer = feedRenderers[event.type];
        if (!Renderer) return null;
        return <Renderer key={event.id} event={event} />;
      })}

      {infiniteScrollEnabled && hasNextPage && (
        <div ref={sentinelRef} className="py-4 text-center">
          {isFetchingNextPage && (
            <p className="text-xs text-gray-400 dark:text-gray-500">{t('common.loading')}</p>
          )}
        </div>
      )}

      {infiniteScrollEnabled && !hasNextPage && allEvents.length >= PAGE_SIZE && (
        <EndOfList label={t('feed.endOfFeed')} />
      )}
    </div>
  );
};
