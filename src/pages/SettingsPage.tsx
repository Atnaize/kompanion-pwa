import { useState, useEffect } from 'react';
import { Layout } from '@components/layout';
import { GlassCard, Toggle } from '@components/ui';
import { useToastStore } from '@store/toastStore';
import { hapticService } from '@utils/haptic';

export const SettingsPage = () => {
  const { success } = useToastStore();
  const [hapticEnabled, setHapticEnabled] = useState(hapticService.isEnabled());

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

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
          <p className="text-gray-600">Customize your Kompanion experience</p>
        </div>

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
