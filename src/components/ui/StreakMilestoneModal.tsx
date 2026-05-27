import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { Flame, Share2, X } from 'lucide-react';
import { Button } from './Button';
import { GlassCard } from './GlassCard';
import { shareOrCopy } from '@utils/share';
import { useToastStore } from '@store/toastStore';
import { useConfetti } from '@hooks/useConfetti';

interface StreakMilestoneModalProps {
  /** The milestone day-count being celebrated (e.g. 30). */
  milestone: number;
  /** The user's live streak — what the share message brags about. */
  currentStreak: number;
  onDismiss: () => void;
}

/**
 * "Keep the fire alive" celebration shown once when an activity streak first
 * reaches a milestone. Mirrors the challenge ChallengeSummaryModal — confetti
 * burst + share affordance — so streak wins get the same "make it official"
 * moment. Triggered from the Dashboard via useStreakMilestone.
 */
export const StreakMilestoneModal = ({
  milestone,
  currentStreak,
  onDismiss,
}: StreakMilestoneModalProps) => {
  const { t } = useTranslation();
  const { success } = useToastStore();
  const fireConfetti = useConfetti();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 100);
    fireConfetti();
    return () => clearTimeout(timer);
  }, [fireConfetti]);

  const handleShare = async () => {
    const result = await shareOrCopy({
      title: t('streak.milestone.label'),
      text: t('streak.milestone.shareText', { days: currentStreak }),
      url: typeof window !== 'undefined' ? window.location.origin : undefined,
    });
    if (result === 'copied') success(t('streak.milestone.shareCopied'));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onDismiss}
    >
      <div
        className={clsx(
          'w-full max-w-sm transition-all duration-500',
          showContent ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <GlassCard className="relative p-6">
          <button
            type="button"
            onClick={onDismiss}
            aria-label={t('common.cancel')}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          >
            <X size={18} strokeWidth={2} />
          </button>

          <div className="flex flex-col items-center text-center">
            <div
              className="mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-strava-orange to-amber-500 text-white shadow-lg shadow-strava-orange/30"
              style={{
                animation: showContent
                  ? 'badge-reveal 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
                  : 'none',
              }}
            >
              <Flame size={34} strokeWidth={2} />
            </div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-strava-orange">
              {t('streak.milestone.label')}
            </p>
            <p className="mt-1 font-mono text-5xl font-bold tabular-nums leading-none text-gray-900 dark:text-gray-50">
              {milestone}
            </p>
            <p className="mt-2 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
              {t('streak.milestone.dayStreak')}
            </p>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              {t('streak.milestone.body', { days: currentStreak })}
            </p>
          </div>

          <div className="mt-6 space-y-2">
            <Button fullWidth onClick={handleShare} className="gap-2">
              <Share2 size={16} strokeWidth={2} />
              {t('streak.milestone.share')}
            </Button>
            <button
              type="button"
              onClick={onDismiss}
              className="w-full rounded-2xl py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              {t('streak.milestone.dismiss')}
            </button>
          </div>
        </GlassCard>
      </div>

      <style>{`
        @keyframes badge-reveal {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};
