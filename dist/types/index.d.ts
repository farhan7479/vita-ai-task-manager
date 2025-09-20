export interface Task {
    id: string;
    title: string;
    category: 'hydration' | 'movement' | 'screen' | 'sleep' | 'mood';
    impact_weight: number;
    effort_min: number;
    time_gate?: 'morning' | 'day' | 'evening';
    micro_alt?: string;
    ignores: number;
    completedToday: boolean;
    lastIgnoreDate?: string;
    lastCompleteDate?: string;
}
export interface UserMetrics {
    water_ml: number;
    steps: number;
    sleep_hours: number;
    screen_time_min: number;
    mood_1to5: number;
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
    date: string;
    completion_status: 'completed' | 'dismissed' | 'ignored';
    timestamp: string;
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
    currentTime: string;
    localDate: string;
}
export interface RecommendationResponse {
    tasks: TaskScore[];
    timestamp: string;
    localDate: string;
}
export interface ActionRequest {
    taskId: string;
    timestamp?: string;
}
export interface ActionResponse {
    success: boolean;
    message: string;
    task?: Task;
}
export type TimeWindow = 'morning' | 'day' | 'evening';
export interface TimeWindowConfig {
    morning: {
        start: string;
        end: string;
    };
    day: {
        start: string;
        end: string;
    };
    evening: {
        start: string;
        end: string;
    };
}
export declare const DEFAULT_WEIGHTS: ScoringWeights;
export declare const TIME_WINDOWS: TimeWindowConfig;
//# sourceMappingURL=index.d.ts.map