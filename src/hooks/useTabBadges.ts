import { useEffect, useState } from 'react';
import { achievementsService } from '@api/services';

interface TabBadge {
  count: number;
  color?: string;
}

interface TabBadges {
  [path: string]: TabBadge;
}

export const useTabBadges = () => {
  const [badges, setBadges] = useState<TabBadges>({});

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        // Fetch achievements badge
        const achievementsResponse = await achievementsService.list();
        if (achievementsResponse.data) {
          const redeemableCount = achievementsResponse.data.filter(
            (a) => a.isRedeemable && !a.unlockedAt
          ).length;

          setBadges((prev) => ({
            ...prev,
            '/achievements': {
              count: redeemableCount,
              color: 'bg-strava-orange',
            },
          }));
        }

        // Add more badge fetchers here as needed
        // Example:
        // const questsResponse = await questsService.list();
        // if (questsResponse.data) {
        //   const availableQuests = questsResponse.data.filter(q => q.status === 'new').length;
        //   setBadges(prev => ({ ...prev, '/quests': { count: availableQuests } }));
        // }
      } catch (error) {
        // Silently fail - badges are not critical
        console.error('Failed to fetch tab badges:', error);
      }
    };

    fetchBadges();

    // Refresh every 30 seconds
    const interval = setInterval(fetchBadges, 30000);

    return () => clearInterval(interval);
  }, []);

  return badges;
};
