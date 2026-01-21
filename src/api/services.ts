import { apiClient } from './client';
import type {
  User,
  Activity,
  Stats,
  Achievement,
  SyncResult,
  Challenge,
  ChallengeProgress,
  ChallengeEvent,
  Friend,
  ChallengeTargets,
  ChallengeType,
  CompetitiveGoal,
  ChallengeParticipant,
} from '@types';

export const authService = {
  login: (redirectUri?: string) => {
    const params = redirectUri ? `?redirect_uri=${encodeURIComponent(redirectUri)}` : '';
    return apiClient.get<{ authUrl: string }>(`/auth/login${params}`);
  },
  me: () => apiClient.get<User>('/auth/me'),
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
      challengesSynced?: number;
      challengeActivitiesAdded?: number;
    }) => void
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const baseURL = apiClient.getBaseURL();
      const token = localStorage.getItem('access_token');

      if (!token) {
        reject(new Error('Not authenticated'));
        return;
      }

      // EventSource doesn't support custom headers, so pass token as query param
      const eventSource = new EventSource(`${baseURL}/activities/sync/stream?token=${token}`);

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
  getUserStats: (period?: 'week' | 'month' | 'year') => {
    const query = period ? `?period=${period}` : '';
    return apiClient.get<Stats>(`/stats${query}`);
  },
  getProgressData: (params: {
    metric: 'distance' | 'elevation' | 'count' | 'time';
    period: 'week' | 'month' | 'year' | 'all';
    groupBy: 'day' | 'week' | 'month';
  }) => {
    const query = new URLSearchParams({
      metric: params.metric,
      period: params.period,
      groupBy: params.groupBy,
    }).toString();
    return apiClient.get<Array<{ date: string; value: number }>>(`/stats/progress?${query}`);
  },
  comparePeriods: (period: 'week' | 'month' | 'year') => {
    const query = new URLSearchParams({ period }).toString();
    return apiClient.get<{
      current: {
        distance: number;
        elevation: number;
        time: number;
        count: number;
      };
      previous: {
        distance: number;
        elevation: number;
        time: number;
        count: number;
      };
      changes: {
        distance: number;
        elevation: number;
        time: number;
        count: number;
      };
    }>(`/stats/compare?${query}`);
  },
  compareCustomRanges: (params: {
    currentStart: string;
    currentEnd: string;
    previousStart: string;
    previousEnd: string;
  }) => {
    const query = new URLSearchParams({
      currentStart: params.currentStart,
      currentEnd: params.currentEnd,
      previousStart: params.previousStart,
      previousEnd: params.previousEnd,
    }).toString();
    return apiClient.get<{
      current: {
        distance: number;
        elevation: number;
        time: number;
        count: number;
      };
      previous: {
        distance: number;
        elevation: number;
        time: number;
        count: number;
      };
      changes: {
        distance: number;
        elevation: number;
        time: number;
        count: number;
      };
    }>(`/stats/compare-custom?${query}`);
  },
  getHeatmapData: (metric: 'count' | 'distance' = 'count') => {
    const query = new URLSearchParams({ metric }).toString();
    return apiClient.get<Array<{ date: string; value: number }>>(`/stats/heatmap?${query}`);
  },
};

export const achievementsService = {
  list: () => apiClient.get<Achievement[]>('/achievements'),
  redeem: (achievementId: string) =>
    apiClient.post<Achievement>(`/achievements/${achievementId}/redeem`),
};

export const challengesService = {
  // Challenge CRUD
  list: (filters?: { status?: string; type?: ChallengeType }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.type) params.append('type', filters.type);
    const query = params.toString();
    return apiClient.get<Challenge[]>(`/challenges${query ? `?${query}` : ''}`);
  },
  getById: (id: string) => apiClient.get<Challenge>(`/challenges/${id}`),
  create: (data: {
    name: string;
    description?: string;
    type: ChallengeType;
    startDate: string;
    endDate: string;
    targets: ChallengeTargets;
    competitiveGoal?: CompetitiveGoal;
    invitedUserIds?: number[];
  }) => apiClient.post<Challenge>('/challenges', data),
  update: (
    id: string,
    data: {
      name?: string;
      description?: string;
      startDate?: string;
      endDate?: string;
      targets?: ChallengeTargets;
    }
  ) => apiClient.patch<Challenge>(`/challenges/${id}`, data),
  delete: (id: string) => apiClient.delete(`/challenges/${id}`),
  start: (id: string) => apiClient.post<Challenge>(`/challenges/${id}/start`),
  cancel: (id: string) => apiClient.post<Challenge>(`/challenges/${id}/cancel`),
  getProgress: (id: string) => apiClient.get<ChallengeProgress>(`/challenges/${id}/progress`),

  // Invitations
  getPendingInvitations: () => apiClient.get<ChallengeParticipant[]>('/challenges/invitations'),
  invite: (id: string, userIds: number[]) =>
    apiClient.post(`/challenges/${id}/invite`, { userIds }),
  accept: (id: string) => apiClient.post<ChallengeParticipant>(`/challenges/${id}/accept`),
  decline: (id: string) => apiClient.post(`/challenges/${id}/decline`),
  leave: (id: string) => apiClient.post(`/challenges/${id}/leave`),

  // Events (polling)
  getEvents: (since?: string) => {
    const params = since ? `?since=${encodeURIComponent(since)}` : '';
    return apiClient.get<{ events: ChallengeEvent[]; latestTimestamp: string | null }>(
      `/challenges/events${params}`
    );
  },
  getChallengeEvents: (id: string, since?: string) => {
    const params = since ? `?since=${encodeURIComponent(since)}` : '';
    return apiClient.get<{ events: ChallengeEvent[]; latestTimestamp: string | null }>(
      `/challenges/${id}/events${params}`
    );
  },
};

export const friendsService = {
  search: (query: string) =>
    apiClient.get<Friend[]>(`/friends/search?q=${encodeURIComponent(query)}`),
};

export { trainingService } from './services/trainingService';
export type { TrainingProgram, TrainingWeek, TrainingSession } from './services/trainingService';
