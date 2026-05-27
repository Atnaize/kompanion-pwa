import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type * as Ably from 'ably';
import { getRealtimeClient } from '@api/realtime';

/**
 * Subscribe to a conversation's realtime channel and invalidate its message
 * queries on any event ("something changed — refetch"). This makes new
 * messages/reactions/notices appear instantly; the cache stays the source of
 * truth. No-ops (falls back to the view's polling) when realtime is disabled.
 */
export function useRealtimeConversation(conversationId: string | undefined): void {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!conversationId) return;
    let channel: Ably.RealtimeChannel | null = null;
    let cancelled = false;
    const onEvent = () => {
      void queryClient.invalidateQueries({ queryKey: ['conversation-messages', conversationId] });
      void queryClient.invalidateQueries({ queryKey: ['conversation-replies', conversationId] });
    };
    void getRealtimeClient().then((client) => {
      if (!client || cancelled) return;
      channel = client.channels.get(`conversation:${conversationId}`);
      void channel.subscribe(onEvent);
    });
    return () => {
      cancelled = true;
      channel?.unsubscribe(onEvent);
    };
  }, [conversationId, queryClient]);
}
