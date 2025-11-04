import clsx from 'clsx';

interface AchievementProgressBarProps {
  percentage: number;
  currentValue: number;
  targetValue: number;
  requirementType: 'distance' | 'elevation' | 'activities' | 'speed' | 'streak';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

const rarityColors = {
  common: 'bg-gray-500',
  rare: 'bg-blue-500',
  epic: 'bg-purple-500',
  legendary: 'bg-orange-500',
};

const formatValue = (value: number, type: string): string => {
  switch (type) {
    case 'distance':
      return `${(value / 1000).toFixed(1)} km`;
    case 'elevation':
      return `${Math.round(value)} m`;
    case 'activities':
      return `${value}`;
    case 'streak':
      return `${value} days`;
    default:
      return `${value}`;
  }
};

export const AchievementProgressBar = ({
  percentage,
  currentValue,
  targetValue,
  requirementType,
  rarity,
}: AchievementProgressBarProps) => {
  return (
    <div className="mt-3 space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-gray-700">
          {formatValue(currentValue, requirementType)} / {formatValue(targetValue, requirementType)}
        </span>
        <span className="font-bold text-gray-900">{percentage}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className={clsx(
            'h-full rounded-full transition-all duration-500',
            rarityColors[rarity]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
