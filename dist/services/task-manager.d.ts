import { Task, TaskScore, RecommendationRequest } from '../types';
/**
 * Task Manager service handling task selection, substitution, and prioritization
 */
export declare class TaskManager {
    private tasks;
    private scoringEngine;
    private dismissedInCurrentCycle;
    constructor();
    /**
     * Add or update a task in the catalog
     */
    addTask(task: Task): void;
    /**
     * Get a task by ID
     */
    getTask(taskId: string): Task | undefined;
    /**
     * Get all tasks
     */
    getAllTasks(): Task[];
    /**
     * Mark task as completed for today
     */
    completeTask(taskId: string, currentDate: string): boolean;
    /**
     * Mark task as dismissed/ignored
     */
    dismissTask(taskId: string, currentDate: string): boolean;
    /**
     * Reset daily state for all tasks
     */
    resetDailyState(): void;
    /**
     * Check if daily reset is needed and perform it
     */
    checkAndPerformDailyReset(currentDate: string): boolean;
    /**
     * Get top 4 recommended tasks based on scoring
     */
    getRecommendations(request: RecommendationRequest): TaskScore[];
    /**
     * Apply substitution logic for tasks with micro alternatives
     */
    private applySubstitutionLogic;
    /**
     * Relax time gates if fewer than 4 eligible tasks
     */
    private relaxTimeGatesIfNeeded;
    /**
     * Compare tasks for sorting (tie-breaking logic)
     * Sort by: score desc, then impact_weight desc, then effort_min asc, then id asc
     */
    private compareTasks;
    /**
     * Load seed data into task catalog
     */
    loadSeedData(): void;
    /**
     * Clear all tasks (useful for testing)
     */
    clearAllTasks(): void;
}
//# sourceMappingURL=task-manager.d.ts.map