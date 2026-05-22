import { apiClient } from './client';
import type {
  User,
  Activity,
  ActivityAthlete,
  ActivityComment,
  ActivityLap,
  ActivityPhoto,
  ActivityStreams,
  Stats,
  Achievement,
  SyncResult,
  Challenge,
  ChallengeProgress,
  ChallengeEvent,
  Friend,
  FriendSearchResult,
  FriendRequest,
  UserProfile,
  FeedPage,
  InboxPage,
  ChallengeTargets,
  ChallengeType,
  CompetitiveGoal,
  ChallengeParticipant,
  PersonalRecordBandGroup,
  FriendsLeaderboard,
  LeaderboardMetricKey,
  LeaderboardPeriod,
  CompareWithFriend,
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
      type: 'fetching' | 'saving' | 'processing' | 'complete' | 'error';
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
  getStreams: (id: number) => apiClient.get<ActivityStreams>(`/activities/${id}/streams`),
  getLaps: (id: number) => apiClient.get<ActivityLap[]>(`/activities/${id}/laps`),
  getKudoers: (id: number) => apiClient.get<ActivityAthlete[]>(`/activities/${id}/kudoers`),
  getComments: (id: number) => apiClient.get<ActivityComment[]>(`/activities/${id}/comments`),
  getPhotos: (id: number) => apiClient.get<ActivityPhoto[]>(`/activities/${id}/photos`),
};

const appendType = (params: URLSearchParams, activityType: string | null | undefined): void => {
  if (activityType && activityType !== 'all') {
    params.set('activityType', activityType);
  }
};

export const statsService = {
  getUserStats: (period?: 'week' | 'month' | 'year', activityType?: string | null) => {
    const params = new URLSearchParams();
    if (period) params.set('period', period);
    appendType(params, activityType);
    const qs = params.toString();
    return apiClient.get<Stats>(`/stats${qs ? `?${qs}` : ''}`);
  },
  getProgressData: (params: {
    metric: 'distance' | 'elevation' | 'count' | 'time';
    period: 'week' | 'month' | 'year' | 'all';
    groupBy: 'day' | 'week' | 'month';
    activityType?: string | null;
  }) => {
    const query = new URLSearchParams({
      metric: params.metric,
      period: params.period,
      groupBy: params.groupBy,
    });
    appendType(query, params.activityType);
    return apiClient.get<Array<{ date: string; value: number }>>(
      `/stats/progress?${query.toString()}`
    );
  },
  comparePeriods: (period: 'week' | 'month' | 'year', activityType?: string | null) => {
    const query = new URLSearchParams({ period });
    appendType(query, activityType);
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
    }>(`/stats/compare?${query.toString()}`);
  },
  compareCustomRanges: (params: {
    currentStart: string;
    currentEnd: string;
    previousStart: string;
    previousEnd: string;
    activityType?: string | null;
  }) => {
    const query = new URLSearchParams({
      currentStart: params.currentStart,
      currentEnd: params.currentEnd,
      previousStart: params.previousStart,
      previousEnd: params.previousEnd,
    });
    appendType(query, params.activityType);
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
    }>(`/stats/compare-custom?${query.toString()}`);
  },
  getHeatmapData: (metric: 'count' | 'distance' = 'count', activityType?: string | null) => {
    const query = new URLSearchParams({ metric });
    appendType(query, activityType);
    return apiClient.get<Array<{ date: string; value: number }>>(`/stats/heatmap?${query}`);
  },
};

export const leaderboardsService = {
  friends: (params: {
    metric: LeaderboardMetricKey;
    period: LeaderboardPeriod;
    activityType?: string | null;
  }) => {
    const query = new URLSearchParams({ metric: params.metric, period: params.period });
    appendType(query, params.activityType);
    return apiClient.get<FriendsLeaderboard>(`/leaderboards/friends?${query.toString()}`);
  },
};

