import clsx from 'clsx';
import { motion } from 'framer-motion';
import { AnimatedNumber } from './AnimatedNumber';

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
      return `${Math.round(value)}`;
    case 'streak':
      return `${Math.round(value)} days`;
    case 'speed':
      return `${value.toFixed(1)}`;
    default:
      return `${Math.round(value)}`;
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
          <AnimatedNumber value={currentValue} format={(n) => formatValue(n, requirementType)} /> /{' '}
          {formatValue(targetValue, requirementType)}
        </span>
        <span className="font-bold text-gray-900">
          <AnimatedNumber value={percentage} format={(n) => `${Math.round(n)}%`} />
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <motion.div
          className={clsx('h-full rounded-full', rarityColors[rarity])}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 3, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
};
