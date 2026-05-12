import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Rss, Users } from 'lucide-react';
import { Layout } from '@components/layout';
import { EmptyState } from '@components/ui';
import { feedService } from '@api/services';
import { feedRenderers } from '@features/feed';
import type { FeedPage as FeedPageData } from '@types';

const PAGE_SIZE = 20;

export const FeedPage = () => {
  const { t } = useTranslation();
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery<
    FeedPageData,
    Error
  >({
    queryKey: ['feed'],
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      const response = await feedService.list(pageParam as string | undefined, PAGE_SIZE);
      return (response.data ?? { events: [], nextCursor: null }) as FeedPageData;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  // IntersectionObserver-driven infinite scroll. Loads the next page whenever
  // the sentinel scrolls into view.
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const events = data?.pages.flatMap((p) => p.events) ?? [];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
            {t('feed.title')}
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('feed.subtitle')}</p>
        </div>

        {isLoading ? (
          <p className="px-1 text-sm text-gray-500 dark:text-gray-400">{t('common.loading')}</p>
        ) : events.length === 0 ? (
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
        ) : (
          <div className="space-y-3">
            {events.map((event) => {
              const Renderer = feedRenderers[event.type];
              if (!Renderer) return null;
              return <Renderer key={event.id} event={event} />;
            })}

            {hasNextPage && (
              <div ref={sentinelRef} className="py-4 text-center">
                {isFetchingNextPage && (
                  <p className="text-xs text-gray-400 dark:text-gray-500">{t('common.loading')}</p>
                )}
              </div>
            )}

            {!hasNextPage && events.length >= PAGE_SIZE && (
              <p className="py-4 text-center text-xs text-gray-400 dark:text-gray-500">
                {t('feed.endOfFeed')}
              </p>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};
