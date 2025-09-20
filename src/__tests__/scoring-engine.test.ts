import { ScoringEngine } from '../services/scoring-engine';
import { Task, UserMetrics } from '../types';

describe('ScoringEngine', () => {
  let scoringEngine: ScoringEngine;
  
  beforeEach(() => {
    scoringEngine = new ScoringEngine();
  });

  describe('urgencyContribution', () => {
    it('should calculate hydration urgency correctly', () => {
      const task: Task = {
        id: 'test-hydration',
        title: 'Test Hydration',
        category: 'hydration',
        impact_weight: 4,
        effort_min: 5,
        ignores: 0,
        completedToday: false
      };

      // Test boundary conditions
      expect(scoringEngine.urgencyContribution(task, { water_ml: 0, steps: 0, sleep_hours: 0, screen_time_min: 0, mood_1to5: 1 }))
        .toBe(1); // (2000 - 0) / 2000 = 1
      
      expect(scoringEngine.urgencyContribution(task, { water_ml: 1000, steps: 0, sleep_hours: 0, screen_time_min: 0, mood_1to5: 1 }))
        .toBe(0.5); // (2000 - 1000) / 2000 = 0.5
      
      expect(scoringEngine.urgencyContribution(task, { water_ml: 2000, steps: 0, sleep_hours: 0, screen_time_min: 0, mood_1to5: 1 }))
        .toBe(0); // At goal, urgency = 0
      
      expect(scoringEngine.urgencyContribution(task, { water_ml: 3000, steps: 0, sleep_hours: 0, screen_time_min: 0, mood_1to5: 1 }))
        .toBe(0); // Above goal, urgency = 0
    });

    it('should calculate movement urgency correctly', () => {
      const task: Task = {
        id: 'test-movement',
        title: 'Test Movement',
        category: 'movement',
        impact_weight: 4,
        effort_min: 10,
        ignores: 0,
        completedToday: false
      };

      // Test boundary conditions
      expect(scoringEngine.urgencyContribution(task, { water_ml: 0, steps: 0, sleep_hours: 0, screen_time_min: 0, mood_1to5: 1 }))
        .toBe(1); // (8000 - 0) / 8000 = 1
      
      expect(scoringEngine.urgencyContribution(task, { water_ml: 0, steps: 4000, sleep_hours: 0, screen_time_min: 0, mood_1to5: 1 }))
        .toBe(0.5); // (8000 - 4000) / 8000 = 0.5
      
      expect(scoringEngine.urgencyContribution(task, { water_ml: 0, steps: 8000, sleep_hours: 0, screen_time_min: 0, mood_1to5: 1 }))
        .toBe(0); // At goal, urgency = 0
    });

    it('should calculate sleep urgency correctly', () => {
      const task: Task = {
        id: 'test-sleep',
        title: 'Test Sleep',
        category: 'sleep',
        impact_weight: 5,
        effort_min: 15,
        ignores: 0,
        completedToday: false
      };

      expect(scoringEngine.urgencyContribution(task, { water_ml: 0, steps: 0, sleep_hours: 5, screen_time_min: 0, mood_1to5: 1 }))
        .toBe(1); // < 7 hours = 1
      
      expect(scoringEngine.urgencyContribution(task, { water_ml: 0, steps: 0, sleep_hours: 6.9, screen_time_min: 0, mood_1to5: 1 }))
        .toBe(1); // < 7 hours = 1
      
      expect(scoringEngine.urgencyContribution(task, { water_ml: 0, steps: 0, sleep_hours: 7, screen_time_min: 0, mood_1to5: 1 }))
        .toBe(0); // >= 7 hours = 0
      
      expect(scoringEngine.urgencyContribution(task, { water_ml: 0, steps: 0, sleep_hours: 8, screen_time_min: 0, mood_1to5: 1 }))
        .toBe(0); // >= 7 hours = 0
    });

    it('should calculate screen time urgency correctly', () => {
      const task: Task = {
        id: 'test-screen',
        title: 'Test Screen',
        category: 'screen',
        impact_weight: 5,
        effort_min: 10,
        ignores: 0,
        completedToday: false
      };

      expect(scoringEngine.urgencyContribution(task, { water_ml: 0, steps: 0, sleep_hours: 0, screen_time_min: 100, mood_1to5: 1 }))
        .toBe(0); // <= 120 mins = 0
      
      expect(scoringEngine.urgencyContribution(task, { water_ml: 0, steps: 0, sleep_hours: 0, screen_time_min: 120, mood_1to5: 1 }))
        .toBe(0); // <= 120 mins = 0
      
      expect(scoringEngine.urgencyContribution(task, { water_ml: 0, steps: 0, sleep_hours: 0, screen_time_min: 121, mood_1to5: 1 }))
        .toBe(1); // > 120 mins = 1
      
      expect(scoringEngine.urgencyContribution(task, { water_ml: 0, steps: 0, sleep_hours: 0, screen_time_min: 200, mood_1to5: 1 }))
        .toBe(1); // > 120 mins = 1
    });

    it('should calculate mood urgency correctly', () => {
      const task: Task = {
        id: 'test-mood',
        title: 'Test Mood',
        category: 'mood',
        impact_weight: 2,
        effort_min: 3,
        ignores: 0,
        completedToday: false
      };

      expect(scoringEngine.urgencyContribution(task, { water_ml: 0, steps: 0, sleep_hours: 0, screen_time_min: 0, mood_1to5: 1 }))
        .toBe(1); // <= 2 = 1
      
      expect(scoringEngine.urgencyContribution(task, { water_ml: 0, steps: 0, sleep_hours: 0, screen_time_min: 0, mood_1to5: 2 }))
        .toBe(1); // <= 2 = 1
      
      expect(scoringEngine.urgencyContribution(task, { water_ml: 0, steps: 0, sleep_hours: 0, screen_time_min: 0, mood_1to5: 3 }))
        .toBe(0.3); // > 2 = 0.3
      
      expect(scoringEngine.urgencyContribution(task, { water_ml: 0, steps: 0, sleep_hours: 0, screen_time_min: 0, mood_1to5: 5 }))
        .toBe(0.3); // > 2 = 0.3
    });
  });

  describe('inverseEffort', () => {
    it('should calculate inverse effort correctly for specified values', () => {
      // Test the specific values with our implementation (1/log2(mins+2))
      expect(Math.round(scoringEngine.inverseEffort(3) * 10000) / 10000).toBeCloseTo(0.4307, 4);
      expect(Math.round(scoringEngine.inverseEffort(5) * 10000) / 10000).toBeCloseTo(0.3562, 4);
      expect(Math.round(scoringEngine.inverseEffort(10) * 10000) / 10000).toBeCloseTo(0.2789, 4);
      expect(Math.round(scoringEngine.inverseEffort(15) * 10000) / 10000).toBeCloseTo(0.2447, 4);
    });

    it('should handle edge cases correctly', () => {
      // Test minimum value clamping
      expect(scoringEngine.inverseEffort(0)).toBeGreaterThan(0);
      expect(scoringEngine.inverseEffort(-5)).toBeGreaterThan(0);
      
      // Should equal 1/log2(1+2) = 1/log2(3) ≈ 0.631 for effort=1
      expect(Math.round(scoringEngine.inverseEffort(1) * 1000) / 1000).toBeCloseTo(0.631, 3);
    });
  });

  describe('timeOfDayFactor', () => {
    it('should return 1 for tasks with no time gate', () => {
      expect(scoringEngine.timeOfDayFactor(undefined, '2023-12-20T15:30:00Z')).toBe(1);
      expect(scoringEngine.timeOfDayFactor('', '2023-12-20T15:30:00Z')).toBe(1);
    });

    it('should return 1 when time is within gate', () => {
      // Morning window: 05:00-11:59
      expect(scoringEngine.timeOfDayFactor('morning', '2023-12-20T05:00:00Z')).toBe(1);
      expect(scoringEngine.timeOfDayFactor('morning', '2023-12-20T08:30:00Z')).toBe(1);
      expect(scoringEngine.timeOfDayFactor('morning', '2023-12-20T11:59:00Z')).toBe(1);

      // Day window: 12:00-17:59
      expect(scoringEngine.timeOfDayFactor('day', '2023-12-20T12:00:00Z')).toBe(1);
      expect(scoringEngine.timeOfDayFactor('day', '2023-12-20T15:30:00Z')).toBe(1);
      expect(scoringEngine.timeOfDayFactor('day', '2023-12-20T17:59:00Z')).toBe(1);

      // Evening window: 18:00-23:59
      expect(scoringEngine.timeOfDayFactor('evening', '2023-12-20T18:00:00Z')).toBe(1);
      expect(scoringEngine.timeOfDayFactor('evening', '2023-12-20T20:00:00Z')).toBe(1);
      expect(scoringEngine.timeOfDayFactor('evening', '2023-12-20T23:59:00Z')).toBe(1);
    });

    it('should return 0.2 when time is outside gate', () => {
      // Morning tasks outside window
      expect(scoringEngine.timeOfDayFactor('morning', '2023-12-20T12:00:00Z')).toBe(0.2);
      expect(scoringEngine.timeOfDayFactor('morning', '2023-12-20T18:00:00Z')).toBe(0.2);

      // Day tasks outside window
      expect(scoringEngine.timeOfDayFactor('day', '2023-12-20T08:00:00Z')).toBe(0.2);
      expect(scoringEngine.timeOfDayFactor('day', '2023-12-20T18:00:00Z')).toBe(0.2);

      // Evening tasks outside window
      expect(scoringEngine.timeOfDayFactor('evening', '2023-12-20T08:00:00Z')).toBe(0.2);
      expect(scoringEngine.timeOfDayFactor('evening', '2023-12-20T15:00:00Z')).toBe(0.2);
    });
  });

  describe('calculateScore - Reference Scenario A', () => {
    it('should match the calculated scores for Scenario A (deterministic)', () => {
      // Scenario A metrics
      const metrics: UserMetrics = {
        water_ml: 900,
        steps: 4000,
        sleep_hours: 6,
        screen_time_min: 150,
        mood_1to5: 2
      };
      const currentTime = '2023-12-20T15:00:00Z'; // 15:00 = "day" window

      // Create test tasks matching seed data
      const screenBreakTask: Task = {
        id: "screen-break-10",
        title: "Take a 10-min screen break",
        category: "screen",
        impact_weight: 5,
        effort_min: 10,
        ignores: 0,
        completedToday: false
      };

      const waterTask: Task = {
        id: "water-500",
        title: "Drink 500 ml water",
        category: "hydration",
        impact_weight: 4,
        effort_min: 5,
        ignores: 0,
        completedToday: false
      };

      const stepsTask: Task = {
        id: "steps-1k",
        title: "Walk 1,000 steps",
        category: "movement",
        impact_weight: 4,
        effort_min: 10,
        ignores: 0,
        completedToday: false
      };

      const moodTask: Task = {
        id: "mood-check-quick",
        title: "Quick mood check-in",
        category: "mood",
        impact_weight: 2,
        effort_min: 3,
        ignores: 0,
        completedToday: false
      };

      // Calculate scores
      const screenScore = scoringEngine.calculateScore(screenBreakTask, metrics, currentTime);
      const waterScore = scoringEngine.calculateScore(waterTask, metrics, currentTime);
      const stepsScore = scoringEngine.calculateScore(stepsTask, metrics, currentTime);
      const moodScore = scoringEngine.calculateScore(moodTask, metrics, currentTime);

      // Check deterministic scores (our calculated reference values)
      expect(screenScore.score).toBeCloseTo(2.1918, 4);
      expect(waterScore.score).toBeCloseTo(1.6784, 4);
      expect(stepsScore.score).toBeCloseTo(1.6418, 4);
      expect(moodScore.score).toBeCloseTo(1.3146, 4);

      console.log('Scenario A Scores:');
      console.log(`screen-break-10: ${screenScore.score}`);
      console.log(`water-500: ${waterScore.score}`);
      console.log(`steps-1k: ${stepsScore.score}`);
      console.log(`mood-check-quick: ${moodScore.score}`);
    });
  });
});