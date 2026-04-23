import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@components/layout/Layout';
import { EmptyState, Skeleton, Button, Tabs, TabList, Tab, TabPanel } from '@components/ui';
import { ChallengeSummaryCard, InvitationCard, ChallengeSummaryModal } from '@features/challenges';
import { useChallengeStore } from '@store/challengeStore';

export const ChallengesPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    challenges,
    pendingInvitations,
    unseenCompletedChallenges,
    isLoading,
    fetchChallenges,
    fetchPendingInvitations,
    fetchUnseenCompleted,
    markSummarySeen,
    acceptInvitation,
    declineInvitation,
    startPolling,
    stopPolling,
  } = useChallengeStore();

  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'invitations'>('active');

  useEffect(() => {
    void fetchChallenges();
    void fetchPendingInvitations();
    void fetchUnseenCompleted();
    startPolling();

    return () => {
      stopPolling();
    };
  }, [fetchChallenges, fetchPendingInvitations, fetchUnseenCompleted, startPolling, stopPolling]);

  const activeChallenges = challenges
    .filter((c) => c.status === 'active')
    .sort((a, b) => {
      const now = new Date();
      const aStarted = new Date(a.startDate) <= now;
      const bStarted = new Date(b.startDate) <= now;

      // Active (started) challenges first, upcoming last
      if (aStarted && !bStarted) return -1;
      if (!aStarted && bStarted) return 1;

      return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
    });

  const completedChallenges = challenges.filter(
    (c) => c.status === 'completed' || c.status === 'failed'
  );

  const handleDismissSummary = async (challengeId: string) => {
    await markSummarySeen(challengeId);
  };

  const currentSummaryChallenge = unseenCompletedChallenges[0] || null;

  return (
    <Layout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('challenges.title')}</h1>
            <p className="text-sm text-gray-600">{t('challenges.subtitle')}</p>
          </div>
          <Button onClick={() => navigate('/challenges/create')}>{t('challenges.create')}</Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onChange={(value) => setActiveTab(value as typeof activeTab)}>
          <TabList>
            <Tab value="active" label={t('challenges.active')} count={activeChallenges.length} />
            <Tab value="completed" label={t('challenges.completed')} />
            <Tab
              value="invitations"
              label={t('challenges.invites')}
              count={pendingInvitations.length}
            />
          </TabList>

          {/* Loading State */}
          {isLoading && challenges.length === 0 ? (
            <div className="mt-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : (
            <>
              {/* Active Tab */}
              <TabPanel value="active" className="mt-4">
                {activeChallenges.length > 0 ? (
                  <div className="space-y-3">
                    {activeChallenges.map((challenge) => (
                      <ChallengeSummaryCard
                        key={challenge.id}
                        challenge={challenge}
                        onClick={() => navigate(`/challenges/${challenge.id}`)}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon="🎯"
                    title={t('challenges.noActive')}
                    description={t('challenges.noActiveDesc')}
                    action={{
                      label: t('challenges.createChallenge'),
                      onClick: () => navigate('/challenges/create'),
                    }}
                  />
                )}
              </TabPanel>

              {/* Completed Tab */}
              <TabPanel value="completed" className="mt-4">
                {completedChallenges.length > 0 ? (
                  <div className="space-y-3">
                    {completedChallenges.map((challenge) => (
                      <ChallengeSummaryCard
                        key={challenge.id}
                        challenge={challenge}
                        onClick={() => navigate(`/challenges/${challenge.id}`)}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon="🏆"
                    title={t('challenges.noCompleted')}
                    description={t('challenges.noCompletedDesc')}
                  />
                )}
              </TabPanel>

              {/* Invitations Tab */}
              <TabPanel value="invitations" className="mt-4">
                {pendingInvitations.length > 0 ? (
                  <div className="space-y-3">
                    {pendingInvitations.map((invitation) => (
                      <InvitationCard
                        key={invitation.id}
                        invitation={invitation}
                        onAccept={acceptInvitation}
                        onDecline={declineInvitation}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon="📬"
                    title={t('challenges.noInvitations')}
                    description={t('challenges.noInvitationsDesc')}
                  />
                )}
              </TabPanel>
            </>
          )}
        </Tabs>
      </div>

      {/* Completion Summary Modal */}
      {currentSummaryChallenge && (
        <ChallengeSummaryModal
          challenge={currentSummaryChallenge}
          onDismiss={() => void handleDismissSummary(currentSummaryChallenge.id)}
          onViewChallenge={() => {
            void handleDismissSummary(currentSummaryChallenge.id);
            navigate(`/challenges/${currentSummaryChallenge.id}`);
          }}
        />
      )}
    </Layout>
  );
};
