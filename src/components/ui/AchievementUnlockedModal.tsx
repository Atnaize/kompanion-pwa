import { useEffect, useState } from 'react';
import clsx from 'clsx';
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
  common: 'text-gray-600',
  rare: 'text-blue-600',
  epic: 'text-purple-600',
  legendary: 'text-orange-600',
};

export const AchievementUnlockedModal = ({
  achievement,
  onClose,
}: AchievementUnlockedModalProps) => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Show content after a brief delay
    const contentTimer = setTimeout(() => setShowContent(true), 100);

    // Create confetti effect with proper randomization
    const colors = ['#FF4B00', '#FF6B2B', '#4B5563', '#3B82F6', '#8B5CF6', '#F59E0B'];
    const confettiCount = 60;
    const confettiElements: HTMLDivElement[] = [];

    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement('div');
      const size = Math.random() * 8 + 4; // 4-12px
      const startX = Math.random() * window.innerWidth;
      const endX = startX + (Math.random() - 0.5) * 200; // Drift sideways
      const rotation = Math.random() * 720 - 360;
      const delay = Math.random() * 500; // Random start time
      const duration = Math.random() * 1500 + 2000; // 2-3.5s

      confetti.style.position = 'fixed';
      confetti.style.width = `${size}px`;
      confetti.style.height = `${size}px`;
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.left = `${startX}px`;
      confetti.style.top = '-20px';
      confetti.style.opacity = '1';
      confetti.style.zIndex = '9999';
      confetti.style.pointerEvents = 'none';
      confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';

      document.body.appendChild(confetti);
      confettiElements.push(confetti);

      // Animate confetti with delay
      setTimeout(() => {
        confetti.style.transition = `all ${duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
        confetti.style.top = `${window.innerHeight + 20}px`;
        confetti.style.left = `${endX}px`;
        confetti.style.opacity = '0';
        confetti.style.transform = `rotate(${rotation}deg)`;
      }, delay);
    }

    // Cleanup
    const cleanup = setTimeout(() => {
      confettiElements.forEach((el) => el.remove());
    }, 4000);

    return () => {
      clearTimeout(contentTimer);
      clearTimeout(cleanup);
      confettiElements.forEach((el) => el.remove());
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={clsx(
          'relative w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl transition-all duration-500',
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
          className="absolute right-4 top-4 text-gray-400 transition-colors hover:text-gray-600"
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
              Achievement Unlocked!
            </p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900">{achievement.name}</h2>
            <p className="mt-2 text-gray-600">{achievement.description}</p>
            <span
              className={clsx(
                'mt-3 inline-block text-sm font-bold capitalize',
                rarityText[achievement.rarity]
              )}
            >
              {achievement.rarity} Achievement
            </span>
          </div>

          <button
            onClick={onClose}
            className="mt-2 rounded-lg bg-gradient-to-r from-strava-orange to-strava-orange-dark px-8 py-3 font-medium text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
          >
            Awesome!
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