export const statsCompareService = {
  withFriend: (params: {
    userId: number;
    period: LeaderboardPeriod;
    activityType?: string | null;
  }) => {
    const query = new URLSearchParams({
      with: String(params.userId),
      period: params.period,
    });
    appendType(query, params.activityType);
    return apiClient.get<CompareWithFriend>(`/stats/compare-friend?${query.toString()}`);
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
  cancel: (id: string) => apiClient.post<Challenge>(`/challenges/${id}/cancel`),
  getProgress: (id: string) => apiClient.get<ChallengeProgress>(`/challenges/${id}/progress`),

  // Completion summary
  getUnseenCompleted: () => apiClient.get<Challenge[]>('/challenges/unseen-completed'),
  markSummarySeen: (id: string) => apiClient.post(`/challenges/${id}/summary-seen`),

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

export interface PersonalRecordsStatus {
  processed: number;
  total: number;
  userDailyUsed: number;
  userDailyCap: number;
  userDailyRemaining: number;
  appDailyUsed: number;
  appDailyBudget: number;
  appDailyRemaining: number;
}

export type PersonalRecordsPausedReason = 'user_daily_cap' | 'app_daily_cap' | 'strava_rate_limit';

export interface PersonalRecordsBacklogEvent {
  type: 'processing' | 'paused' | 'complete' | 'error';
  current?: number;
  total?: number;
  reason?: PersonalRecordsPausedReason;
  message?: string;
}

export const personalRecordsService = {
  list: () => apiClient.get<PersonalRecordBandGroup[]>('/personal-records'),
  status: () => apiClient.get<PersonalRecordsStatus>('/personal-records/status'),
  processStream: (onEvent: (event: PersonalRecordsBacklogEvent) => void): Promise<void> => {
    return new Promise((resolve, reject) => {
      const baseURL = apiClient.getBaseURL();
      const token = localStorage.getItem('access_token');
      if (!token) {
        reject(new Error('Not authenticated'));
        return;
      }
      const url = `${baseURL}/personal-records/process/stream?token=${token}`;
      const eventSource = new EventSource(url);
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data) as PersonalRecordsBacklogEvent;
        onEvent(data);
        if (data.type === 'complete' || data.type === 'paused' || data.type === 'error') {
          eventSource.close();
          if (data.type === 'error') {
            reject(new Error(data.message || 'PR processing failed'));
          } else {
            resolve();
          }
        }
      };
      eventSource.onerror = () => {
        eventSource.close();
        reject(new Error('Connection failed'));
      };
    });
  },
};

export interface AdminQuotaOverview {
  date: string;
  appDailyUsed: number;
  appDailyBudget: number;
  appDailyRemaining: number;
  byKind: { pr_fetch: number; webhook_fetch: number; activity_sync: number };
  sparkline: Array<{ date: string; total: number }>;
}

export interface AdminQuotaUserRow {
  userId: number;
  username: string | null;
  firstname: string;
  lastname: string;
  prFetch: number;
  webhookFetch: number;
  activitySync: number;
  userDailyCap: number;
  userDailyRemaining: number;
  unprocessedRuns: number;
}

export interface AdminQuotaBacklogRow {
  userId: number;
  username: string | null;
  firstname: string;
  lastname: string;
  unprocessedRuns: number;
}

export interface AdminQuotaGrant {
  id: number;
  userId: number;
  kind: string;
  amount: number;
  validFrom: string;
  validUntil: string;
  grantedBy: number;
  grantedByName: string;
  note: string | null;
  createdAt: string;
}

export interface ActivitySyncProgressEvent {
  type: 'fetching' | 'saving' | 'processing' | 'complete' | 'error';
  current?: number;
  total?: number;
  message?: string;
  challengesSynced?: number;
  challengeActivitiesAdded?: number;
}

const streamSse = <T extends { type: string; message?: string }>(
  url: string,
  onEvent: (event: T) => void,
  terminalTypes: readonly string[],
  errorType = 'error'
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      reject(new Error('Not authenticated'));
      return;
    }
    const fullUrl = `${apiClient.getBaseURL()}${url}${url.includes('?') ? '&' : '?'}token=${token}`;
    const eventSource = new EventSource(fullUrl);
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data) as T;
      onEvent(data);
      if (terminalTypes.includes(data.type)) {
        eventSource.close();
        if (data.type === errorType) {
          reject(new Error(data.message || 'Stream failed'));
        } else {
          resolve();
        }
      }
    };
    eventSource.onerror = () => {
      eventSource.close();
      reject(new Error('Connection failed'));
    };
  });
};

