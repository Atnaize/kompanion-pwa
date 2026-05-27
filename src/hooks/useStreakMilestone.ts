import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { statsService } from '@api/services';
import { useAuthStore } from '@store/authStore';

/** Activity-streak day counts that earn a celebration. Ascending. */
export const STREAK_MILESTONES = [7, 14, 30, 50, 100, 200, 365] as const;

const storageKey = (userId: number) => `kompanion-streak-milestone-${userId}`;

/** Highest milestone the streak has reached, or null if below the first one. */
function reachedMilestone(streak: number): number | null {
  let reached: number | null = null;
  for (const milestone of STREAK_MILESTONES) {
    if (streak >= milestone) {
      reached = milestone;
    }
  }
  return reached;
}

interface StreakMilestoneState {
  /** The milestone to celebrate right now, or null when there's nothing to show. */
  milestone: number | null;
  /** The user's current streak — what the celebration actually brags about. */
  currentStreak: number;
  /** Mark the active milestone seen (persisted) and close the celebration. */
  dismiss: () => void;
}

/**
 * Drives the streak celebration the way ChallengeSummaryModal is driven by
 * unseenCompletedChallenges — fire once when a milestone is first reached.
 * There's no server-side "seen" flag for streaks, so the last-celebrated
 * milestone is persisted in localStorage per user. The very first observation
 * for a user seeds that baseline silently, so shipping this feature doesn't
 * blast confetti at everyone who already has a long streak — only genuine
 * forward crossings celebrate.
 */
export function useStreakMilestone(): StreakMilestoneState {
  const userId = useAuthStore((s) => s.user?.userId);
  const [milestone, setMilestone] = useState<number | null>(null);

  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const response = await statsService.getUserStats();
      return response.data ?? null;
    },
    enabled: !!userId,
  });

  const currentStreak = stats?.currentStreak ?? 0;
  const reached = reachedMilestone(currentStreak);

  useEffect(() => {
    if (!userId) return;
    // `undefined` = still loading; `null` = loaded but no stats yet.
    if (stats === undefined) return;

    const key = storageKey(userId);
    const stored = localStorage.getItem(key);

    if (stored === null) {
      localStorage.setItem(key, String(reached ?? 0));
      return;
    }

    if (reached !== null && reached > Number(stored)) {
      setMilestone(reached);
    }
  }, [userId, stats, reached]);

  const dismiss = () => {
    if (userId && milestone !== null) {
      const key = storageKey(userId);
      const stored = Number(localStorage.getItem(key) ?? 0);
      if (milestone > stored) {
        localStorage.setItem(key, String(milestone));
      }
    }
    setMilestone(null);
  };

  return { milestone, currentStreak, dismiss };
}
