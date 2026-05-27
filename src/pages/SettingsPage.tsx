import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Ban, Bell, BellOff, Globe, Moon, Sun, Zap } from 'lucide-react';
import { Layout } from '@components/layout';
import { useSettingsStore } from '@store/settingsStore';
import { usePushNotifications } from '@hooks/usePushNotifications';
import { privacyService } from '@api/services';
import { SettingsRow } from './settings/SettingsRow';

/**
 * Settings hub — navigation list of category rows. Replaces the previous
 * long-scroll layout (A/B review #4): each row drills into a focused
 * sub-page so scrolling stays minimal as we add categories.
 *
 * Subtitles show current state at a glance — e.g. "English", "Enabled · 4
 * categories on", "2 muted · 1 blocked" — so users don't need to dig into a
 * sub-page just to remember what they configured.
 */
export const SettingsPage = () => {
  const { t } = useTranslation();
  const locale = useSettingsStore((s) => s.locale);
  const theme = useSettingsStore((s) => s.theme);
  const hapticEnabled = useSettingsStore((s) => s.hapticEnabled);
  const { isSubscribed, preferences } = usePushNotifications();

  const { data: blocked = [] } = useQuery({
    queryKey: ['privacy-blocked'],
    queryFn: async () => (await privacyService.listBlocked()).data,
  });
  const { data: muted = [] } = useQuery({
    queryKey: ['privacy-muted'],
    queryFn: async () => (await privacyService.listMuted()).data,
  });

  const localeLabel = t(`settings.language.${locale}`);
  const themeLabel = t(`profileMenu.theme.${theme}`);
  const notifSubtitle = !isSubscribed
    ? t('settings.pushNotifications.disabled')
    : preferences
      ? t('settings.notifSummary', {
          count: countActivePrefs(preferences),
        })
      : t('settings.pushNotifications.enabled');
  const privacySubtitle = t('settings.privacySummary', {
    muted: muted.length,
    blocked: blocked.length,
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
            {t('settings.title')}
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('settings.subtitle')}</p>
        </div>

        {/* App */}
        <section>
          <h3 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
            {t('settings.groups.app')}
          </h3>
          <div className="divide-y divide-gray-200/60 overflow-hidden rounded-2xl border border-white/20 bg-white/80 backdrop-blur-md dark:divide-gray-800/60 dark:border-gray-700/40 dark:bg-gray-900/70">
            <SettingsRow
              to="/settings/language"
              icon={<Globe size={16} strokeWidth={2} />}
              title={t('settings.language.title')}
              value={localeLabel}
            />
            <SettingsRow
              to="/settings/appearance"
              icon={
                theme === 'dark' ? (
                  <Moon size={16} strokeWidth={2} />
                ) : (
                  <Sun size={16} strokeWidth={2} />
                )
              }
              title={t('settings.appearance.title')}
              value={themeLabel}
            />
          </div>
        </section>

        {/* Notifications */}
        <section>
          <h3 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
            {t('settings.groups.notifications')}
          </h3>
          <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/80 backdrop-blur-md dark:border-gray-700/40 dark:bg-gray-900/70">
            <SettingsRow
              to="/settings/notifications"
              icon={
                isSubscribed ? (
                  <Bell size={16} strokeWidth={2} />
                ) : (
                  <BellOff size={16} strokeWidth={2} />
                )
              }
              title={t('settings.pushNotifications.title')}
              value={notifSubtitle}
            />
          </div>
        </section>

        {/* Privacy */}
        <section>
          <h3 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
            {t('settings.groups.privacy')}
          </h3>
          <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/80 backdrop-blur-md dark:border-gray-700/40 dark:bg-gray-900/70">
            <SettingsRow
              to="/settings/privacy"
              icon={<Ban size={16} strokeWidth={2} />}
              title={t('settings.privacy.title')}
              value={privacySubtitle}
            />
          </div>
        </section>

        {/* Feedback */}
        <section>
          <h3 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
            {t('settings.groups.feedback')}
          </h3>
          <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/80 backdrop-blur-md dark:border-gray-700/40 dark:bg-gray-900/70">
            <SettingsRow
              to="/settings/feedback"
              icon={<Zap size={16} strokeWidth={2} />}
              title={t('settings.feedback.haptic')}
              value={hapticEnabled ? t('common.enabled') : t('common.disabled')}
            />
          </div>
        </section>
      </div>
    </Layout>
  );
};

function countActivePrefs(
  prefs: NonNullable<ReturnType<typeof usePushNotifications>['preferences']>
): number {
  return Object.values(prefs).filter((v) => v === true).length;
}
