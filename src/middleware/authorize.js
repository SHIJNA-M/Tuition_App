const logger = require('../utils/logger');

/**
 * Role-Based Authorization Middleware
 * Checks if authenticated user has required role(s)
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */

/**
 * Authorize middleware factory - creates middleware that checks for required roles
 * @param {...string} allowedRoles - One or more roles that are allowed to access the route
 * @returns {Function} Express middleware function
 * 
 * @example
 * // Allow only Admin
 * router.get('/users', authenticate, authorize('Admin'), userController.getAllUsers);
 * 
 * @example
 * // Allow Admin or Teacher
 * router.get('/students', authenticate, authorize('Admin', 'Teacher'), studentController.getStudents);
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    try {
      // Check if user is authenticated (should be set by authenticate middleware)
      if (!req.user) {
        logger.warn('Authorization failed: No user object in request');
        return res.status(401).json({
          success: false,
          message: 'Authentication required. Please log in.'
        });
      }

      // Check if user has one of the allowed roles
      if (!allowedRoles.includes(req.user.role)) {
        logger.warn(
          `Authorization failed: User ${req.user.id} with role ${req.user.role} ` +
          `attempted to access route requiring roles: ${allowedRoles.join(', ')}`
        );
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not have permission to access this resource.'
        });
      }

      logger.info(`User ${req.user.id} (${req.user.role}) authorized for route`);
      next();
    } catch (error) {
      logger.error('Authorization middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during authorization'
      });
    }
  };
}

module.exports = authorize;
