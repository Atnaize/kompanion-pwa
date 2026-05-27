import { useQuery } from '@tanstack/react-query';
import {
  achievementsService,
  conversationsService,
  friendsService,
  inboxService,
} from '@api/services';
import type { Achievement } from '@types';

interface TabBadge {
  count: number;
  color?: string;
}

interface TabBadges {
  [path: string]: TabBadge;
}

/**
 * Single source of truth for the count bubbles shown on bottom-nav tabs and
 * `MoreSheet` tiles. Adding a new badge source = one `useQuery` block + one
 * entry in the returned map. Same path key as the route the bubble points to.
 */
export const useTabBadges = (): TabBadges => {
  // Achievements ready to redeem.
  const { data: achievements } = useQuery({
    queryKey: ['achievements'],
    queryFn: async () => {
      const response = await achievementsService.list();
      return response.data || [];
    },
  });

  // Pending friend requests sent TO me — drives the `/friends` tile bubble
  // specifically (matches what the Friends page shows in the Requests tab).
  const { data: incomingRequests } = useQuery({
    queryKey: ['friend-requests-incoming'],
    queryFn: async () => {
      const response = await friendsService.listIncoming();
      return response.data || [];
    },
  });

  // Unread inbox notifications — drives the `/notifications` tile bubble.
  // This is broader than the friends-only count (includes achievements,
  // challenge invites, etc.).
  const { data: inboxCount } = useQuery({
    queryKey: ['inbox-unread-count'],
    queryFn: async () => {
      const response = await inboxService.unreadCount();
      return response.data?.count ?? 0;
    },
    // Background-refresh the badge so it stays warm without spamming the server.
    refetchInterval: 60_000,
  });

  // Unread chat messages across every conversation — drives the `/messages`
  // tile bubble.
  const { data: messagesUnread } = useQuery({
    queryKey: ['conversations-unread-total'],
    queryFn: async () => {
      const response = await conversationsService.unreadTotal();
      return response.data?.count ?? 0;
    },
    refetchInterval: 60_000,
  });

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

  if (incomingRequests && incomingRequests.length > 0) {
    badges['/friends'] = {
      count: incomingRequests.length,
      color: 'bg-strava-orange',
    };
  }

  if (inboxCount && inboxCount > 0) {
    badges['/notifications'] = {
      count: inboxCount,
      color: 'bg-strava-orange',
    };
  }

  if (messagesUnread && messagesUnread > 0) {
    badges['/messages'] = {
      count: messagesUnread,
      color: 'bg-strava-orange',
    };
  }

  return badges;
};
