import { Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  requiresData?: boolean;
}

const navItems: NavItem[] = [
  { path: '/dashboard', label: 'Home', icon: '🏠' },
  { path: '/quests', label: 'Quests', icon: '🎯', requiresData: true },
  { path: '/achievements', label: 'Badges', icon: '🏆', requiresData: true },
  { path: '/stats', label: 'Stats', icon: '📊', requiresData: true },
];

interface BottomNavProps {
  hideDataTabs?: boolean;
}

export const BottomNav = ({ hideDataTabs = false }: BottomNavProps) => {
  const location = useLocation();

  const visibleItems = hideDataTabs ? navItems.filter((item) => !item.requiresData) : navItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40">
      <div className="border-t border-white/20 bg-white/80 shadow-lg backdrop-blur-lg">
        <div className="mx-auto max-w-lg px-4">
          <div className="flex items-center justify-around">
            {visibleItems.map((item) => {
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={clsx(
                    'relative flex flex-col items-center px-2 py-3 transition-all duration-200',
                    'min-w-[60px] rounded-t-xl',
                    isActive
                      ? 'scale-105 bg-strava-orange/10 text-strava-orange'
                      : 'text-gray-600 hover:bg-gray-100/50 hover:text-gray-900 active:scale-95'
                  )}
                >
                  <span className="mb-1 text-2xl">{item.icon}</span>
                  <span className="text-xs font-medium">{item.label}</span>
                  {isActive && (
                    <div className="absolute bottom-0 left-1/2 h-1 w-12 -translate-x-1/2 rounded-t-full bg-strava-orange" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};
