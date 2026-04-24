import { useState } from 'react';
import { GlassCard, Button } from '@components/ui';
import { apiClient } from '@api/client';
import { useToastStore } from '@store/toastStore';
import { usePushNotifications } from '@hooks/usePushNotifications';
import { useNotificationDebug, type NotificationDebug } from './useNotificationDebug';
import { StatusPill, type StatusTone } from './StatusPill';

export const NotificationsTab = () => {
  const { success, error: showError } = useToastStore();
  const { isSupported, isSubscribed, subscribe } = usePushNotifications();
  const { debug, refresh } = useNotificationDebug();
  const [sending, setSending] = useState(false);

  const handleSubscribe = async () => {
    try {
      await subscribe();
      success('Push notifications enabled!');
      await refresh();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to subscribe');
    }
  };

  const sendTest = async () => {
    setSending(true);
    try {
      const response = await apiClient.post<{ message: string }>('/notifications/test');
      if (response.success) {
        success('Test notification sent! Check your device.');
      } else {
        showError(response.error || 'Failed to send test notification');
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <GlassCard className="p-4">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Notification Debug Info</h2>
        {debug ? (
          <DebugChecks debug={debug} isSupported={isSupported} isSubscribed={isSubscribed} />
        ) : (
          <p className="text-sm text-gray-500">Loading...</p>
        )}
        <div className="mt-4 flex gap-2">
          <Button onClick={refresh} variant="secondary" size="sm">
            Refresh
          </Button>
          {!isSubscribed && isSupported && (
            <Button onClick={handleSubscribe} variant="primary" size="sm">
              Enable Push
            </Button>
          )}
        </div>
      </GlassCard>

      <GlassCard className="p-4">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Send Test Notification</h2>
        <p className="mb-4 text-sm text-gray-600">
          Send a test push notification to your device. All debug checks above should show green for
          this to work.
        </p>
        <Button
          onClick={sendTest}
          variant="primary"
          className="w-full"
          disabled={sending || !isSubscribed}
        >
          {sending ? 'Sending...' : 'Send Test Notification'}
        </Button>
        {!isSubscribed && (
          <div className="mt-3 rounded-lg bg-yellow-50 p-3">
            <p className="text-xs text-yellow-800">
              <strong>Warning:</strong> Push notifications are not enabled. Click &quot;Enable
              Push&quot; above or enable in Settings first.
            </p>
          </div>
        )}
      </GlassCard>
    </div>
  );
};

interface DebugChecksProps {
  debug: NotificationDebug;
  isSupported: boolean;
  isSubscribed: boolean;
}

const DebugChecks = ({ debug, isSupported, isSubscribed }: DebugChecksProps) => {
  const permissionTone: StatusTone =
    debug.permission === 'granted'
      ? 'success'
      : debug.permission === 'denied'
        ? 'danger'
        : 'warning';

  return (
    <div className="space-y-2 text-sm">
      <CheckRow label="Browser Support:">
        <StatusPill tone={isSupported ? 'success' : 'danger'}>
          {isSupported ? 'Supported' : 'Not Supported'}
        </StatusPill>
      </CheckRow>
      <CheckRow label="Permission:">
        <StatusPill tone={permissionTone}>{debug.permission}</StatusPill>
      </CheckRow>
      <CheckRow label="Service Worker Ready:">
        <StatusPill tone={debug.swReady ? 'success' : 'danger'}>
          {debug.swReady ? 'Yes' : 'No'}
        </StatusPill>
      </CheckRow>
      <CheckRow label="SW Controller Active:">
        <StatusPill tone={debug.swController ? 'success' : 'warning'}>
          {debug.swController ? 'Yes' : 'No'}
        </StatusPill>
      </CheckRow>
      <CheckRow label="Push Subscribed:">
        <StatusPill tone={isSubscribed ? 'success' : 'danger'}>
          {isSubscribed ? 'Yes' : 'No'}
        </StatusPill>
      </CheckRow>
      {debug.pushSubscription && (
        <div className="mt-2">
          <span className="text-gray-600">Endpoint:</span>
          <p className="mt-1 break-all rounded bg-gray-100 p-2 font-mono text-xs">
            {debug.pushSubscription}
          </p>
        </div>
      )}
    </div>
  );
};

const CheckRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex justify-between">
    <span className="text-gray-600">{label}</span>
    {children}
  </div>
);
