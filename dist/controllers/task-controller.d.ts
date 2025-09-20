import { Request, Response } from 'express';
/**
 * Task Controller handling HTTP requests for task management
 */
export declare class TaskController {
    private taskManager;
    constructor();
    /**
     * GET /recommendations
     * Returns top 4 recommended tasks based on user metrics
     */
    getRecommendations: (req: Request, res: Response) => void;
    /**
     * POST /actions/complete
     * Mark a task as completed
     */
    completeTask: (req: Request, res: Response) => void;
    /**
     * POST /actions/dismiss
     * Mark a task as dismissed/ignored
     */
    dismissTask: (req: Request, res: Response) => void;
    /**
     * POST /admin/seed
     * Load seed data into the system
     */
    loadSeedData: (req: Request, res: Response) => void;
    /**
     * GET /admin/tasks
     * Get all tasks (useful for debugging)
     */
    getAllTasks: (req: Request, res: Response) => void;
    /**
     * POST /admin/reset
     * Reset daily state for all tasks
     */
    resetDailyState: (req: Request, res: Response) => void;
    /**
     * Validate user metrics
     */
    private isValidMetrics;
}
//# sourceMappingURL=task-controller.d.ts.map