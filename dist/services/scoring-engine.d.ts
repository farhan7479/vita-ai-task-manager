import { Task, UserMetrics, TaskScore, ScoringWeights } from '../types';
/**
 * Core scoring engine for wellness tasks
 * Implements deterministic scoring algorithm as per specification
 */
export declare class ScoringEngine {
    private weights;
    constructor(weights?: ScoringWeights);
    /**
     * Calculate urgency contribution for a task based on current metrics
     * Returns value between 0 and 1
     */
    urgencyContribution(task: Task, metrics: UserMetrics): number;
    /**
     * Calculate inverse effort score
     * inverseEffort(mins) = 1 / log2(mins + 2)
     * Smaller tasks get a slight boost
     */
    inverseEffort(effortMinutes: number): number;
    /**
     * Calculate time of day factor
     * Returns 1 if within window, 0.2 if outside, 1 if no gate
     */
    timeOfDayFactor(timeGate: string | undefined, currentTime: string): number;
    /**
     * Calculate the final score for a task
     */
    calculateScore(task: Task, metrics: UserMetrics, currentTime: string): TaskScore;
    /**
     * Generate human-readable rationale for the score
     */
    private generateRationale;
    /**
     * Get specific urgency reason based on category and metrics
     */
    private getUrgencyReason;
    /**
     * Extract hour and minute from ISO datetime string
     * NOTE: For this implementation, we assume local time interpretation
     * In a real system, you'd handle timezones properly
     */
    private extractHourMinute;
    /**
     * Parse time string (HH:MM) to hour and minute
     */
    private parseTime;
    /**
     * Check if current time is within the specified window
     */
    private isTimeInWindow;
}
//# sourceMappingURL=scoring-engine.d.ts.map