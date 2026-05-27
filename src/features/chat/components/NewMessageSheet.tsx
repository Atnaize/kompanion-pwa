import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { Button, Input } from '@components/ui';
import { FriendSelector } from '@features/friends';
import { friendsService } from '@api/services';
import { useStartConversation } from '../hooks/useStartConversation';

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * Compose sheet: pick one friend to open a 1:1 DM, or several to spin up a
 * group (with an optional name). Navigation into the new thread is handled by
 * `useStartConversation`; this just closes on success.
 */
export const NewMessageSheet = ({ open, onClose }: Props) => {
  const { t } = useTranslation();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [title, setTitle] = useState('');
  const { startDm, startGroup } = useStartConversation();

  const { data: friends = [], isLoading } = useQuery({
    queryKey: ['friends'],
    queryFn: async () => (await friendsService.list()).data ?? [],
    enabled: open,
    staleTime: 60_000,
  });

  const isGroup = selectedIds.length > 1;
  const pending = startDm.isPending || startGroup.isPending;

  const close = () => {
    setSelectedIds([]);
    setTitle('');
    onClose();
  };

  const handleStart = () => {
    if (selectedIds.length === 0 || pending) return;
    if (isGroup) {
      startGroup.mutate(
        { userIds: selectedIds, title: title.trim() || undefined },
        { onSuccess: close }
      );
    } else {
      startDm.mutate(selectedIds[0], { onSuccess: close });
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      <button
        type="button"
        aria-label={t('common.close', { defaultValue: 'Close' })}
        onClick={close}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative mt-auto flex max-h-[85vh] flex-col rounded-t-3xl border-t border-white/20 bg-white shadow-2xl dark:bg-gray-900"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <header className="flex items-center justify-between border-b border-gray-200/60 px-4 py-3 dark:border-gray-800/60">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">
            {t('messages.new.title', { defaultValue: 'New message' })}
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label={t('common.close', { defaultValue: 'Close' })}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {isGroup && (
            <div className="mb-3">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('messages.new.groupNamePlaceholder', {
                  defaultValue: 'Group name (optional)',
                })}
                maxLength={80}
              />
            </div>
          )}
          <FriendSelector
            selectedFriendIds={selectedIds}
            onSelectionChange={setSelectedIds}
            friends={friends}
            isLoading={isLoading}
          />
        </div>

        <footer className="border-t border-gray-200/60 px-4 py-3 dark:border-gray-800/60">
          <Button onClick={handleStart} disabled={selectedIds.length === 0 || pending} fullWidth>
            {isGroup
              ? t('messages.new.createGroup', { defaultValue: 'Create group' })
              : t('messages.new.startChat', { defaultValue: 'Start chat' })}
          </Button>
        </footer>
      </div>
    </div>
  );
};
