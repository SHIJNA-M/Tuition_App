const logger = require('../utils/logger');

/**
 * Centralized Error Handler Middleware
 * Requirements: 22.1, 22.2, 22.3, 22.4
 */

/**
 * Custom API Error class
 */
class ApiError extends Error {
  constructor(statusCode, message, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error handler middleware
 */
function errorHandler(err, req, res, next) {
  let { statusCode, message } = err;

  // Default to 500 if no status code
  statusCode = statusCode || 500;
  message = message || 'Internal Server Error';

  // Log error with context
  const errorContext = {
    statusCode,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.user?.id,
    body: req.body,
    params: req.params,
    query: req.query
  };

  logger.logError(err, errorContext);

  // Send error response
  const response = {
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  };

  res.status(statusCode).json(response);
}

/**
 * Handle 404 errors
 */
function notFoundHandler(req, res, next) {
  const error = new ApiError(404, `Route ${req.originalUrl} not found`);
  next(error);
}

module.exports = {
  ApiError,
  errorHandler,
  notFoundHandler
};
