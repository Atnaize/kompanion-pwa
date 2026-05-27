import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import clsx from 'clsx';
import { Layout } from '@components/layout';
import { BackButton, GlassCard } from '@components/ui';
import { useSettingsStore } from '@store/settingsStore';
import type { Locale } from '@store/settingsStore';

const LOCALES: Array<{ value: Locale; labelKey: string }> = [
  { value: 'en', labelKey: 'settings.language.en' },
  { value: 'fr', labelKey: 'settings.language.fr' },
];

export const SettingsLanguagePage = () => {
  const { t } = useTranslation();
  const locale = useSettingsStore((s) => s.locale);
  const setLocale = useSettingsStore((s) => s.setLocale);

  return (
    <Layout>
      <div className="space-y-4">
        <BackButton to="/settings" label={t('settings.title')} />

        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
            {t('settings.language.title')}
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('settings.language.description')}
          </p>
        </div>

        <GlassCard className="divide-y divide-gray-200/60 p-0 dark:divide-gray-800/60">
          {LOCALES.map(({ value, labelKey }) => {
            const isActive = locale === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setLocale(value)}
                className={clsx(
                  'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-100/40 dark:hover:bg-gray-800/40',
                  isActive && 'bg-strava-orange/5'
                )}
              >
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
