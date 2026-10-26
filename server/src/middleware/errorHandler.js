import { config } from '../config/env.js';

/**
 * Global Error Handler Middleware
 * Formats errors into consistent JSON responses without leaking stack traces in production
 */
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || res.statusCode >= 400 ? res.statusCode : 500;
  
  res.status(statusCode).json({
    success: false,
    error: {
      message: err.message || 'Internal Server Error',
      statusCode,
      ...(config.nodeEnv === 'development' && { stack: err.stack })
    }
  });
};
