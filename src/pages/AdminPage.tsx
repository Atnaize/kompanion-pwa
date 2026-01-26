import { useState, useEffect } from 'react';
import { Layout } from '@components/layout/Layout';
import { GlassCard, Button, Tabs, TabList, Tab, TabPanel } from '@components/ui';
import { apiClient } from '@api/client';
import { useToastStore } from '@store/toastStore';
import { usePushNotifications } from '@hooks/usePushNotifications';

export const AdminPage = () => {
  const { success, error: showError } = useToastStore();
  const [activeTab, setActiveTab] = useState('tokens');
  const [tokenInfo, setTokenInfo] = useState<{
    tokenExpiresAt?: number;
    expiresIn?: string;
    isExpired?: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<{
    [key: string]: { success: boolean; data?: unknown; error?: string };
  }>({});
  const [challengeSyncLoading, setChallengeSyncLoading] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationDebug, setNotificationDebug] = useState<{
    permission: NotificationPermission | 'unsupported';
    swReady: boolean;
    swController: boolean;
    pushSubscription: string | null;
  } | null>(null);

  const { isSupported, isSubscribed, subscribe } = usePushNotifications();

  useEffect(() => {
    checkTokenInfo();
    checkNotificationDebug();
  }, []);

  const checkNotificationDebug = async () => {
    const debug: {
      permission: NotificationPermission | 'unsupported';
      swReady: boolean;
      swController: boolean;
      pushSubscription: string | null;
    } = {
      permission: 'unsupported',
      swReady: false,
      swController: false,
      pushSubscription: null,
    };

    if ('Notification' in window) {
      debug.permission = Notification.permission;
    }

    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        debug.swReady = true;
        debug.swController = !!navigator.serviceWorker.controller;

        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          debug.pushSubscription = subscription.endpoint.substring(0, 60) + '...';
        }
      } catch (error) {
        console.error('Error checking SW:', error);
      }
    }

    setNotificationDebug(debug);
  };

  const checkTokenInfo = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<{
        userId: number;
        stravaId: number;
        tokenExpiresAt: number;
        tokenExpiresAtDate: string;
        currentTime: number;
        currentTimeDate: string;
        expiresIn: number;
        expiresInMinutes: number;
        isExpired: boolean;
        isExpiringSoon: boolean;
      }>('/auth/debug');

      if (response.success && response.data) {
        const expiresIn = response.data.expiresIn;
        const isExpired = response.data.isExpired;

        setTokenInfo({
          tokenExpiresAt: response.data.tokenExpiresAt,
          expiresIn: isExpired
            ? 'Expired'
            : `${Math.floor(expiresIn / 60)} minutes ${expiresIn % 60} seconds`,
          isExpired,
        });
      }
    } catch (error) {
      console.error('Error checking token:', error);
    } finally {
      setLoading(false);
    }
  };

  const testEndpoint = async (name: string, endpoint: string) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/api${endpoint}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      const data = await response.json();

      setTestResults((prev) => ({
        ...prev,
        [name]: {
          success: response.ok,
          data: response.ok ? data : undefined,
          error: !response.ok ? data.error || response.statusText : undefined,
        },
      }));
    } catch (error) {
      setTestResults((prev) => ({
        ...prev,
        [name]: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      }));
    } finally {
      setLoading(false);
    }
  };

  const refreshToken = async () => {
    setLoading(true);
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        alert('No refresh token found');
        return;
      }

      const response = await fetch('http://localhost:3000/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('access_token', data.data.accessToken);
        alert('Token refreshed successfully!');
        await checkTokenInfo();
      } else {
        alert(`Failed to refresh: ${data.error}`);
      }
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const refreshStravaToken = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/auth/refresh-strava', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(`Strava token refreshed! New expiry: ${data.data.expiresAtDate}`);
        await checkTokenInfo();
      } else {
        const errorMsg = data.message || data.error || 'Unknown error';
        if (data.requiresReauth) {
          alert(
            `⚠️ RE-AUTHENTICATION REQUIRED\n\n${errorMsg}\n\nPlease:\n1. Log out completely\n2. Log back in via Strava\n3. This will give you fresh, valid tokens`
          );
        } else {
          alert(`Failed to refresh Strava token: ${errorMsg}`);
        }
      }
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const syncChallenges = async () => {
    setChallengeSyncLoading(true);
    try {
      const response = await apiClient.post<{ synced: number; activitiesAdded: number }>(
        '/challenges/sync'
      );

      if (response.success && response.data) {
        success(
          `Synced ${response.data.synced} challenge(s)! Added ${response.data.activitiesAdded} activity(ies).`
        );
      } else {
        showError(response.error || 'Failed to sync challenges');
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setChallengeSyncLoading(false);
    }
  };

  const sendTestNotification = async () => {
    setNotificationLoading(true);
    try {
      const response = await apiClient.post<{ message: string }>('/notifications/test');

      if (response.success) {
        success('Test notification sent! Check your device.');
      } else {
        showError(response.error || 'Failed to send test notification');
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setNotificationLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-4">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Admin / Debug Page</h1>
          <p className="text-sm text-gray-600">Debug token and API issues</p>
        </div>

        <Tabs value={activeTab} onChange={setActiveTab}>
          <TabList className="mb-6">
            <Tab value="tokens" label="Tokens" />
            <Tab value="testing" label="Testing" />
            <Tab value="notifications" label="Notifications" />
            <Tab value="api" label="API Tests" />
            <Tab value="storage" label="Storage" />
          </TabList>

          {/* Tokens Tab */}
          <TabPanel value="tokens">
            <GlassCard className="p-4">
              <h2 className="mb-3 text-lg font-semibold text-gray-900">Token Information</h2>
              <div className="space-y-2">
                {tokenInfo ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Expires at:</span>
                      <span className="font-medium text-gray-900">
                        {new Date((tokenInfo.tokenExpiresAt || 0) * 1000).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Expires in:</span>
                      <span
                        className={`font-medium ${tokenInfo.isExpired ? 'text-red-600' : 'text-green-600'}`}
                      >
                        {tokenInfo.expiresIn}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Status:</span>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          tokenInfo.isExpired
                            ? 'bg-red-100 text-red-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {tokenInfo.isExpired ? 'Expired' : 'Valid'}
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-500">Loading...</p>
                )}
              </div>
              <div className="mt-4 flex flex-col gap-2">
                <Button onClick={checkTokenInfo} variant="secondary" disabled={loading}>
                  Refresh Info
                </Button>
                <Button onClick={refreshStravaToken} disabled={loading}>
                  Force Strava Token Refresh
                </Button>
                <Button onClick={refreshToken} variant="secondary" disabled={loading}>
                  Force JWT Refresh
                </Button>
              </div>
            </GlassCard>
          </TabPanel>

          {/* Testing Tab */}
          <TabPanel value="testing">
            <div className="space-y-4">
              {/* Challenge Sync */}
              <GlassCard className="p-4">
                <h2 className="mb-3 text-lg font-semibold text-gray-900">Challenge Sync</h2>
                <p className="mb-4 text-sm text-gray-600">
                  Manually sync all your active challenges with current activities. This will add
                  any missing activities to your challenges and update progress.
                </p>
                <Button
                  onClick={syncChallenges}
                  variant="primary"
                  className="w-full"
                  disabled={challengeSyncLoading}
                >
                  {challengeSyncLoading ? 'Syncing...' : 'Sync Active Challenges'}
                </Button>
                <div className="mt-3 rounded-lg bg-blue-50 p-3">
                  <p className="text-xs text-blue-800">
                    <strong>When to use:</strong> Use this if your challenges are missing activities
                    or showing incorrect progress. This will recalculate everything.
                  </p>
                </div>
              </GlassCard>
            </div>
          </TabPanel>

          {/* Notifications Tab */}
          <TabPanel value="notifications">
            <div className="space-y-4">
              {/* Debug Info */}
              <GlassCard className="p-4">
                <h2 className="mb-3 text-lg font-semibold text-gray-900">
                  Notification Debug Info
                </h2>
                {notificationDebug ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Browser Support:</span>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          isSupported ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {isSupported ? 'Supported' : 'Not Supported'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Permission:</span>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          notificationDebug.permission === 'granted'
                            ? 'bg-green-100 text-green-700'
                            : notificationDebug.permission === 'denied'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {notificationDebug.permission}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Service Worker Ready:</span>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          notificationDebug.swReady
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {notificationDebug.swReady ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">SW Controller Active:</span>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          notificationDebug.swController
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {notificationDebug.swController ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Push Subscribed:</span>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          isSubscribed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {isSubscribed ? 'Yes' : 'No'}
                      </span>
                    </div>
                    {notificationDebug.pushSubscription && (
                      <div className="mt-2">
                        <span className="text-gray-600">Endpoint:</span>
                        <p className="mt-1 break-all rounded bg-gray-100 p-2 font-mono text-xs">
                          {notificationDebug.pushSubscription}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Loading...</p>
                )}
                <div className="mt-4 flex gap-2">
                  <Button onClick={checkNotificationDebug} variant="secondary" size="sm">
                    Refresh
                  </Button>
                  {!isSubscribed && isSupported && (
                    <Button
                      onClick={async () => {
                        try {
                          await subscribe();
                          success('Push notifications enabled!');
                          await checkNotificationDebug();
                        } catch (err) {
                          showError(err instanceof Error ? err.message : 'Failed to subscribe');
                        }
                      }}
                      variant="primary"
                      size="sm"
                    >
                      Enable Push
                    </Button>
                  )}
                </div>
              </GlassCard>

              {/* Send Test */}
              <GlassCard className="p-4">
                <h2 className="mb-3 text-lg font-semibold text-gray-900">Send Test Notification</h2>
                <p className="mb-4 text-sm text-gray-600">
                  Send a test push notification to your device. All debug checks above should show
                  green for this to work.
                </p>
                <Button
                  onClick={sendTestNotification}
                  variant="primary"
                  className="w-full"
                  disabled={notificationLoading || !isSubscribed}
                >
                  {notificationLoading ? 'Sending...' : 'Send Test Notification'}
                </Button>
                {!isSubscribed && (
                  <div className="mt-3 rounded-lg bg-yellow-50 p-3">
                    <p className="text-xs text-yellow-800">
                      <strong>Warning:</strong> Push notifications are not enabled. Click
                      &quot;Enable Push&quot; above or enable in Settings first.
                    </p>
                  </div>
                )}
              </GlassCard>
            </div>
          </TabPanel>

          {/* API Tests Tab */}
          <TabPanel value="api">
            <div className="space-y-4">
              <GlassCard className="p-4">
                <h2 className="mb-3 text-lg font-semibold text-gray-900">API Endpoint Tests</h2>
                <div className="space-y-2">
                  <Button
                    onClick={() => testEndpoint('Get Me', '/auth/me')}
                    variant="secondary"
                    className="w-full"
                    disabled={loading}
                  >
                    Test GET /auth/me
                  </Button>
                  <Button
                    onClick={() => testEndpoint('Get Debug', '/auth/debug')}
                    variant="secondary"
                    className="w-full"
                    disabled={loading}
                  >
                    Test GET /auth/debug
                  </Button>
                  <Button
                    onClick={() => testEndpoint('Get Stats', '/stats')}
                    variant="secondary"
                    className="w-full"
                    disabled={loading}
                  >
                    Test GET /stats
                  </Button>
                </div>
              </GlassCard>

              {/* Test Results */}
              {Object.keys(testResults).length > 0 && (
                <GlassCard className="p-4">
                  <h2 className="mb-3 text-lg font-semibold text-gray-900">Test Results</h2>
                  <div className="space-y-3">
                    {Object.entries(testResults).map(([name, result]) => {
                      const dataStr = result.data ? JSON.stringify(result.data, null, 2) : '';
                      return (
                        <div key={name} className="rounded-lg bg-white/30 p-3">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="font-medium text-gray-900">{name}</span>
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-medium ${
                                result.success
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {result.success ? 'Success' : 'Failed'}
                            </span>
                          </div>
                          {result.error && (
                            <p className="text-xs text-red-600">Error: {result.error}</p>
                          )}
                          {dataStr && (
                            <details className="text-xs">
                              <summary className="cursor-pointer text-gray-600">View Data</summary>
                              <pre className="mt-2 overflow-auto rounded bg-gray-100 p-2 text-gray-900">
                                {dataStr}
                              </pre>
                            </details>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </GlassCard>
              )}
            </div>
          </TabPanel>

          {/* Storage Tab */}
          <TabPanel value="storage">
            <GlassCard className="p-4">
              <h2 className="mb-3 text-lg font-semibold text-gray-900">Local Storage</h2>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Access Token:</span>
                  <p className="mt-1 break-all rounded bg-gray-100 p-2 font-mono text-xs">
                    {localStorage.getItem('access_token')?.substring(0, 50)}...
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Refresh Token:</span>
                  <p className="mt-1 break-all rounded bg-gray-100 p-2 font-mono text-xs">
                    {localStorage.getItem('refresh_token')?.substring(0, 50)}...
                  </p>
                </div>
              </div>
            </GlassCard>
          </TabPanel>
        </Tabs>
      </div>
    </Layout>
  );
};
