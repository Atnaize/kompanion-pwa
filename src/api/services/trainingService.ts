import { apiClient } from '../client';

export interface TrainingSession {
  date: string;
  length: string;
  pace: string;
  extra: string;
  day: number;
}

export interface TrainingWeek {
  week: number;
  start_date: string;
  end_date: string;
  sessions: TrainingSession[];
}

export interface TrainingProgram {
  title: string;
  start_date: string;
  objective: string;
  duration_weeks: number;
  weeks: TrainingWeek[];
  total_sessions: number;
}

export const trainingService = {
  /**
   * Get the full marathon training program
   */
  async getProgram() {
    return apiClient.get<TrainingProgram>('/training/program');
  },

  /**
   * Get a specific week from the training program
   */
  async getWeek(weekNumber: number) {
    return apiClient.get<TrainingWeek>(`/training/week/${weekNumber}`);
  },

  /**
   * Get the current week based on today's date
   */
  async getCurrentWeek() {
    return apiClient.get<TrainingWeek | null>('/training/current-week');
  },
};
