import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@api/client';

export interface TokenInfo {
  tokenExpiresAt?: number;
  expiresIn?: string;
  isExpired?: boolean;
}

interface TokenDebugResponse {
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
}

const API_BASE = 'http://localhost:3000/api';

export const useTokenInfo = () => {
  const [info, setInfo] = useState<TokenInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<TokenDebugResponse>('/auth/debug');

      if (response.success && response.data) {
        const { expiresIn, isExpired, tokenExpiresAt } = response.data;
        setInfo({
          tokenExpiresAt,
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
  }, []);

  const refreshJwt = useCallback(async () => {
    setLoading(true);
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        alert('No refresh token found');
        return;
      }

      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('access_token', data.data.accessToken);
        alert('Token refreshed successfully!');
        await refresh();
      } else {
        alert(`Failed to refresh: ${data.error}`);
      }
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  const refreshStrava = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/refresh-strava`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      const data = await response.json();

      if (response.ok && data.success) {
        alert(`Strava token refreshed! New expiry: ${data.data.expiresAtDate}`);
        await refresh();
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
  }, [refresh]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { info, loading, refresh, refreshJwt, refreshStrava };
};
