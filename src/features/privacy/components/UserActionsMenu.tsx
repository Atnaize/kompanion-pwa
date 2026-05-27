import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Ban, BellOff, MoreHorizontal, Swords, UserMinus, Volume2 } from 'lucide-react';
import { ActionSheet, type ActionSheetItem, ConfirmModal } from '@components/ui';
import { privacyService } from '@api/services';
import { useToastStore } from '@store/toastStore';
import type { FriendshipState } from '@types';
import { useFriendshipActions } from '@features/friends';
import { usePrivacyActions } from '../hooks/usePrivacyActions';

interface UserActionsMenuProps {
  userId: number;
  userName: string;
  friendshipState: FriendshipState;
}

/**
 * "···" trigger on user profiles → bottom action sheet with privacy actions.
 *
 * Previously a dropdown anchored to the trigger. Re-platformed onto the shared
 * ActionSheet primitive (A/B review #3) — bigger tap targets, native-feeling
 * presentation, and consistent with the rest of the app's sheets (chat mute,
 * more-nav, etc.). Block still goes through a ConfirmModal because deleting
 * the friendship and pending invites is irreversible.
 *
 * Mute state is derived from the cached `privacy-muted` query so the row
 * label reflects current state without a per-mount network call.
 */
export const UserActionsMenu = ({ userId, userName, friendshipState }: UserActionsMenuProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { success, error } = useToastStore();
  const { block, mute, unmute } = usePrivacyActions();
  const { unfriend } = useFriendshipActions();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [confirmBlockOpen, setConfirmBlockOpen] = useState(false);
  const [confirmUnfriendOpen, setConfirmUnfriendOpen] = useState(false);

  const { data: mutedList = [] } = useQuery({
    queryKey: ['privacy-muted'],
    queryFn: async () => (await privacyService.listMuted()).data,
    staleTime: 60_000,
  });
  const isMuted = mutedList.some((u) => u.id === userId);

  // "View profile" is intentionally omitted — this menu only lives on
  // UserProfilePage, so the action would just reload the current page.
  const items: ActionSheetItem[] = [
    {
      id: 'challenge',
      label: t('privacy.menu.inviteToChallenge'),
      icon: <Swords size={16} strokeWidth={2} />,
    },
    isMuted
      ? {
          id: 'unmute',
          label: t('privacy.menu.unmute'),
          icon: <Volume2 size={16} strokeWidth={2} />,
          variant: 'warning',
          separator: true,
          disabled: unmute.isPending,
        }
      : {
          id: 'mute',
          label: t('privacy.menu.mute'),
          description: t('privacy.menu.muteHint'),
          icon: <BellOff size={16} strokeWidth={2} />,
          variant: 'warning',
          separator: true,
          disabled: mute.isPending,
        },
    ...(friendshipState === 'friends'
      ? [
          {
            id: 'unfriend',
            label: t('friends.action.unfriend'),
            icon: <UserMinus size={16} strokeWidth={2} />,
            variant: 'danger',
            disabled: unfriend.isPending,
          } satisfies ActionSheetItem,
        ]
      : []),
    {
      id: 'block',
      label: t('privacy.menu.block'),
      description: t('privacy.menu.blockHint'),
      icon: <Ban size={16} strokeWidth={2} />,
      variant: 'danger',
      disabled: block.isPending,
    },
  ];

  const handleSelect = async (id: string) => {
    if (id === 'challenge') {
      setSheetOpen(false);
      navigate(`/challenges/create?invite=${userId}`);
      return;
    }
    if (id === 'mute') {
      setSheetOpen(false);
      try {
        await mute.mutateAsync(userId);
        success(t('privacy.toast.muted', { name: userName }));
      } catch (err) {
        error(err instanceof Error ? err.message : t('privacy.toast.actionFailed'));
      }
      return;
    }
    if (id === 'unmute') {
      setSheetOpen(false);
      try {
        await unmute.mutateAsync(userId);
        success(t('privacy.toast.unmuted', { name: userName }));
      } catch (err) {
        error(err instanceof Error ? err.message : t('privacy.toast.actionFailed'));
      }
      return;
    }
    if (id === 'block') {
      setSheetOpen(false);
      setConfirmBlockOpen(true);
      return;
    }
    if (id === 'unfriend') {
      setSheetOpen(false);
      setConfirmUnfriendOpen(true);
      return;
    }
  };

  const handleBlockConfirm = async () => {
    try {
      await block.mutateAsync(userId);
      success(t('privacy.toast.blocked', { name: userName }));
      setConfirmBlockOpen(false);
      navigate('/');
    } catch (err) {
      error(err instanceof Error ? err.message : t('privacy.toast.actionFailed'));
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        aria-label={t('privacy.menu.open')}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/60 text-gray-700 backdrop-blur transition hover:bg-white/80 dark:border-gray-700/40 dark:bg-gray-900/60 dark:text-gray-200 dark:hover:bg-gray-900/80"
      >
        <MoreHorizontal size={18} strokeWidth={2} />
      </button>

      <ActionSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={userName}
        items={items}
        onSelect={handleSelect}
      />

      <ConfirmModal
        isOpen={confirmUnfriendOpen}
        onClose={() => setConfirmUnfriendOpen(false)}
        onConfirm={() => {
          setConfirmUnfriendOpen(false);
          unfriend.mutate(userId);
        }}
        title={t('friends.unfriendConfirm.title')}
        message={t('friends.unfriendConfirm.message')}
        confirmText={t('friends.unfriendConfirm.confirm')}
        cancelText={t('common.cancel')}
        confirmVariant="danger"
        isLoading={unfriend.isPending}
      />

      <ConfirmModal
        isOpen={confirmBlockOpen}
        onClose={() => setConfirmBlockOpen(false)}
        onConfirm={handleBlockConfirm}
        title={t('privacy.confirmBlock.title', { name: userName })}
        message={
          <ul className="list-disc space-y-1.5 pl-5 text-sm">
            <li>{t('privacy.confirmBlock.bullet1')}</li>
            <li>{t('privacy.confirmBlock.bullet2')}</li>
            <li>{t('privacy.confirmBlock.bullet3')}</li>
            <li>{t('privacy.confirmBlock.bullet4')}</li>
          </ul>
        }
        confirmText={t('privacy.confirmBlock.confirm')}
        cancelText={t('common.cancel')}
        confirmVariant="danger"
        isLoading={block.isPending}
      />
    </>
  );
};
