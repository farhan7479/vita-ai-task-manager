import { Application } from 'express';
/**
 * Express server application for Vita AI Task Manager
 */
declare class App {
    private app;
    private port;
    private taskRoutes;
    constructor(port?: number);
    private initializeMiddlewares;
    private initializeRoutes;
    private initializeErrorHandling;
    listen(): void;
    getApp(): Application;
}
export default App;
//# sourceMappingURL=server.d.ts.map