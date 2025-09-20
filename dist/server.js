"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const task_routes_1 = require("./routes/task-routes");
/**
 * Express server application for Vita AI Task Manager
 */
class App {
    constructor(port = 3000) {
        this.app = (0, express_1.default)();
        this.port = port;
        this.taskRoutes = new task_routes_1.TaskRoutes();
        this.initializeMiddlewares();
        this.initializeRoutes();
        this.initializeErrorHandling();
    }
    initializeMiddlewares() {
        // CORS configuration
        this.app.use((0, cors_1.default)({
            origin: ['http://localhost:3000', 'http://localhost:3001'],
            methods: ['GET', 'POST', 'PUT', 'DELETE'],
            allowedHeaders: ['Content-Type', 'Authorization'],
        }));
        // Body parsing middleware
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true }));
        // Request logging middleware
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
            next();
        });
    }
    initializeRoutes() {
        // Root endpoint
        this.app.get('/', (req, res) => {
            res.json({
                name: 'Vita AI Task Manager API',
                version: '1.0.0',
                description: 'Deterministic prioritization engine for wellness tasks',
                endpoints: {
                    health: 'GET /health',
                    recommendations: 'POST /recommendations',
                    complete: 'POST /actions/complete',
                    dismiss: 'POST /actions/dismiss',
                    seed: 'POST /admin/seed',
                    tasks: 'GET /admin/tasks',
                    reset: 'POST /admin/reset'
                }
            });
        });
        // Task routes
        this.app.use('/', this.taskRoutes.getRouter());
    }
    initializeErrorHandling() {
        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                error: 'Endpoint not found',
                path: req.path,
                method: req.method
            });
        });
        // Global error handler
        this.app.use((error, req, res, next) => {
            console.error('Global error handler:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
            });
        });
    }
    listen() {
        this.app.listen(this.port, () => {
            console.log(`🚀 Vita AI Task Manager API server running on port ${this.port}`);
            console.log(`📊 API Documentation available at: http://localhost:${this.port}/`);
            console.log(`🏥 Health check: http://localhost:${this.port}/health`);
        });
    }
    getApp() {
        return this.app;
    }
}
// Start server if this file is run directly
if (require.main === module) {
    const port = parseInt(process.env.PORT || '3000');
    const app = new App(port);
    app.listen();
}
exports.default = App;
//# sourceMappingURL=server.js.map