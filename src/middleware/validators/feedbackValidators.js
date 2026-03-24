const { body, param, query } = require('express-validator');
const { handleValidationErrors } = require('./validationMiddleware');

/**
 * Feedback Validation Middleware
 * Requirements: 21.1, 21.2, 21.3, 21.4, 21.5
 */

/**
 * Validator for creating feedback
 * POST /api/feedback
 */
exports.validateCreateFeedback = [
  body('workId')
    .trim()
    .notEmpty()
    .withMessage('Work ID is required')
    .isMongoId()
    .withMessage('Invalid work ID format'),
  
  body('comment')
    .trim()
    .notEmpty()
    .withMessage('Comment is required')
    .isString()
    .withMessage('Comment must be a string')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Comment must be between 10 and 2000 characters'),
  
  handleValidationErrors
];

/**
 * Validator for updating feedback
 * PUT /api/feedback/:id
 */
exports.validateUpdateFeedback = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('Feedback ID is required')
    .isMongoId()
    .withMessage('Invalid feedback ID format'),
  
  body('comment')
    .trim()
    .notEmpty()
    .withMessage('Comment is required')
    .isString()
    .withMessage('Comment must be a string')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Comment must be between 10 and 2000 characters'),
  
  handleValidationErrors
];

/**
 * Validator for getting feedback
 * GET /api/feedback
 */
exports.validateGetFeedback = [
  query('workId')
    .optional()
    .trim()
    .isMongoId()
    .withMessage('Invalid work ID format'),
  
  query('studentId')
    .optional()
    .trim()
    .isMongoId()
    .withMessage('Invalid student ID format'),
  
  handleValidationErrors
];
