import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Loader2, Sparkles } from 'lucide-react';
import { GlassCard, Button } from '@components/ui';

export interface WelcomeCardProps {
  onSync: () => void;
  isSyncing: boolean;
  syncProgress?: {
    type: 'fetching' | 'saving' | 'processing' | 'complete' | 'error';
    current?: number;
    total?: number;
    message?: string;
  } | null;
}

export const WelcomeCard = ({ onSync, isSyncing, syncProgress }: WelcomeCardProps) => {
  const { t } = useTranslation();
  const isFetching = syncProgress?.type === 'fetching';
  const isSaving = syncProgress?.type === 'saving';
  const isProcessing = syncProgress?.type === 'processing';

  const current = syncProgress?.current ?? 0;
  const total = syncProgress?.total ?? 0;
  const percent =
    isSyncing && total > 0 ? Math.min(100, Math.round((current / total) * 100)) : null;

  return (
    <GlassCard className="relative overflow-hidden p-8 text-center sm:p-10">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-gradient-to-br from-strava-orange/30 via-orange-400/20 to-amber-300/10 blur-3xl"
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative"
      >
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-strava-orange to-amber-500 opacity-40 blur-xl" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-strava-orange via-orange-500 to-amber-500 shadow-lg shadow-strava-orange/30">
              {isSyncing ? (
                <Loader2 size={36} strokeWidth={2.25} className="animate-spin text-white" />
              ) : (
                <Sparkles size={36} strokeWidth={2.25} className="text-white" />
              )}
            </div>
          </div>
        </div>

        <h2 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
          {isSyncing ? t('welcome.syncingTitle') : t('welcome.title')}
        </h2>

        <p className="mb-6 text-gray-600 dark:text-gray-400">
          {isSyncing ? (
            <span className="font-medium text-strava-orange">
              {isFetching && t('welcome.fetchingFromStrava', { count: current })}
              {isSaving && t('welcome.savingActivities', { current, total })}
              {isProcessing && t('welcome.processingRecords', { current, total })}
            </span>
          ) : (
            t('welcome.description')
          )}
        </p>

        {percent !== null && (
          <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-gray-200/60 dark:bg-gray-700/60">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-strava-orange to-amber-500"
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>
        )}

        <Button onClick={onSync} disabled={isSyncing} variant="primary">
          {isSyncing ? t('common.syncing') : t('welcome.syncButton')}
        </Button>
      </motion.div>
    </GlassCard>
  );
};
