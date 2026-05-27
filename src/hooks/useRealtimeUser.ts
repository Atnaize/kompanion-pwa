import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type * as Ably from 'ably';
import { getRealtimeClient } from '@api/realtime';

/**
 * Subscribe to the viewer's personal channel (`user:{userId}`) and refresh every
 * query that channel can affect on any event ("something changed — refetch").
 * The server publishes here from two places:
 *   - chat fan-out (new message / reaction / read) — keeps the Messages hub and
 *     its unread badge live;
 *   - the notification emitter (club invite, friend request, challenge invite,
 *     achievement, …) — keeps the Notifications inbox and its nav badge live.
 *
 * Mounted once in `Layout` so the bottom-nav badges stay live on every page, not
 * just whichever surface owns the underlying list. No-ops (each view falls back
 * to its own polling) when realtime is disabled server-side.
 */
export function useRealtimeUser(userId: number | undefined): void {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!userId) return;
    let channel: Ably.RealtimeChannel | null = null;
    let cancelled = false;
    const onEvent = () => {
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });
      void queryClient.invalidateQueries({ queryKey: ['conversations-unread-total'] });
      void queryClient.invalidateQueries({ queryKey: ['inbox'] });
      void queryClient.invalidateQueries({ queryKey: ['inbox-unread-count'] });
      void queryClient.invalidateQueries({ queryKey: ['friend-requests-incoming'] });
    };
    void getRealtimeClient().then((client) => {
      if (!client || cancelled) return;
      channel = client.channels.get(`user:${userId}`);
      void channel.subscribe(onEvent);
    });
    return () => {
      cancelled = true;
      channel?.unsubscribe(onEvent);
    };
  }, [userId, queryClient]);
}
