import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@components/layout/Layout';
import { GlassCard, Button, Skeleton, ConfirmModal, Avatar } from '@components/ui';
import { ChallengeProgress, ChallengeChart, InviteFriendsModal } from '@features/challenges';
import { useChallengeStore } from '@store/challengeStore';
import { useAuthStore } from '@store/authStore';

export const ChallengeDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    currentChallenge,
    isLoading,
    fetchChallengeById,
    startChallenge,
    cancelChallenge,
    acceptInvitation,
    declineInvitation,
    leaveChallenge,
    inviteFriends,
  } = useChallengeStore();

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (id) {
      void fetchChallengeById(id);
    }
  }, [id, fetchChallengeById]);

  if (isLoading || !currentChallenge) {
    return (
      <Layout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-32" />
          <Skeleton className="h-64" />
        </div>
      </Layout>
    );
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Draft' },
      active: { bg: 'bg-green-100', text: 'text-green-700', label: 'Active' },
      completed: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Completed' },
      failed: { bg: 'bg-red-100', text: 'text-red-700', label: 'Failed' },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Cancelled' },
    };

    const badge = badges[status as keyof typeof badges] || badges.draft;
    return (
      <span className={`rounded-full px-3 py-1 text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const getTypeIcon = (type: string): string => {
    return type === 'collaborative' ? '🤝' : '⚔️';
  };

  const getTypeLabel = (type: string): string => {
    return type === 'collaborative' ? 'Collaborative Challenge' : 'Competitive Challenge';
  };

  const userParticipation = currentChallenge.participants?.find((p) => p.userId === user?.userId);

  const isCreator = currentChallenge.creator?.id === user?.userId;
  const isInvited = userParticipation?.status === 'invited';
  const isAccepted = userParticipation?.status === 'accepted';
  const isDraft = currentChallenge.status === 'draft';
  const isActive = currentChallenge.status === 'active';

  const handleStart = async () => {
    if (id) {
      await startChallenge(id);
    }
  };

  const handleCancelClick = () => {
    setShowCancelModal(true);
  };

  const handleCancelConfirm = async () => {
    if (id) {
      setIsProcessing(true);
      await cancelChallenge(id);
      setIsProcessing(false);
      setShowCancelModal(false);
      navigate('/challenges');
    }
  };

  const handleAccept = async () => {
    if (id) {
      await acceptInvitation(id);
    }
  };

  const handleDecline = async () => {
    if (id) {
      await declineInvitation(id);
      navigate('/challenges');
    }
  };

  const handleLeaveClick = () => {
    setShowLeaveModal(true);
  };

  const handleLeaveConfirm = async () => {
    if (id) {
      setIsProcessing(true);
      await leaveChallenge(id);
      setIsProcessing(false);
      setShowLeaveModal(false);
      navigate('/challenges');
    }
  };

  const handleInviteFriends = async (friendIds: number[]) => {
    if (id) {
      await inviteFriends(id, friendIds);
    }
  };

  const existingParticipantIds = currentChallenge?.participants?.map((p) => p.userId) || [];

  return (
    <Layout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-3">
              <button
                onClick={() => navigate('/challenges')}
                className="text-gray-500 hover:text-gray-700"
              >
                ← Back
              </button>
              {getStatusBadge(currentChallenge.status)}
            </div>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-2xl">{getTypeIcon(currentChallenge.type)}</span>
              <h1 className="text-2xl font-bold text-gray-900">{currentChallenge.name}</h1>
            </div>
            <p className="text-sm text-gray-600">{getTypeLabel(currentChallenge.type)}</p>
          </div>
        </div>

        {/* Description */}
        {currentChallenge.description && (
          <GlassCard className="p-4">
            <p className="text-gray-700">{currentChallenge.description}</p>
          </GlassCard>
        )}

        {/* Details */}
        <GlassCard className="p-4">
          <h2 className="mb-3 text-lg font-semibold text-gray-900">Challenge Details</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Start Date:</span>
              <span className="font-medium text-gray-900">
                {formatDate(currentChallenge.startDate)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">End Date:</span>
              <span className="font-medium text-gray-900">
                {formatDate(currentChallenge.endDate)}
              </span>
            </div>
            {currentChallenge.targets.distance && (
              <div className="flex justify-between">
                <span className="text-gray-600">Distance Goal:</span>
                <span className="font-medium text-gray-900">
                  {(currentChallenge.targets.distance / 1000).toFixed(1)} km
                </span>
              </div>
            )}
            {currentChallenge.targets.elevation && (
              <div className="flex justify-between">
                <span className="text-gray-600">Elevation Goal:</span>
                <span className="font-medium text-gray-900">
                  {Math.round(currentChallenge.targets.elevation)} m
                </span>
              </div>
            )}
            {currentChallenge.targets.activityType && (
              <div className="flex justify-between">
                <span className="text-gray-600">Activity Type:</span>
                <span className="font-medium capitalize text-gray-900">
                  {currentChallenge.targets.activityType}
                </span>
              </div>
            )}
            {currentChallenge.creator && (
              <div className="flex items-center justify-between border-t border-gray-200 pt-2">
                <span className="text-gray-600">Created by:</span>
                <div className="flex items-center gap-2">
                  <Avatar
                    src={currentChallenge.creator.profile}
                    firstname={currentChallenge.creator.firstname}
                    lastname={currentChallenge.creator.lastname}
                    size="sm"
                    className="h-6 w-6"
                  />
                  <span className="font-medium text-gray-900">
                    {currentChallenge.creator.firstname} {currentChallenge.creator.lastname}
                  </span>
                </div>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Participants */}
        {currentChallenge.participants && currentChallenge.participants.length > 0 && (
          <GlassCard className="p-4">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">Participants</h2>
            <div className="space-y-2">
              {currentChallenge.participants.map((participant) => {
                const statusBadge = {
                  accepted: { bg: 'bg-green-100', text: 'text-green-700', label: 'Accepted' },
                  invited: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' },
                  declined: { bg: 'bg-red-100', text: 'text-red-700', label: 'Declined' },
                  left: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Left' },
                }[participant.status] || {
                  bg: 'bg-gray-100',
                  text: 'text-gray-700',
                  label: participant.status,
                };

                return (
                  <div
                    key={participant.userId}
                    className="flex items-center justify-between rounded-lg bg-white/30 p-3"
                  >
                    <div className="flex items-center gap-2">
                      {participant.user && (
                        <>
                          <Avatar
                            src={participant.user.profile}
                            firstname={participant.user.firstname}
                            lastname={participant.user.lastname}
                            size="sm"
                          />
                          <span className="text-sm font-medium text-gray-900">
                            {participant.user.firstname} {participant.user.lastname}
                          </span>
                        </>
                      )}
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`}
                    >
                      {statusBadge.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        )}

        {/* Progress */}
        {isActive && (
          <div className="space-y-4">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">Progress</h2>
            <ChallengeProgress
              challenge={currentChallenge}
              showAllParticipants={currentChallenge.type === 'collaborative'}
            />

            {/* Chart - only show if there are multiple participants */}
            {currentChallenge.participants &&
              currentChallenge.participants.filter((p) => p.status === 'accepted').length > 1 && (
                <ChallengeChart challenge={currentChallenge} />
              )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {/* Pending invitation - Accept or Decline */}
          {isInvited && (
            <>
              <Button onClick={handleAccept} className="w-full">
                Accept Invitation
              </Button>
              <Button onClick={handleDecline} variant="secondary" className="w-full">
                Decline Invitation
              </Button>
            </>
          )}

          {/* Creator actions for draft challenges */}
          {isCreator && isDraft && (
            <>
              <Button onClick={handleStart} className="w-full">
                Start Challenge
              </Button>
              <Button
                onClick={() => setShowInviteModal(true)}
                variant="secondary"
                className="w-full"
              >
                Invite Friends
              </Button>
              <Button onClick={handleCancelClick} variant="secondary" className="w-full">
                Cancel Challenge
              </Button>
            </>
          )}

          {/* Creator actions for active challenges */}
          {isCreator && isActive && (
            <>
              <Button
                onClick={() => setShowInviteModal(true)}
                variant="secondary"
                className="w-full"
              >
                Invite Friends
              </Button>
              <Button onClick={handleCancelClick} variant="secondary" className="w-full">
                Cancel Challenge
              </Button>
            </>
          )}

          {/* Non-creator who accepted can leave */}
          {!isCreator && isAccepted && (isDraft || isActive) && (
            <Button onClick={handleLeaveClick} variant="secondary" className="w-full">
              Leave Challenge
            </Button>
          )}
        </div>
      </div>

      {/* Cancel Modal */}
      <ConfirmModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancelConfirm}
        title="Cancel Challenge"
        message="Are you sure you want to cancel this challenge? This action cannot be undone and all participants will be notified."
        confirmText="Cancel Challenge"
        cancelText="Keep Challenge"
        confirmVariant="danger"
        isLoading={isProcessing}
      />

      {/* Leave Modal */}
      <ConfirmModal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        onConfirm={handleLeaveConfirm}
        title="Leave Challenge"
        message="Are you sure you want to leave this challenge? You will no longer see progress or compete with other participants."
        confirmText="Leave Challenge"
        cancelText="Stay"
        confirmVariant="danger"
        isLoading={isProcessing}
      />

      {/* Invite Friends Modal */}
      {id && (
        <InviteFriendsModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          onInvite={handleInviteFriends}
          challengeId={id}
          existingParticipantIds={existingParticipantIds}
        />
      )}
    </Layout>
  );
};