export const adminQuotaService = {
  overview: () => apiClient.get<AdminQuotaOverview>('/admin/quota/overview'),
  users: (params: { date?: string; activeOnly?: boolean } = {}) => {
    const q = new URLSearchParams();
    if (params.date) q.set('date', params.date);
    if (params.activeOnly) q.set('activeOnly', 'true');
    const qs = q.toString();
    return apiClient.get<AdminQuotaUserRow[]>(`/admin/quota/users${qs ? `?${qs}` : ''}`);
  },
  backlog: () => apiClient.get<AdminQuotaBacklogRow[]>('/admin/quota/backlog'),
  listGrants: (userId: number) =>
    apiClient.get<AdminQuotaGrant[]>(`/admin/quota/grants?userId=${userId}`),
  createGrant: (body: { userId: number; amount: number; validUntil?: string; note?: string }) =>
    apiClient.post<AdminQuotaGrant>('/admin/quota/grants', body),
  revokeGrant: (id: number) => apiClient.delete(`/admin/quota/grants/${id}`),
  syncUserActivities: (
    userId: number,
    onEvent: (event: ActivitySyncProgressEvent) => void
  ): Promise<void> =>
    streamSse<ActivitySyncProgressEvent>(
      `/admin/quota/users/${userId}/sync-activities/stream`,
      onEvent,
      ['complete', 'error']
    ),
  processUserBacklog: (
    userId: number,
    onEvent: (event: PersonalRecordsBacklogEvent) => void
  ): Promise<void> =>
    streamSse<PersonalRecordsBacklogEvent>(
      `/admin/quota/users/${userId}/process-backlog/stream`,
      onEvent,
      ['complete', 'paused', 'error']
    ),
};

export const friendsService = {
  search: (query: string) =>
    apiClient.get<FriendSearchResult[]>(`/friends/search?q=${encodeURIComponent(query)}`),
  list: () => apiClient.get<Friend[]>('/friends'),
  listIncoming: () => apiClient.get<FriendRequest[]>('/friends/requests/incoming'),
  listOutgoing: () => apiClient.get<FriendRequest[]>('/friends/requests/outgoing'),
  sendRequest: (userId: number) => apiClient.post<FriendRequest>(`/friends/requests/${userId}`),
  acceptRequest: (userId: number) =>
    apiClient.post<FriendRequest>(`/friends/requests/${userId}/accept`),
  cancelOrDeclineRequest: (userId: number) => apiClient.delete(`/friends/requests/${userId}`),
  unfriend: (userId: number) => apiClient.delete(`/friends/${userId}`),
};

export const usersService = {
  getProfile: (userId: number) => apiClient.get<UserProfile>(`/users/${userId}/profile`),
};

export const privacyService = {
  block: (userId: number) => apiClient.post(`/privacy/blocks/${userId}`),
  unblock: (userId: number) => apiClient.delete(`/privacy/blocks/${userId}`),
  mute: (userId: number) => apiClient.post(`/privacy/mutes/${userId}`),
  unmute: (userId: number) => apiClient.delete(`/privacy/mutes/${userId}`),
  listBlocked: () => apiClient.get<Friend[]>('/privacy/blocks'),
  listMuted: () => apiClient.get<Friend[]>('/privacy/mutes'),
};

export const feedService = {
  list: (cursor?: string, limit?: number) => {
    const params = new URLSearchParams();
    if (cursor) params.set('cursor', cursor);
    if (limit) params.set('limit', String(limit));
    const qs = params.toString();
    return apiClient.get<FeedPage>(`/feed${qs ? `?${qs}` : ''}`);
  },
};

export const inboxService = {
  list: (cursor?: string, limit?: number) => {
    const params = new URLSearchParams();
    if (cursor) params.set('cursor', cursor);
    if (limit) params.set('limit', String(limit));
    const qs = params.toString();
    return apiClient.get<InboxPage>(`/inbox${qs ? `?${qs}` : ''}`);
  },
  unreadCount: () => apiClient.get<{ count: number }>('/inbox/count'),
  markRead: (id: string) => apiClient.post(`/inbox/${id}/read`),
  markAllRead: () => apiClient.post<{ count: number }>('/inbox/read-all'),
  delete: (id: string) => apiClient.delete(`/inbox/${id}`),
  deleteAll: () => apiClient.delete<{ count: number }>('/inbox'),
};
