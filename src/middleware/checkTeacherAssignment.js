const TeacherAssignment = require('../models/TeacherAssignment');
const logger = require('../utils/logger');

/**
 * Teacher Assignment Validation Middleware
 * Validates that teacher is assigned to the student they're trying to access
 * Requirements: 7.1, 7.5
 */

/**
 * Check teacher assignment middleware - validates teacher-student relationship
 * This middleware should be used after authenticate middleware
 * It queries TeacherAssignments to validate the teacher is assigned to the student
 * 
 * @param {string} paramName - The request parameter name containing the student ID (default: 'studentId')
 * @returns {Function} Express middleware function
 * 
 * @example
 * // Check teacher assignment using 'studentId' parameter
 * router.get('/students/:studentId/work', authenticate, checkTeacherAssignment('studentId'), controller.getWork);
 * 
 * @example
 * // Check teacher assignment using 'id' parameter
 * router.post('/feedback/:id', authenticate, checkTeacherAssignment('id'), controller.createFeedback);
 */
function checkTeacherAssignment(paramName = 'studentId') {
  return async (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        logger.warn('Teacher assignment check failed: No user object in request');
        return res.status(401).json({
          success: false,
          message: 'Authentication required. Please log in.'
        });
      }

      // Admin can access all resources
      if (req.user.role === 'Admin') {
        logger.info(`Admin ${req.user.id} bypassing teacher assignment check`);
        return next();
      }

      // Only apply this check for Teacher role
      if (req.user.role === 'Teacher') {
        const studentId = req.params[paramName] || req.query[paramName] || req.body[paramName];

        if (!studentId) {
          logger.warn(`Teacher assignment check failed: No ${paramName} found in request`);
          return res.status(400).json({
            success: false,
            message: `Student ID parameter '${paramName}' is required`
          });
        }

        // Query TeacherAssignments to validate teacher-student relationship
        const assignment = await TeacherAssignment.findOne({
          teacher_id: req.user.id,
          student_id: studentId
        });

        if (!assignment) {
          logger.warn(
            `Teacher assignment check failed: Teacher ${req.user.id} is not assigned to student ${studentId}`
          );
          return res.status(403).json({
            success: false,
            message: 'Access denied. You are not assigned to this student.'
          });
        }

        logger.info(`Teacher ${req.user.id} validated for student ${studentId}`);
      }

      // For other roles, let other middleware handle authorization
      next();
    } catch (error) {
      logger.error('Teacher assignment check middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during teacher assignment validation'
      });
    }
  };
}

module.exports = checkTeacherAssignment;
