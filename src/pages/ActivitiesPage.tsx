import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Activity as ActivityIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { Layout } from '@components/layout';
import { AnimatedNumber, GlassCard, Button, Skeleton, EmptyState, EndOfList } from '@components/ui';
import { ActivityCard, ActivityTypePicker } from '@components/activity';
import { activitiesService } from '@api/services';
import { useInfiniteScroll } from '@hooks/useInfiniteScroll';
import { useAuthStore } from '@store/authStore';
import { useToastStore } from '@store/toastStore';
import { hapticService } from '@utils/haptic';
import type { Activity } from '@types';

const ITEMS_PER_PAGE = 20;

export const ActivitiesPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, setUser } = useAuthStore();
  const { success, error } = useToastStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_PAGE);
  const [isSyncing, setIsSyncing] = useState(false);

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['activities'],
    queryFn: async () => {
      const response = await activitiesService.list();
      return response.data || [];
    },
  });

  const handleSync = async () => {
    if (isSyncing) return;

    setIsSyncing(true);

    try {
      let syncedCount = 0;
      let challengeActivitiesAdded = 0;

      await activitiesService.syncWithProgress((progressData) => {
        if (progressData.type === 'complete') {
          syncedCount = progressData.total || 0;
          challengeActivitiesAdded = progressData.challengeActivitiesAdded || 0;
        }
      });

      // Refresh data
      await queryClient.invalidateQueries({ queryKey: ['activities'] });
      await queryClient.invalidateQueries({ queryKey: ['stats'] });
      await queryClient.invalidateQueries({ queryKey: ['challenges'] });

      // Update user with lastSyncedAt
      if (user) {
        setUser({ ...user, lastSyncedAt: new Date().toISOString() });
      }

      // Show success toast
      let message =
        syncedCount > 0
          ? t('dashboard.syncSuccess', { count: syncedCount })
          : t('dashboard.allUpToDate');

      if (challengeActivitiesAdded > 0) {
        message += t('dashboard.challengeActivitiesAdded', { count: challengeActivitiesAdded });
      } else if (syncedCount > 0) {
        message += ' 🏃';
      }

      success(message);
      hapticService.syncCompleted();
    } catch (err) {
      console.error('Sync error:', err);
      error(t('dashboard.syncFailed'));
    } finally {
      setIsSyncing(false);
    }
  };

  // Filter and search activities
  const filteredActivities = useMemo(() => {
    let result = activities;

    // Filter by type
    if (selectedType !== null) {
      result = result.filter((activity) => activity.type === selectedType);
    }

    // Search by name
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((activity) => activity.name.toLowerCase().includes(query));
    }

    return result;
  }, [activities, selectedType, searchQuery]);

  // Get unique activity types with counts for filter chips
  const activityTypes = useMemo(() => {
    const counts = new Map<string, number>();
    for (const activity of activities) {
      counts.set(activity.type, (counts.get(activity.type) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([type, count]) => ({ type, count }));
  }, [activities]);

  // Paginate displayed activities for infinite scroll
  const displayedActivities = useMemo(() => {
    return filteredActivities.slice(0, displayedCount);
  }, [filteredActivities, displayedCount]);

  const hasMore = displayedCount < filteredActivities.length;

  // Load more when scrolling to bottom
  const loadMore = useCallback(() => {
    if (hasMore && !isLoading) {
      setDisplayedCount((prev) => prev + ITEMS_PER_PAGE);
    }
  }, [hasMore, isLoading]);

  const scrollTriggerRef = useInfiniteScroll(loadMore);

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-10 w-full" />
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
              {t('activities.title')}
            </p>
            <p className="mt-1 font-mono text-2xl font-semibold tabular-nums tracking-tight text-gray-900 dark:text-gray-50">
              <AnimatedNumber value={filteredActivities.length} />
            </p>
            {searchQuery && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('activities.matchingQuery', { query: searchQuery })}
              </p>
            )}
          </div>
          <Button size="sm" onClick={handleSync} disabled={isSyncing}>
            {isSyncing ? t('common.syncing') : t('common.sync')}
          </Button>
        </div>

        {/* Search Bar */}
        <GlassCard className="p-4">
          <input
            type="text"
            placeholder={t('activities.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border-0 bg-white/50 px-4 py-2 text-gray-900 placeholder-gray-500 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-900/50 dark:text-gray-50 dark:placeholder-gray-400"
          />
        </GlassCard>

        {/* Filter Chips */}
        <ActivityTypePicker
          types={activityTypes}
          totalCount={activities.length}
          selected={selectedType}
          onChange={setSelectedType}
        />

        {/* Activities List */}
        {displayedActivities.length === 0 ? (
          <EmptyState
            icon={
              <ActivityIcon
                className="h-10 w-10 text-gray-400 dark:text-gray-500"
                strokeWidth={1.5}
              />
            }
            title={t('activities.noActivitiesFound')}
            description={
              searchQuery || selectedType !== null
                ? t('activities.adjustFilters')
                : t('activities.startSyncing')
            }
            action={
              searchQuery || selectedType !== null
                ? {
                    label: t('activities.clearFilters'),
                    onClick: () => {
                      setSearchQuery('');
                      setSelectedType(null);
                    },
                  }
                : undefined
            }
          />
        ) : (
          <div className="space-y-3">
            {displayedActivities.map((activity: Activity, i: number) => (
              <motion.div
                key={activity.id}
                initial={i < 8 ? { opacity: 0, y: 8 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: Math.min(i, 8) * 0.04, ease: 'easeOut' }}
              >
                <ActivityCard
                  activity={activity}
                  variant="detailed"
                  onClick={() => navigate(`/activities/${activity.id}`)}
                />
              </motion.div>
            ))}

            {/* Infinite Scroll Trigger */}
            {hasMore && (
              <div ref={scrollTriggerRef} className="py-4">
                <div className="space-y-3">
                  <Skeleton className="h-32" />
                  <Skeleton className="h-32" />
                </div>
              </div>
            )}

            {/* End of List Message */}
            {!hasMore && displayedActivities.length > 0 && (
              <EndOfList label={t('activities.endOfList')} />
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};
