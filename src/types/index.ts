export interface User {
  userId: number;
  stravaId: number;
  username: string;
  firstname: string;
  lastname: string;
  profile: string;
  lastSyncedAt?: string;
  isAdmin: boolean;
}

export interface SyncResult {
  synced: number;
  total: number;
  isIncremental: boolean;
  challengesSynced: number;
  challengeActivitiesAdded: number;
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
  timezone?: string;
  average_speed: number;
  max_speed: number;
  average_heartrate?: number;
  max_heartrate?: number;
  average_watts?: number;
  weighted_average_watts?: number;
  max_watts?: number;
  kilojoules?: number;
  average_cadence?: number;
  average_temp?: number;
  calories?: number;
  suffer_score?: number;
  description?: string;
  device_name?: string;
  elev_high?: number;
  elev_low?: number;
  pr_count: number;
  kudos_count: number;
  comment_count: number;
  photo_count: number;
  total_photo_count: number;
  achievement_count: number;
  segment_efforts?: SegmentEffort[];
  map?: {
    id?: string;
    summary_polyline?: string;
    polyline?: string;
  };
}

export interface ActivityLap {
  id: number;
  lap_index: number;
  name: string;
  distance: number;
  elapsed_time: number;
  moving_time: number;
  average_speed: number;
  max_speed: number;
  total_elevation_gain: number;
  average_heartrate?: number;
  max_heartrate?: number;
  average_cadence?: number;
  average_watts?: number;
  split: number;
  start_date_local: string;
}

export type StreamType =
  | 'time'
  | 'distance'
  | 'latlng'
  | 'altitude'
  | 'velocity_smooth'
  | 'heartrate'
  | 'cadence'
  | 'watts'
  | 'temp'
  | 'moving'
  | 'grade_smooth';

export interface Stream<T = number> {
  type: StreamType;
  data: T[];
  series_type: 'distance' | 'time';
  original_size: number;
  resolution: 'low' | 'medium' | 'high';
}

export interface ActivityAthlete {
  id: number;
  firstname: string;
  lastname: string;
  profile?: string;
  profile_medium?: string;
}

export interface ActivityComment {
  id: number;
  activity_id: number;
  text: string;
  created_at: string;
  athlete: ActivityAthlete;
}

export interface ActivityPhoto {
  unique_id: string;
  urls: Record<string, string>;
  caption?: string | null;
  created_at?: string;
  sizes?: Record<string, [number, number]>;
}

export interface ActivityStreams {
  time?: Stream<number>;
  distance?: Stream<number>;
  latlng?: Stream<[number, number]>;
  altitude?: Stream<number>;
  velocity_smooth?: Stream<number>;
  heartrate?: Stream<number>;
  cadence?: Stream<number>;
  watts?: Stream<number>;
  temp?: Stream<number>;
  moving?: Stream<boolean>;
  grade_smooth?: Stream<number>;
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
  progress?: {
    currentValue: number;
    targetValue: number;
    percentage: number;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Challenge System Types
export type ChallengeType = 'collaborative' | 'competitive';
export type ChallengeStatus = 'active' | 'completed' | 'failed' | 'cancelled';
export type ParticipantStatus = 'invited' | 'accepted' | 'declined' | 'left';
export type CompetitiveGoal = 'most' | 'least' | 'exact';
export type ChallengeEventType =
  | 'created'
  | 'started'
  | 'invited'
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

export type PersonalRecordBand =
  | '400m'
  | '1km'
  | '5km'
  | '10km'
  | '15km'
  | 'half_marathon'
  | 'marathon';

export interface PersonalRecord {
  bestTimeSeconds: number;
  achievedAt: string;
  activity: {
    id: string;
    name: string;
  };
}

export interface PersonalRecordBandGroup {
  band: PersonalRecordBand;
  distanceMeters: number;
  records: PersonalRecord[];
}

export interface Friend {
  id: number;
  stravaId: number;
  firstname: string;
  lastname: string;
  profile: string;
  profileMedium: string;
}
