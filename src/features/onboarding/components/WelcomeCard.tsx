import { GlassCard, Button } from '@components/ui';

export interface WelcomeCardProps {
  onSync: () => void;
  isSyncing: boolean;
  syncProgress?: {
    type: 'fetching' | 'saving' | 'complete' | 'error';
    current?: number;
    total?: number;
    message?: string;
  } | null;
}

export const WelcomeCard = ({ onSync, isSyncing, syncProgress }: WelcomeCardProps) => {
  const isFetching = syncProgress?.type === 'fetching';
  const isSaving = syncProgress?.type === 'saving';

  return (
    <GlassCard className="p-8 text-center">
      <div className="mb-4 text-6xl">{isSyncing ? '🔄' : '👋'}</div>
      <h2 className="mb-2 text-2xl font-bold text-gray-900">
        {isSyncing ? 'Syncing Your Activities' : 'Welcome to Kompanion!'}
      </h2>
      <p className="mb-6 text-gray-600">
        {isSyncing ? (
          <>
            {isFetching && (
              <span className="font-medium text-strava-orange">
                Fetching from Strava... {syncProgress?.current || 0} activities found
              </span>
            )}
            {isSaving && (
              <span className="font-medium text-strava-orange">
                Saving activities... {syncProgress?.current || 0}/{syncProgress?.total || 0}
              </span>
            )}
          </>
        ) : (
          "Let's get started by syncing your Strava activities."
        )}
      </p>
      <Button onClick={onSync} disabled={isSyncing} variant="primary">
        {isSyncing ? 'Syncing...' : 'Sync My Activities'}
      </Button>
    </GlassCard>
  );
};
