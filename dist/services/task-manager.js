"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskManager = void 0;
const scoring_engine_1 = require("./scoring-engine");
/**
 * Task Manager service handling task selection, substitution, and prioritization
 */
class TaskManager {
    constructor() {
        this.tasks = new Map();
        this.dismissedInCurrentCycle = new Set();
        /**
         * Compare tasks for sorting (tie-breaking logic)
         * Sort by: score desc, then impact_weight desc, then effort_min asc, then id asc
         */
        this.compareTasks = (a, b) => {
            // 1. Score descending
            if (a.score !== b.score) {
                return b.score - a.score;
            }
            // 2. Impact weight descending
            if (a.task.impact_weight !== b.task.impact_weight) {
                return b.task.impact_weight - a.task.impact_weight;
            }
            // 3. Effort ascending (lower effort first)
            if (a.task.effort_min !== b.task.effort_min) {
                return a.task.effort_min - b.task.effort_min;
            }
            // 4. ID ascending (alphabetical)
            return a.task.id.localeCompare(b.task.id);
        };
        this.scoringEngine = new scoring_engine_1.ScoringEngine();
    }
    /**
     * Add or update a task in the catalog
     */
    addTask(task) {
        this.tasks.set(task.id, { ...task });
    }
    /**
     * Get a task by ID
     */
    getTask(taskId) {
        return this.tasks.get(taskId);
    }
    /**
     * Get all tasks
     */
    getAllTasks() {
        return Array.from(this.tasks.values());
    }
    /**
     * Mark task as completed for today
     */
    completeTask(taskId, currentDate) {
        const task = this.tasks.get(taskId);
        if (!task) {
            return false;
        }
        task.completedToday = true;
        task.lastCompleteDate = currentDate;
        this.tasks.set(taskId, task);
        return true;
    }
    /**
     * Mark task as dismissed/ignored
     */
    dismissTask(taskId, currentDate) {
        const task = this.tasks.get(taskId);
        if (!task) {
            return false;
        }
        // Only increment ignores if it's the same day
        if (task.lastIgnoreDate !== currentDate) {
            task.ignores = 0; // Reset if it's a new day
        }
        task.ignores += 1;
        task.lastIgnoreDate = currentDate;
        this.dismissedInCurrentCycle.add(taskId);
        this.tasks.set(taskId, task);
        return true;
    }
    /**
     * Reset daily state for all tasks
     */
    resetDailyState() {
        for (const [id, task] of this.tasks.entries()) {
            task.completedToday = false;
            task.ignores = 0;
            this.tasks.set(id, task);
        }
        this.dismissedInCurrentCycle.clear();
    }
    /**
     * Check if daily reset is needed and perform it
     */
    checkAndPerformDailyReset(currentDate) {
        // Simple implementation: reset if any task has a different lastCompleteDate
        // In a real system, this would be more sophisticated
        for (const task of this.tasks.values()) {
            if (task.lastCompleteDate && task.lastCompleteDate !== currentDate && task.completedToday) {
                this.resetDailyState();
                return true;
            }
        }
        return false;
    }
    /**
     * Get top 4 recommended tasks based on scoring
     */
    getRecommendations(request) {
        const { metrics, currentTime, localDate } = request;
        // Clear dismissed cycle at start of new recommendation request
        this.dismissedInCurrentCycle.clear();
        // Check and perform daily reset if needed
        this.checkAndPerformDailyReset(localDate);
        // Build candidate set: tasks where completedToday === false
        let candidates = Array.from(this.tasks.values())
            .filter(task => !task.completedToday);
        // Apply substitution logic
        candidates = this.applySubstitutionLogic(candidates);
        // Calculate scores for all candidates
        const scoredTasks = candidates
            .map(task => this.scoringEngine.calculateScore(task, metrics, currentTime))
            .filter(scored => !this.dismissedInCurrentCycle.has(scored.task.id)); // Remove dismissed in current cycle
        // Sort by priority (score desc, impact desc, effort asc, id asc)
        scoredTasks.sort(this.compareTasks);
        // Return top 4, or relax time gates if fewer than 4
        let result = scoredTasks.slice(0, 4);
        if (result.length < 4) {
            result = this.relaxTimeGatesIfNeeded(candidates, metrics, currentTime, result.length);
        }
        return result.slice(0, 4); // Ensure exactly 4 or fewer
    }
    /**
     * Apply substitution logic for tasks with micro alternatives
     */
    applySubstitutionLogic(candidates) {
        const substituted = [];
        const substitutedParentIds = new Set();
        for (const task of candidates) {
            // If task has micro_alt and ignores >= 3, substitute with micro task
            if (task.micro_alt && task.ignores >= 3) {
                const microTask = this.tasks.get(task.micro_alt);
                if (microTask && !microTask.completedToday) {
                    substituted.push(microTask);
                    substitutedParentIds.add(task.id);
                    continue;
                }
            }
            // Don't add parent task if it was substituted
            if (!substitutedParentIds.has(task.id)) {
                substituted.push(task);
            }
        }
        return substituted;
    }
    /**
     * Relax time gates if fewer than 4 eligible tasks
     */
    relaxTimeGatesIfNeeded(candidates, metrics, currentTime, currentCount) {
        if (currentCount >= 4) {
            return [];
        }
        // Recalculate with relaxed time gates (timeOfDayFactor = 1 for all)
        const relaxedScored = candidates
            .filter(task => !this.dismissedInCurrentCycle.has(task.id))
            .map(task => {
            // Temporarily override time gate calculation
            const originalTimeGate = task.time_gate;
            const taskCopy = { ...task, time_gate: undefined }; // Remove time gate
            const scored = this.scoringEngine.calculateScore(taskCopy, metrics, currentTime);
            // Restore original for rationale display
            scored.task.time_gate = originalTimeGate;
            scored.timeOfDayContribution = 1; // Mark as relaxed
            return scored;
        });
        relaxedScored.sort(this.compareTasks);
        return relaxedScored.slice(0, 4 - currentCount);
    }
    /**
     * Load seed data into task catalog
     */
    loadSeedData() {
        const seedTasks = [
            {
                id: "water-500",
                title: "Drink 500 ml water",
                category: "hydration",
                impact_weight: 4,
                effort_min: 5,
                micro_alt: "water-250",
                ignores: 0,
                completedToday: false
            },
            {
                id: "water-250",
                title: "Drink 250 ml water",
                category: "hydration",
                impact_weight: 3,
                effort_min: 3,
                ignores: 0,
                completedToday: false
            },
            {
                id: "steps-1k",
                title: "Walk 1,000 steps",
                category: "movement",
                impact_weight: 4,
                effort_min: 10,
                micro_alt: "steps-300",
                ignores: 0,
                completedToday: false
            },
            {
                id: "steps-300",
                title: "Walk 300 steps (indoors ok)",
                category: "movement",
                impact_weight: 3,
                effort_min: 5,
                ignores: 0,
                completedToday: false
            },
            {
                id: "screen-break-10",
                title: "Take a 10-min screen break",
                category: "screen",
                impact_weight: 5,
                effort_min: 10,
                ignores: 0,
                completedToday: false
            },
            {
                id: "sleep-winddown-15",
                title: "15-min wind-down routine",
                category: "sleep",
                impact_weight: 5,
                effort_min: 15,
                time_gate: "evening",
                ignores: 0,
                completedToday: false
            },
            {
                id: "mood-check-quick",
                title: "Quick mood check-in",
                category: "mood",
                impact_weight: 2,
                effort_min: 3,
                ignores: 0,
                completedToday: false
            }
        ];
        for (const task of seedTasks) {
            this.addTask(task);
        }
    }
    /**
     * Clear all tasks (useful for testing)
     */
    clearAllTasks() {
        this.tasks.clear();
        this.dismissedInCurrentCycle.clear();
    }
}
exports.TaskManager = TaskManager;
//# sourceMappingURL=task-manager.js.map