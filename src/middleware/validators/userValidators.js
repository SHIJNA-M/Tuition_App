const { body, param, query } = require('express-validator');
const { handleValidationErrors } = require('./validationMiddleware');

/**
 * User Management Validation Middleware
 * Requirements: 21.1, 21.2, 21.3, 21.4, 21.5
 */

/**
 * Validation for GET /api/users
 */
exports.validateGetAllUsers = [
  query('role')
    .optional()
    .isIn(['Admin', 'Teacher', 'Student', 'Parent'])
    .withMessage('Role must be one of: Admin, Teacher, Student, Parent'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

/**
 * Validation for GET /api/users/:id
 */
exports.validateGetUserById = [
  param('id')
    .isMongoId()
    .withMessage('Invalid user ID format'),
  handleValidationErrors
];

/**
 * Validation for PUT /api/users/:id
 */
exports.validateUpdateUser = [
  param('id')
    .isMongoId()
    .withMessage('Invalid user ID format'),
  body('first_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .escape(),
  body('last_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .escape(),
  body('role')
    .optional()
    .isIn(['Admin', 'Teacher', 'Student', 'Parent'])
    .withMessage('Role must be one of: Admin, Teacher, Student, Parent'),
  body('active')
    .optional()
    .isBoolean()
    .withMessage('Active must be a boolean value'),
  handleValidationErrors
];

/**
 * Validation for DELETE /api/users/:id
 */
exports.validateDeactivateUser = [
  param('id')
    .isMongoId()
    .withMessage('Invalid user ID format'),
  handleValidationErrors
];
