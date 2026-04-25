import React, { useState } from 'react';
import { Swords, Users, type LucideIcon } from 'lucide-react';
import type { ChallengeParticipant } from '@types';
import { GlassCard, Button, Avatar } from '@components/ui';

interface InvitationCardProps {
  invitation: ChallengeParticipant;
  onAccept: (id: string) => Promise<void>;
  onDecline: (id: string) => Promise<void>;
}

export const InvitationCard: React.FC<InvitationCardProps> = ({
  invitation,
  onAccept,
  onDecline,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const challenge = invitation.challenge;

  if (!challenge) {
    return null;
  }

  const handleAccept = async () => {
    setIsLoading(true);
    try {
      await onAccept(challenge.id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecline = async () => {
    setIsLoading(true);
    try {
      await onDecline(challenge.id);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getTypeLabel = (type: string): string => {
    return type === 'collaborative' ? 'Team Challenge' : 'Competition';
  };

  const getTypeIcon = (type: string): LucideIcon => {
    return type === 'collaborative' ? Users : Swords;
  };

  const creator = challenge.creator;
  const participantCount =
    challenge.participants?.filter((p: ChallengeParticipant) => p.status === 'accepted').length ||
    0;

  return (
    <GlassCard className="p-4">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              {(() => {
                const Icon = getTypeIcon(challenge.type);
                return <Icon className="h-4 w-4 shrink-0 text-strava-orange" strokeWidth={1.75} />;
              })()}
              <h3 className="truncate font-semibold text-gray-900 dark:text-gray-50">{challenge.name}</h3>
            </div>
            <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
              {getTypeLabel(challenge.type)} • {formatDate(challenge.startDate)} -{' '}
              {formatDate(challenge.endDate)}
            </p>
            {challenge.description && (
              <p className="line-clamp-2 text-sm text-gray-600 dark:text-gray-400">{challenge.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
          {creator && (
            <div className="flex items-center gap-1">
              <Avatar
                src={creator.profile}
                firstname={creator.firstname}
                lastname={creator.lastname}
                size="sm"
                className="h-5 w-5"
              />
              <span>by {creator.firstname}</span>
            </div>
          )}
          <span>
            {participantCount} participant{participantCount !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="space-y-2">
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {challenge.targets.distance && (
              <div className="flex justify-between">
                <span>Distance Goal:</span>
                <span className="font-medium">
                  {(challenge.targets.distance / 1000).toFixed(1)} km
                </span>
              </div>
            )}
            {challenge.targets.elevation && (
              <div className="flex justify-between">
                <span>Elevation Goal:</span>
                <span className="font-medium">{Math.round(challenge.targets.elevation)} m</span>
              </div>
            )}
            {challenge.targets.activities && (
              <div className="flex justify-between">
                <span>Activity Goal:</span>
                <span className="font-medium">{challenge.targets.activities} activities</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleAccept}
            disabled={isLoading}
            className="flex-1 bg-green-600 text-white hover:bg-green-700"
          >
            {isLoading ? 'Accepting...' : 'Accept'}
          </Button>
          <Button
            onClick={handleDecline}
            disabled={isLoading}
            variant="secondary"
            className="flex-1"
          >
            {isLoading ? 'Declining...' : 'Decline'}
          </Button>
        </div>
      </div>
    </GlassCard>
  );
};
