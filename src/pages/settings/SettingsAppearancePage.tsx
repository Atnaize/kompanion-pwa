import { useTranslation } from 'react-i18next';
import { Check, Moon, Sun } from 'lucide-react';
import clsx from 'clsx';
import { Layout } from '@components/layout';
import { BackButton, GlassCard } from '@components/ui';
import { useSettingsStore, type Theme } from '@store/settingsStore';

const THEMES: Array<{ value: Theme; icon: typeof Sun; labelKey: string }> = [
  { value: 'light', icon: Sun, labelKey: 'profileMenu.theme.light' },
  { value: 'dark', icon: Moon, labelKey: 'profileMenu.theme.dark' },
];

/**
 * Appearance settings — theme only. Haptic feedback lives on its own
 * `/settings/feedback` page so each row in the hub maps 1:1 to a focused
 * destination (no "tapped Haptic, found Theme" confusion).
 */
export const SettingsAppearancePage = () => {
  const { t } = useTranslation();
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);

  return (
    <Layout>
      <div className="space-y-6">
        <BackButton to="/settings" label={t('settings.title')} />

        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
            {t('settings.appearance.title')}
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('settings.appearance.description')}
          </p>
        </div>

        <GlassCard className="divide-y divide-gray-200/60 p-0 dark:divide-gray-800/60">
          {THEMES.map(({ value, icon: Icon, labelKey }) => {
            const isActive = theme === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setTheme(value)}
                className={clsx(
                  'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-100/40 dark:hover:bg-gray-800/40',
                  isActive && 'bg-strava-orange/5'
                )}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-strava-orange/15 text-strava-orange">
                  <Icon size={16} strokeWidth={2} />
                </span>
                <span className="flex-1 text-sm text-gray-900 dark:text-gray-100">
                  {t(labelKey)}
                </span>
                {isActive && <Check size={16} strokeWidth={2.5} className="text-strava-orange" />}
              </button>
            );
          })}
        </GlassCard>
      </div>
    </Layout>
  );
};
