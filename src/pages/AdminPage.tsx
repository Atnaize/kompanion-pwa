import { useState, useEffect } from 'react';
import { Layout } from '@components/layout/Layout';
import { GlassCard, Button } from '@components/ui';
import { apiClient } from '@api/client';
import { useToastStore } from '@store/toastStore';

interface Activity {
  id: number;
  name: string;
  type: string;
  startDateLocal: string;
  distance: number;
}

export const AdminPage = () => {
  const { success, error: showError } = useToastStore();
  const [tokenInfo, setTokenInfo] = useState<{
    tokenExpiresAt?: number;
    expiresIn?: string;
    isExpired?: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<{
    [key: string]: { success: boolean; data?: unknown; error?: string };
  }>({});
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null);
  const [webhookLoading, setWebhookLoading] = useState(false);
  const [lastWebhookTest, setLastWebhookTest] = useState<Date | null>(null);
  const [challengeSyncLoading, setChallengeSyncLoading] = useState(false);

  useEffect(() => {
    checkTokenInfo();
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const response = await apiClient.get<Activity[]>('/activities');
      if (response.success && response.data) {
        setActivities(response.data.slice(0, 10)); // Get last 10 activities
        if (response.data.length > 0) {
          setSelectedActivityId(response.data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
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

  const testWebhook = async () => {
    if (!selectedActivityId) {
      showError('Please select an activity');
      return;
    }

    setWebhookLoading(true);
    try {
      const response = await apiClient.post<{ activityId: number; processed: boolean }>(
        '/webhooks/test',
        { activityId: selectedActivityId }
      );

      if (response.success) {
        setLastWebhookTest(new Date());
        success('Webhook processed successfully! Stats and achievement progress recalculated.');
        // Refetch activities to show the latest data
        await fetchActivities();
      } else {
        showError(response.error || 'Failed to process webhook');
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setWebhookLoading(false);
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

  return (
    <Layout>
      <div className="space-y-4">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Admin / Debug Page</h1>
          <p className="text-sm text-gray-600">Debug token and API issues</p>
        </div>

        {/* Token Info */}
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

        {/* Challenge Sync */}
        <GlassCard className="p-4">
          <h2 className="mb-3 text-lg font-semibold text-gray-900">Challenge Sync</h2>
          <p className="mb-4 text-sm text-gray-600">
            Manually sync all your active challenges with current activities. This will add any
            missing activities to your challenges and update progress.
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
              <strong>When to use:</strong> Use this if your challenges are missing activities or
              showing incorrect progress. This will recalculate everything.
            </p>
          </div>
        </GlassCard>

        {/* Webhook Testing */}
        <GlassCard className="p-4">
          <h2 className="mb-3 text-lg font-semibold text-gray-900">Webhook Simulation</h2>
          <p className="mb-4 text-sm text-gray-600">
            Test the webhook flow locally by simulating a Strava activity webhook event. This will
            trigger stats recalculation and achievement progress updates.
          </p>
          <div className="space-y-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Select Activity
              </label>
              <select
                value={selectedActivityId || ''}
                onChange={(e) => setSelectedActivityId(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-strava-orange focus:outline-none focus:ring-2 focus:ring-strava-orange/20"
                disabled={webhookLoading || activities.length === 0}
              >
                {activities.length === 0 && <option>No activities found</option>}
                {activities.map((activity) => {
                  const date = new Date(activity.startDateLocal);
                  const formattedDate = isNaN(date.getTime())
                    ? 'Unknown date'
                    : date.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      });
                  return (
                    <option key={activity.id} value={activity.id}>
                      {activity.name} ({activity.type}) - {formattedDate}
                    </option>
                  );
                })}
              </select>
            </div>
            <Button
              onClick={testWebhook}
              variant="primary"
              className="w-full"
              disabled={webhookLoading || !selectedActivityId}
            >
              {webhookLoading ? 'Processing...' : 'Trigger Webhook Event'}
            </Button>
            {lastWebhookTest && (
              <div className="text-center text-xs text-gray-500">
                Last test: {lastWebhookTest.toLocaleTimeString()}
              </div>
            )}
            <div className="rounded-lg bg-blue-50 p-3">
              <p className="text-xs text-blue-800">
                <strong>Note:</strong> This simulates a webhook event for an existing activity.
                Since the activity is already in your database, stats will be recalculated but
                won&apos;t change. To see actual progress updates, navigate to your achievements
                page after triggering the webhook - the &quot;Last Updated&quot; timestamp should
                change.
              </p>
            </div>
            <div className="rounded-lg bg-yellow-50 p-3">
              <p className="text-xs text-yellow-800">
                <strong>Tip:</strong> To test with real progress changes, add a new activity on
                Strava and it will automatically sync via the real webhook (no testing needed).
              </p>
            </div>
          </div>
        </GlassCard>

        {/* API Tests */}
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
                          result.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {result.success ? 'Success' : 'Failed'}
                      </span>
                    </div>
                    {result.error && <p className="text-xs text-red-600">Error: {result.error}</p>}
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

        {/* Local Storage */}
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
      </div>
    </Layout>
  );
};
