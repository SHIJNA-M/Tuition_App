const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const config = require('../config');

/**
 * Logger Utility with Winston
 * Requirements: 22.1, 22.2, 22.3, 22.4, 22.5, 22.6, 22.7
 */

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    if (stack) {
      log += `\n${stack}`;
    }
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    return log;
  })
);

// Create transports
const transports = [];

// Console transport
transports.push(
  new winston.transports.Console({
    format: consoleFormat,
    level: config.logging.level
  })
);

// File transport with rotation for all logs
transports.push(
  new DailyRotateFile({
    filename: 'logs/application-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: `${config.logging.maxFileSizeMB}m`,
    maxFiles: `${config.logging.retentionDays}d`,
    format: logFormat,
    level: config.logging.level
  })
);

// File transport for error logs only
transports.push(
  new DailyRotateFile({
    filename: 'logs/error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: `${config.logging.maxFileSizeMB}m`,
    maxFiles: `${config.logging.retentionDays}d`,
    format: logFormat,
    level: 'error'
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  transports,
  exitOnError: false
});

// Handle logging errors
logger.on('error', (error) => {
  console.error('Logger error:', error);
});

/**
 * Log error with context
 * @param {Error} error - Error object
 * @param {Object} context - Additional context (request details, user info, etc.)
 */
logger.logError = function(error, context = {}) {
  const errorLog = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    ...context
  };
  
  this.error(errorLog);
};

/**
 * Log request
 * @param {Object} req - Express request object
 */
logger.logRequest = function(req) {
  this.info({
    type: 'request',
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?.id
  });
};

module.exports = logger;
