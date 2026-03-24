const { body, param, query } = require('express-validator');
const { handleValidationErrors, isValidObjectId } = require('./validationMiddleware');
const logger = require('../../utils/logger');

/**
 * Student Work Validation Middleware
 * Requirements: 21.1, 21.2, 21.3, 21.4, 21.5
 */

/**
 * Upload student work validation
 * POST /api/student-work
 */
const uploadStudentWorkValidation = [
  body('subjectId')
    .trim()
    .notEmpty()
    .withMessage('Subject ID is required')
    .custom(isValidObjectId)
    .withMessage('Invalid Subject ID format'),
  
  body('conceptId')
    .trim()
    .notEmpty()
    .withMessage('Concept ID is required')
    .custom(isValidObjectId)
    .withMessage('Invalid Concept ID format'),
  
  handleValidationErrors
];

/**
 * Get student work validation
 * GET /api/student-work
 */
const getStudentWorkValidation = [
  query('studentId')
    .optional()
    .trim()
    .custom(isValidObjectId)
    .withMessage('Invalid Student ID format'),
  
  query('status')
    .optional()
    .trim()
    .isIn(['pending', 'reviewed'])
    .withMessage('Status must be either "pending" or "reviewed"'),
  
  query('subjectId')
    .optional()
    .trim()
    .custom(isValidObjectId)
    .withMessage('Invalid Subject ID format'),
  
  handleValidationErrors
];

/**
 * Get student work by ID validation
 * GET /api/student-work/:id
 */
const getStudentWorkByIdValidation = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('Work ID is required')
    .custom(isValidObjectId)
    .withMessage('Invalid Work ID format'),
  
  handleValidationErrors
];

module.exports = {
  uploadStudentWorkValidation,
  getStudentWorkValidation,
  getStudentWorkByIdValidation
};
