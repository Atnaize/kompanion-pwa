import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Layout } from '@components/layout';
import { GlassCard, Skeleton, EmptyState } from '@components/ui';
import { activitiesService } from '@api/services';
import { useInfiniteScroll } from '@hooks/useInfiniteScroll';
import { formatDistance, formatElevation, formatRelativeTime, formatDuration } from '@utils/format';
import type { Activity } from '@types';

const ITEMS_PER_PAGE = 20;

export const PersonalRecordsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<string>('all');
  const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_PAGE);

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['activities'],
    queryFn: async () => {
      const response = await activitiesService.list();
      return response.data || [];
    },
  });

  // Filter activities with PRs
  const prActivities = useMemo(() => {
    return activities.filter((activity) => activity.pr_count > 0);
  }, [activities]);

  // Filter by type
  const filteredActivities = useMemo(() => {
    if (selectedType === 'all') {
      return prActivities;
    }
    return prActivities.filter((activity) => activity.type === selectedType);
  }, [prActivities, selectedType]);

  // Get unique activity types for filter chips
  const activityTypes = useMemo(() => {
    const types = new Set(prActivities.map((a) => a.type));
    return Array.from(types).sort();
  }, [prActivities]);

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

  // Calculate total PRs
  const totalPRs = useMemo(() => {
    return prActivities.reduce((sum, activity) => sum + activity.pr_count, 0);
  }, [prActivities]);

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-24 w-full" />
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('personalRecords.title')}</h1>
          <p className="text-sm text-gray-600">
            {t('personalRecords.summary', { count: prActivities.length, activityCount: prActivities.length, prCount: totalPRs })}
          </p>
        </div>

        {/* Stats Card */}
        {prActivities.length > 0 && (
          <GlassCard className="p-6">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <div>
                <div className="text-3xl font-bold text-orange-600">{totalPRs}</div>
                <p className="text-sm text-gray-600">{t('personalRecords.totalPrs')}</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-orange-600">{prActivities.length}</div>
                <p className="text-sm text-gray-600">{t('personalRecords.activitiesWithPrs')}</p>
              </div>
              <div className="col-span-2 md:col-span-1">
                <div className="text-3xl font-bold text-orange-600">
                  {(totalPRs / prActivities.length).toFixed(1)}
                </div>
                <p className="text-sm text-gray-600">{t('personalRecords.avgPrsPerActivity')}</p>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Filter Chips */}
        {activityTypes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedType('all')}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                selectedType === 'all'
                  ? 'bg-gradient-to-r from-orange-400 to-orange-600 text-white shadow-lg'
                  : 'bg-white/50 text-gray-700 backdrop-blur-sm hover:bg-white/80'
              }`}
            >
              {t('common.all')} ({prActivities.length})
            </button>
            {activityTypes.map((type) => {
              const count = prActivities.filter((a) => a.type === type).length;
              return (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    selectedType === type
                      ? 'bg-gradient-to-r from-orange-400 to-orange-600 text-white shadow-lg'
                      : 'bg-white/50 text-gray-700 backdrop-blur-sm hover:bg-white/80'
                  }`}
                >
                  {getActivityEmoji(type)} {type} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Activities List */}
        {displayedActivities.length === 0 ? (
          <EmptyState
            icon="🏆"
            title={
              selectedType !== 'all' ? t('personalRecords.noPrsForType') : t('personalRecords.noPrsYet')
            }
            description={
              selectedType !== 'all'
                ? t('personalRecords.tryDifferentType')
                : t('personalRecords.keepTraining')
            }
            action={
              selectedType !== 'all'
                ? {
                    label: t('personalRecords.showAll'),
                    onClick: () => setSelectedType('all'),
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
                  {/* Activity Icon with PR Badge */}
                  <div className="relative flex-shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-2xl">
                      {getActivityEmoji(activity.type)}
                    </div>
                    <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 text-sm shadow-lg">
                      🏆
                    </div>
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
                      <span className="flex-shrink-0 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 px-3 py-1 text-sm font-bold text-white shadow-md">
                        {t('activities.pr', { count: activity.pr_count })}
                      </span>
                    </div>

                    {/* Metrics */}
                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                      <div>
                        <p className="text-gray-600">{t('common.distance')}</p>
                        <p className="font-medium text-gray-900">
                          {formatDistance(activity.distance)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">{t('common.duration')}</p>
                        <p className="font-medium text-gray-900">
                          {formatDuration(activity.moving_time)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">{t('common.elevation')}</p>
                        <p className="font-medium text-gray-900">
                          {formatElevation(activity.total_elevation_gain)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">{t('common.avgSpeed')}</p>
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
                {t('personalRecords.endOfList')}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};
