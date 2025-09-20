"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const scoring_engine_1 = require("./services/scoring-engine");
// Debug calculations for Scenario A
const scoringEngine = new scoring_engine_1.ScoringEngine();
const metrics = {
    water_ml: 900,
    steps: 4000,
    sleep_hours: 6,
    screen_time_min: 150,
    mood_1to5: 2
};
const currentTime = '2023-12-20T15:00:00Z'; // 15:00 = "day" window
const screenBreakTask = {
    id: "screen-break-10",
    title: "Take a 10-min screen break",
    category: "screen",
    impact_weight: 5,
    effort_min: 10,
    ignores: 0,
    completedToday: false
};
console.log('=== SCENARIO A DEBUG ===');
console.log('Metrics:', metrics);
console.log('Current time:', currentTime);
// Debug screen-break-10 scoring
console.log('\n--- screen-break-10 Task ---');
console.log('Task:', screenBreakTask);
const urgency = scoringEngine.urgencyContribution(screenBreakTask, metrics);
const impact = screenBreakTask.impact_weight;
const effort = scoringEngine.inverseEffort(screenBreakTask.effort_min);
const timeOfDay = scoringEngine.timeOfDayFactor(screenBreakTask.time_gate, currentTime);
const penalty = screenBreakTask.ignores;
console.log(`Urgency: ${urgency} (screen_time: ${metrics.screen_time_min}min > 120)`);
console.log(`Impact: ${impact}`);
console.log(`Effort: ${effort} (inverseEffort(${screenBreakTask.effort_min}min))`);
console.log(`Time of Day: ${timeOfDay} (no gate = always 1)`);
console.log(`Penalty: ${penalty} ignores`);
// Manual calculation
const weights = {
    W_urgency: 0.5,
    W_impact: 0.3,
    W_effort: 0.15,
    W_tod: 0.15,
    W_penalty: 0.2
};
const manualScore = weights.W_urgency * urgency +
    weights.W_impact * impact +
    weights.W_effort * effort +
    weights.W_tod * timeOfDay -
    weights.W_penalty * penalty;
console.log(`Manual calculation: ${weights.W_urgency} * ${urgency} + ${weights.W_impact} * ${impact} + ${weights.W_effort} * ${effort} + ${weights.W_tod} * ${timeOfDay} - ${weights.W_penalty} * ${penalty} = ${manualScore}`);
const engineScore = scoringEngine.calculateScore(screenBreakTask, metrics, currentTime);
console.log(`Engine score: ${engineScore.score}`);
console.log(`Expected: 1.8918`);
console.log(`Difference: ${Math.abs(engineScore.score - 1.8918)}`);
// Test specific components
console.log('\n=== COMPONENT TESTS ===');
// Test inverse effort for specific values
console.log('Inverse Effort Tests:');
const efforts = [3, 5, 10, 15];
efforts.forEach(mins => {
    const result = scoringEngine.inverseEffort(mins);
    console.log(`inverseEffort(${mins}) = ${result} (= 1 / log2(${mins} + 2) = 1 / log2(${mins + 2}) = 1 / ${Math.log2(mins + 2)})`);
});
// Test urgency calculations
console.log('\nUrgency Tests:');
console.log(`Screen urgency: ${urgency} (${metrics.screen_time_min} > 120 ? 1 : 0)`);
console.log(`Water urgency: ${scoringEngine.urgencyContribution({ ...screenBreakTask, category: 'hydration' }, metrics)} ((2000 - ${metrics.water_ml})/2000 = ${(2000 - metrics.water_ml) / 2000})`);
console.log(`Steps urgency: ${scoringEngine.urgencyContribution({ ...screenBreakTask, category: 'movement' }, metrics)} ((8000 - ${metrics.steps})/8000 = ${(8000 - metrics.steps) / 8000})`);
console.log(`Sleep urgency: ${scoringEngine.urgencyContribution({ ...screenBreakTask, category: 'sleep' }, metrics)} (${metrics.sleep_hours} < 7 ? 1 : 0)`);
console.log(`Mood urgency: ${scoringEngine.urgencyContribution({ ...screenBreakTask, category: 'mood' }, metrics)} (${metrics.mood_1to5} <= 2 ? 1 : 0.3)`);
//# sourceMappingURL=debug-calculations.js.map