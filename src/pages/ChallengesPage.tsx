import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@components/layout/Layout';
import { EmptyState, Skeleton, Button, Tabs, TabList, Tab, TabPanel } from '@components/ui';
import { ChallengeSummaryCard, InvitationCard } from '@features/challenges';
import { useChallengeStore } from '@store/challengeStore';

export const ChallengesPage = () => {
  const navigate = useNavigate();
  const {
    challenges,
    pendingInvitations,
    isLoading,
    fetchChallenges,
    fetchPendingInvitations,
    acceptInvitation,
    declineInvitation,
    startPolling,
    stopPolling,
  } = useChallengeStore();

  const [activeTab, setActiveTab] = useState<'active' | 'draft' | 'completed' | 'invitations'>(
    'active'
  );

  useEffect(() => {
    void fetchChallenges();
    void fetchPendingInvitations();
    startPolling();

    return () => {
      stopPolling();
    };
  }, [fetchChallenges, fetchPendingInvitations, startPolling, stopPolling]);

  const getFilteredChallenges = (status: 'active' | 'draft' | 'completed') => {
    switch (status) {
      case 'active':
        return challenges.filter((c) => c.status === 'active');
      case 'draft':
        return challenges.filter((c) => c.status === 'draft');
      case 'completed':
        return challenges.filter((c) => c.status === 'completed' || c.status === 'failed');
    }
  };

  const activeChallenges = getFilteredChallenges('active');
  const draftChallenges = getFilteredChallenges('draft');
  const completedChallenges = getFilteredChallenges('completed');

  return (
    <Layout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Challenges</h1>
            <p className="text-sm text-gray-600">Compete and collaborate with friends</p>
          </div>
          <Button onClick={() => navigate('/challenges/create')}>Create</Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onChange={(value) => setActiveTab(value as typeof activeTab)}>
          <TabList>
            <Tab value="active" label="Active" count={activeChallenges.length} />
            <Tab value="draft" label="Draft" count={draftChallenges.length} />
            <Tab value="completed" label="Completed" />
            <Tab value="invitations" label="Invites" count={pendingInvitations.length} />
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
                    title="No active challenges"
                    description="Create a challenge to compete or collaborate with friends"
                    action={{
                      label: 'Create Challenge',
                      onClick: () => navigate('/challenges/create'),
                    }}
                  />
                )}
              </TabPanel>

              {/* Draft Tab */}
              <TabPanel value="draft" className="mt-4">
                {draftChallenges.length > 0 ? (
                  <div className="space-y-3">
                    {draftChallenges.map((challenge) => (
                      <ChallengeSummaryCard
                        key={challenge.id}
                        challenge={challenge}
                        onClick={() => navigate(`/challenges/${challenge.id}`)}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon="📝"
                    title="No draft challenges"
                    description="Your draft challenges will appear here"
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
                    title="No completed challenges"
                    description="Completed challenges will appear here"
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
                    title="No pending invitations"
                    description="You'll see challenge invitations from your friends here"
                  />
                )}
              </TabPanel>
            </>
          )}
        </Tabs>
      </div>
    </Layout>
  );
};
