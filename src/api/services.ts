import { apiClient } from './client';
import type { User, Activity, Stats, Achievement, Quest, SyncResult } from '@app-types/index';

export const authService = {
  login: (redirectUri?: string) => {
    const params = redirectUri ? `?redirect_uri=${encodeURIComponent(redirectUri)}` : '';
    return apiClient.get<{ authUrl: string }>(`/auth/login${params}`);
  },
  me: () => apiClient.get<User>('/auth/me'),
  logout: () => apiClient.post('/auth/logout'),
  deleteAccount: () => apiClient.delete('/auth/account'),
};

export const activitiesService = {
  list: () => apiClient.get<Activity[]>('/activities'),
  sync: () => apiClient.post<SyncResult>('/activities/sync'),
  syncWithProgress: (
    onProgress: (data: {
      type: 'fetching' | 'saving' | 'complete' | 'error';
      current?: number;
      total?: number;
      message?: string;
    }) => void
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const eventSource = new EventSource('/api/activities/sync/stream', {
        withCredentials: true,
      });

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        onProgress(data);

        if (data.type === 'complete' || data.type === 'error') {
          eventSource.close();
          if (data.type === 'complete') {
            resolve();
          } else {
            reject(new Error(data.message || 'Sync failed'));
          }
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        reject(new Error('Connection failed'));
      };
    });
  },
  getById: (id: number) => apiClient.get<Activity>(`/activities/${id}`),
};

export const statsService = {
  getUserStats: () => apiClient.get<Stats>('/stats'),
};

export const achievementsService = {
  list: () => apiClient.get<Achievement[]>('/achievements'),
};

export const questsService = {
  list: () => apiClient.get<Quest[]>('/quests'),
};
