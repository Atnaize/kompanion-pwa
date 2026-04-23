import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const isFetching = syncProgress?.type === 'fetching';
  const isSaving = syncProgress?.type === 'saving';

  return (
    <GlassCard className="p-8 text-center">
      <div className="mb-4 text-6xl">{isSyncing ? '🔄' : '👋'}</div>
      <h2 className="mb-2 text-2xl font-bold text-gray-900">
        {isSyncing ? t('welcome.syncingTitle') : t('welcome.title')}
      </h2>
      <p className="mb-6 text-gray-600">
        {isSyncing ? (
          <>
            {isFetching && (
              <span className="font-medium text-strava-orange">
                {t('welcome.fetchingFromStrava', { count: syncProgress?.current || 0 })}
              </span>
            )}
            {isSaving && (
              <span className="font-medium text-strava-orange">
                {t('welcome.savingActivities', {
                  current: syncProgress?.current || 0,
                  total: syncProgress?.total || 0,
                })}
              </span>
            )}
          </>
        ) : (
          t('welcome.description')
        )}
      </p>
      <Button onClick={onSync} disabled={isSyncing} variant="primary">
        {isSyncing ? t('common.syncing') : t('welcome.syncButton')}
      </Button>
    </GlassCard>
  );
};
