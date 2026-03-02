import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Layout } from '@components/layout';
import { GlassCard, Button, Skeleton } from '@components/ui';
import { activitiesService } from '@api/services';
import { formatDistance, formatElevation, formatDuration, formatDate } from '@utils/format';

export const ActivityDetailPage = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showAllSegments, setShowAllSegments] = useState(false);

  const {
    data: activity,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['activity', id],
    queryFn: async () => {
      if (!id) throw new Error('Activity ID is required');
      const response = await activitiesService.getById(parseInt(id, 10));
      return response.data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (error) {
      navigate('/dashboard');
    }
  }, [error, navigate]);

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Back Button */}
              <Skeleton className="mb-4 h-10 w-24" />

              {/* Activity Header with Icon */}
              <div className="flex items-center gap-3">
                <Skeleton className="h-16 w-16 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-8 w-80" />
                  <Skeleton className="h-5 w-56" />
                </div>
              </div>
            </div>
          </div>

          {/* Key Metrics Card */}
          <GlassCard className="p-6">
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-9 w-28" />
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Performance Card Skeleton */}
          <GlassCard className="p-6">
            <Skeleton className="mb-6 h-7 w-36" />
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Details Card Skeleton */}
          <GlassCard className="p-6">
            <Skeleton className="mb-6 h-7 w-28" />
            <div className="grid grid-cols-2 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-5 w-full" />
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Engagement Card Skeleton */}
          <GlassCard className="p-6">
            <Skeleton className="mb-6 h-7 w-36" />
            <div className="flex flex-wrap gap-8">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-7 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </Layout>
    );
  }

  if (!activity) {
    return null;
  }

  const activityTypeEmoji = (type: string): string => {
    const emojiMap: Record<string, string> = {
      Run: '🏃',
      Ride: '🚴',
      Swim: '🏊',
      Walk: '🚶',
      Hike: '🥾',
      AlpineSki: '⛷️',
      BackcountrySki: '🎿',
      NordicSki: '⛷️',
      Snowboard: '🏂',
      IceSkate: '⛸️',
      InlineSkate: '🛼',
      Rowing: '🚣',
      Kayaking: '🛶',
      Canoeing: '🛶',
      Surfing: '🏄',
      Yoga: '🧘',
      Workout: '💪',
      WeightTraining: '🏋️',
      Elliptical: '🏃',
      StairStepper: '🪜',
      RockClimbing: '🧗',
    };
    return emojiMap[type] || '🏃';
  };

  const hasHeartRate = activity.average_heartrate && activity.max_heartrate;
  const hasPower = activity.average_watts && activity.max_watts;
  const hasElevation = activity.total_elevation_gain > 0;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Button variant="secondary" size="sm" onClick={() => navigate(-1)} className="mb-4">
              {t('common.back')}
            </Button>
            <div className="flex items-center gap-3">
              <span className="text-4xl">{activityTypeEmoji(activity.type)}</span>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{activity.name}</h1>
                <p className="text-sm text-gray-600">
                  {formatDate(activity.start_date_local)} • {activity.type}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <GlassCard className="p-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm text-gray-600">{t('common.distance')}</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatDistance(activity.distance)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('common.duration')}</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatDuration(activity.moving_time)}
              </p>
            </div>
            {hasElevation && (
              <div>
                <p className="text-sm text-gray-600">{t('common.elevation')}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatElevation(activity.total_elevation_gain)}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">{t('common.avgSpeed')}</p>
              <p className="text-2xl font-bold text-gray-900">
                {(activity.average_speed * 3.6).toFixed(1)} km/h
              </p>
            </div>
          </div>
        </GlassCard>

        {/* Additional Metrics */}
        {(hasHeartRate || hasPower) && (
          <GlassCard className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">{t('activityDetail.performance')}</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {hasHeartRate && (
                <>
                  <div>
                    <p className="text-sm text-gray-600">{t('activityDetail.avgHeartRate')}</p>
                    <p className="text-xl font-bold text-gray-900">
                      {Math.round(activity.average_heartrate!)} bpm
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{t('activityDetail.maxHeartRate')}</p>
                    <p className="text-xl font-bold text-gray-900">
                      {Math.round(activity.max_heartrate!)} bpm
                    </p>
                  </div>
                </>
              )}
              {hasPower && (
                <>
                  <div>
                    <p className="text-sm text-gray-600">{t('activityDetail.avgPower')}</p>
                    <p className="text-xl font-bold text-gray-900">
                      {Math.round(activity.average_watts!)} W
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{t('activityDetail.maxPower')}</p>
                    <p className="text-xl font-bold text-gray-900">
                      {Math.round(activity.max_watts!)} W
                    </p>
                  </div>
                </>
              )}
            </div>
          </GlassCard>
        )}

        {/* Activity Details */}
        <GlassCard className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">{t('activityDetail.details')}</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">{t('activityDetail.elapsedTime')}</span>
              <span className="ml-2 font-medium text-gray-900">
                {formatDuration(activity.elapsed_time)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">{t('activityDetail.movingTime')}</span>
              <span className="ml-2 font-medium text-gray-900">
                {formatDuration(activity.moving_time)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">{t('activityDetail.maxSpeed')}</span>
              <span className="ml-2 font-medium text-gray-900">
                {(activity.max_speed * 3.6).toFixed(1)} km/h
              </span>
            </div>
            {hasElevation && activity.elev_high && activity.elev_low && (
              <>
                <div>
                  <span className="text-gray-600">{t('activityDetail.highestPoint')}</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {Math.round(activity.elev_high)} m
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">{t('activityDetail.lowestPoint')}</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {Math.round(activity.elev_low)} m
                  </span>
                </div>
              </>
            )}
            {activity.pr_count > 0 && (
              <div className="col-span-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 px-3 py-1 text-sm font-medium text-white">
                  🏆 {t('activityDetail.personalRecord', { count: activity.pr_count })}
                </span>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Interaction Stats */}
        <GlassCard className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">{t('activityDetail.engagement')}</h2>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl">👍</span>
              <span className="text-lg font-medium text-gray-900">{activity.kudos_count}</span>
              <span className="text-sm text-gray-600">{t('activityDetail.kudos')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">💬</span>
              <span className="text-lg font-medium text-gray-900">{activity.comment_count}</span>
              <span className="text-sm text-gray-600">{t('activityDetail.comments')}</span>
            </div>
          </div>
        </GlassCard>

        {/* Personal Records (Segment PRs) */}
        {activity.segment_efforts && activity.segment_efforts.length > 0 && (
          <GlassCard className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">{t('activityDetail.segmentPrs')}</h2>
              <span className="rounded-full bg-gradient-to-r from-orange-400 to-orange-600 px-3 py-1 text-sm font-bold text-white">
                {activity.segment_efforts.filter((e) => e.pr_rank !== null).length} PRs
              </span>
            </div>

            <div className="space-y-3">
              {activity.segment_efforts
                .filter((effort) => effort.pr_rank !== null)
                .slice(0, showAllSegments ? undefined : 3)
                .map((effort) => (
                  <div
                    key={effort.id}
                    className="flex items-center justify-between rounded-lg border border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50 p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate font-bold text-gray-900">
                            {effort.segment.name}
                          </h3>
                          <div className="mt-1 flex flex-wrap gap-3 text-sm text-gray-600">
                            <span>📏 {formatDistance(effort.segment.distance)}</span>
                            <span>⏱️ {formatDuration(effort.elapsed_time)}</span>
                            {effort.segment.average_grade !== 0 && (
                              <span>
                                📈 {effort.segment.average_grade > 0 ? '+' : ''}
                                {effort.segment.average_grade.toFixed(1)}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 text-xl font-bold text-white shadow-lg">
                        {effort.pr_rank === 1 ? '🥇' : effort.pr_rank === 2 ? '🥈' : '🥉'}
                      </div>
                      <p className="mt-1 text-center text-xs text-gray-600">
                        {effort.pr_rank === 1
                          ? t('activityDetail.prRank1')
                          : effort.pr_rank === 2
                            ? t('activityDetail.prRank2')
                            : t('activityDetail.prRank3')}
                      </p>
                    </div>
                  </div>
                ))}
            </div>

            {activity.segment_efforts.filter((e) => e.pr_rank !== null).length > 3 && (
              <Button
                variant="secondary"
                size="sm"
                className="mt-4 w-full"
                onClick={() => setShowAllSegments(!showAllSegments)}
              >
                {showAllSegments
                  ? t('activityDetail.showLess')
                  : t('activityDetail.showAllPrs', { count: activity.segment_efforts.filter((e) => e.pr_rank !== null).length })}
              </Button>
            )}
          </GlassCard>
        )}
      </div>
    </Layout>
  );
};
