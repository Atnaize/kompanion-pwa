export interface User {
  userId: number;
  stravaId: number;
  username: string;
  firstname: string;
  lastname: string;
  profile: string;
  lastSyncedAt?: string;
}

export interface SyncResult {
  synced: number;
  total: number;
  isIncremental: boolean;
}

export interface SegmentEffort {
  id: number;
  elapsed_time: number;
  moving_time: number;
  distance: number;
  pr_rank: number | null;
  segment: {
    id: number;
    name: string;
    activity_type: string;
    distance: number;
    average_grade: number;
  };
}

export interface Activity {
  id: number;
  name: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  type: string;
  sport_type: string;
  start_date: string;
  start_date_local: string;
  average_speed: number;
  max_speed: number;
  average_heartrate?: number;
  max_heartrate?: number;
  average_watts?: number;
  max_watts?: number;
  elev_high?: number;
  elev_low?: number;
  pr_count: number;
  kudos_count: number;
  comment_count: number;
  achievement_count: number;
  segment_efforts?: SegmentEffort[];
}

export interface Stats {
  userId: number;
  totalDistance: number;
  totalElevation: number;
  totalActivities: number;
  totalTime: number;
  currentStreak: number;
  longestStreak: number;
  level: number;
  xp: number;
  byActivityType: {
    [key: string]: {
      count: number;
      distance: number;
      elevation: number;
      time: number;
    };
  };
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirement: {
    type: 'distance' | 'elevation' | 'activities' | 'speed' | 'streak';
    value: number;
    activityType?: string;
  };
  unlockedAt?: string;
  isRedeemable?: boolean;
  isSecret?: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Challenge System Types
export type ChallengeType = 'collaborative' | 'competitive';
export type ChallengeStatus = 'draft' | 'active' | 'completed' | 'failed' | 'cancelled';
export type ParticipantStatus = 'invited' | 'accepted' | 'declined' | 'left';
export type CompetitiveGoal = 'most' | 'least' | 'exact';
export type ChallengeEventType =
  | 'created'
  | 'started'
  | 'activity_added'
  | 'milestone_reached'
  | 'lead_change'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface ChallengeTargets {
  distance?: number; // meters
  elevation?: number; // meters
  activities?: number; // number of activities
  activityType?: string;
}

export interface ChallengeParticipant {
  id: number;
  challengeId: string;
  userId: number;
  status: ParticipantStatus;
  invitedAt: string;
  acceptedAt?: string;
  totalDistance: number;
  totalElevation: number;
  activityCount: number;
  lastActivityAt?: string;
  user: {
    id: number;
    firstname: string;
    lastname: string;
    profile: string;
    profileMedium?: string;
  };
  challenge?: Challenge;
}

export interface Challenge {
  id: string;
  creatorId: number;
  name: string;
  description?: string;
  type: ChallengeType;
  status: ChallengeStatus;
  startDate: string;
  endDate: string;
  targets: ChallengeTargets;
  competitiveGoal?: CompetitiveGoal;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: number;
    firstname: string;
    lastname: string;
    profile: string;
  };
  participants?: ChallengeParticipant[];
}

export interface ChallengeEvent {
  id: string;
  challengeId: string;
  userId?: number;
  type: ChallengeEventType;
  data: Record<string, unknown>;
  createdAt: string;
}

export interface ChallengeProgress {
  totalProgress: {
    distance: number;
    elevation: number;
    activityCount: number;
  };
  targetProgress: {
    distance?: number;
    elevation?: number;
  };
  isComplete: boolean;
}

export interface Friend {
  id: number;
  stravaId: number;
  firstname: string;
  lastname: string;
  profile: string;
  profileMedium: string;
}
