"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskRoutes = void 0;
const express_1 = require("express");
const task_controller_1 = require("../controllers/task-controller");
/**
 * Task routes configuration
 */
class TaskRoutes {
    constructor() {
        this.router = (0, express_1.Router)();
        this.taskController = new task_controller_1.TaskController();
        this.initializeRoutes();
    }
    initializeRoutes() {
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
    getRouter() {
        return this.router;
    }
}
exports.TaskRoutes = TaskRoutes;
//# sourceMappingURL=task-routes.js.map