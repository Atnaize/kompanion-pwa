import { GlassCard, ProgressRing, Avatar, Button } from '@components/ui';
import type { Challenge } from '@types';
import { formatDistance } from '@utils/format';
import { useAuthStore } from '@store/authStore';

interface ChallengeSummaryModalProps {
  challenge: Challenge;
  onDismiss: () => void;
  onViewChallenge: () => void;
}

export const ChallengeSummaryModal = ({
  challenge,
  onDismiss,
  onViewChallenge,
}: ChallengeSummaryModalProps) => {
  const { user } = useAuthStore();
  const isSuccess = challenge.status === 'completed';
  const isCollaborative = challenge.type === 'collaborative';

  const acceptedParticipants = challenge.participants?.filter((p) => p.status === 'accepted') || [];

  // Calculate team totals
  const totalDistance = acceptedParticipants.reduce((sum, p) => sum + p.totalDistance, 0);
  const totalElevation = acceptedParticipants.reduce((sum, p) => sum + p.totalElevation, 0);
  const totalActivities = acceptedParticipants.reduce((sum, p) => sum + p.activityCount, 0);

  // Calculate progress percentages
  const distanceProgress = challenge.targets.distance
    ? Math.min((totalDistance / challenge.targets.distance) * 100, 100)
    : 0;
  const elevationProgress = challenge.targets.elevation
    ? Math.min((totalElevation / challenge.targets.elevation) * 100, 100)
    : 0;
  const mainProgress = challenge.targets.distance ? distanceProgress : elevationProgress;

  // Sort participants by distance for leaderboard
  const sortedParticipants = [...acceptedParticipants].sort(
    (a, b) => b.totalDistance - a.totalDistance
  );

  // Find current user's rank
  const currentUserRank = sortedParticipants.findIndex((p) => p.userId === user?.userId) + 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto">
        <GlassCard className="p-6">
          {/* Header */}
          <div className="mb-6 text-center">
            <div className="mb-3 text-5xl">{isSuccess ? '🎉' : '💪'}</div>
            <h2
              className={`mb-1 text-2xl font-bold ${isSuccess ? 'text-green-600' : 'text-orange-600'}`}
            >
              {isSuccess ? 'Challenge Completed!' : 'Challenge Ended'}
            </h2>
            <p className="text-lg font-medium text-gray-900">{challenge.name}</p>
            <p className="text-sm text-gray-600">
              {challenge.type === 'collaborative' ? '🤝 Collaborative' : '🏆 Competitive'}
            </p>
          </div>

          {/* Progress Overview */}
          <div className="mb-6 flex justify-center">
            <ProgressRing progress={mainProgress} size={100} />
          </div>

          {/* Stats */}
          <div className="mb-6 grid grid-cols-3 gap-3 text-center">
            {challenge.targets.distance && (
              <div>
                <p className="text-lg font-bold text-gray-900">{formatDistance(totalDistance)}</p>
                <p className="text-xs text-gray-600">
                  of {formatDistance(challenge.targets.distance)}
                </p>
              </div>
            )}
            {challenge.targets.elevation && (
              <div>
                <p className="text-lg font-bold text-gray-900">{Math.round(totalElevation)}m</p>
                <p className="text-xs text-gray-600">
                  of {Math.round(challenge.targets.elevation)}m
                </p>
              </div>
            )}
            <div>
              <p className="text-lg font-bold text-gray-900">{totalActivities}</p>
              <p className="text-xs text-gray-600">
                {totalActivities === 1 ? 'activity' : 'activities'}
              </p>
            </div>
          </div>

          {/* Collaborative: Individual Contributions */}
          {isCollaborative && (
            <div className="mb-6">
              <h3 className="mb-3 text-sm font-semibold text-gray-700">Team Contributions</h3>
              <div className="space-y-2">
                {sortedParticipants.map((participant) => (
                  <div
                    key={participant.userId}
                    className={`flex items-center justify-between rounded-lg p-2 ${
                      participant.userId === user?.userId ? 'bg-blue-50' : 'bg-white/30'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Avatar
                        src={participant.user.profile}
                        firstname={participant.user.firstname}
                        lastname={participant.user.lastname}
                        size="sm"
                        className="h-7 w-7"
                      />
                      <span className="text-sm font-medium text-gray-900">
                        {participant.user.firstname}
                        {participant.userId === user?.userId && (
                          <span className="ml-1 text-xs text-blue-600">(you)</span>
                        )}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {formatDistance(participant.totalDistance)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Competitive: Leaderboard */}
          {!isCollaborative && (
            <div className="mb-6">
              <h3 className="mb-3 text-sm font-semibold text-gray-700">Final Rankings</h3>
              <div className="space-y-2">
                {sortedParticipants.map((participant, index) => {
                  const rank = index + 1;
                  const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
                  const isCurrentUser = participant.userId === user?.userId;

                  return (
                    <div
                      key={participant.userId}
                      className={`flex items-center justify-between rounded-lg p-2 ${
                        isCurrentUser ? 'bg-blue-50' : rank === 1 ? 'bg-yellow-50' : 'bg-white/30'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-8 text-center text-sm">{rankEmoji}</span>
                        <Avatar
                          src={participant.user.profile}
                          firstname={participant.user.firstname}
                          lastname={participant.user.lastname}
                          size="sm"
                          className="h-7 w-7"
                        />
                        <span className="text-sm font-medium text-gray-900">
                          {participant.user.firstname}
                          {isCurrentUser && (
                            <span className="ml-1 text-xs text-blue-600">(you)</span>
                          )}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {formatDistance(participant.totalDistance)}
                      </span>
                    </div>
                  );
                })}
              </div>
              {currentUserRank > 0 && (
                <p className="mt-2 text-center text-sm text-gray-600">
                  You finished{' '}
                  <span className="font-semibold">
                    {currentUserRank === 1
                      ? '1st'
                      : currentUserRank === 2
                        ? '2nd'
                        : currentUserRank === 3
                          ? '3rd'
                          : `${currentUserRank}th`}
                  </span>{' '}
                  out of {sortedParticipants.length}
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button onClick={onViewChallenge} className="w-full">
              View Challenge
            </Button>
            <Button onClick={onDismiss} variant="secondary" className="w-full">
              Dismiss
            </Button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
