const ParentStudentLink = require('../models/ParentStudentLink');
const logger = require('../utils/logger');

/**
 * Parent Link Validation Middleware
 * Validates that parent is linked to the student they're trying to access
 * Requirements: 9.1, 9.6
 */

/**
 * Check parent link middleware - validates parent-student relationship
 * This middleware should be used after authenticate middleware
 * It queries ParentStudentLinks to validate the parent is linked to the student
 * 
 * @param {string} paramName - The request parameter name containing the student ID (default: 'studentId')
 * @returns {Function} Express middleware function
 * 
 * @example
 * // Check parent link using 'studentId' parameter
 * router.get('/students/:studentId/progress', authenticate, checkParentLink('studentId'), controller.getProgress);
 * 
 * @example
 * // Check parent link using 'id' parameter
 * router.get('/students/:id/work', authenticate, checkParentLink('id'), controller.getWork);
 */
function checkParentLink(paramName = 'studentId') {
  return async (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        logger.warn('Parent link check failed: No user object in request');
        return res.status(401).json({
          success: false,
          message: 'Authentication required. Please log in.'
        });
      }

      // Admin can access all resources
      if (req.user.role === 'Admin') {
        logger.info(`Admin ${req.user.id} bypassing parent link check`);
        return next();
      }

      // Only apply this check for Parent role
      if (req.user.role === 'Parent') {
        const studentId = req.params[paramName] || req.query[paramName] || req.body[paramName];

        if (!studentId) {
          logger.warn(`Parent link check failed: No ${paramName} found in request`);
          return res.status(400).json({
            success: false,
            message: `Student ID parameter '${paramName}' is required`
          });
        }

        // Query ParentStudentLinks to validate parent-student relationship
        const link = await ParentStudentLink.findOne({
          parent_id: req.user.id,
          student_id: studentId
        });

        if (!link) {
          logger.warn(
            `Parent link check failed: Parent ${req.user.id} is not linked to student ${studentId}`
          );
          return res.status(403).json({
            success: false,
            message: 'Access denied. You are not linked to this student.'
          });
        }

        logger.info(`Parent ${req.user.id} validated for student ${studentId}`);
      }

      // For other roles, let other middleware handle authorization
      next();
    } catch (error) {
      logger.error('Parent link check middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during parent link validation'
      });
    }
  };
}

module.exports = checkParentLink;
