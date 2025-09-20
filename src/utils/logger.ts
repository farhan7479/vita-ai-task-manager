import winston from 'winston';
import { Request, Response } from 'express';

// Custom format for colorized console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let logMessage = `[${timestamp}] ${level}: ${message}`;
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      logMessage += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return logMessage;
  })
);

// Create logger instance
export const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    // Console transport with colorized output
    new winston.transports.Console({
      format: consoleFormat
    }),
    // File transport for errors
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    // File transport for all logs
    new winston.transports.File({
      filename: 'logs/combined.log'
    })
  ]
});

// Custom middleware for detailed request/response logging
export const requestLogger = (req: Request, res: Response, next: Function) => {
  const startTime = Date.now();
  
  // Log incoming request
  logger.info('📨 INCOMING REQUEST', {
    method: req.method,
    url: req.url,
    path: req.path,
    query: req.query,
    headers: {
      'content-type': req.get('content-type'),
      'user-agent': req.get('user-agent'),
      'content-length': req.get('content-length')
    },
    body: req.body,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  // Capture response data
  const originalSend = res.send;
  let responseBody: any;
  
  res.send = function(body: any) {
    responseBody = body;
    return originalSend.call(this, body);
  };

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    
    // Determine log level based on status code
    let logLevel = 'info';
    if (statusCode >= 400 && statusCode < 500) {
      logLevel = 'warn';
    } else if (statusCode >= 500) {
      logLevel = 'error';
    }
    
    // Parse response body if it's a string
    let parsedResponse;
    try {
      parsedResponse = typeof responseBody === 'string' ? JSON.parse(responseBody) : responseBody;
    } catch (e) {
      parsedResponse = responseBody;
    }

    logger[logLevel as keyof winston.Logger]('📤 OUTGOING RESPONSE', {
      method: req.method,
      url: req.url,
      statusCode: statusCode,
      statusMessage: res.statusMessage,
      duration: `${duration}ms`,
      headers: {
        'content-type': res.get('content-type'),
        'content-length': res.get('content-length')
      },
      response: parsedResponse,
      timestamp: new Date().toISOString()
    });
  });

  next();
};

// Helper function to log API endpoint calls
export const logEndpoint = (endpoint: string, data?: any) => {
  logger.info(`🎯 ENDPOINT: ${endpoint}`, data ? { data } : {});
};

// Helper function to log errors with context
export const logError = (error: Error, context?: any) => {
  logger.error('❌ ERROR OCCURRED', {
    message: error.message,
    stack: error.stack,
    context
  });
};

// Helper function to log success operations
export const logSuccess = (operation: string, data?: any) => {
  logger.info(`✅ SUCCESS: ${operation}`, data ? { data } : {});
};

// Helper function to log warnings
export const logWarning = (message: string, data?: any) => {
  logger.warn(`⚠️  WARNING: ${message}`, data ? { data } : {});
};

export default logger;