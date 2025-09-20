import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { TaskRoutes } from './routes/task-routes';
import { logger, requestLogger, logSuccess } from './utils/logger';

/**
 * Express server application for Vita AI Task Manager
 */
class App {
  private app: Application;
  private port: number;
  private taskRoutes: TaskRoutes;

  constructor(port: number = 3000) {
    this.app = express();
    this.port = port;
    this.taskRoutes = new TaskRoutes();
    
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // CORS configuration
    this.app.use(cors({
      origin: ['http://localhost:3000', 'http://localhost:3001'],
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }));

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Comprehensive request/response logging middleware
    this.app.use(requestLogger);
  }

  private initializeRoutes(): void {
    // Root endpoint
    this.app.get('/', (req: Request, res: Response) => {
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

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use('*', (req: Request, res: Response) => {
      res.status(404).json({
        error: 'Endpoint not found',
        path: req.path,
        method: req.method
      });
    });

    // Global error handler
    this.app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
      logger.error('❌ GLOBAL ERROR HANDLER', {
        message: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method
      });
      
      res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      });
    });
  }

  public listen(): void {
    this.app.listen(this.port, () => {
      logger.info('🚀 SERVER STARTED', {
        port: this.port,
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        endpoints: {
          docs: `http://localhost:${this.port}/`,
          health: `http://localhost:${this.port}/health`,
          api: `http://localhost:${this.port}/recommendations`
        }
      });

      // Also log to console for quick reference
      console.log(`\n✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨\n`);
      console.log(`🚀 Vita AI Task Manager API running on port ${this.port}`);
      console.log(`📊 API Documentation: http://localhost:${this.port}/`);
      console.log(`🏥 Health check: http://localhost:${this.port}/health`);
      console.log(`\n✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨\n`);
    });
  }

  public getApp(): Application {
    return this.app;
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const port = parseInt(process.env.PORT || '3000');
  const app = new App(port);
  app.listen();
}

export default App;