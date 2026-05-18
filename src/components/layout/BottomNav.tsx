import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { Activity, Home, MoreHorizontal, Target, type LucideIcon } from 'lucide-react';
import { useAuthStore } from '@store/authStore';

interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  requiresData?: boolean;
  requiresAdmin?: boolean;
}

interface TabBadge {
  count: number;
  color?: string;
}

interface TabBadges {
  [path: string]: TabBadge;
}

const navItems: NavItem[] = [
  { path: '/dashboard', label: 'nav.home', icon: Home },
  { path: '/activities', label: 'nav.activities', icon: Activity, requiresData: true },
  { path: '/challenges', label: 'nav.challenges', icon: Target, requiresData: true },
];

interface BottomNavProps {
  hideDataTabs?: boolean;
  badges?: TabBadges;
  onOpenMore?: () => void;
}

export const BottomNav = ({ hideDataTabs = false, badges = {}, onOpenMore }: BottomNavProps) => {
  const location = useLocation();
  const { user } = useAuthStore();
  const { t } = useTranslation();

  const visibleItems = navItems.filter((item) => {
    if (hideDataTabs && item.requiresData) {
      return false;
    }
    if (item.requiresAdmin && !user?.isAdmin) {
      return false;
    }
    return true;
  });

  const showMoreButton = !hideDataTabs;

  const visiblePaths = new Set(visibleItems.map((item) => item.path));
  const moreBadgeCount = Object.entries(badges).reduce((sum, [path, badge]) => {
    return visiblePaths.has(path) ? sum : sum + badge.count;
  }, 0);
  const showMoreBadge = showMoreButton && moreBadgeCount > 0;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="border-t border-white/20 bg-white/80 shadow-lg backdrop-blur-lg dark:border-gray-700/40 dark:bg-gray-900/85">
        <div className="mx-auto max-w-lg px-2">
          <div className="flex items-stretch justify-around">
            {visibleItems.map((item) => {
              const isActive = location.pathname === item.path;
              const badge = badges[item.path];
              const showBadge = badge && badge.count > 0;
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  aria-label={t(item.label)}
                  aria-current={isActive ? 'page' : undefined}
                  className={clsx(
                    'relative flex flex-1 flex-col items-center justify-center gap-1 px-1 py-2.5',
                    'min-w-[56px] rounded-t-xl transition-colors duration-200',
                    isActive
                      ? 'text-strava-orange'
                      : 'text-gray-500 hover:text-gray-900 active:bg-gray-100/60 dark:text-gray-400 dark:hover:text-gray-100 dark:active:bg-gray-800/60'
                  )}
                >
                  <span className="relative flex h-6 w-6 items-center justify-center">
                    <Icon
                      size={22}
                      strokeWidth={isActive ? 2.25 : 1.75}
                      className="transition-transform duration-200"
                      aria-hidden="true"
                    />
                    {showBadge && (
                      <span
                        className={clsx(
                          'absolute -right-2 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none text-white shadow-sm ring-2 ring-white dark:ring-gray-900',
                          badge.color || 'bg-strava-orange'
                        )}
                      >
                        {badge.count > 99 ? '99+' : badge.count}
                      </span>
                    )}
                  </span>
                  <span
                    className={clsx(
                      'text-[10px] leading-none tracking-tight transition-all',
                      isActive ? 'font-semibold' : 'font-medium'
                    )}
                  >
                    {t(item.label)}
                  </span>
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 h-[3px] w-8 -translate-x-1/2 rounded-t-full bg-strava-orange" />
                  )}
                </Link>
              );
            })}

            {showMoreButton && (
              <button
                type="button"
                onClick={onOpenMore}
                aria-label={t('nav.more')}
                aria-haspopup="dialog"
                className={clsx(
                  'relative flex flex-1 flex-col items-center justify-center gap-1 px-1 py-2.5',
                  'min-w-[56px] rounded-t-xl transition-colors duration-200',
                  'text-gray-500 hover:text-gray-900 active:bg-gray-100/60 dark:text-gray-400 dark:hover:text-gray-100 dark:active:bg-gray-800/60'
                )}
              >
                <span className="relative flex h-6 w-6 items-center justify-center">
                  <MoreHorizontal size={22} strokeWidth={1.75} aria-hidden="true" />
                  {showMoreBadge && (
                    <span className="absolute -right-2 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-strava-orange px-1 text-[10px] font-bold leading-none text-white shadow-sm ring-2 ring-white dark:ring-gray-900">
                      {moreBadgeCount > 99 ? '99+' : moreBadgeCount}
                    </span>
                  )}
                </span>
                <span className="text-[10px] font-medium leading-none tracking-tight">
                  {t('nav.more')}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
