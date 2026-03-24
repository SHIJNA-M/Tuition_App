const logger = require('../utils/logger');

/**
 * Resource Ownership Validation Middleware
 * Validates that students can only access their own data
 * Requirements: 5.4, 8.6
 */

/**
 * Check ownership middleware - validates student can only access their own data
 * This middleware should be used after authenticate middleware
 * It checks if the authenticated user (if Student role) is accessing their own resource
 * 
 * @param {string} paramName - The request parameter name containing the student ID (default: 'studentId')
 * @returns {Function} Express middleware function
 * 
 * @example
 * // Check ownership using 'studentId' parameter
 * router.get('/students/:studentId/work', authenticate, checkOwnership('studentId'), controller.getWork);
 * 
 * @example
 * // Check ownership using 'id' parameter
 * router.get('/students/:id/profile', authenticate, checkOwnership('id'), controller.getProfile);
 */
function checkOwnership(paramName = 'studentId') {
  return (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        logger.warn('Ownership check failed: No user object in request');
        return res.status(401).json({
          success: false,
          message: 'Authentication required. Please log in.'
        });
      }

      // Admin can access all resources
      if (req.user.role === 'Admin') {
        logger.info(`Admin ${req.user.id} bypassing ownership check`);
        return next();
      }

      // For Student role, validate they can only access their own data
      if (req.user.role === 'Student') {
        const resourceStudentId = req.params[paramName] || req.query[paramName] || req.body[paramName];

        if (!resourceStudentId) {
          logger.warn(`Ownership check failed: No ${paramName} found in request`);
          return res.status(400).json({
            success: false,
            message: `Student ID parameter '${paramName}' is required`
          });
        }

        // Check if the student is accessing their own resource
        if (resourceStudentId !== req.user.id.toString()) {
          logger.warn(
            `Ownership check failed: Student ${req.user.id} attempted to access ` +
            `resource belonging to student ${resourceStudentId}`
          );
          return res.status(403).json({
            success: false,
            message: 'Access denied. You can only access your own data.'
          });
        }

        logger.info(`Student ${req.user.id} accessing own resource`);
      }

      // For other roles (Teacher, Parent), let other middleware handle authorization
      next();
    } catch (error) {
      logger.error('Ownership check middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during ownership validation'
      });
    }
  };
}

module.exports = checkOwnership;
