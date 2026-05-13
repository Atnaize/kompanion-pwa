import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle2,
  Flag,
  Target,
  Trash2,
  Trophy,
  UserCheck,
  UserPlus,
  Users,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import clsx from 'clsx';
import { Avatar } from '@components/ui';
import { formatRelativeTime } from '@utils/format';
import type { InboxNotification } from '@types';

interface InboxItemProps {
  notification: InboxNotification;
  onClick?: () => void;
  onDismiss?: () => void;
}

const SWIPE_DISMISS_THRESHOLD = 96; // px past which release dismisses
const SWIPE_ACTIVATION = 8; // px before we treat the gesture as a horizontal swipe

/**
 * Inbox row — one renderer per notification type via a single switch.
 * Adding a new type: add a `case` here (title + body + icon + link).
 *
 * Visual states:
 *   - unread: orange dot + slight orange tint
 *   - read: plain
 *
 * Touch/mouse swipe left to dismiss reveals a trash background; releasing past
 * the threshold calls `onDismiss`.
 */
export const InboxItem = ({ notification, onClick, onDismiss }: InboxItemProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isUnread = notification.readAt === null;
  const view = buildView(notification, t);

  const [swipeX, setSwipeX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const dragStartXRef = useRef<number | null>(null);
  const dragActiveRef = useRef(false);
  const swipedRef = useRef(false);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!onDismiss) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragStartXRef.current = e.clientX;
    dragActiveRef.current = false;
    swipedRef.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!onDismiss || dragStartXRef.current === null) return;
    const dx = e.clientX - dragStartXRef.current;
    if (!dragActiveRef.current) {
      if (Math.abs(dx) < SWIPE_ACTIVATION) return;
      dragActiveRef.current = true;
      setIsDragging(true);
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    const clamped = Math.min(0, dx);
    setSwipeX(clamped);
    if (clamped < -SWIPE_ACTIVATION) {
      swipedRef.current = true;
    }
  };

  const handlePointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!onDismiss) return;
    const wasDragging = dragActiveRef.current;
    dragStartXRef.current = null;
    dragActiveRef.current = false;
    setIsDragging(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    if (!wasDragging) return;
    if (swipeX < -SWIPE_DISMISS_THRESHOLD) {
      setIsDismissed(true);
      setSwipeX(-window.innerWidth);
      window.setTimeout(() => onDismiss(), 180);
    } else {
      setSwipeX(0);
    }
  };

  const handleClick = () => {
    // A completed horizontal swipe should not also navigate.
    if (swipedRef.current) {
      swipedRef.current = false;
      return;
    }
    onClick?.();
    if (view.href) {
      navigate(view.href);
    }
  };

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

  const foregroundClass = clsx(
    'block rounded-2xl border p-4',
    isDragging ? '' : 'transition-[transform,background-color,opacity] duration-200',
    isUnread
      ? 'border-strava-orange/30 bg-strava-orange/[0.04] hover:bg-strava-orange/[0.08] dark:bg-strava-orange/[0.06] dark:hover:bg-strava-orange/[0.1]'
      : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800'
  );

  // No-swipe back-compat: render the previous link/div shape.
  if (!onDismiss) {
    return (
      <div className={foregroundClass} onClick={handleClick} role="button" tabIndex={0}>
        {inner}
      </div>
    );
  }

  const swipeProgress = Math.min(1, Math.abs(swipeX) / SWIPE_DISMISS_THRESHOLD);

  return (
    <div
      className={clsx(
        'relative overflow-hidden rounded-2xl',
        isDismissed ? 'pointer-events-none' : ''
      )}
      style={{
        maxHeight: isDismissed ? 0 : undefined,
        marginBottom: isDismissed ? 0 : undefined,
        opacity: isDismissed ? 0 : 1,
        transition: isDismissed ? 'max-height 200ms ease, opacity 200ms ease' : undefined,
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-end rounded-2xl bg-red-500/90 pr-6 text-white"
        style={{ opacity: swipeProgress }}
      >
        <Trash2 size={20} strokeWidth={2} />
      </div>
      <div
        className={foregroundClass}
        style={{ transform: `translateX(${swipeX}px)`, touchAction: 'pan-y' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onClick={handleClick}
        role="button"
        tabIndex={0}
      >
        {inner}
      </div>
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
    case 'challenge_progress':
      return {
        title: meta.challengeName ?? t('inbox.types.challengeProgressFallback'),
        subtitle: meta.milestone,
        icon: Flag,
        iconClass: 'bg-strava-orange/10 text-strava-orange',
        href: n.entityId ? `/challenges/${n.entityId}` : '/challenges',
      };
    case 'challenge_activity_added':
      return {
        title: meta.challengeName ?? '',
        subtitle: t('inbox.types.challengeActivityAdded', {
          name: meta.participantName ?? '',
          count: Number(meta.activityCount ?? 0),
          distance: ((Number(meta.totalDistance ?? 0)) / 1000).toFixed(1),
        }),
        icon: Target,
        iconClass: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
        href: n.entityId ? `/challenges/${n.entityId}` : '/challenges',
      };
    case 'challenge_cancelled':
      return {
        title: t('inbox.types.challengeCancelled'),
        subtitle: meta.challengeName,
        icon: XCircle,
        iconClass: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
        href: n.entityId ? `/challenges/${n.entityId}` : '/challenges',
      };
    case 'challenge_completed': {
      const rawIsSuccess = (n.metadata as { isSuccess?: unknown } | null)?.isSuccess;
      const isSuccess = rawIsSuccess === true || rawIsSuccess === 'true';
      return {
        title: isSuccess
          ? t('inbox.types.challengeCompletedSuccess')
          : t('inbox.types.challengeCompletedEnded'),
        subtitle: meta.challengeName,
        icon: isSuccess ? CheckCircle2 : Flag,
        iconClass: isSuccess
          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
        href: n.entityId ? `/challenges/${n.entityId}` : '/challenges',
      };
    }
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
