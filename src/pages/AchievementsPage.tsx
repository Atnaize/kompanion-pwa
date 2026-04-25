import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { Layout } from '@components/layout';
import {
  AnimatedNumber,
  BadgeCard,
  AchievementUnlockedModal,
  AchievementCardSkeleton,
  NoAchievementsEmpty,
} from '@components/ui';
import { achievementsService } from '@api/services';
import { hapticService } from '@utils/haptic';
import type { Achievement } from '@types';

export const AchievementsPage = () => {
  const [unlockedAchievement, setUnlockedAchievement] = useState<Achievement | null>(null);
  const [showUnlocked, setShowUnlocked] = useState(false);
  const queryClient = useQueryClient();

  const { data: achievements = [], isLoading } = useQuery({
    queryKey: ['achievements'],
    queryFn: async () => {
      const response = await achievementsService.list();
      return response.data || [];
    },
  });

  const redeemMutation = useMutation({
    mutationFn: (achievementId: string) => achievementsService.redeem(achievementId),
    onSuccess: (response) => {
      if (response.data) {
        setUnlockedAchievement(response.data);
        hapticService.achievementUnlocked();
      }
      // Invalidate and refetch achievements
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
    },
    // onError is not needed - API client automatically shows error toasts
  });

  const unlocked = achievements?.filter((a) => a.unlockedAt) || [];
  const locked = achievements?.filter((a) => !a.unlockedAt) || [];

  // Sort locked achievements by progress percentage (descending)
  const lockedSorted = locked.sort((a, b) => {
    const aProgress = a.progress?.percentage || 0;
    const bProgress = b.progress?.percentage || 0;
    return bProgress - aProgress;
  });

  const redeemableCount = locked.filter((a) => a.isRedeemable).length;

  const handleRedeem = (achievement: Achievement) => {
    redeemMutation.mutate(achievement.id);
  };

  const handleCloseModal = () => {
    setUnlockedAchievement(null);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
            Achievements
          </p>
          <p className="mt-1 font-mono text-2xl font-semibold tabular-nums tracking-tight text-gray-900 dark:text-gray-50">
            <AnimatedNumber value={unlocked.length} /> / {achievements?.length || 0}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            unlocked
            {redeemableCount > 0 && (
              <span className="ml-2 text-strava-orange">• {redeemableCount} ready to unlock</span>
            )}
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            <AchievementCardSkeleton />
            <AchievementCardSkeleton />
            <AchievementCardSkeleton />
            <AchievementCardSkeleton />
            <AchievementCardSkeleton />
            <AchievementCardSkeleton />
          </div>
        ) : achievements.length === 0 ? (
          <NoAchievementsEmpty />
        ) : (
          <>
            {lockedSorted.length > 0 && (
              <section>
                <h3 className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                  In Progress
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {lockedSorted.map((achievement, i) => (
                    <motion.div
                      key={achievement.id}
                      initial={i < 12 ? { opacity: 0, y: 8 } : false}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.35,
                        delay: Math.min(i, 12) * 0.04,
                        ease: 'easeOut',
                      }}
                    >
                      <BadgeCard
                        {...achievement}
                        redeemable={achievement.isRedeemable}
                        onRedeem={() => handleRedeem(achievement)}
                      />
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {unlocked.length > 0 && (
              <section>
                <button
                  type="button"
                  onClick={() => setShowUnlocked((v) => !v)}
                  aria-expanded={showUnlocked}
                  className="mb-4 flex w-full items-center justify-between rounded-lg text-left transition-colors hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                    Unlocked · {unlocked.length}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-gray-400 transition-transform duration-300 dark:text-gray-500 ${
                      showUnlocked ? 'rotate-180' : ''
                    }`}
                    strokeWidth={1.75}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {showUnlocked && (
                    <motion.div
                      key="unlocked-grid"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-2 gap-3">
                        {unlocked.map((achievement, i) => (
                          <motion.div
                            key={achievement.id}
                            initial={i < 12 ? { opacity: 0, y: 8 } : false}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              duration: 0.35,
                              delay: Math.min(i, 12) * 0.04,
                              ease: 'easeOut',
                            }}
                          >
                            <BadgeCard {...achievement} unlocked />
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>
            )}
          </>
        )}
      </div>

      {unlockedAchievement && (
        <AchievementUnlockedModal achievement={unlockedAchievement} onClose={handleCloseModal} />
      )}
    </Layout>
  );
};
