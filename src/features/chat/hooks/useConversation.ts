import { useQuery } from '@tanstack/react-query';
import { conversationsService } from '@api/services';
import type { ConversationSummary } from '@types';

export type ConversationScope =
  | { kind: 'challenge'; id: string }
  | { kind: 'club'; id: string }
  // A DM/group thread keyed directly by its conversation id (Messages hub,
  // push deep-links). `id` is the conversation id, not a scope id.
  | { kind: 'conversation'; id: string };

/**
 * Resolve a conversation for a scope (challenge/club) or directly by id. The
 * server lazy-creates club/challenge rows on first call. Returns the summary
 * used to render the chat header and to key all subsequent conversation calls.
 */
export function useConversation(scope: ConversationScope | null) {
  return useQuery<ConversationSummary>({
    queryKey: ['conversation', scope?.kind, scope?.id],
    enabled: !!scope?.id,
    queryFn: async () => {
      if (!scope) throw new Error('No scope');
      const response =
        scope.kind === 'challenge'
          ? await conversationsService.getChallengeConversation(scope.id)
          : scope.kind === 'club'
            ? await conversationsService.getClubConversation(scope.id)
            : await conversationsService.getConversation(scope.id);
      if (!response.data) throw new Error('Conversation not found');
      return response.data;
    },
    // Conversation identity is stable for a scope; cache aggressively.
    staleTime: 5 * 60 * 1000,
  });
}
