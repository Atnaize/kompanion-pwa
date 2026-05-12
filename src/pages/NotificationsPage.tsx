import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck } from 'lucide-react';
import { Layout } from '@components/layout';
import { Button, EmptyState } from '@components/ui';
import { inboxService } from '@api/services';
import { InboxItem } from '@features/inbox';
import type { InboxPage as InboxPageData } from '@types';

const PAGE_SIZE = 20;

export const NotificationsPage = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery<
    InboxPageData,
    Error
  >({
    queryKey: ['inbox'],
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      const response = await inboxService.list(pageParam as string | undefined, PAGE_SIZE);
      return (response.data ?? { notifications: [], nextCursor: null }) as InboxPageData;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const invalidateBadge = () => {
    void queryClient.invalidateQueries({ queryKey: ['inbox-unread-count'] });
    void queryClient.invalidateQueries({ queryKey: ['inbox'] });
  };

  const markReadMutation = useMutation({
    mutationFn: (id: string) => inboxService.markRead(id),
    onSuccess: invalidateBadge,
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => inboxService.markAllRead(),
    onSuccess: invalidateBadge,
  });

  // Infinite scroll sentinel.
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

  const notifications = data?.pages.flatMap((p) => p.notifications) ?? [];
  const hasUnread = notifications.some((n) => n.readAt === null);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
              {t('inbox.title')}
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('inbox.subtitle')}</p>
          </div>
          {hasUnread && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
            >
              <CheckCheck size={14} strokeWidth={2} className="mr-1.5" />
              {t('inbox.markAllRead')}
            </Button>
          )}
        </div>

        {isLoading ? (
          <p className="px-1 text-sm text-gray-500 dark:text-gray-400">{t('common.loading')}</p>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={<Bell size={32} strokeWidth={1.5} aria-hidden="true" />}
            title={t('inbox.empty.title')}
            description={t('inbox.empty.description')}
          />
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <InboxItem
                key={n.id}
                notification={n}
                onClick={() => {
                  if (n.readAt === null) {
                    markReadMutation.mutate(n.id);
                  }
                }}
              />
            ))}

            {hasNextPage && (
              <div ref={sentinelRef} className="py-4 text-center">
                {isFetchingNextPage && (
                  <p className="text-xs text-gray-400 dark:text-gray-500">{t('common.loading')}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};
