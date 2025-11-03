import React from 'react';
import type { ChallengeParticipant, Challenge } from '@types';
import { GlassCard, ProgressRing, Avatar } from '@components/ui';

interface ChallengeProgressProps {
  challenge: Challenge;
  showAllParticipants?: boolean;
}

export const ChallengeProgress: React.FC<ChallengeProgressProps> = ({
  challenge,
  showAllParticipants = false,
}) => {
  const participants = challenge.participants || [];
  const activeParticipants = participants.filter(
    (p: ChallengeParticipant) => p.status === 'accepted'
  );

  if (activeParticipants.length === 0) {
    return (
      <GlassCard className="p-4">
        <p className="text-center text-sm text-gray-500">No active participants yet</p>
      </GlassCard>
    );
  }

  const getProgressPercentage = (participant: ChallengeParticipant): number => {
    if (!challenge.targets.distance) {
      return 0;
    }

    if (challenge.type === 'collaborative') {
      const totalDistance = activeParticipants.reduce(
        (sum: number, p: ChallengeParticipant) => sum + p.totalDistance,
        0
      );
      return Math.min((totalDistance / challenge.targets.distance) * 100, 100);
    }

    return Math.min((participant.totalDistance / challenge.targets.distance) * 100, 100);
  };

  const formatDistance = (meters: number): string => {
    const km = meters / 1000;
    return km.toFixed(1);
  };

  const formatElevation = (meters: number): string => {
    return Math.round(meters).toString();
  };

  if (challenge.type === 'collaborative') {
    const totalDistance = activeParticipants.reduce(
      (sum: number, p: ChallengeParticipant) => sum + p.totalDistance,
      0
    );
    const totalElevation = activeParticipants.reduce(
      (sum: number, p: ChallengeParticipant) => sum + p.totalElevation,
      0
    );
    const totalActivities = activeParticipants.reduce(
      (sum: number, p: ChallengeParticipant) => sum + p.activityCount,
      0
    );
    const progress = getProgressPercentage(activeParticipants[0]);

    return (
      <div className="space-y-4">
        <GlassCard className="p-6">
          <div className="flex items-center gap-6">
            <ProgressRing progress={progress} size={80} />
            <div className="flex-1">
              <h3 className="mb-3 text-lg font-semibold text-gray-900">Team Progress</h3>
              <div className="grid grid-cols-3 gap-4">
                {challenge.targets.distance && (
                  <div>
                    <p className="mb-1 text-xs text-gray-500">Distance</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatDistance(totalDistance)} km
                    </p>
                    <p className="text-xs text-gray-500">
                      of {formatDistance(challenge.targets.distance)} km
                    </p>
                  </div>
                )}
                {challenge.targets.elevation && (
                  <div>
                    <p className="mb-1 text-xs text-gray-500">Elevation</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatElevation(totalElevation)} m
                    </p>
                    <p className="text-xs text-gray-500">
                      of {formatElevation(challenge.targets.elevation)} m
                    </p>
                  </div>
                )}
                {challenge.targets.activities && (
                  <div>
                    <p className="mb-1 text-xs text-gray-500">Activities</p>
                    <p className="text-lg font-semibold text-gray-900">{totalActivities}</p>
                    <p className="text-xs text-gray-500">of {challenge.targets.activities}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </GlassCard>

        {showAllParticipants && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Individual Contributions</h4>
            {activeParticipants.map((participant: ChallengeParticipant) => (
              <GlassCard key={participant.id} className="p-3">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={participant.user.profileMedium || participant.user.profile}
                    firstname={participant.user.firstname}
                    lastname={participant.user.lastname}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="mb-1 truncate text-sm font-medium text-gray-900">
                      {participant.user.firstname} {participant.user.lastname}
                    </p>
                    <div className="flex gap-4 text-xs">
                      {challenge.targets.distance && (
                        <div>
                          <span className="text-gray-500">Distance: </span>
                          <span className="font-medium text-gray-900">
                            {formatDistance(participant.totalDistance)} km
                          </span>
                        </div>
                      )}
                      {challenge.targets.elevation && (
                        <div>
                          <span className="text-gray-500">Elevation: </span>
                          <span className="font-medium text-gray-900">
                            {formatElevation(participant.totalElevation)} m
                          </span>
                        </div>
                      )}
                      {challenge.targets.activities && (
                        <div>
                          <span className="text-gray-500">Activities: </span>
                          <span className="font-medium text-gray-900">
                            {participant.activityCount}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    );
  }

  const sortedParticipants = [...activeParticipants].sort(
    (a, b) => b.totalDistance - a.totalDistance
  );

  return (
    <div className="space-y-3">
      {sortedParticipants.map((participant, index) => {
        const progress = getProgressPercentage(participant);
        const isLeader = index === 0;

        return (
          <GlassCard key={participant.id} className="p-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <ProgressRing progress={progress} size={60} />
                {isLeader && challenge.status === 'active' && (
                  <div className="absolute -right-1 -top-1 text-lg">👑</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <Avatar
                    src={participant.user.profileMedium || participant.user.profile}
                    firstname={participant.user.firstname}
                    lastname={participant.user.lastname}
                    size="sm"
                  />
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {participant.user.firstname} {participant.user.lastname}
                  </p>
                  {isLeader && challenge.status === 'active' && (
                    <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800">
                      Leading
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {challenge.targets.distance && (
                    <div>
                      <p className="text-gray-500">Distance</p>
                      <p className="font-medium text-gray-900">
                        {formatDistance(participant.totalDistance)} km
                      </p>
                    </div>
                  )}
                  {challenge.targets.elevation && (
                    <div>
                      <p className="text-gray-500">Elevation</p>
                      <p className="font-medium text-gray-900">
                        {formatElevation(participant.totalElevation)} m
                      </p>
                    </div>
                  )}
                  {challenge.targets.activities && (
                    <div>
                      <p className="text-gray-500">Activities</p>
                      <p className="font-medium text-gray-900">{participant.activityCount}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
};
