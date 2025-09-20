import { Request, Response } from 'express';
import { TaskManager } from '../services/task-manager';
import { RecommendationRequest, ActionRequest, UserMetrics } from '../types';
import { logger, logEndpoint, logError, logSuccess, logWarning } from '../utils/logger';

/**
 * Task Controller handling HTTP requests for task management
 */
export class TaskController {
  private taskManager: TaskManager;

  constructor() {
    this.taskManager = new TaskManager();
    // Load seed data by default
    this.taskManager.loadSeedData();
  }

  /**
   * GET /recommendations
   * Returns top 4 recommended tasks based on user metrics
   */
  public getRecommendations = (req: Request, res: Response): void => {
    try {
      const { metrics, currentTime, localDate } = req.body as {
        metrics: UserMetrics;
        currentTime?: string;
        localDate?: string;
      };

      // Validate required fields
      if (!metrics || !this.isValidMetrics(metrics)) {
        res.status(400).json({
          error: 'Invalid metrics provided. Required: water_ml, steps, sleep_hours, screen_time_min, mood_1to5'
        });
        return;
      }

      // Default to current time/date if not provided
      const now = new Date();
      const requestTime = currentTime || now.toISOString();
      const requestDate = localDate || now.toISOString().split('T')[0];

      const request: RecommendationRequest = {
        metrics,
        currentTime: requestTime,
        localDate: requestDate
      };

      const recommendations = this.taskManager.getRecommendations(request);

      res.json({
        tasks: recommendations.map(scored => ({
          id: scored.task.id,
          title: scored.task.title,
          category: scored.task.category,
          impact_weight: scored.task.impact_weight,
          effort_min: scored.task.effort_min,
          time_gate: scored.task.time_gate,
          score: scored.score,
          rationale: scored.rationale,
          urgencyContribution: scored.urgencyContribution,
          impactContribution: scored.impactContribution,
          effortContribution: scored.effortContribution,
          timeOfDayContribution: scored.timeOfDayContribution,
          ignoresPenalty: scored.ignoresPenalty
        })),
        timestamp: requestTime,
        localDate: requestDate
      });
    } catch (error) {
      console.error('Error in getRecommendations:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  /**
   * POST /actions/complete
   * Mark a task as completed
   */
  public completeTask = (req: Request, res: Response): void => {
    try {
      const { taskId, timestamp } = req.body as ActionRequest;

      if (!taskId) {
        res.status(400).json({ error: 'taskId is required' });
        return;
      }

      const task = this.taskManager.getTask(taskId);
      if (!task) {
        res.status(404).json({ error: 'Task not found' });
        return;
      }

      const currentDate = timestamp 
        ? new Date(timestamp).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

      const success = this.taskManager.completeTask(taskId, currentDate);

      if (success) {
        res.json({
          success: true,
          message: `Task ${taskId} marked as completed`,
          task: this.taskManager.getTask(taskId)
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to complete task'
        });
      }
    } catch (error) {
      console.error('Error in completeTask:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  /**
   * POST /actions/dismiss
   * Mark a task as dismissed/ignored
   */
  public dismissTask = (req: Request, res: Response): void => {
    try {
      const { taskId, timestamp } = req.body as ActionRequest;

      if (!taskId) {
        res.status(400).json({ error: 'taskId is required' });
        return;
      }

      const task = this.taskManager.getTask(taskId);
      if (!task) {
        res.status(404).json({ error: 'Task not found' });
        return;
      }

      const currentDate = timestamp 
        ? new Date(timestamp).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

      const success = this.taskManager.dismissTask(taskId, currentDate);

      if (success) {
        const updatedTask = this.taskManager.getTask(taskId);
        res.json({
          success: true,
          message: `Task ${taskId} dismissed (ignores: ${updatedTask?.ignores || 0})`,
          task: updatedTask
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to dismiss task'
        });
      }
    } catch (error) {
      console.error('Error in dismissTask:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  /**
   * POST /admin/seed
   * Load seed data into the system
   */
  public loadSeedData = (req: Request, res: Response): void => {
    try {
      this.taskManager.clearAllTasks();
      this.taskManager.loadSeedData();

      const allTasks = this.taskManager.getAllTasks();
      
      res.json({
        success: true,
        message: `Loaded ${allTasks.length} seed tasks`,
        tasks: allTasks
      });
    } catch (error) {
      console.error('Error in loadSeedData:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  /**
   * GET /admin/tasks
   * Get all tasks (useful for debugging)
   */
  public getAllTasks = (req: Request, res: Response): void => {
    try {
      const allTasks = this.taskManager.getAllTasks();
      res.json({ tasks: allTasks });
    } catch (error) {
      console.error('Error in getAllTasks:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  /**
   * POST /admin/reset
   * Reset daily state for all tasks
   */
  public resetDailyState = (req: Request, res: Response): void => {
    try {
      this.taskManager.resetDailyState();
      res.json({
        success: true,
        message: 'Daily state reset for all tasks'
      });
    } catch (error) {
      console.error('Error in resetDailyState:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  /**
   * Validate user metrics
   */
  private isValidMetrics(metrics: any): metrics is UserMetrics {
    return (
      typeof metrics === 'object' &&
      typeof metrics.water_ml === 'number' &&
      typeof metrics.steps === 'number' &&
      typeof metrics.sleep_hours === 'number' &&
      typeof metrics.screen_time_min === 'number' &&
      typeof metrics.mood_1to5 === 'number' &&
      metrics.mood_1to5 >= 1 &&
      metrics.mood_1to5 <= 5
    );
  }
}