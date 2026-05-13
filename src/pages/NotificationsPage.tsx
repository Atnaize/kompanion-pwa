import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { Layout } from '@components/layout';
import { Button, ConfirmModal, EmptyState } from '@components/ui';
import { inboxService } from '@api/services';
import { InboxItem } from '@features/inbox';
import type { InboxPage as InboxPageData } from '@types';

type InboxCache = InfiniteData<InboxPageData, string | undefined>;

const PAGE_SIZE = 20;
type Filter = 'all' | 'unread';

export const NotificationsPage = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [confirmDeleteAllOpen, setConfirmDeleteAllOpen] = useState(false);

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
    // The global default is `refetchOnMount: false`, but invalidations triggered
    // while this page is unmounted (e.g. emitting from the admin Notifications
    // tab, or a push arriving in the background) would then go unseen until a
    // hard refresh. Force a refetch every time the page is opened.
    refetchOnMount: 'always',
  });

  const invalidateInbox = () => {
    void queryClient.invalidateQueries({ queryKey: ['inbox-unread-count'] });
    void queryClient.invalidateQueries({ queryKey: ['inbox'] });
  };

  // Optimistic mark-read: the user typically clicks then immediately navigates
  // to the linked page. We mutate the cache synchronously so the row stops
  // looking unread before the route change, and reconcile via invalidate on
  // success (or roll back on error).
  const markReadMutation = useMutation({
    mutationFn: (id: string) => inboxService.markRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['inbox'] });
      const previous = queryClient.getQueryData<InboxCache>(['inbox']);
      const nowIso = new Date().toISOString();
      queryClient.setQueryData<InboxCache>(['inbox'], (old) =>
        old
          ? {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                notifications: page.notifications.map((n) =>
                  n.id === id && n.readAt === null ? { ...n, readAt: nowIso } : n
                ),
              })),
            }
          : old
      );
      queryClient.setQueryData<{ count: number } | undefined>(['inbox-unread-count'], (old) =>
        old && old.count > 0 ? { count: old.count - 1 } : old
      );
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(['inbox'], ctx.previous);
      }
      void queryClient.invalidateQueries({ queryKey: ['inbox-unread-count'] });
    },
    onSettled: invalidateInbox,
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => inboxService.markAllRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['inbox'] });
      const previous = queryClient.getQueryData<InboxCache>(['inbox']);
      const nowIso = new Date().toISOString();
      queryClient.setQueryData<InboxCache>(['inbox'], (old) =>
        old
          ? {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                notifications: page.notifications.map((n) =>
                  n.readAt === null ? { ...n, readAt: nowIso } : n
                ),
              })),
            }
          : old
      );
      queryClient.setQueryData(['inbox-unread-count'], { count: 0 });
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(['inbox'], ctx.previous);
      }
      void queryClient.invalidateQueries({ queryKey: ['inbox-unread-count'] });
    },
    onSettled: invalidateInbox,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => inboxService.delete(id),
    onSuccess: invalidateInbox,
  });

  const deleteAllMutation = useMutation({
    mutationFn: () => inboxService.deleteAll(),
    onSuccess: () => {
      setConfirmDeleteAllOpen(false);
      invalidateInbox();
    },
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

  const allNotifications = useMemo(() => data?.pages.flatMap((p) => p.notifications) ?? [], [data]);
  const filtered = useMemo(
    () =>
      filter === 'unread' ? allNotifications.filter((n) => n.readAt === null) : allNotifications,
    [allNotifications, filter]
  );
  const hasAny = allNotifications.length > 0;
  const hasUnread = allNotifications.some((n) => n.readAt === null);

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
              {t('inbox.title')}
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('inbox.subtitle')}</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
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
            {hasAny && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setConfirmDeleteAllOpen(true)}
                disabled={deleteAllMutation.isPending}
              >
                <Trash2 size={14} strokeWidth={2} className="mr-1.5" />
                {t('inbox.deleteAll')}
              </Button>
            )}
          </div>
        </div>

        {hasAny && (
          <div
            role="tablist"
            className="inline-flex rounded-full border border-gray-200 bg-white p-1 text-xs font-medium dark:border-gray-700 dark:bg-gray-900"
          >
            {(['all', 'unread'] as Filter[]).map((value) => {
              const isActive = filter === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setFilter(value)}
                  className={clsx(
                    'rounded-full px-3 py-1.5 transition-colors',
                    isActive
                      ? 'bg-strava-orange/10 text-strava-orange'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  )}
                >
                  {value === 'all' ? t('inbox.filterAll') : t('inbox.filterUnread')}
                </button>
              );
            })}
          </div>
        )}

        {isLoading ? (
          <p className="px-1 text-sm text-gray-500 dark:text-gray-400">{t('common.loading')}</p>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Bell size={32} strokeWidth={1.5} aria-hidden="true" />}
            title={
              hasAny && filter === 'unread' ? t('inbox.emptyUnread.title') : t('inbox.empty.title')
            }
            description={
              hasAny && filter === 'unread'
                ? t('inbox.emptyUnread.description')
                : t('inbox.empty.description')
            }
          />
        ) : (
          <div className="space-y-2">
            {filtered.map((n) => (
              <InboxItem
                key={n.id}
                notification={n}
                onClick={() => {
                  if (n.readAt === null) {
                    markReadMutation.mutate(n.id);
                  }
                }}
                onDismiss={() => deleteMutation.mutate(n.id)}
              />
            ))}

            {hasNextPage && filter === 'all' && (
              <div ref={sentinelRef} className="py-4 text-center">
                {isFetchingNextPage && (
                  <p className="text-xs text-gray-400 dark:text-gray-500">{t('common.loading')}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmDeleteAllOpen}
        onClose={() => setConfirmDeleteAllOpen(false)}
        onConfirm={() => deleteAllMutation.mutate()}
        title={t('inbox.deleteAll')}
        message={t('inbox.deleteAllConfirm')}
        confirmText={t('inbox.deleteAll')}
        confirmVariant="danger"
        isLoading={deleteAllMutation.isPending}
      />
    </Layout>
  );
};
