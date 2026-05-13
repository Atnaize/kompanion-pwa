import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { GlassCard, Button } from '@components/ui';
import { apiClient } from '@api/client';
import { useToastStore } from '@store/toastStore';
import { usePushNotifications } from '@hooks/usePushNotifications';
import { useNotificationDebug, type NotificationDebug } from './useNotificationDebug';
import { StatusPill, type StatusTone } from './StatusPill';

const INBOX_TEST_TYPES = [
  { type: 'friend_request', label: 'Friend request' },
  { type: 'friend_accepted', label: 'Friend accepted' },
  { type: 'achievement_unlocked', label: 'Achievement unlocked' },
  { type: 'challenge_invite', label: 'Challenge invite' },
  { type: 'challenge_joined', label: 'Challenge joined' },
] as const;

type InboxTestType = (typeof INBOX_TEST_TYPES)[number]['type'];

export const NotificationsTab = () => {
  const { success, error: showError } = useToastStore();
  const queryClient = useQueryClient();
  const { isSupported, isSubscribed, subscribe } = usePushNotifications();
  const { debug, refresh } = useNotificationDebug();
  const [sending, setSending] = useState(false);
  const [pendingInboxType, setPendingInboxType] = useState<InboxTestType | null>(null);

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

  const sendInboxTest = async (type: InboxTestType, label: string) => {
    setPendingInboxType(type);
    try {
      const response = await apiClient.post<{ message: string }>('/notifications/test-inbox', {
        type,
      });
      if (response.success) {
        success(`Emitted "${label}" — check the bell + your device`);
        void queryClient.invalidateQueries({ queryKey: ['inbox'] });
        void queryClient.invalidateQueries({ queryKey: ['inbox-unread-count'] });
      } else {
        showError(response.error || 'Failed to emit notification');
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setPendingInboxType(null);
    }
  };

  return (
    <div className="space-y-4">
      <GlassCard className="p-4">
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-50">
          Notification Debug Info
        </h2>
        {debug ? (
          <DebugChecks debug={debug} isSupported={isSupported} isSubscribed={isSubscribed} />
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
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
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-50">
          Send Raw Push (no inbox row)
        </h2>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Sends a bare push notification to your subscribed device(s). Does NOT create an inbox row
          — use the per-type tests below to exercise the full pipeline.
        </p>
        <Button
          onClick={sendTest}
          variant="primary"
          className="w-full"
          disabled={sending || !isSubscribed}
        >
          {sending ? 'Sending...' : 'Send Test Push'}
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

      <GlassCard className="p-4">
        <h2 className="mb-1 text-lg font-semibold text-gray-900 dark:text-gray-50">
          Test Inbox + Push (full pipeline)
        </h2>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Emits one notification of the selected type to your own account via{' '}
          <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">notificationEmitter</code>.
          Creates the in-app row AND dispatches a web-push (gated by your notification preferences).
          Push subscription only matters for the push half — the inbox row appears regardless.
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {INBOX_TEST_TYPES.map(({ type, label }) => {
            const isPending = pendingInboxType === type;
            return (
              <Button
                key={type}
                variant="secondary"
                onClick={() => sendInboxTest(type, label)}
                disabled={pendingInboxType !== null}
              >
                {isPending ? 'Emitting...' : label}
              </Button>
            );
          })}
        </div>
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
          <span className="text-gray-600 dark:text-gray-400">Endpoint:</span>
          <p className="mt-1 break-all rounded bg-gray-100 p-2 font-mono text-xs dark:bg-gray-800">
            {debug.pushSubscription}
          </p>
        </div>
      )}
    </div>
  );
};

const CheckRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex justify-between">
    <span className="text-gray-600 dark:text-gray-400">{label}</span>
    {children}
  </div>
);
