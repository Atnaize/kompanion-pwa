import { Layout } from '@components/layout';
import { WelcomeCard } from '@features/onboarding';
import { useAuthStore } from '@store/authStore';
import { QuickStatsSection } from './QuickStatsSection';
import { PersonalRecordsPreview } from './PersonalRecordsPreview';
import { useDashboardSync } from './useDashboardSync';

export const DashboardPage = () => {
  const { user } = useAuthStore();
  const { isSyncing, syncProgress, handleSync } = useDashboardSync();
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
            <PersonalRecordsPreview />
          </>
        )}
      </div>
    </Layout>
  );
};
