import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Layout } from '@components/layout';
import { GlassCard, Button, StatTile, Toast, WelcomeCard, QuestSummaryCard } from '@components/ui';
import { activitiesService, statsService, questsService } from '@api/services';
import { useAuthStore } from '@store/authStore';
import { formatDistance, formatElevation, formatRelativeTime } from '@utils/format';

export const DashboardPage = () => {
  const { user, setUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{
    type: 'fetching' | 'saving' | 'complete' | 'error';
    current?: number;
    total?: number;
    message?: string;
  } | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    message: string;
    type: 'success' | 'info' | 'error';
  } | null>(null);

  const {
    data: activities = [],
    isLoading: activitiesLoading,
  } = useQuery({
    queryKey: ['activities'],
    queryFn: async () => {
      const response = await activitiesService.list();
      return response.data || [];
    },
  });

  const {
    data: stats,
    isLoading: statsLoading,
  } = useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const response = await statsService.getUserStats();
      return response.data!;
    },
  });

  const { data: quests = [] } = useQuery({
    queryKey: ['quests'],
    queryFn: async () => {
      const response = await questsService.list();
      return response.data || [];
    },
  });

  const handleSync = async () => {
    if (isSyncing) return;

    setIsSyncing(true);
    setSyncProgress({ type: 'fetching', current: 0, message: 'Starting sync...' });

    try {
      let syncedCount = 0;

      await activitiesService.syncWithProgress((progressData) => {
        setSyncProgress(progressData);

        if (progressData.type === 'complete') {
          syncedCount = progressData.total || 0;
        }
      });

      // Refresh data - invalidate all queries to refetch fresh data
      await queryClient.invalidateQueries({ queryKey: ['activities'] });
      await queryClient.invalidateQueries({ queryKey: ['stats'] });
      await queryClient.invalidateQueries({ queryKey: ['quests'] });
      await queryClient.invalidateQueries({ queryKey: ['achievements'] });

      // Update user with lastSyncedAt
      if (user) {
        setUser({ ...user, lastSyncedAt: new Date().toISOString() });
      }

      // Show success toast
      setToastMessage({
        message:
          syncedCount > 0
            ? `${syncedCount} activit${syncedCount === 1 ? 'y' : 'ies'} synced! 🏃`
            : 'All activities up to date ✓',
        type: 'success',
      });

      // Clear progress
      setSyncProgress(null);
    } catch {
      setToastMessage({
        message: 'Failed to sync activities. Please try again.',
        type: 'error',
      });
      setSyncProgress(null);
    } finally {
      setIsSyncing(false);
    }
  };

  const recentActivities = activities?.slice(0, 5) || [];
  const activeQuests = quests?.filter((q) => q.status === 'active') || [];

  const isFirstTimeUser = !user?.lastSyncedAt;

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
              <h2 className="mb-4 text-xl font-bold text-gray-900">Quick Stats</h2>
              {statsLoading ? (
                <div className="py-8 text-center text-gray-600">Loading stats...</div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <StatTile
                    icon="🏃"
                    label="Activities"
                    value={stats?.totalActivities.toString() || '0'}
                  />
                  <StatTile
                    icon="📏"
                    label="Distance"
                    value={formatDistance(stats?.totalDistance || 0)}
                  />
                  <StatTile
                    icon="⛰️"
                    label="Elevation"
                    value={formatElevation(stats?.totalElevation || 0)}
                  />
                  <StatTile icon="🔥" label="Streak" value={`${stats?.currentStreak || 0} days`} />
                </div>
              )}
            </section>

            {/* Quest Summary */}
            <section>
              <QuestSummaryCard activeQuestsCount={activeQuests.length} />
            </section>

            {/* Recent Activities */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Recent Activities</h2>
                <Button size="sm" onClick={handleSync} disabled={isSyncing}>
                  {isSyncing ? 'Syncing...' : 'Sync'}
                </Button>
              </div>

              {activitiesLoading ? (
                <div className="py-8 text-center text-gray-600">Loading activities...</div>
              ) : recentActivities.length === 0 ? (
                <GlassCard className="p-6 text-center">
                  <p className="mb-4 text-gray-600">No activities yet. Sync your Strava data!</p>
                  <Button onClick={handleSync} disabled={isSyncing}>
                    {isSyncing ? 'Syncing...' : 'Sync Activities'}
                  </Button>
                </GlassCard>
              ) : (
                <div className="space-y-3">
                  {recentActivities.map((activity) => (
                    <GlassCard key={activity.id} className="p-4">
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

      {toastMessage && (
        <Toast
          message={toastMessage.message}
          type={toastMessage.type}
          onClose={() => setToastMessage(null)}
        />
      )}
    </Layout>
  );
};
