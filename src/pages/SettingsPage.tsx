import { useState, useEffect } from 'react';
import { Layout } from '@components/layout';
import { GlassCard, Toggle, Button } from '@components/ui';
import { useToastStore } from '@store/toastStore';
import { hapticService } from '@utils/haptic';
import { usePushNotifications } from '@hooks/usePushNotifications';

export const SettingsPage = () => {
  const { success, error } = useToastStore();
  const [hapticEnabled, setHapticEnabled] = useState(hapticService.isEnabled());

  const {
    isSupported: isPushSupported,
    isSubscribed,
    isLoading: isPushLoading,
    preferences,
    subscribe,
    unsubscribe,
    updatePreferences,
  } = usePushNotifications();

  useEffect(() => {
    setHapticEnabled(hapticService.isEnabled());
  }, []);

  const handleHapticToggle = (enabled: boolean) => {
    hapticService.setEnabled(enabled);
    setHapticEnabled(enabled);

    if (enabled) {
      hapticService.vibrate('light');
      success('Haptic feedback enabled');
    } else {
      success('Haptic feedback disabled');
    }
  };

  const handlePushToggle = async () => {
    try {
      if (isSubscribed) {
        await unsubscribe();
        success('Push notifications disabled');
      } else {
        await subscribe();
        success('Push notifications enabled');
      }
    } catch (err) {
      error(err instanceof Error ? err.message : 'Failed to update push notifications');
    }
  };

  const handlePreferenceToggle = async (key: keyof typeof preferences, value: boolean) => {
    try {
      await updatePreferences({ [key]: value });
      success('Preference updated');
    } catch {
      error('Failed to update preference');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
          <p className="text-gray-600">Customize your Kompanion experience</p>
        </div>

        {/* Push Notifications */}
        <section>
          <h3 className="mb-4 text-lg font-bold text-gray-900">Push Notifications</h3>
          <div className="space-y-4">
            <GlassCard className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">Enable Notifications</h4>
                  <p className="text-sm text-gray-600">
                    {isPushSupported
                      ? 'Receive real-time updates for activities, challenges, and achievements'
                      : 'Push notifications are not supported on this device'}
                  </p>
                </div>
                <Button
                  onClick={handlePushToggle}
                  disabled={!isPushSupported || isPushLoading}
                  variant={isSubscribed ? 'secondary' : 'primary'}
                  size="sm"
                >
                  {isPushLoading ? 'Loading...' : isSubscribed ? 'Disable' : 'Enable'}
                </Button>
              </div>
            </GlassCard>

            {isSubscribed && preferences && (
              <GlassCard className="p-5">
                <h4 className="mb-4 font-semibold text-gray-900">Notification Preferences</h4>
                <div className="space-y-4">
                  <Toggle
                    enabled={preferences.activityWebhooks}
                    onChange={(value) => handlePreferenceToggle('activityWebhooks', value)}
                    label="Activity Syncs"
                    description="Get notified when new activities are synced from Strava"
                  />
                  <Toggle
                    enabled={preferences.challengeInvites}
                    onChange={(value) => handlePreferenceToggle('challengeInvites', value)}
                    label="Challenge Invitations"
                    description="Get notified when you're invited to a challenge"
                  />
                  <Toggle
                    enabled={preferences.challengeProgress}
                    onChange={(value) => handlePreferenceToggle('challengeProgress', value)}
                    label="Challenge Progress"
                    description="Get notified about challenge milestones and updates"
                  />
                  <Toggle
                    enabled={preferences.challengeReminders}
                    onChange={(value) => handlePreferenceToggle('challengeReminders', value)}
                    label="Challenge Reminders"
                    description="Get notified when challenges are starting or ending soon"
                  />
                </div>
              </GlassCard>
            )}
          </div>
        </section>

        {/* Haptic Feedback */}
        <section>
          <h3 className="mb-4 text-lg font-bold text-gray-900">Feedback</h3>
          <GlassCard className="p-5">
            <Toggle
              enabled={hapticEnabled}
              onChange={handleHapticToggle}
              disabled={!hapticService.isSupported()}
              label="Haptic Feedback"
              description={`Enable vibration for achievements and events${!hapticService.isSupported() ? ' (Not supported on this device)' : ''}`}
            />
          </GlassCard>
        </section>
      </div>
    </Layout>
  );
};
