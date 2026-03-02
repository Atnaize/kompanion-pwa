import { useTranslation } from 'react-i18next';
import { Layout } from '@components/layout';
import { GlassCard, Toggle, Button } from '@components/ui';
import { useToastStore } from '@store/toastStore';
import { useSettingsStore } from '@store/settingsStore';
import { hapticService } from '@utils/haptic';
import { usePushNotifications } from '@hooks/usePushNotifications';

export const SettingsPage = () => {
  const { t } = useTranslation();
  const { success, error } = useToastStore();
  const { locale, setLocale, hapticEnabled, setHapticEnabled } = useSettingsStore();

  const {
    isSupported: isPushSupported,
    isSubscribed,
    isLoading: isPushLoading,
    preferences,
    subscribe,
    unsubscribe,
    updatePreferences,
  } = usePushNotifications();

  const handleHapticToggle = (enabled: boolean) => {
    setHapticEnabled(enabled);

    if (enabled) {
      hapticService.vibrate('light');
      success(t('settings.feedback.hapticEnabled'));
    } else {
      success(t('settings.feedback.hapticDisabled'));
    }
  };

  const handlePushToggle = async () => {
    try {
      if (isSubscribed) {
        await unsubscribe();
        success(t('settings.pushNotifications.disabled'));
      } else {
        await subscribe();
        success(t('settings.pushNotifications.enabled'));
      }
    } catch (err) {
      error(err instanceof Error ? err.message : t('settings.pushNotifications.disabled'));
    }
  };

  const handlePreferenceToggle = async (
    key: 'challengeInvites' | 'challengeProgress' | 'challengeReminders',
    value: boolean
  ) => {
    try {
      await updatePreferences({ [key]: value });
      success(t('settings.preferences.updated'));
    } catch {
      error(t('settings.preferences.updateFailed'));
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('settings.title')}</h2>
          <p className="text-gray-600">{t('settings.subtitle')}</p>
        </div>

        {/* Language */}
        <section>
          <h3 className="mb-4 text-lg font-bold text-gray-900">{t('settings.language.title')}</h3>
          <GlassCard className="p-5">
            <p className="mb-3 text-sm text-gray-600">{t('settings.language.description')}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setLocale('en')}
                className={`flex-1 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                  locale === 'en'
                    ? 'bg-gradient-to-r from-orange-400 to-orange-600 text-white shadow-lg'
                    : 'bg-white/50 text-gray-700 hover:bg-white/80'
                }`}
              >
                {t('settings.language.en')}
              </button>
              <button
                onClick={() => setLocale('fr')}
                className={`flex-1 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                  locale === 'fr'
                    ? 'bg-gradient-to-r from-orange-400 to-orange-600 text-white shadow-lg'
                    : 'bg-white/50 text-gray-700 hover:bg-white/80'
                }`}
              >
                {t('settings.language.fr')}
              </button>
            </div>
          </GlassCard>
        </section>

        {/* Push Notifications */}
        <section>
          <h3 className="mb-4 text-lg font-bold text-gray-900">{t('settings.pushNotifications.title')}</h3>
          <div className="space-y-4">
            <GlassCard className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">{t('settings.pushNotifications.enable')}</h4>
                  <p className="text-sm text-gray-600">
                    {isPushSupported
                      ? t('settings.pushNotifications.descriptionSupported')
                      : t('settings.pushNotifications.descriptionUnsupported')}
                  </p>
                </div>
                <Button
                  onClick={handlePushToggle}
                  disabled={!isPushSupported || isPushLoading}
                  variant={isSubscribed ? 'secondary' : 'primary'}
                  size="sm"
                >
                  {isPushLoading ? t('common.loading') : isSubscribed ? t('common.disable') : t('common.enable')}
                </Button>
              </div>
            </GlassCard>

            {isSubscribed && preferences && (
              <GlassCard className="p-5">
                <h4 className="mb-4 font-semibold text-gray-900">{t('settings.preferences.title')}</h4>
                <div className="space-y-4">
                  <Toggle
                    enabled={preferences.challengeInvites}
                    onChange={(value) => handlePreferenceToggle('challengeInvites', value)}
                    label={t('settings.preferences.challengeInvites')}
                    description={t('settings.preferences.challengeInvitesDesc')}
                  />
                  <Toggle
                    enabled={preferences.challengeProgress}
                    onChange={(value) => handlePreferenceToggle('challengeProgress', value)}
                    label={t('settings.preferences.challengeProgress')}
                    description={t('settings.preferences.challengeProgressDesc')}
                  />
                  <Toggle
                    enabled={preferences.challengeReminders}
                    onChange={(value) => handlePreferenceToggle('challengeReminders', value)}
                    label={t('settings.preferences.challengeReminders')}
                    description={t('settings.preferences.challengeRemindersDesc')}
                  />
                </div>
              </GlassCard>
            )}
          </div>
        </section>

        {/* Haptic Feedback */}
        <section>
          <h3 className="mb-4 text-lg font-bold text-gray-900">{t('settings.feedback.title')}</h3>
          <GlassCard className="p-5">
            <Toggle
              enabled={hapticEnabled}
              onChange={handleHapticToggle}
              disabled={!hapticService.isSupported()}
              label={t('settings.feedback.haptic')}
              description={`${t('settings.feedback.hapticDesc')}${!hapticService.isSupported() ? t('settings.feedback.hapticUnsupported') : ''}`}
            />
          </GlassCard>
        </section>
      </div>
    </Layout>
  );
};
