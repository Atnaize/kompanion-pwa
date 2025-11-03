import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Layout } from '@components/layout';
import { GlassCard, Button, Skeleton, EmptyState } from '@components/ui';
import { activitiesService } from '@api/services';
import { useInfiniteScroll } from '@hooks/useInfiniteScroll';
import { formatDistance, formatElevation, formatRelativeTime, formatDuration } from '@utils/format';
import { useAuthStore } from '@store/authStore';
import { useToastStore } from '@store/toastStore';
import { hapticService } from '@utils/haptic';
import type { Activity } from '@types';

const ITEMS_PER_PAGE = 20;

export const ActivitiesPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, setUser } = useAuthStore();
  const { success, error } = useToastStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
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

      await activitiesService.syncWithProgress((progressData) => {
        if (progressData.type === 'complete') {
          syncedCount = progressData.total || 0;
        }
      });

      // Refresh data
      await queryClient.invalidateQueries({ queryKey: ['activities'] });
      await queryClient.invalidateQueries({ queryKey: ['stats'] });

      // Update user with lastSyncedAt
      if (user) {
        setUser({ ...user, lastSyncedAt: new Date().toISOString() });
      }

      // Show success toast
      const message =
        syncedCount > 0
          ? `${syncedCount} activit${syncedCount === 1 ? 'y' : 'ies'} synced! 🏃`
          : 'All activities up to date';
      success(message);
      hapticService.syncCompleted();
    } catch (err) {
      console.error('Sync error:', err);
      error('Failed to sync activities. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Filter and search activities
  const filteredActivities = useMemo(() => {
    let result = activities;

    // Filter by type
    if (selectedType !== 'all') {
      result = result.filter((activity) => activity.type === selectedType);
    }

    // Search by name
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((activity) => activity.name.toLowerCase().includes(query));
    }

    return result;
  }, [activities, selectedType, searchQuery]);

  // Get unique activity types for filter chips
  const activityTypes = useMemo(() => {
    const types = new Set(activities.map((a) => a.type));
    return Array.from(types).sort();
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

  // Activity type emoji mapping
  const getActivityEmoji = (type: string): string => {
    const emojiMap: Record<string, string> = {
      Run: '🏃',
      Ride: '🚴',
      Swim: '🏊',
      Walk: '🚶',
      Hike: '🥾',
      Workout: '💪',
      Yoga: '🧘',
    };
    return emojiMap[type] || '🏃';
  };

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
            <h1 className="text-2xl font-bold text-gray-900">Activities</h1>
            <p className="text-sm text-gray-600">
              {filteredActivities.length} activit{filteredActivities.length === 1 ? 'y' : 'ies'}
              {searchQuery && ` matching "${searchQuery}"`}
            </p>
          </div>
          <Button size="sm" onClick={handleSync} disabled={isSyncing}>
            {isSyncing ? 'Syncing...' : 'Sync'}
          </Button>
        </div>

        {/* Search Bar */}
        <GlassCard className="p-4">
          <input
            type="text"
            placeholder="Search activities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border-0 bg-white/50 px-4 py-2 text-gray-900 placeholder-gray-500 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </GlassCard>

        {/* Filter Chips */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedType('all')}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
              selectedType === 'all'
                ? 'bg-gradient-to-r from-orange-400 to-orange-600 text-white shadow-lg'
                : 'bg-white/50 text-gray-700 backdrop-blur-sm hover:bg-white/80'
            }`}
          >
            All ({activities.length})
          </button>
          {activityTypes.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                selectedType === type
                  ? 'bg-gradient-to-r from-orange-400 to-orange-600 text-white shadow-lg'
                  : 'bg-white/50 text-gray-700 backdrop-blur-sm hover:bg-white/80'
              }`}
            >
              {getActivityEmoji(type)} {type} ({activities.filter((a) => a.type === type).length})
            </button>
          ))}
        </div>

        {/* Activities List */}
        {displayedActivities.length === 0 ? (
          <EmptyState
            icon="🏃"
            title="No activities found"
            description={
              searchQuery || selectedType !== 'all'
                ? 'Try adjusting your filters or search query'
                : 'Start syncing your activities to see them here'
            }
            action={
              searchQuery || selectedType !== 'all'
                ? {
                    label: 'Clear Filters',
                    onClick: () => {
                      setSearchQuery('');
                      setSelectedType('all');
                    },
                  }
                : undefined
            }
          />
        ) : (
          <div className="space-y-3">
            {displayedActivities.map((activity: Activity) => (
              <GlassCard
                key={activity.id}
                className="cursor-pointer p-4 transition-all hover:scale-[1.01] hover:shadow-lg"
                onClick={() => navigate(`/activities/${activity.id}`)}
              >
                <div className="flex items-start gap-4">
                  {/* Activity Icon */}
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-2xl">
                    {getActivityEmoji(activity.type)}
                  </div>

                  {/* Activity Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-bold text-gray-900">{activity.name}</h3>
                        <p className="text-sm text-gray-600">
                          {formatRelativeTime(activity.start_date_local)}
                        </p>
                      </div>
                      {activity.pr_count > 0 && (
                        <span className="flex-shrink-0 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 px-2 py-0.5 text-xs font-medium text-white">
                          🏆 {activity.pr_count} PR{activity.pr_count > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    {/* Metrics */}
                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                      <div>
                        <p className="text-gray-600">Distance</p>
                        <p className="font-medium text-gray-900">
                          {formatDistance(activity.distance)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Duration</p>
                        <p className="font-medium text-gray-900">
                          {formatDuration(activity.moving_time)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Elevation</p>
                        <p className="font-medium text-gray-900">
                          {formatElevation(activity.total_elevation_gain)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Avg Speed</p>
                        <p className="font-medium text-gray-900">
                          {(activity.average_speed * 3.6).toFixed(1)} km/h
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </GlassCard>
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
              <div className="py-8 text-center text-sm text-gray-600">
                You&apos;ve reached the end of your activities 🎉
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};
