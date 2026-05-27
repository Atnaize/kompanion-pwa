import { useTranslation } from 'react-i18next';
import { Layout } from '@components/layout';
import { StreakMilestoneModal } from '@components/ui';
import { WelcomeCard } from '@features/onboarding';
import { FeedList } from '@features/feed';
import { useAuthStore } from '@store/authStore';
import { useStreakMilestone } from '@hooks/useStreakMilestone';
import { QuickStatsSection } from './QuickStatsSection';
import { useDashboardSync } from './useDashboardSync';

export const DashboardPage = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { isSyncing, syncProgress, handleSync } = useDashboardSync();
  const { milestone, currentStreak, dismiss: dismissStreak } = useStreakMilestone();
  const isFirstTimeUser = !user?.lastSyncedAt;

  return (
    <Layout>
      <div className="space-y-6">
        {isFirstTimeUser ? (
          <section>
            <WelcomeCard onSync={handleSync} isSyncing={isSyncing} syncProgress={syncProgress} />
          </section>
        ) : (
          <>
            <QuickStatsSection />
            <section className="space-y-3">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                {t('feed.title')}
              </p>
              <FeedList />
            </section>
          </>
        )}
      </div>

      {milestone !== null && (
        <StreakMilestoneModal
          milestone={milestone}
          currentStreak={currentStreak}
          onDismiss={dismissStreak}
        />
      )}
    </Layout>
  );
};
