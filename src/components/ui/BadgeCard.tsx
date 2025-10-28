import { GlassCard } from './GlassCard';
import clsx from 'clsx';

interface BadgeCardProps {
  icon: string;
  name: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlocked?: boolean;
  redeemable?: boolean;
  onRedeem?: () => void;
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
  redeemable = false,
  onRedeem,
}: BadgeCardProps) => {
  const isSecretLocked = icon === '❓';

  return (
    <GlassCard
      className={clsx(
        'relative p-4 transition-all duration-300',
        !unlocked && !redeemable && 'opacity-50 grayscale',
        redeemable &&
          'cursor-pointer opacity-100 shadow-lg shadow-strava-orange/20 ring-2 ring-strava-orange grayscale-0 hover:scale-105'
      )}
      onClick={redeemable && onRedeem ? onRedeem : undefined}
    >
      {redeemable && (
        <div className="absolute right-0 top-0 overflow-hidden">
          <div className="relative flex items-center justify-center">
            <div
              className="absolute bg-strava-orange px-6 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-md"
              style={{
                transform: 'rotate(45deg) translate(20%, -50%)',
                transformOrigin: 'top right',
                width: '100px',
              }}
            >
              Redeem
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-col items-center gap-3 text-center">
        <div
          className={clsx(
            'flex h-16 w-16 items-center justify-center rounded-full shadow-md transition-transform duration-300',
            isSecretLocked
              ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-4xl font-bold text-white'
              : 'bg-gradient-to-br text-3xl',
            !isSecretLocked && rarityColors[rarity]
          )}
        >
          {isSecretLocked ? '?' : icon}
        </div>
        <div className="w-full">
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
