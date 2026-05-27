import { useTranslation } from 'react-i18next';
import { Layout } from '@components/layout';
import { BackButton, GlassCard, Toggle } from '@components/ui';
import { useSettingsStore } from '@store/settingsStore';
import { useToastStore } from '@store/toastStore';
import { hapticService } from '@utils/haptic';

/**
 * Haptic feedback gets its own focused sub-page — keeping it out of
 * Appearance avoids the "I tapped Haptic and got theme too" confusion. One
 * toggle, one purpose.
 */
export const SettingsFeedbackPage = () => {
  const { t } = useTranslation();
  const { success } = useToastStore();
  const hapticEnabled = useSettingsStore((s) => s.hapticEnabled);
  const setHapticEnabled = useSettingsStore((s) => s.setHapticEnabled);

  const handleToggle = (enabled: boolean) => {
    setHapticEnabled(enabled);
    if (enabled) hapticService.vibrate('light');
    success(t(enabled ? 'settings.feedback.hapticEnabled' : 'settings.feedback.hapticDisabled'));
  };

  return (
    <Layout>
      <div className="space-y-6">
        <BackButton to="/settings" label={t('settings.title')} />

        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
            {t('settings.feedback.title')}
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('settings.feedback.description')}
          </p>
        </div>

        <GlassCard className="p-5">
          <Toggle
            enabled={hapticEnabled}
            onChange={handleToggle}
            disabled={!hapticService.isSupported()}
            label={t('settings.feedback.haptic')}
            description={`${t('settings.feedback.hapticDesc')}${
              !hapticService.isSupported() ? t('settings.feedback.hapticUnsupported') : ''
            }`}
          />
        </GlassCard>
      </div>
    </Layout>
  );
};
