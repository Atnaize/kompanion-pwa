import { useQuery } from '@tanstack/react-query';
import { achievementsService } from '@api/services';
import type { Achievement } from '@types';

interface TabBadge {
  count: number;
  color?: string;
}

interface TabBadges {
  [path: string]: TabBadge;
}

export const useTabBadges = (): TabBadges => {
  // Use the same query that AchievementsPage uses - React Query will deduplicate
  const { data: achievements } = useQuery({
    queryKey: ['achievements'],
    queryFn: async () => {
      const response = await achievementsService.list();
      return response.data || [];
    },
  });

  // Calculate badges from cached data
  const badges: TabBadges = {};

  if (achievements) {
    const redeemableCount = achievements.filter(
      (a: Achievement) => a.isRedeemable && !a.unlockedAt
    ).length;

    if (redeemableCount > 0) {
      badges['/achievements'] = {
        count: redeemableCount,
        color: 'bg-strava-orange',
      };
    }
  }

  // Add more badge calculations here as needed
  // Example:
  // if (quests) {
  //   const activeQuests = quests.filter(q => q.status === 'active').length;
  //   if (activeQuests > 0) {
  //     badges['/quests'] = { count: activeQuests };
  //   }
  // }

  return badges;
};
