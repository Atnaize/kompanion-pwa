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
}

export interface Quest {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  type: 'weekly' | 'monthly' | 'special';
  objectives: QuestObjective[];
  rewards: {
    xp: number;
    achievements?: string[];
  };
  status: 'active' | 'completed' | 'expired';
}

export interface QuestObjective {
  id: string;
  description: string;
  type: 'distance' | 'elevation' | 'activities' | 'time';
  target: number;
  current: number;
  activityType?: string;
  completed: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
