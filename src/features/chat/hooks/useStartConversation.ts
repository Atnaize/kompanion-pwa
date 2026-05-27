import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { conversationsService } from '@api/services';
import { useToastStore } from '@store/toastStore';
import type { ConversationSummary } from '@types';

/**
 * Start (or reopen) a conversation and navigate into its thread. `startDm`
 * resolves the idempotent 1:1 DM with a friend; `startGroup` creates a new
 * group DM. Both invalidate the inbox so the row appears immediately.
 */
export function useStartConversation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { error } = useToastStore();

  const onSuccess = (summary: ConversationSummary) => {
    void queryClient.invalidateQueries({ queryKey: ['conversations'] });
    navigate(`/messages/${summary.id}`);
  };

  const onError = (err: unknown) =>
    error(
      err instanceof Error
        ? err.message
        : t('messages.toast.startFailed', { defaultValue: "Couldn't open chat" })
    );

  const startDm = useMutation({
    mutationFn: async (userId: number) => {
      const res = await conversationsService.startDm(userId);
      if (!res.data) throw new Error(res.error || 'Failed to start chat');
      return res.data;
    },
    onSuccess,
    onError,
  });

  const startGroup = useMutation({
    mutationFn: async (input: { userIds: number[]; title?: string }) => {
      const res = await conversationsService.createGroup(input.userIds, input.title);
      if (!res.data) throw new Error(res.error || 'Failed to create group');
      return res.data;
    },
    onSuccess,
    onError,
  });

  return { startDm, startGroup };
}
