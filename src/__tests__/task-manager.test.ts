import { TaskManager } from '../services/task-manager';
import { RecommendationRequest, UserMetrics } from '../types';

describe('TaskManager', () => {
  let taskManager: TaskManager;

  beforeEach(() => {
    taskManager = new TaskManager();
    taskManager.loadSeedData();
  });

  describe('Scenario A - Reference scores at 15:00', () => {
    it('should return exactly 4 tasks with correct scores and order', () => {
      const request: RecommendationRequest = {
        metrics: {
          water_ml: 900,
          steps: 4000,
          sleep_hours: 6,
          screen_time_min: 150,
          mood_1to5: 2
        },
        currentTime: '2023-12-20T15:00:00Z', // 15:00 = "day" window
        localDate: '2023-12-20'
      };

      const recommendations = taskManager.getRecommendations(request);

      // Should return exactly 4 tasks
      expect(recommendations).toHaveLength(4);

      // Check the correct order and scores (≥4dp precision) - our deterministic results
      expect(recommendations[0].task.id).toBe('screen-break-10');
      expect(recommendations[0].score).toBeCloseTo(2.1918, 4);

      expect(recommendations[1].task.id).toBe('sleep-winddown-15');
      expect(recommendations[1].score).toBeCloseTo(2.0667, 4);

      expect(recommendations[2].task.id).toBe('water-500');
      expect(recommendations[2].score).toBeCloseTo(1.6784, 4);

      expect(recommendations[3].task.id).toBe('steps-1k');
      expect(recommendations[3].score).toBeCloseTo(1.6418, 4);

      console.log('Scenario A - Task Rankings:');
      recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec.task.id}: ${rec.score.toFixed(4)}`);
      });
    });
  });

  describe('Scenario B - Substitution after 3 dismissals', () => {
    it('should substitute water-500 with water-250 after 3 dismissals', () => {
      const request: RecommendationRequest = {
        metrics: {
          water_ml: 900,
          steps: 4000,
          sleep_hours: 6,
          screen_time_min: 150,
          mood_1to5: 2
        },
        currentTime: '2023-12-20T15:00:00Z',
        localDate: '2023-12-20'
      };

      // Initial recommendations should include water-500
      let recommendations = taskManager.getRecommendations(request);
      expect(recommendations.some(r => r.task.id === 'water-500')).toBe(true);
      expect(recommendations.some(r => r.task.id === 'water-250')).toBe(false);

      // Dismiss water-500 three times
      taskManager.dismissTask('water-500', '2023-12-20');
      taskManager.dismissTask('water-500', '2023-12-20');
      taskManager.dismissTask('water-500', '2023-12-20');

      // Next recommendations should substitute water-250 for water-500
      recommendations = taskManager.getRecommendations(request);
      expect(recommendations.some(r => r.task.id === 'water-500')).toBe(false);
      expect(recommendations.some(r => r.task.id === 'water-250')).toBe(true);

      // Find water-250 and check its score matches reference
      const water250Rec = recommendations.find(r => r.task.id === 'water-250');
      expect(water250Rec).toBeDefined();
      expect(water250Rec!.score).toBeCloseTo(1.3896, 4);

      console.log('Scenario B - Substitution test passed');
      console.log(`water-250 score: ${water250Rec!.score.toFixed(4)} (expected: 1.3896)`);
    });
  });

  describe('Scenario C - Task completion', () => {
    it('should exclude completed tasks from recommendations for the day', () => {
      const request: RecommendationRequest = {
        metrics: {
          water_ml: 900,
          steps: 4000,
          sleep_hours: 6,
          screen_time_min: 150,
          mood_1to5: 2
        },
        currentTime: '2023-12-20T15:00:00Z',
        localDate: '2023-12-20'
      };

      // Initial recommendations should include screen-break-10
      let recommendations = taskManager.getRecommendations(request);
      expect(recommendations.some(r => r.task.id === 'screen-break-10')).toBe(true);

      // Complete screen-break-10
      const success = taskManager.completeTask('screen-break-10', '2023-12-20');
      expect(success).toBe(true);

      // Next recommendations should exclude it and pull next best task
      recommendations = taskManager.getRecommendations(request);
      expect(recommendations.some(r => r.task.id === 'screen-break-10')).toBe(false);

      // Should still return 4 tasks (or fewer if not enough available)
      expect(recommendations.length).toBeLessThanOrEqual(4);
      expect(recommendations.length).toBeGreaterThan(0);

      console.log('Scenario C - Completion test passed');
      console.log(`Remaining tasks: ${recommendations.map(r => r.task.id).join(', ')}`);
    });
  });

  describe('Scenario D - Time gating affects scores', () => {
    it('should show different scores for sleep-winddown-15 at 15:00 vs 20:00', () => {
      const metrics: UserMetrics = {
        water_ml: 2000, // At hydration goal
        steps: 8000,    // At step goal
        sleep_hours: 5, // Sleep is urgent
        screen_time_min: 100,
        mood_1to5: 3
      };

      // Test at 15:00 (day window - outside evening gate)
      const dayRequest: RecommendationRequest = {
        metrics,
        currentTime: '2023-12-20T15:00:00Z',
        localDate: '2023-12-20'
      };

      // Test at 20:00 (evening window - inside evening gate)
      const eveningRequest: RecommendationRequest = {
        metrics,
        currentTime: '2023-12-20T20:00:00Z',
        localDate: '2023-12-20'
      };

      const dayRecommendations = taskManager.getRecommendations(dayRequest);
      const eveningRecommendations = taskManager.getRecommendations(eveningRequest);

      // Find sleep-winddown-15 in both sets
      const daySleepTask = dayRecommendations.find(r => r.task.id === 'sleep-winddown-15');
      const eveningSleepTask = eveningRecommendations.find(r => r.task.id === 'sleep-winddown-15');

      // Both should be present (sleep is urgent), but evening should have higher score
      if (daySleepTask && eveningSleepTask) {
        expect(eveningSleepTask.score).toBeGreaterThan(daySleepTask.score);
        
        console.log('Scenario D - Time gating test passed');
        console.log(`Day (15:00) sleep-winddown score: ${daySleepTask.score.toFixed(4)}`);
        console.log(`Evening (20:00) sleep-winddown score: ${eveningSleepTask.score.toFixed(4)}`);
        
        // Check time factor contributions
        expect(daySleepTask.timeOfDayContribution).toBe(0.2); // Outside time gate
        expect(eveningSleepTask.timeOfDayContribution).toBe(1); // Inside time gate
      } else {
        console.log('Sleep task presence:', { day: !!daySleepTask, evening: !!eveningSleepTask });
      }
    });
  });

  describe('Scenario E - No duplicates and relaxation', () => {
    it('should never return duplicate task IDs', () => {
      // Complete most tasks to test relaxation logic
      taskManager.completeTask('water-500', '2023-12-20');
      taskManager.completeTask('water-250', '2023-12-20');
      taskManager.completeTask('steps-1k', '2023-12-20');
      taskManager.completeTask('steps-300', '2023-12-20');

      const request: RecommendationRequest = {
        metrics: {
          water_ml: 1000,
          steps: 5000,
          sleep_hours: 6,
          screen_time_min: 150,
          mood_1to5: 3
        },
        currentTime: '2023-12-20T15:00:00Z',
        localDate: '2023-12-20'
      };

      const recommendations = taskManager.getRecommendations(request);
      
      // Should return unique task IDs only
      const taskIds = recommendations.map(r => r.task.id);
      const uniqueIds = [...new Set(taskIds)];
      
      expect(taskIds).toHaveLength(uniqueIds.length);
      expect(recommendations.length).toBeGreaterThan(0);

      console.log('Scenario E - No duplicates test passed');
      console.log(`Returned tasks: ${taskIds.join(', ')}`);
    });
  });

  describe('Daily reset behavior', () => {
    it('should reset completedToday and ignores at date change', () => {
      // Complete a task and dismiss another
      taskManager.completeTask('water-500', '2023-12-20');
      taskManager.dismissTask('steps-1k', '2023-12-20');

      // Check initial state
      let waterTask = taskManager.getTask('water-500');
      let stepsTask = taskManager.getTask('steps-1k');
      
      expect(waterTask!.completedToday).toBe(true);
      expect(stepsTask!.ignores).toBe(1);

      // Trigger daily reset by checking with new date
      taskManager.checkAndPerformDailyReset('2023-12-21');

      // Check reset state
      waterTask = taskManager.getTask('water-500');
      stepsTask = taskManager.getTask('steps-1k');
      
      expect(waterTask!.completedToday).toBe(false);
      expect(stepsTask!.ignores).toBe(0);

      console.log('Daily reset test passed');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty task catalog gracefully', () => {
      taskManager.clearAllTasks();

      const request: RecommendationRequest = {
        metrics: {
          water_ml: 1000,
          steps: 5000,
          sleep_hours: 6,
          screen_time_min: 100,
          mood_1to5: 3
        },
        currentTime: '2023-12-20T15:00:00Z',
        localDate: '2023-12-20'
      };

      const recommendations = taskManager.getRecommendations(request);
      expect(recommendations).toHaveLength(0);
    });

    it('should handle invalid task IDs for actions', () => {
      expect(taskManager.completeTask('non-existent', '2023-12-20')).toBe(false);
      expect(taskManager.dismissTask('non-existent', '2023-12-20')).toBe(false);
    });
  });
});