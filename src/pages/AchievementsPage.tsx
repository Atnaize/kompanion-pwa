import { useState } from 'react';
import { Layout } from '@components/layout';
import { BadgeCard, AchievementUnlockedModal } from '@components/ui';
import { achievementsService } from '@api/services';
import { useAsync } from '@hooks/useAsync';
import type { Achievement } from '@app-types/index';

export const AchievementsPage = () => {
  const [unlockedAchievement, setUnlockedAchievement] = useState<Achievement | null>(null);
  const {
    data: achievements,
    isLoading,
    refetch,
  } = useAsync<Achievement[]>(async () => {
    const response = await achievementsService.list();
    return response.data || [];
  });

  const unlocked = achievements?.filter((a) => a.unlockedAt) || [];
  const locked = achievements?.filter((a) => !a.unlockedAt) || [];
  const redeemableCount = locked.filter((a) => a.isRedeemable).length;

  const handleRedeem = async (achievement: Achievement) => {
    try {
      const response = await achievementsService.redeem(achievement.id);
      if (response.data) {
        setUnlockedAchievement(response.data);
      }
    } catch (error) {
      console.error('Failed to redeem achievement:', error);
      alert(error instanceof Error ? error.message : 'Failed to redeem achievement');
    }
  };

  const handleCloseModal = async () => {
    setUnlockedAchievement(null);
    await refetch();
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
          <div className="py-12 text-center text-gray-600">Loading achievements...</div>
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

            {locked.length > 0 && (
              <section>
                <h3 className="mb-4 text-lg font-bold text-gray-900">Locked</h3>
                <div className="grid grid-cols-2 gap-3">
                  {locked.map((achievement) => (
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
