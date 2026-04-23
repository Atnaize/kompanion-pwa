import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Layout } from '@components/layout';
import {
  GlassCard,
  Button,
  StatTile,
  StatTileSkeleton,
  ActivityCardSkeleton,
  NoActivitiesEmpty,
  TimePeriodSelector,
} from '@components/ui';
import type { TimePeriod } from '@components/ui';
import { WelcomeCard } from '@features/onboarding';
import { activitiesService, statsService } from '@api/services';
import { useAuthStore } from '@store/authStore';
import { useToastStore } from '@store/toastStore';
import { hapticService } from '@utils/haptic';
import { formatDistance, formatElevation, formatRelativeTime } from '@utils/format';

export const DashboardPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const queryClient = useQueryClient();
  const { success, error } = useToastStore();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{
    type: 'fetching' | 'saving' | 'complete' | 'error';
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
      console.log('Showing sync error toast');
      error(t('dashboard.syncFailed'));
      setSyncProgress(null);
    } finally {
      setIsSyncing(false);
    }
  };

  const recentActivities = activities?.slice(0, 5) || [];
  const isFirstTimeUser = !user?.lastSyncedAt;

  // Calculate PR stats
  const prActivities = activities.filter((a) => a.pr_count > 0);
  const totalPRs = prActivities.reduce((sum, a) => sum + a.pr_count, 0);

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
                <div className="grid grid-cols-2 gap-3">
                  <StatTile
                    icon="🏃"
                    label={t('common.activities')}
                    value={stats?.totalActivities.toString() || '0'}
                  />
                  <StatTile
                    icon="📏"
                    label={t('common.distance')}
                    value={formatDistance(stats?.totalDistance || 0)}
                  />
                  <StatTile
                    icon="⛰️"
                    label={t('common.elevation')}
                    value={formatElevation(stats?.totalElevation || 0)}
                  />
                  <StatTile
                    icon="🔥"
                    label={t('common.streak')}
                    value={`${stats?.currentStreak || 0} ${t('common.days')}`}
                  />
                </div>
              )}
            </section>

            {/* Personal Records Card */}
            {totalPRs > 0 && (
              <section>
                <GlassCard
                  className="cursor-pointer p-6 transition-all hover:scale-[1.01] hover:shadow-lg"
                  onClick={() => navigate('/personal-records')}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🏆</span>
                        <h3 className="text-lg font-bold text-gray-900">
                          {t('dashboard.personalRecords')}
                        </h3>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">
                        {t('dashboard.prDescription', {
                          totalPRs,
                          recordText: t('dashboard.prRecord', { count: totalPRs }),
                          activityCount: prActivities.length,
                          activityText: t('dashboard.prActivity', { count: prActivities.length }),
                        })}
                      </p>
                    </div>
                    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 text-3xl font-bold text-white shadow-lg">
                      {totalPRs}
                    </div>
                  </div>
                  <Button variant="secondary" size="sm" className="mt-4 w-full">
                    {t('dashboard.viewAllPrs')}
                  </Button>
                </GlassCard>
              </section>
            )}

            {/* Recent Activities */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {t('dashboard.recentActivities')}
                </h2>
                <Button size="sm" onClick={handleSync} disabled={isSyncing}>
                  {isSyncing ? t('common.syncing') : t('common.sync')}
                </Button>
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
