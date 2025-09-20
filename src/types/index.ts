// Core data types for the Smart Task Manager

export interface Task {
  id: string;
  title: string;
  category: 'hydration' | 'movement' | 'screen' | 'sleep' | 'mood';
  impact_weight: number;
  effort_min: number;
  time_gate?: 'morning' | 'day' | 'evening';
  micro_alt?: string; // ID of micro-task alternative
  ignores: number;
  completedToday: boolean;
  lastIgnoreDate?: string; // ISO date string
  lastCompleteDate?: string; // ISO date string
}

export interface UserMetrics {
  water_ml: number;
  steps: number;
  sleep_hours: number;
  screen_time_min: number;
  mood_1to5: number; // 1-5 scale
}

export interface TaskScore {
  task: Task;
  score: number;
  rationale: string;
  urgencyContribution: number;
  impactContribution: number;
  effortContribution: number;
  timeOfDayContribution: number;
  ignoresPenalty: number;
}

export interface TaskHistory {
  user_id: string;
  task_id: string;
  date: string; // ISO date string
  completion_status: 'completed' | 'dismissed' | 'ignored';
  timestamp: string; // ISO datetime string
}

export interface ScoringWeights {
  W_urgency: number;
  W_impact: number;
  W_effort: number;
  W_tod: number;
  W_penalty: number;
}

export interface RecommendationRequest {
  metrics: UserMetrics;
  currentTime: string; // ISO datetime string
  localDate: string; // ISO date string (YYYY-MM-DD)
}

export interface RecommendationResponse {
  tasks: TaskScore[];
  timestamp: string;
  localDate: string;
}

export interface ActionRequest {
  taskId: string;
  timestamp?: string; // ISO datetime string
}

export interface ActionResponse {
  success: boolean;
  message: string;
  task?: Task;
}

export type TimeWindow = 'morning' | 'day' | 'evening';

export interface TimeWindowConfig {
  morning: { start: string; end: string }; // "05:00" - "11:59"
  day: { start: string; end: string };     // "12:00" - "17:59"
  evening: { start: string; end: string }; // "18:00" - "23:59"
}

// Default scoring weights as specified in requirements
export const DEFAULT_WEIGHTS: ScoringWeights = {
  W_urgency: 0.5,
  W_impact: 0.3,
  W_effort: 0.15,
  W_tod: 0.15,
  W_penalty: 0.2
};

// Time windows as specified in requirements
export const TIME_WINDOWS: TimeWindowConfig = {
  morning: { start: '05:00', end: '11:59' },
  day: { start: '12:00', end: '17:59' },
  evening: { start: '18:00', end: '23:59' }
};