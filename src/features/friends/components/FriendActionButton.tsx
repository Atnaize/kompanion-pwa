import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, UserPlus, X, type LucideIcon } from 'lucide-react';
import clsx from 'clsx';
import { Button, ConfirmModal } from '@components/ui';
import type { FriendshipState } from '@types';
import { useFriendshipActions } from '../hooks/useFriendshipActions';

interface FriendActionButtonProps {
  userId: number;
  state: FriendshipState;
  /** Compact (icon-only square buttons) when used in narrow rows. */
  compact?: boolean;
  /** Allow unfriending when state is 'friends'. Off by default to keep search rows safe. */
  allowUnfriend?: boolean;
}

type IconButtonVariant = 'primary' | 'secondary' | 'danger';

interface IconButtonProps {
  icon: LucideIcon;
  label: string;
  variant: IconButtonVariant;
  disabled?: boolean;
  onClick: () => void;
}

/**
 * Small 40×40 icon-only button used in compact rows. Keeps the row to a single
 * line while still hitting a comfortable touch target.
 */
const IconButton = ({ icon: Icon, label, variant, disabled, onClick }: IconButtonProps) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    onClick={onClick}
    disabled={disabled}
    className={clsx(
      'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all',
      'active:scale-95 disabled:cursor-not-allowed disabled:opacity-50',
      {
        'bg-strava-orange text-white shadow-md hover:bg-strava-orange-dark': variant === 'primary',
        'bg-white/90 text-gray-700 shadow-sm ring-1 ring-gray-900/5 hover:bg-white dark:bg-gray-800/90 dark:text-gray-200 dark:ring-gray-100/10 dark:hover:bg-gray-800':
          variant === 'secondary',
        'bg-red-50 text-red-600 ring-1 ring-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 dark:ring-red-900/40':
          variant === 'danger',
      }
    )}
  >
    <Icon size={18} strokeWidth={2.25} aria-hidden="true" />
  </button>
);

/**
 * State-driven action button. Adding a new branch (e.g. block) = new case here.
 * Every consumer (search rows, profile page, friends list) uses this same
 * component so behaviour stays consistent.
 *
 * In compact mode (used in narrow list rows) all actions render as icon-only
 * 40×40 buttons so the whole row stays on a single line. The full-size variant
 * uses labelled Buttons and is reserved for surfaces with more room (profile).
 */
export const FriendActionButton = ({
  userId,
  state,
  compact = false,
  allowUnfriend = false,
}: FriendActionButtonProps) => {
  const { t } = useTranslation();
  const { sendRequest, acceptRequest, cancelOrDeclineRequest, unfriend } = useFriendshipActions();
  const [unfriendConfirmOpen, setUnfriendConfirmOpen] = useState(false);

  const isPending =
    sendRequest.isPending ||
    acceptRequest.isPending ||
    cancelOrDeclineRequest.isPending ||
    unfriend.isPending;

  const confirmModal = (
    <ConfirmModal
      isOpen={unfriendConfirmOpen}
      onClose={() => setUnfriendConfirmOpen(false)}
      onConfirm={() => {
        setUnfriendConfirmOpen(false);
        unfriend.mutate(userId);
      }}
      title={t('friends.unfriendConfirm.title')}
      message={t('friends.unfriendConfirm.message')}
      confirmText={t('friends.unfriendConfirm.confirm')}
      cancelText={t('common.cancel')}
      confirmVariant="danger"
      isLoading={unfriend.isPending}
    />
  );

  const requestUnfriend = () => setUnfriendConfirmOpen(true);

  switch (state) {
    case 'self':
      return null;

    case 'friends': {
      if (!allowUnfriend) {
        return (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
            <Check size={14} strokeWidth={2.5} />
            {t('friends.action.friends')}
          </span>
        );
      }
      // Unfriend is an occasional, destructive action — render as a small,
      // outlined button. Still visually a button, just not a call-to-action.
      return (
        <>
          <button
            type="button"
            onClick={requestUnfriend}
            disabled={isPending}
            className="rounded-lg border border-gray-200 bg-white/70 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-gray-300 hover:bg-white hover:text-gray-900 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:bg-gray-900 dark:hover:text-gray-100"
          >
            {t('friends.action.unfriend')}
          </button>
          {confirmModal}
        </>
      );
    }

    case 'pending_outgoing': {
      if (compact) {
        return (
          <IconButton
            icon={X}
            label={t('friends.action.cancelRequest')}
            variant="secondary"
            disabled={isPending}
            onClick={() => cancelOrDeclineRequest.mutate(userId)}
          />
        );
      }
      return (
        <Button
          variant="secondary"
          size="md"
          disabled={isPending}
          onClick={() => cancelOrDeclineRequest.mutate(userId)}
        >
          {t('friends.action.cancelRequest')}
        </Button>
      );
    }

    case 'pending_incoming': {
      if (compact) {
        return (
          <div className="flex items-center gap-1.5">
            <IconButton
              icon={Check}
              label={t('friends.action.accept')}
              variant="primary"
              disabled={isPending}
              onClick={() => acceptRequest.mutate(userId)}
            />
            <IconButton
              icon={X}
              label={t('friends.action.decline')}
              variant="secondary"
              disabled={isPending}
              onClick={() => cancelOrDeclineRequest.mutate(userId)}
            />
          </div>
        );
      }
      return (
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="md"
            disabled={isPending}
            onClick={() => acceptRequest.mutate(userId)}
          >
            <Check size={14} strokeWidth={2.5} className="mr-1.5" />
            {t('friends.action.accept')}
          </Button>
          <Button
            variant="secondary"
            size="md"
            disabled={isPending}
            onClick={() => cancelOrDeclineRequest.mutate(userId)}
          >
            <X size={14} strokeWidth={2.5} className="mr-1.5" />
            {t('friends.action.decline')}
          </Button>
        </div>
      );
    }

    case 'none': {
      if (compact) {
        return (
          <IconButton
            icon={UserPlus}
            label={t('friends.action.addFriend')}
            variant="primary"
            disabled={isPending}
            onClick={() => sendRequest.mutate(userId)}
          />
        );
      }
      return (
        <Button
          variant="primary"
          size="md"
          disabled={isPending}
          onClick={() => sendRequest.mutate(userId)}
        >
          <UserPlus size={14} strokeWidth={2} className="mr-1.5" />
          {t('friends.action.addFriend')}
        </Button>
      );
    }
  }
};
