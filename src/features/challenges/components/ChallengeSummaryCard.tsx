import { GlassCard, ProgressRing, Avatar } from '@components/ui';
import type { Challenge } from '@types';
import { formatDistance, formatDate } from '@utils/format';

interface ChallengeSummaryCardProps {
  challenge: Challenge;
  onClick?: () => void;
}

export const ChallengeSummaryCard = ({ challenge, onClick }: ChallengeSummaryCardProps) => {
  const now = new Date();
  const endDate = new Date(challenge.endDate);
  const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isActive = challenge.status === 'active';
  const isCompleted = challenge.status === 'completed';
  const isFailed = challenge.status === 'failed';

  // Calculate total progress
  const totalDistance = challenge.participants?.reduce((sum, p) => sum + p.totalDistance, 0) || 0;
  const totalElevation = challenge.participants?.reduce((sum, p) => sum + p.totalElevation, 0) || 0;

  const distanceProgress = challenge.targets.distance
    ? (totalDistance / challenge.targets.distance) * 100
    : 0;
  const elevationProgress = challenge.targets.elevation
    ? (totalElevation / challenge.targets.elevation) * 100
    : 0;

  const mainProgress = challenge.targets.distance ? distanceProgress : elevationProgress;

  const getStatusColor = () => {
    if (isCompleted) return 'text-green-600';
    if (isFailed) return 'text-red-600';
    if (isActive) return 'text-blue-600';
    return 'text-gray-600';
  };

  const getStatusBadge = () => {
    if (isCompleted) return '✓ Completed';
    if (isFailed) return '✗ Failed';
    if (isActive && daysRemaining === 0) return '⚠️ Last day!';
    if (isActive && daysRemaining <= 3) return `⏰ ${daysRemaining} days left`;
    if (challenge.status === 'draft') return '📝 Draft';
    return null;
  };

  const statusBadge = getStatusBadge();

  return (
    <GlassCard className="p-4" onClick={onClick} hover={!!onClick}>
      <div className="flex items-start justify-between gap-3">
        {/* Progress Ring */}
        <div className="flex-shrink-0">
          <ProgressRing progress={Math.min(mainProgress, 100)} size={60} />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Header */}
          <div className="mb-1 flex items-start justify-between gap-2">
            <h3 className="truncate font-semibold text-gray-900">{challenge.name}</h3>
            {challenge.type === 'collaborative' ? '🤝' : '🏆'}
          </div>

          {/* Description */}
          {challenge.description && (
            <p className="mb-2 line-clamp-1 text-sm text-gray-600">{challenge.description}</p>
          )}

          {/* Participants */}
          <div className="mb-2 flex items-center gap-2">
            <div className="flex -space-x-2">
              {challenge.participants?.slice(0, 3).map((p) => (
                <div key={p.id} className="rounded-full border-2 border-white">
                  <Avatar
                    src={p.user.profile}
                    firstname={p.user.firstname}
                    lastname={p.user.lastname}
                    size="sm"
                    className="h-6 w-6"
                  />
                </div>
              ))}
            </div>
            <span className="text-xs text-gray-600">
              {challenge.participants?.filter((p) => p.status === 'accepted').length || 0}{' '}
              participant{challenge.participants?.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Progress Details */}
          <div className="space-y-1">
            {challenge.targets.distance && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Distance</span>
                <span className="font-medium text-gray-900">
                  {formatDistance(totalDistance)} / {formatDistance(challenge.targets.distance)}
                </span>
              </div>
            )}
            {challenge.targets.elevation && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Elevation</span>
                <span className="font-medium text-gray-900">
                  {Math.round(totalElevation)}m / {Math.round(challenge.targets.elevation)}m
                </span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2">
            {statusBadge && (
              <span className={`text-xs font-medium ${getStatusColor()}`}>{statusBadge}</span>
            )}
            <span className="text-xs text-gray-500">
              {isActive ? `Ends ${formatDate(challenge.endDate)}` : formatDate(challenge.endDate)}
            </span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};
