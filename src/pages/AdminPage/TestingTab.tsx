import { useState } from 'react';
import { GlassCard, Button } from '@components/ui';
import { apiClient } from '@api/client';
import { useToastStore } from '@store/toastStore';

export const TestingTab = () => {
  const { success, error: showError } = useToastStore();
  const [loading, setLoading] = useState(false);

  const syncChallenges = async () => {
    setLoading(true);
    try {
      const response = await apiClient.post<{ synced: number; activitiesAdded: number }>(
        '/challenges/sync'
      );

      if (response.success && response.data) {
        success(
          `Synced ${response.data.synced} challenge(s)! Added ${response.data.activitiesAdded} activity(ies).`
        );
      } else {
        showError(response.error || 'Failed to sync challenges');
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <GlassCard className="p-4">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Challenge Sync</h2>
        <p className="mb-4 text-sm text-gray-600">
          Manually sync all your active challenges with current activities. This will add any
          missing activities to your challenges and update progress.
        </p>
        <Button onClick={syncChallenges} variant="primary" className="w-full" disabled={loading}>
          {loading ? 'Syncing...' : 'Sync Active Challenges'}
        </Button>
        <div className="mt-3 rounded-lg bg-blue-50 p-3">
          <p className="text-xs text-blue-800">
            <strong>When to use:</strong> Use this if your challenges are missing activities or
            showing incorrect progress. This will recalculate everything.
          </p>
        </div>
      </GlassCard>
    </div>
  );
};
