import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { Flag, Share2, Trophy, X } from 'lucide-react';
import { Avatar, Button, GlassCard, ProgressRing } from '@components/ui';
import type { Challenge } from '@types';
import { formatDistance, formatElevation } from '@utils/format';
import { shareOrCopy } from '@utils/share';
import { useAuthStore } from '@store/authStore';
import { useToastStore } from '@store/toastStore';
import { useConfetti } from '@hooks/useConfetti';

interface ChallengeSummaryModalProps {
  challenge: Challenge;
  onDismiss: () => void;
  onViewChallenge: () => void;
}

/**
 * "Make it official" celebration shown once when a challenge a user took part
 * in wraps up. Success fires confetti; both outcomes recap the result with
 * team contributions (collaborative) or final rankings (competitive) and a
 * share affordance. Triggered from ChallengesPage off `unseenCompletedChallenges`.
 */
export const ChallengeSummaryModal = ({
  challenge,
  onDismiss,
  onViewChallenge,
}: ChallengeSummaryModalProps) => {
  const { t } = useTranslation();
  const viewerId = useAuthStore((s) => s.user?.userId);
  const { success } = useToastStore();
  const fireConfetti = useConfetti();
  const [showContent, setShowContent] = useState(false);

  const isSuccess = challenge.status === 'completed';
  const isCollaborative = challenge.type === 'collaborative';

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 100);
    if (isSuccess) fireConfetti();
    return () => clearTimeout(timer);
  }, [isSuccess, fireConfetti]);

  const accepted = challenge.participants?.filter((p) => p.status === 'accepted') ?? [];
  const totalDistance = accepted.reduce((sum, p) => sum + p.totalDistance, 0);
  const totalElevation = accepted.reduce((sum, p) => sum + p.totalElevation, 0);
  const totalActivities = accepted.reduce((sum, p) => sum + p.activityCount, 0);

  const distanceProgress = challenge.targets.distance
    ? Math.min((totalDistance / challenge.targets.distance) * 100, 100)
    : 0;
  const elevationProgress = challenge.targets.elevation
    ? Math.min((totalElevation / challenge.targets.elevation) * 100, 100)
    : 0;
  const mainProgress = challenge.targets.distance ? distanceProgress : elevationProgress;

  const ranked = [...accepted].sort((a, b) => b.totalDistance - a.totalDistance);
  const viewerRank = ranked.findIndex((p) => p.userId === viewerId) + 1;

  const handleShare = async () => {
    const result = await shareOrCopy({
      title: challenge.name,
      text: t('challenges.summary.shareText', { name: challenge.name }),
      url: typeof window !== 'undefined' ? window.location.origin : undefined,
    });
    if (result === 'copied') success(t('challenges.summary.shareCopied'));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onDismiss}
    >
      <div
        className={clsx(
          'max-h-[90vh] w-full max-w-md overflow-y-auto transition-all duration-500',
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

          {/* Celebratory header */}
          <div className="mb-6 flex flex-col items-center text-center">
            <div
              className={clsx(
                'mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br text-white shadow-lg',
                isSuccess
                  ? 'from-emerald-400 to-emerald-600 shadow-emerald-500/30'
                  : 'from-gray-400 to-gray-600 shadow-gray-500/20'
              )}
              style={{
                animation: showContent
                  ? 'badge-reveal 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
                  : 'none',
              }}
            >
              {isSuccess ? (
                <Trophy size={34} strokeWidth={2} />
              ) : (
                <Flag size={34} strokeWidth={2} />
              )}
            </div>
            <p
              className={clsx(
                'font-mono text-[10px] font-semibold uppercase tracking-[0.18em]',
                isSuccess ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500'
              )}
            >
              {isSuccess
                ? t('challenges.summary.completedTitle')
                : t('challenges.summary.endedTitle')}
            </p>
            <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-50">
              {challenge.name}
            </h2>
            <span className="mt-2 inline-flex items-center rounded-full bg-strava-orange/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-strava-orange">
              {isCollaborative
                ? t('createChallenge.collaborative')
                : t('createChallenge.competitive')}
            </span>
          </div>

          {/* Progress ring */}
          <div className="mb-6 flex justify-center">
            <ProgressRing
              progress={mainProgress}
              size={104}
              color={isSuccess ? '#10b981' : '#9ca3af'}
            />
          </div>

          {/* Totals */}
          <div className="mb-6 grid grid-cols-3 gap-3 text-center">
            {challenge.targets.distance ? (
              <SummaryStat
                value={formatDistance(totalDistance)}
                sub={t('challenges.summary.ofTarget', {
                  target: formatDistance(challenge.targets.distance),
                })}
              />
            ) : null}
            {challenge.targets.elevation ? (
              <SummaryStat
                value={formatElevation(totalElevation)}
                sub={t('challenges.summary.ofTarget', {
                  target: formatElevation(challenge.targets.elevation),
                })}
              />
            ) : null}
            <SummaryStat
              value={String(totalActivities)}
              sub={t('challenges.summary.activityCount', { count: totalActivities })}
            />
          </div>

          {/* Contributions / rankings */}
          <div className="mb-6">
            <h3 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
              {isCollaborative
                ? t('challenges.summary.teamContributions')
                : t('challenges.summary.finalRankings')}
            </h3>
            <ol className="space-y-2">
              {ranked.map((p, index) => {
                const rank = index + 1;
                const isViewer = p.userId === viewerId;
                const isPodium = !isCollaborative && rank <= 3;
                return (
                  <li
                    key={p.userId}
                    className={clsx(
                      'flex items-center gap-3 rounded-xl p-2',
                      isViewer
                        ? 'bg-strava-orange/10 ring-1 ring-strava-orange/30'
                        : 'bg-gray-100/60 dark:bg-gray-800/50'
                    )}
                  >
                    {!isCollaborative && (
                      <span
                        className={clsx(
                          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-xs font-semibold tabular-nums',
                          isPodium
                            ? 'bg-strava-orange/15 text-strava-orange'
                            : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-300'
                        )}
                      >
                        {rank}
                      </span>
                    )}
                    <Avatar
                      src={p.user.profile}
                      firstname={p.user.firstname}
                      lastname={p.user.lastname}
                      size="sm"
                      className="!h-7 !w-7"
                    />
                    <span className="flex-1 truncate text-sm font-medium text-gray-900 dark:text-gray-50">
                      {p.user.firstname}
                      {isViewer && (
                        <span className="ml-1.5 font-mono text-[10px] uppercase tracking-wider text-strava-orange">
                          {t('challenges.summary.you')}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 font-mono text-sm font-semibold tabular-nums text-gray-700 dark:text-gray-300">
                      {formatDistance(p.totalDistance)}
                    </span>
                  </li>
                );
              })}
            </ol>
            {!isCollaborative && viewerRank > 0 && (
              <p className="mt-3 text-center text-sm text-gray-600 dark:text-gray-400">
                {t('challenges.summary.finishedPlace', {
                  rank: viewerRank,
                  count: ranked.length,
                })}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <Button fullWidth onClick={handleShare} className="gap-2">
              <Share2 size={16} strokeWidth={2} />
              {t('challenges.summary.share')}
            </Button>
            <Button fullWidth variant="secondary" onClick={onViewChallenge}>
              {t('challenges.summary.viewChallenge')}
            </Button>
            <button
              type="button"
              onClick={onDismiss}
              className="w-full rounded-2xl py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              {t('challenges.summary.dismiss')}
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

const SummaryStat = ({ value, sub }: { value: string; sub: string }) => (
  <div>
    <p className="font-mono text-lg font-bold tabular-nums text-gray-900 dark:text-gray-50">
      {value}
    </p>
    <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">{sub}</p>
  </div>
);
