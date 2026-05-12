import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Target, Trophy, UserCheck, UserPlus, Users, type LucideIcon } from 'lucide-react';
import clsx from 'clsx';
import { Avatar } from '@components/ui';
import { formatRelativeTime } from '@utils/format';
import type { InboxNotification } from '@types';

interface InboxItemProps {
  notification: InboxNotification;
  onClick?: () => void;
}

/**
 * Inbox row — one renderer per notification type via a single switch.
 * Adding a new type: add a `case` here (title + body + icon + link).
 *
 * Visual states:
 *   - unread: orange dot + slight orange tint
 *   - read: plain
 */
export const InboxItem = ({ notification, onClick }: InboxItemProps) => {
  const { t } = useTranslation();
  const isUnread = notification.readAt === null;
  const view = buildView(notification, t);

  const inner = (
    <div className="flex items-start gap-3">
      {notification.actor ? (
        <Avatar
          src={notification.actor.profile}
          firstname={notification.actor.firstname}
          lastname={notification.actor.lastname}
          size="sm"
        />
      ) : (
        <span
          className={clsx(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
            view.iconClass
          )}
        >
          <view.icon size={18} strokeWidth={2} aria-hidden="true" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-snug text-gray-900 dark:text-gray-50">{view.title}</p>
        {view.subtitle && (
          <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
            {view.subtitle}
          </p>
        )}
        <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
          {formatRelativeTime(notification.createdAt)}
        </p>
      </div>
      {/* Per-type icon chip on the right when we showed the actor's avatar */}
      {notification.actor && (
        <span
          className={clsx(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
            view.iconClass
          )}
        >
          <view.icon size={14} strokeWidth={2.25} aria-hidden="true" />
        </span>
      )}
      {isUnread && (
        <span
          aria-label={t('inbox.unread')}
          className="ml-1 mt-1 h-2 w-2 shrink-0 rounded-full bg-strava-orange"
        />
      )}
    </div>
  );

  const wrapperClass = clsx(
    'block rounded-2xl border p-4 transition-colors',
    isUnread
      ? 'border-strava-orange/30 bg-strava-orange/[0.04] hover:bg-strava-orange/[0.08] dark:bg-strava-orange/[0.06] dark:hover:bg-strava-orange/[0.1]'
      : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800'
  );

  if (view.href) {
    return (
      <Link to={view.href} onClick={onClick} className={wrapperClass}>
        {inner}
      </Link>
    );
  }
  return (
    <div className={wrapperClass} onClick={onClick}>
      {inner}
    </div>
  );
};

interface View {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  iconClass: string;
  href?: string;
}

function buildView(
  n: InboxNotification,
  t: (key: string, opts?: Record<string, unknown>) => string
): View {
  const meta = (n.metadata ?? {}) as Record<string, string>;

  switch (n.type) {
    case 'friend_request':
      return {
        title: t('inbox.types.friendRequest', { name: meta.actorName ?? '' }),
        icon: UserPlus,
        iconClass: 'bg-strava-orange/10 text-strava-orange',
        href: '/friends',
      };
    case 'friend_accepted':
      return {
        title: t('inbox.types.friendAccepted', { name: meta.actorName ?? '' }),
        icon: UserCheck,
        iconClass: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
        href: n.actorId ? `/users/${n.actorId}` : '/friends',
      };
    case 'achievement_unlocked':
      return {
        title: t('inbox.types.achievementUnlocked'),
        subtitle: meta.achievementName,
        icon: Trophy,
        iconClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
        href: '/achievements',
      };
    case 'challenge_invite':
      return {
        title: t('inbox.types.challengeInvite', { name: meta.creatorName ?? '' }),
        subtitle: meta.challengeName,
        icon: Target,
        iconClass: 'bg-strava-orange/10 text-strava-orange',
        href: n.entityId ? `/challenges/${n.entityId}` : '/challenges',
      };
    case 'challenge_joined':
      return {
        title: t('inbox.types.challengeJoined', { name: meta.joinerName ?? '' }),
        subtitle: meta.challengeName,
        icon: Users,
        iconClass: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
        href: n.entityId ? `/challenges/${n.entityId}` : '/challenges',
      };
    default:
      // Unknown type — show a generic row so the inbox never blows up if the
      // backend ships a new notification type before the frontend knows it.
      return {
        title: t('inbox.types.generic'),
        icon: Users,
        iconClass: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
      };
  }
}
