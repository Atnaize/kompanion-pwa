import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '@components/layout';
import {
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
          <h2 className="text-2xl font-bold text-gray-900">Achievements</h2>
          <p className="text-gray-600">
            {unlocked.length} / {achievements?.length || 0} unlocked
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
            {unlocked.length > 0 && (
              <section>
                <h3 className="mb-4 text-lg font-bold text-gray-900">Unlocked</h3>
                <div className="grid grid-cols-2 gap-3">
                  {unlocked.map((achievement) => (
                    <BadgeCard key={achievement.id} {...achievement} unlocked />
                  ))}
                </div>
              </section>
            )}

            {lockedSorted.length > 0 && (
              <section>
                <h3 className="mb-4 text-lg font-bold text-gray-900">
                  In Progress
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {lockedSorted.map((achievement) => (
                    <BadgeCard
                      key={achievement.id}
                      {...achievement}
                      redeemable={achievement.isRedeemable}
                      onRedeem={() => handleRedeem(achievement)}
                    />
                  ))}
                </div>
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
