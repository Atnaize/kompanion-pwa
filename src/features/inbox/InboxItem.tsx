import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Check,
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
  /** Left-swipe action: destructive, removes the row. */
  onDismiss?: () => void;
  /** Right-swipe action: non-destructive, marks the row read. Pass only when
   *  the row is actually unread — for read rows we suppress the affordance. */
  onMarkRead?: () => void;
}

const SWIPE_THRESHOLD = 96; // px past which release commits the action
const SWIPE_ACTIVATION = 8; // px before we treat the gesture as a horizontal swipe
const SNAP_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'; // ease-out-quint — smooth snap

/**
 * Inbox row — one renderer per notification type via a single switch.
 * Adding a new type: add a `case` here (title + body + icon + link).
 *
 * Swipe gestures (iOS-mail pattern):
 *   - Swipe right → mark read (green background, check icon). Only available
 *     when the row is unread; on read rows the right swipe is suppressed.
 *   - Swipe left  → delete (red background, trash icon). Always available
 *     when `onDismiss` is provided.
 *   - Below threshold: snaps back without committing.
 */
export const InboxItem = ({ notification, onClick, onDismiss, onMarkRead }: InboxItemProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isUnread = notification.readAt === null;
  const view = buildView(notification, t);

  const canMarkRead = !!onMarkRead && isUnread;
  const canDismiss = !!onDismiss;
  const swipeEnabled = canMarkRead || canDismiss;

  const [swipeX, setSwipeX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isRemoved, setIsRemoved] = useState(false);
  const dragStartXRef = useRef<number | null>(null);
  const dragActiveRef = useRef(false);
  const swipedRef = useRef(false);

  const swipingRight = swipeX > 0;
  // Clamp the visible offset so the user can't drag right when mark-read isn't
  // available — the row snaps back rather than misleading them.
  const visibleSwipeX = swipingRight && !canMarkRead ? Math.min(swipeX, SWIPE_ACTIVATION) : swipeX;
  const directionActive = swipingRight ? canMarkRead : canDismiss;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!swipeEnabled) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragStartXRef.current = e.clientX;
    dragActiveRef.current = false;
    swipedRef.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!swipeEnabled || dragStartXRef.current === null) return;
    const dx = e.clientX - dragStartXRef.current;
    if (!dragActiveRef.current) {
      if (Math.abs(dx) < SWIPE_ACTIVATION) return;
      dragActiveRef.current = true;
      setIsDragging(true);
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    setSwipeX(dx);
    if (Math.abs(dx) > SWIPE_ACTIVATION) {
      swipedRef.current = true;
    }
  };

  const handlePointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!swipeEnabled) return;
    const wasDragging = dragActiveRef.current;
    const finalDx = swipeX;
    dragStartXRef.current = null;
    dragActiveRef.current = false;
    setIsDragging(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    if (!wasDragging) return;

    const committedRight = finalDx > SWIPE_THRESHOLD && canMarkRead;
    const committedLeft = finalDx < -SWIPE_THRESHOLD && canDismiss;

    if (committedLeft) {
      setIsRemoved(true);
      setSwipeX(-window.innerWidth);
      window.setTimeout(() => onDismiss?.(), 220);
      return;
    }

    if (committedRight) {
      // Mark-read is non-destructive — the row stays. Snap back and fire the
      // callback; the parent's optimistic update will repaint the row as read.
      setSwipeX(0);
      onMarkRead?.();
      return;
    }

    setSwipeX(0);
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

  const foregroundBaseClass = clsx(
    'block rounded-2xl border p-4',
    isUnread
      ? 'border-strava-orange/30 bg-strava-orange/[0.04] hover:bg-strava-orange/[0.08] dark:bg-strava-orange/[0.06] dark:hover:bg-strava-orange/[0.1]'
      : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800'
  );

  // No-swipe fallback (back-compat: parent provided neither callback).
  if (!swipeEnabled) {
    return (
      <div className={foregroundBaseClass} onClick={handleClick} role="button" tabIndex={0}>
        {inner}
      </div>
    );
  }

  const swipeProgress = Math.min(1, Math.abs(visibleSwipeX) / SWIPE_THRESHOLD);
  const crossedThreshold = Math.abs(visibleSwipeX) > SWIPE_THRESHOLD && directionActive;
  const iconScale = 0.7 + 0.3 * swipeProgress + (crossedThreshold ? 0.15 : 0);

  // Action affordance: green/check on the leading edge (right swipe = mark
  // read), red/trash on the trailing edge (left swipe = delete).
  const ActionIcon = swipingRight ? Check : Trash2;
  const actionBgIdle = swipingRight ? 'bg-emerald-500/90' : 'bg-red-500/90';
  const actionBgActive = swipingRight ? 'bg-emerald-600' : 'bg-red-600';

  return (
    <div
      className={clsx(
        'relative overflow-hidden rounded-2xl',
        isRemoved ? 'pointer-events-none' : ''
      )}
      style={{
        maxHeight: isRemoved ? 0 : undefined,
        marginBottom: isRemoved ? 0 : undefined,
        opacity: isRemoved ? 0 : 1,
        transition: isRemoved
          ? `max-height 220ms ${SNAP_EASE} 80ms, opacity 220ms ${SNAP_EASE} 80ms`
          : undefined,
      }}
    >
      <div
        aria-hidden="true"
        className={clsx(
          'pointer-events-none absolute inset-0 flex items-center rounded-2xl text-white transition-colors duration-150',
          swipingRight ? 'justify-start pl-6' : 'justify-end pr-6',
          crossedThreshold ? actionBgActive : actionBgIdle
        )}
        style={{ opacity: directionActive ? swipeProgress : 0 }}
      >
        <ActionIcon
          size={20}
          strokeWidth={2.25}
          style={{
            transform: `scale(${iconScale})`,
            transition: isDragging ? `transform 120ms ${SNAP_EASE}` : undefined,
          }}
        />
      </div>
      <div
        className={foregroundBaseClass}
        style={{
          transform: `translateX(${visibleSwipeX}px)`,
          touchAction: 'pan-y',
          transition: isDragging ? undefined : `transform 260ms ${SNAP_EASE}`,
          willChange: 'transform',
        }}
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
          distance: (Number(meta.totalDistance ?? 0) / 1000).toFixed(1),
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
