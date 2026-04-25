import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sun, Moon } from 'lucide-react';
import { useAuthStore } from '@store/authStore';
import { useSettingsStore, type Theme } from '@store/settingsStore';
import { Avatar } from '@components/ui';
import clsx from 'clsx';

const THEME_OPTIONS: ReadonlyArray<{ value: Theme; icon: typeof Sun; labelKey: string }> = [
  { value: 'light', icon: Sun, labelKey: 'profileMenu.theme.light' },
  { value: 'dark', icon: Moon, labelKey: 'profileMenu.theme.dark' },
];

export const ProfileMenu = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const theme = useSettingsStore((state) => state.theme);
  const setTheme = useSettingsStore((state) => state.setTheme);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    navigate('/');
  };

  if (!user) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 transition-opacity hover:opacity-80"
      >
        <Avatar src={user.profile} firstname={user.firstname} lastname={user.lastname} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-2xl border border-white/20 bg-white/95 shadow-xl backdrop-blur-lg dark:border-gray-800/60 dark:bg-gray-900/95">
          {/* User Info */}
          <div className="border-b border-gray-200 p-4 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <Avatar
                src={user.profile}
                firstname={user.firstname}
                lastname={user.lastname}
                size="md"
              />
              <div className="flex-1">
                <p className="font-bold text-gray-900 dark:text-gray-50">
                  {user.firstname} {user.lastname || ''}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {t('profileMenu.stravaId', { id: user.stravaId })}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <Link
              to="/profile"
              onClick={() => setIsOpen(false)}
              className={clsx(
                'flex items-center gap-3 px-4 py-3 text-sm transition-colors',
                'hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
            >
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {t('profileMenu.profile')}
              </span>
            </Link>
            <Link
              to="/settings"
              onClick={() => setIsOpen(false)}
              className={clsx(
                'flex items-center gap-3 px-4 py-3 text-sm transition-colors',
                'hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
            >
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {t('profileMenu.settings')}
              </span>
            </Link>

            {/* Theme switcher */}
            <div className="px-4 py-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {t('profileMenu.theme.label')}
                </span>
              </div>
              <div
                role="radiogroup"
                aria-label={t('profileMenu.theme.label')}
                className="flex items-center gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800"
              >
                {THEME_OPTIONS.map(({ value, icon: Icon, labelKey }) => {
                  const isActive = theme === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={isActive}
                      aria-label={t(labelKey)}
                      title={t(labelKey)}
                      onClick={() => setTheme(value)}
                      className={clsx(
                        'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-all',
                        isActive
                          ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-50'
                          : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                      )}
                    >
                      <Icon size={14} strokeWidth={2} />
                      <span>{t(labelKey)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Admin Menu - Only visible to admin users */}
            {user.isAdmin && (
              <>
                <div className="my-2 border-t border-violet-200/50 dark:border-violet-900/40"></div>
                <Link
                  to="/admin"
                  onClick={() => setIsOpen(false)}
                  className={clsx(
                    'group relative flex items-center gap-3 px-4 py-3 text-sm transition-all duration-200',
                    'overflow-hidden rounded-lg',
                    'hover:bg-gradient-to-r hover:from-violet-500/10 hover:via-purple-500/10 hover:to-fuchsia-500/10',
                    'hover:shadow-sm'
                  )}
                >
                  <span className="relative z-10 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text font-semibold text-transparent dark:from-violet-400 dark:via-purple-400 dark:to-fuchsia-400">
                    {t('profileMenu.adminPanel')}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-purple-500/5 to-fuchsia-500/5 opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              </>
            )}

            <div className="my-2 border-t border-gray-200 dark:border-gray-800"></div>
            <button
              onClick={handleLogout}
              className={clsx(
                'flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors',
                'hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
            >
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {t('profileMenu.logout')}
              </span>
            </button>

            {/* Separator */}
            <div className="my-2 border-t border-gray-200 dark:border-gray-800"></div>

            <Link
              to="/about"
              onClick={() => setIsOpen(false)}
              className={clsx(
                'flex items-center gap-3 px-4 py-3 text-sm transition-colors',
                'hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
            >
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {t('profileMenu.aboutKompanion')}
              </span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
