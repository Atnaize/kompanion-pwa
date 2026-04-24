import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { activitiesService } from '@api/services';
import { useAuthStore } from '@store/authStore';
import { useToastStore } from '@store/toastStore';
import { hapticService } from '@utils/haptic';

export interface SyncProgress {
  type: 'fetching' | 'saving' | 'processing' | 'complete' | 'error';
  current?: number;
  total?: number;
  message?: string;
}

export const useDashboardSync = () => {
  const { t } = useTranslation();
  const { user, setUser } = useAuthStore();
  const queryClient = useQueryClient();
  const { success, error } = useToastStore();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);

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

      if (user) {
        setUser({ ...user, lastSyncedAt: new Date().toISOString() });
      }

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

  return { isSyncing, syncProgress, handleSync };
};
