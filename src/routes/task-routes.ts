import { Router } from 'express';
import { TaskController } from '../controllers/task-controller';

/**
 * Task routes configuration
 */
export class TaskRoutes {
  private router: Router;
  private taskController: TaskController;

  constructor() {
    this.router = Router();
    this.taskController = new TaskController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Main API endpoints
    this.router.post('/recommendations', this.taskController.getRecommendations);
    this.router.post('/actions/complete', this.taskController.completeTask);
    this.router.post('/actions/dismiss', this.taskController.dismissTask);

    // Admin endpoints
    this.router.post('/admin/seed', this.taskController.loadSeedData);
    this.router.get('/admin/tasks', this.taskController.getAllTasks);
    this.router.post('/admin/reset', this.taskController.resetDailyState);

    // Health check endpoint
    this.router.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        message: 'Vita AI Task Manager API is running',
        timestamp: new Date().toISOString()
      });
    });
  }

  public getRouter(): Router {
    return this.router;
  }
}