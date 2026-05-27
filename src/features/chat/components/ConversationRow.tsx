import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { BellOff, Shield, Trophy, Users } from 'lucide-react';
import { Avatar } from '@components/ui';
import { useAuthStore } from '@store/authStore';
import type { ConversationListItem } from '@types';

interface Props {
  item: ConversationListItem;
  onClick: () => void;
}

/**
 * One row in the Messages inbox. Avatar adapts to kind: 1:1 DMs show the other
 * person's photo; groups/clubs/challenges show a representative icon. The
 * preview line prefixes the sender ("You: …" for the viewer) and the trailing
 * column carries the timestamp + unread bubble.
 */
export const ConversationRow = ({ item, onClick }: Props) => {
  const { t } = useTranslation();
  const viewerId = useAuthStore((s) => s.user?.userId);

  const last = item.lastMessage;
  const senderPrefix = last?.authorId
    ? last.authorId === viewerId
      ? `${t('messages.you', { defaultValue: 'You' })}: `
      : item.kind !== 'dm' || item.members.length > 1
        ? `${last.authorName ?? ''}: `
        : ''
    : '';
  const preview = last
    ? `${senderPrefix}${last.preview}`
    : t('messages.noMessagesYet', { defaultValue: 'No messages yet' });

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors hover:bg-gray-50 active:bg-gray-100 dark:hover:bg-gray-800/60 dark:active:bg-gray-800"
    >
      <RowAvatar item={item} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={clsx(
              'min-w-0 flex-1 truncate text-[15px]',
              item.unreadCount > 0
                ? 'font-semibold text-gray-900 dark:text-gray-50'
                : 'font-medium text-gray-800 dark:text-gray-100'
            )}
          >
            {item.title}
          </span>
          {last && (
            <span className="shrink-0 text-[11px] text-gray-400 dark:text-gray-500">
              {formatInboxTime(last.createdAt)}
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-2">
          <span
            className={clsx(
              'min-w-0 flex-1 truncate text-[13px]',
              item.unreadCount > 0
                ? 'text-gray-700 dark:text-gray-200'
                : 'text-gray-500 dark:text-gray-400'
            )}
          >
            {preview}
          </span>
          {item.muted && (
            <BellOff
              size={13}
              strokeWidth={2}
              className="shrink-0 text-gray-400 dark:text-gray-500"
            />
          )}
          {item.unreadCount > 0 && (
            <span className="flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-strava-orange px-1 text-[10px] font-bold leading-none text-white">
              {item.unreadCount > 99 ? '99+' : item.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

const RowAvatar = ({ item }: { item: ConversationListItem }) => {
  if (item.kind === 'dm' && item.image) {
    const other = item.members[0];
    return (
      <Avatar
        src={item.image}
        firstname={other?.firstname}
        lastname={other?.lastname}
        size="md"
        className="!h-11 !w-11"
      />
    );
  }

  const Icon = item.kind === 'club' ? Shield : item.kind === 'challenge' ? Trophy : Users;
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-strava-orange/10 text-strava-orange">
      <Icon size={20} strokeWidth={2} aria-hidden="true" />
    </span>
  );
};

/** Compact inbox timestamp: time today, weekday this week, else short date. */
function formatInboxTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (diffDays < 7) {
    return d.toLocaleDateString(undefined, { weekday: 'short' });
  }
  return d.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' });
}
