const logger = require('../utils/logger');

/**
 * Request Logging Middleware
 * Requirements: 22.3
 */

function requestLogger(req, res, next) {
  // Log incoming request
  logger.logRequest(req);

  // Log response when finished
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info({
      type: 'response',
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id
    });
  });

  next();
}

module.exports = requestLogger;
