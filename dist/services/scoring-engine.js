"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoringEngine = void 0;
const types_1 = require("../types");
/**
 * Core scoring engine for wellness tasks
 * Implements deterministic scoring algorithm as per specification
 */
class ScoringEngine {
    constructor(weights = types_1.DEFAULT_WEIGHTS) {
        this.weights = weights;
    }
    /**
     * Calculate urgency contribution for a task based on current metrics
     * Returns value between 0 and 1
     */
    urgencyContribution(task, metrics) {
        const { category } = task;
        switch (category) {
            case 'hydration':
                // If water_ml < 2000, urgency = (2000 - water_ml)/2000 else 0
                return metrics.water_ml < 2000 ? (2000 - metrics.water_ml) / 2000 : 0;
            case 'movement':
                // If steps < 8000, urgency = (8000 - steps)/8000 else 0
                return metrics.steps < 8000 ? (8000 - metrics.steps) / 8000 : 0;
            case 'sleep':
                // If sleep_hours < 7 → 1, else 0
                return metrics.sleep_hours < 7 ? 1 : 0;
            case 'screen':
                // If screen_time_min > 120 → 1, else 0
                return metrics.screen_time_min > 120 ? 1 : 0;
            case 'mood':
                // If mood_1to5 <= 2 → 1, else 0.3
                return metrics.mood_1to5 <= 2 ? 1 : 0.3;
            default:
                return 0;
        }
    }
    /**
     * Calculate inverse effort score
     * inverseEffort(mins) = 1 / log2(mins + 2)
     * Smaller tasks get a slight boost
     */
    inverseEffort(effortMinutes) {
        // Ensure mins >= 1 to avoid errors
        const mins = Math.max(effortMinutes, 1);
        return 1 / Math.log2(mins + 2);
    }
    /**
     * Calculate time of day factor
     * Returns 1 if within window, 0.2 if outside, 1 if no gate
     */
    timeOfDayFactor(timeGate, currentTime) {
        if (!timeGate) {
            return 1; // No time gate, always eligible
        }
        const timeWindow = timeGate;
        if (!types_1.TIME_WINDOWS[timeWindow]) {
            return 1; // Unknown time window, default to eligible
        }
        const currentHourMin = this.extractHourMinute(currentTime);
        const windowStart = this.parseTime(types_1.TIME_WINDOWS[timeWindow].start);
        const windowEnd = this.parseTime(types_1.TIME_WINDOWS[timeWindow].end);
        if (this.isTimeInWindow(currentHourMin, windowStart, windowEnd)) {
            return 1;
        }
        else {
            return 0.2;
        }
    }
    /**
     * Calculate the final score for a task
     */
    calculateScore(task, metrics, currentTime) {
        const urgency = this.urgencyContribution(task, metrics);
        const impact = task.impact_weight;
        const effort = this.inverseEffort(task.effort_min);
        const timeOfDay = this.timeOfDayFactor(task.time_gate, currentTime);
        const ignoresPenalty = task.ignores;
        const score = (this.weights.W_urgency * urgency +
            this.weights.W_impact * impact +
            this.weights.W_effort * effort +
            this.weights.W_tod * timeOfDay -
            this.weights.W_penalty * ignoresPenalty);
        // Round to 4 decimal places for precision
        const roundedScore = Math.round(score * 10000) / 10000;
        const rationale = this.generateRationale(task, metrics, urgency, impact, effort, timeOfDay, ignoresPenalty);
        return {
            task,
            score: roundedScore,
            rationale,
            urgencyContribution: Math.round(urgency * 10000) / 10000,
            impactContribution: Math.round(impact * 10000) / 10000,
            effortContribution: Math.round(effort * 10000) / 10000,
            timeOfDayContribution: Math.round(timeOfDay * 10000) / 10000,
            ignoresPenalty: Math.round(ignoresPenalty * 10000) / 10000
        };
    }
    /**
     * Generate human-readable rationale for the score
     */
    generateRationale(task, metrics, urgency, impact, effort, timeOfDay, ignoresPenalty) {
        const components = [
            `urgency: ${urgency.toFixed(4)} (${this.getUrgencyReason(task, metrics)})`,
            `impact: ${impact.toFixed(4)}`,
            `effort: ${effort.toFixed(4)} (${task.effort_min} mins)`,
            `time: ${timeOfDay.toFixed(4)} ${task.time_gate ? `(${task.time_gate} window)` : '(no gate)'}`,
            `penalty: -${ignoresPenalty.toFixed(4)} (${task.ignores} ignores)`
        ];
        return components.join(', ');
    }
    /**
     * Get specific urgency reason based on category and metrics
     */
    getUrgencyReason(task, metrics) {
        switch (task.category) {
            case 'hydration':
                return `${metrics.water_ml}ml/2000ml water`;
            case 'movement':
                return `${metrics.steps}/8000 steps`;
            case 'sleep':
                return `${metrics.sleep_hours}h sleep`;
            case 'screen':
                return `${metrics.screen_time_min} mins screen time`;
            case 'mood':
                return `mood: ${metrics.mood_1to5}/5`;
            default:
                return 'unknown';
        }
    }
    /**
     * Extract hour and minute from ISO datetime string
     * NOTE: For this implementation, we assume local time interpretation
     * In a real system, you'd handle timezones properly
     */
    extractHourMinute(isoDateTime) {
        const date = new Date(isoDateTime);
        // For this test, we'll treat UTC time as local time for simplicity
        return {
            hour: date.getUTCHours(),
            minute: date.getUTCMinutes()
        };
    }
    /**
     * Parse time string (HH:MM) to hour and minute
     */
    parseTime(timeString) {
        const [hour, minute] = timeString.split(':').map(Number);
        return { hour, minute };
    }
    /**
     * Check if current time is within the specified window
     */
    isTimeInWindow(current, start, end) {
        const currentMinutes = current.hour * 60 + current.minute;
        const startMinutes = start.hour * 60 + start.minute;
        const endMinutes = end.hour * 60 + end.minute;
        return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    }
}
exports.ScoringEngine = ScoringEngine;
//# sourceMappingURL=scoring-engine.js.map