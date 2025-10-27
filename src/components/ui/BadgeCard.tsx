import { GlassCard } from './GlassCard';
import clsx from 'clsx';

interface BadgeCardProps {
  icon: string;
  name: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlocked?: boolean;
}

const rarityColors = {
  common: 'from-gray-400 to-gray-600',
  rare: 'from-blue-400 to-blue-600',
  epic: 'from-purple-400 to-purple-600',
  legendary: 'from-orange-400 to-orange-600',
};

export const BadgeCard = ({
  icon,
  name,
  description,
  rarity,
  unlocked = false,
}: BadgeCardProps) => {
  return (
    <GlassCard className={clsx('p-4', !unlocked && 'opacity-50 grayscale')}>
      <div className="flex flex-col items-center gap-3 text-center">
        <div
          className={clsx(
            'flex h-16 w-16 items-center justify-center rounded-full text-3xl',
            'bg-gradient-to-br shadow-md',
            rarityColors[rarity]
          )}
        >
          {icon}
        </div>
        <div>
          <h3 className="font-bold text-gray-900">{name}</h3>
          <p className="mt-1 text-xs text-gray-600">{description}</p>
          <span
            className={clsx('mt-2 inline-block text-xs font-medium capitalize', {
              'text-gray-600': rarity === 'common',
              'text-blue-600': rarity === 'rare',
              'text-purple-600': rarity === 'epic',
              'text-orange-600': rarity === 'legendary',
            })}
          >
            {rarity}
          </span>
        </div>
      </div>
    </GlassCard>
  );
};
