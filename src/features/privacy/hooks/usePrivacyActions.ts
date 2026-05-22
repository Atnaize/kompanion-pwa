import { useMutation, useQueryClient } from '@tanstack/react-query';
import { privacyService } from '@api/services';

/**
 * Block/mute mutations + sweeping query invalidation. Blocking deletes
 * friendships and pending requests on the server, so we invalidate the same
 * surfaces that `useFriendshipActions` does — plus inbox + leaderboards which
 * the privacy filter feeds into.
 */
export const usePrivacyActions = () => {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    void queryClient.invalidateQueries({ queryKey: ['friends'] });
    void queryClient.invalidateQueries({ queryKey: ['friend-requests-incoming'] });
    void queryClient.invalidateQueries({ queryKey: ['friend-requests-outgoing'] });
    void queryClient.invalidateQueries({ queryKey: ['friend-search'] });
    void queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    void queryClient.invalidateQueries({ queryKey: ['feed'] });
    void queryClient.invalidateQueries({ queryKey: ['leaderboards'] });
    void queryClient.invalidateQueries({ queryKey: ['inbox'] });
    void queryClient.invalidateQueries({ queryKey: ['inbox-unread-count'] });
    void queryClient.invalidateQueries({ queryKey: ['privacy-blocked'] });
    void queryClient.invalidateQueries({ queryKey: ['privacy-muted'] });
  };

  const block = useMutation({
    mutationFn: (userId: number) => privacyService.block(userId),
    onSuccess: invalidateAll,
  });

  const unblock = useMutation({
    mutationFn: (userId: number) => privacyService.unblock(userId),
    onSuccess: invalidateAll,
  });

  const mute = useMutation({
    mutationFn: (userId: number) => privacyService.mute(userId),
    onSuccess: invalidateAll,
  });

  const unmute = useMutation({
    mutationFn: (userId: number) => privacyService.unmute(userId),
    onSuccess: invalidateAll,
  });

  return { block, unblock, mute, unmute };
};
