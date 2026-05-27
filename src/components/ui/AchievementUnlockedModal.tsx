import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { useConfetti } from '@hooks/useConfetti';
import type { Achievement } from '@types';

interface AchievementUnlockedModalProps {
  achievement: Achievement;
  onClose: () => void;
}

const rarityColors = {
  common: 'from-gray-400 to-gray-600',
  rare: 'from-blue-400 to-blue-600',
  epic: 'from-purple-400 to-purple-600',
  legendary: 'from-orange-400 to-orange-600',
};

const rarityText = {
  common: 'text-gray-600 dark:text-gray-400',
  rare: 'text-blue-600',
  epic: 'text-purple-600',
  legendary: 'text-orange-600',
};

export const AchievementUnlockedModal = ({
  achievement,
  onClose,
}: AchievementUnlockedModalProps) => {
  const { t } = useTranslation();
  const [showContent, setShowContent] = useState(false);
  const fireConfetti = useConfetti();

  useEffect(() => {
    const contentTimer = setTimeout(() => setShowContent(true), 100);
    fireConfetti();
    return () => clearTimeout(contentTimer);
  }, [fireConfetti]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={clsx(
          'relative w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl transition-all duration-500 dark:bg-gray-900',
          showContent ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
        )}
        onClick={(e) => e.stopPropagation()}
        style={{
          transformOrigin: 'center',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 transition-colors hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Content */}
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="relative">
            <div
              className={clsx(
                'flex h-32 w-32 items-center justify-center rounded-full text-6xl',
                'bg-gradient-to-br shadow-2xl',
                rarityColors[achievement.rarity]
              )}
              style={{
                animation: showContent
                  ? 'badge-reveal 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
                  : 'none',
              }}
            >
              {achievement.icon}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-strava-orange">
              {t('achievements.achievementUnlocked')}
            </p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-50">
              {achievement.name}
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">{achievement.description}</p>
            <span
              className={clsx(
                'mt-3 inline-block text-sm font-bold capitalize',
                rarityText[achievement.rarity]
              )}
            >
              {t('achievements.achievement', { rarity: achievement.rarity })}
            </span>
          </div>

          <button
            onClick={onClose}
            className="mt-2 rounded-lg bg-gradient-to-r from-strava-orange to-strava-orange-dark px-8 py-3 font-medium text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
          >
            {t('achievements.awesome')}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes badge-reveal {
          0% {
            transform: scale(0) rotateY(0deg);
            opacity: 0;
          }
          60% {
            transform: scale(1.15) rotateY(360deg);
          }
          100% {
            transform: scale(1) rotateY(360deg);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};
