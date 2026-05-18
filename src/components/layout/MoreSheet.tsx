import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import {
  BarChart3,
  Bell,
  ChevronRight,
  Medal,
  Rss,
  Timer,
  Trophy,
  Users,
  type LucideIcon,
} from 'lucide-react';
import clsx from 'clsx';
import { friendsService } from '@api/services';

/**
 * List animation: the <ul> orchestrates a small stagger so each row
 * cascades in just after the sheet's spring settles. Snappier and more
 * intentional than everything appearing at once.
 */
const listVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { delayChildren: 0.08, staggerChildren: 0.035 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', damping: 24, stiffness: 360 },
  },
};

interface TabBadge {
  count: number;
  color?: string;
}

interface TabBadges {
  [path: string]: TabBadge;
}

interface MoreSheetProps {
  open: boolean;
  onClose: () => void;
  badges?: TabBadges;
}

interface SheetItem {
  to: string;
  labelKey: string;
  icon: LucideIcon;
  beta?: boolean;
  /**
   * Hide this tile when the viewer has no accepted friends. Set on tiles that
   * are inherently empty without a friend graph (Feed, Leaderboards). The
   * `/friends` tile itself stays visible so users can add their first friend.
   */
  requiresFriends?: boolean;
}

// Grouped: own progress → social hub → friend-dependent social → alerts.
const items: SheetItem[] = [
  { to: '/stats', labelKey: 'more.stats', icon: BarChart3 },
  { to: '/personal-records', labelKey: 'nav.personalRecords', icon: Timer },
  { to: '/achievements', labelKey: 'nav.badges', icon: Trophy },
  { to: '/friends', labelKey: 'more.friends', icon: Users, beta: true },
  {
    to: '/leaderboards',
    labelKey: 'more.leaderboards',
    icon: Medal,
    beta: true,
    requiresFriends: true,
  },
  { to: '/feed', labelKey: 'more.feed', icon: Rss, beta: true, requiresFriends: true },
  { to: '/notifications', labelKey: 'more.notifications', icon: Bell, beta: true },
];

export const MoreSheet = ({ open, onClose, badges = {} }: MoreSheetProps) => {
  const { t } = useTranslation();
  const sheetRef = useRef<HTMLDivElement>(null);

  // Drives which tiles are hidden until the viewer has friends. Same query key
  // as the Friends page, so it dedupes on cache rather than refetching.
  const { data: friends } = useQuery({
    queryKey: ['friends'],
    queryFn: async () => {
      const response = await friendsService.list();
      return response.data ?? [];
    },
    staleTime: 60_000,
  });
  const hasFriends = (friends?.length ?? 0) > 0;

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          />
          <motion.div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label={t('nav.more')}
            className="pointer-events-none fixed inset-x-0 bottom-0 z-50"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 5rem)' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          >
            <div className="pointer-events-auto mx-auto max-w-lg px-3">
              <div className="overflow-hidden rounded-3xl border border-white/20 bg-white/95 shadow-2xl backdrop-blur-lg dark:border-gray-700/40 dark:bg-gray-900/95">
                <div className="flex justify-center py-3">
                  <span className="h-1.5 w-10 rounded-full bg-gray-300 dark:bg-gray-700" />
                </div>

                <motion.ul
                  className="px-2 pb-3"
                  variants={listVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {items.map((item) => {
                    const Icon = item.icon;
                    // Friend-dependent rows stay visible but greyed-out when
                    // the viewer has no friends — tapping reroutes to /friends
                    // so they have a clear next step.
                    const locked = !!item.requiresFriends && !hasFriends;
                    const destination = locked ? '/friends' : item.to;
                    const badge = locked ? undefined : badges[item.to];
                    const showBadge = !!badge && badge.count > 0;

                    return (
                      <motion.li key={item.to} variants={itemVariants}>
                        <Link
                          to={destination}
                          onClick={onClose}
                          aria-disabled={locked || undefined}
                          className={clsx(
                            'group flex items-center gap-4 rounded-2xl px-3 py-3 transition-colors hover:bg-gray-50 active:bg-gray-100 dark:hover:bg-gray-800/60 dark:active:bg-gray-800',
                            locked && 'opacity-60'
                          )}
                        >
                          <span
                            className={clsx(
                              'flex h-10 w-10 items-center justify-center rounded-xl',
                              locked
                                ? 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                                : 'bg-strava-orange/10 text-strava-orange'
                            )}
                          >
                            <Icon size={20} strokeWidth={2} aria-hidden="true" />
                          </span>
                          <span className="flex flex-1 flex-col gap-0.5">
                            <span className="flex items-center gap-2">
                              <span className="text-[15px] font-medium text-gray-900 dark:text-gray-100">
                                {t(item.labelKey)}
                              </span>
                              {item.beta && (
                                <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                                  {t('more.beta')}
                                </span>
                              )}
                            </span>
                            {locked && (
                              <span className="text-[11px] text-gray-500 dark:text-gray-400">
                                {t('more.requiresFriends')}
                              </span>
                            )}
                          </span>
                          {showBadge && (
                            <span
                              className={clsx(
                                'flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-bold leading-none text-white',
                                badge?.color || 'bg-strava-orange'
                              )}
                            >
                              {badge!.count > 99 ? '99+' : badge!.count}
                            </span>
                          )}
                          <ChevronRight
                            size={18}
                            className="text-gray-300 transition-transform group-hover:translate-x-0.5 dark:text-gray-600"
                            aria-hidden="true"
                          />
                        </Link>
                      </motion.li>
                    );
                  })}
                </motion.ul>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
