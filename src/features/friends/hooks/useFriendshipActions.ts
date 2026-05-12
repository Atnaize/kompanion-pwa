import { useMutation, useQueryClient } from '@tanstack/react-query';
import { friendsService } from '@api/services';

/**
 * Single source of truth for friendship mutations + query invalidation.
 * Any UI that needs to send / accept / cancel / decline / unfriend imports this
 * hook and gets matching cache invalidation for free — no scattered queryClient
 * calls in components.
 */
export const useFriendshipActions = () => {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    void queryClient.invalidateQueries({ queryKey: ['friends'] });
    void queryClient.invalidateQueries({ queryKey: ['friend-requests-incoming'] });
    void queryClient.invalidateQueries({ queryKey: ['friend-requests-outgoing'] });
    void queryClient.invalidateQueries({ queryKey: ['friend-search'] });
    void queryClient.invalidateQueries({ queryKey: ['user-profile'] });
  };

  const sendRequest = useMutation({
    mutationFn: (userId: number) => friendsService.sendRequest(userId),
    onSuccess: invalidateAll,
  });

  const acceptRequest = useMutation({
    mutationFn: (userId: number) => friendsService.acceptRequest(userId),
    onSuccess: invalidateAll,
  });

  const cancelOrDeclineRequest = useMutation({
    mutationFn: (userId: number) => friendsService.cancelOrDeclineRequest(userId),
    onSuccess: invalidateAll,
  });

  const unfriend = useMutation({
    mutationFn: (userId: number) => friendsService.unfriend(userId),
    onSuccess: invalidateAll,
  });

  return {
    sendRequest,
    acceptRequest,
    cancelOrDeclineRequest,
    unfriend,
  };
};
