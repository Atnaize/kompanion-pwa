import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { Layout } from '@components/layout';
import {
  ActivityBarsViz,
  AnimatedNumber,
  DistanceProgressViz,
  ElevationMountainViz,
  GlassCard,
  StatTile,
  StatTileSkeleton,
  ActivityCardSkeleton,
  NoActivitiesEmpty,
  StreakDotsViz,
  SyncButton,
  TimePeriodSelector,
} from '@components/ui';
import type { TimePeriod } from '@components/ui';
import { WelcomeCard } from '@features/onboarding';
import { activitiesService, personalRecordsService, statsService } from '@api/services';
import { useAuthStore } from '@store/authStore';
import { useToastStore } from '@store/toastStore';
import { hapticService } from '@utils/haptic';
import { formatDistance, formatElevation, formatRelativeTime } from '@utils/format';

const formatDashboardRecordTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(secs)}` : `${minutes}:${pad(secs)}`;
};

export const DashboardPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const queryClient = useQueryClient();
  const { success, error } = useToastStore();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{
    type: 'fetching' | 'saving' | 'processing' | 'complete' | 'error';
    current?: number;
    total?: number;
    message?: string;
  } | null>(null);
  const [statsPeriod, setStatsPeriod] = useState<TimePeriod>('week');

  const { data: activities = [], isLoading: activitiesLoading } = useQuery({
    queryKey: ['activities'],
    queryFn: async () => {
      const response = await activitiesService.list();
      return response.data || [];
    },
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['stats', statsPeriod],
    queryFn: async () => {
      const response = await statsService.getUserStats(
        statsPeriod === 'overall' ? undefined : statsPeriod
      );
      return response.data!;
    },
  });

  const handleSync = async () => {
    if (isSyncing) return;

    setIsSyncing(true);
    setSyncProgress({ type: 'fetching', current: 0, message: t('dashboard.startingSync') });

    try {
      let syncedCount = 0;
      let challengeActivitiesAdded = 0;

      await activitiesService.syncWithProgress((progressData) => {
        setSyncProgress(progressData);

        if (progressData.type === 'complete') {
          syncedCount = progressData.total || 0;
          challengeActivitiesAdded = progressData.challengeActivitiesAdded || 0;
        }
      });

      // Refresh data - invalidate all queries to refetch fresh data
      await queryClient.invalidateQueries({ queryKey: ['activities'] });
      await queryClient.invalidateQueries({ queryKey: ['stats'] });
      await queryClient.invalidateQueries({ queryKey: ['achievements'] });
      await queryClient.invalidateQueries({ queryKey: ['challenges'] });
      await queryClient.invalidateQueries({ queryKey: ['personal-records'] });

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

      // Clear progress
      setSyncProgress(null);
    } catch (err) {
      console.error('Sync error:', err);
      const message = err instanceof Error && err.message ? err.message : t('dashboard.syncFailed');
      error(message);
      setSyncProgress(null);
    } finally {
      setIsSyncing(false);
    }
  };

  const recentActivities = activities?.slice(0, 5) || [];
  const isFirstTimeUser = !user?.lastSyncedAt;

  const { data: personalRecordBands = [] } = useQuery({
    queryKey: ['personal-records'],
    queryFn: async () => {
      const response = await personalRecordsService.list();
      return response.data || [];
    },
    enabled: !isFirstTimeUser,
  });

  const totalRecords = personalRecordBands.reduce((sum, b) => sum + b.records.length, 0);
  const freshestBand = personalRecordBands.reduce<string | null>((latest, group) => {
    const best = group.records[0];
    if (!best) return latest;
    if (!latest) return group.band;
    const current = personalRecordBands.find((g) => g.band === latest)?.records[0];
    return current && new Date(best.achievedAt) > new Date(current.achievedAt)
      ? group.band
      : latest;
  }, null);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Card for First-Time Users */}
        {isFirstTimeUser ? (
          <section>
            <WelcomeCard onSync={handleSync} isSyncing={isSyncing} syncProgress={syncProgress} />
          </section>
        ) : (
          <>
            {/* Quick Stats */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">{t('dashboard.quickStats')}</h2>
                <TimePeriodSelector
                  value={statsPeriod}
                  onChange={setStatsPeriod}
                  storageKey="dashboard-stats-period"
                />
              </div>
              {statsLoading ? (
                <div className="grid grid-cols-2 gap-3">
                  <StatTileSkeleton />
                  <StatTileSkeleton />
                  <StatTileSkeleton />
                  <StatTileSkeleton />
                </div>
              ) : (
                <div key={statsPeriod} className="grid grid-cols-2 gap-3">
                  <StatTile
                    label={t('common.activities')}
                    value={<AnimatedNumber value={stats?.totalActivities || 0} />}
                    viz={<ActivityBarsViz />}
                  />
                  <StatTile
                    label={t('common.distance')}
                    value={
                      <AnimatedNumber value={stats?.totalDistance || 0} format={formatDistance} />
                    }
                    viz={
                      <DistanceProgressViz
                        progress={Math.min(1, (stats?.totalDistance || 0) / 100000)}
                      />
                    }
                  />
                  <StatTile
                    label={t('common.elevation')}
                    value={
                      <AnimatedNumber value={stats?.totalElevation || 0} format={formatElevation} />
                    }
                    viz={<ElevationMountainViz />}
                  />
                  <StatTile
                    label={t('common.streak')}
                    value={
                      <AnimatedNumber
                        value={stats?.currentStreak || 0}
                        format={(n) => `${Math.round(n)} ${t('common.days')}`}
                      />
                    }
                    viz={<StreakDotsViz filled={stats?.currentStreak || 0} />}
                  />
                </div>
              )}
            </section>

            {/* Personal Records Preview */}
            {totalRecords > 0 && (
              <section>
                <GlassCard
                  className="group cursor-pointer p-5 transition-all hover:shadow-lg"
                  onClick={() => navigate('/personal-records')}
                >
                  <div className="mb-5 flex items-baseline justify-between">
                    <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                      {t('dashboard.personalRecords')}
                    </h3>
                    <span className="text-gray-400 transition-transform group-hover:translate-x-0.5">
                      ›
                    </span>
                  </div>
                  {(() => {
                    const achieved = personalRecordBands.filter((g) => g.records.length > 0);
                    const perRow =
                      achieved.length <= 4 ? achieved.length : Math.ceil(achieved.length / 2);
                    return (
                      <div
                        className="grid justify-items-center gap-y-5"
                        style={{ gridTemplateColumns: `repeat(${perRow}, minmax(0, 1fr))` }}
                      >
                        {achieved.map((group) => {
                          const best = group.records[0];
                          const isFreshest = group.band === freshestBand;
                          return (
                            <div key={group.band} className="flex w-[72px] flex-col items-center">
                              <div className="inline-flex items-center rounded-full border border-strava-orange/40 bg-white/60 px-2.5 py-0.5 shadow-sm backdrop-blur-sm">
                                <span className="font-mono text-[10px] font-bold tracking-[0.15em] text-strava-orange">
                                  {t(`personalRecords.bandsShort.${group.band}`)}
                                </span>
                              </div>
                              <div className="mt-2 font-mono text-base font-semibold tabular-nums tracking-tight text-gray-900">
                                {formatDashboardRecordTime(best.bestTimeSeconds)}
                              </div>
                              <div
                                className={clsx(
                                  'mt-1.5 h-[3px] w-full bg-gradient-to-r transition-opacity',
                                  isFreshest
                                    ? 'from-transparent via-strava-orange to-transparent opacity-100'
                                    : 'opacity-0'
                                )}
                              />
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </GlassCard>
              </section>
            )}

            {/* Recent Activities */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {t('dashboard.recentActivities')}
                </h2>
                <SyncButton
                  size="sm"
                  onClick={handleSync}
                  isSyncing={isSyncing}
                  progress={syncProgress}
                  className="min-w-[180px]"
                />
              </div>

              {activitiesLoading ? (
                <div className="space-y-3">
                  <ActivityCardSkeleton />
                  <ActivityCardSkeleton />
                  <ActivityCardSkeleton />
                  <ActivityCardSkeleton />
                  <ActivityCardSkeleton />
                </div>
              ) : recentActivities.length === 0 ? (
                <NoActivitiesEmpty onSync={handleSync} />
              ) : (
                <div className="space-y-3">
                  {recentActivities.map((activity) => (
                    <GlassCard
                      key={activity.id}
                      className="cursor-pointer p-4 transition-all hover:scale-[1.02] hover:shadow-lg"
                      onClick={() => navigate(`/activities/${activity.id}`)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900">{activity.name}</h3>
                          <p className="text-sm text-gray-600">
                            {formatRelativeTime(activity.start_date_local)}
                          </p>
                          <div className="mt-2 flex gap-4 text-sm">
                            <span>📏 {formatDistance(activity.distance)}</span>
                            <span>⛰️ {formatElevation(activity.total_elevation_gain)}</span>
                          </div>
                        </div>
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs">
                          {activity.type}
                        </span>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </Layout>
  );
};
