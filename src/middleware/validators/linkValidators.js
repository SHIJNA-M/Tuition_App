const { body, param, query } = require('express-validator');
const { handleValidationErrors } = require('./validationMiddleware');

/**
 * Linking Validation Middleware
 * Requirements: 21.1, 21.2, 21.3, 21.4
 */

/**
 * Validation for POST /api/links/parent-student
 */
exports.validateCreateParentStudentLink = [
  body('parentId')
    .trim()
    .notEmpty()
    .withMessage('Parent ID is required')
    .isMongoId()
    .withMessage('Invalid parent ID format'),
  body('studentId')
    .trim()
    .notEmpty()
    .withMessage('Student ID is required')
    .isMongoId()
    .withMessage('Invalid student ID format'),
  handleValidationErrors
];

/**
 * Validation for DELETE /api/links/parent-student/:id
 */
exports.validateDeleteParentStudentLink = [
  param('id')
    .trim()
    .isMongoId()
    .withMessage('Invalid link ID format'),
  handleValidationErrors
];

/**
 * Validation for GET /api/links/parent-student
 */
exports.validateGetParentStudentLinks = [
  query('parentId')
    .optional()
    .trim()
    .isMongoId()
    .withMessage('Invalid parent ID format'),
  query('studentId')
    .optional()
    .trim()
    .isMongoId()
    .withMessage('Invalid student ID format'),
  handleValidationErrors
];

/**
 * Validation for POST /api/links/teacher-student
 */
exports.validateCreateTeacherAssignment = [
  body('teacherId')
    .trim()
    .notEmpty()
    .withMessage('Teacher ID is required')
    .isMongoId()
    .withMessage('Invalid teacher ID format'),
  body('studentId')
    .trim()
    .notEmpty()
    .withMessage('Student ID is required')
    .isMongoId()
    .withMessage('Invalid student ID format'),
  handleValidationErrors
];

/**
 * Validation for DELETE /api/links/teacher-student/:id
 */
exports.validateDeleteTeacherAssignment = [
  param('id')
    .trim()
    .isMongoId()
    .withMessage('Invalid assignment ID format'),
  handleValidationErrors
];

/**
 * Validation for GET /api/links/teacher-student
 */
exports.validateGetTeacherAssignments = [
  query('teacherId')
    .optional()
    .trim()
    .isMongoId()
    .withMessage('Invalid teacher ID format'),
  query('studentId')
    .optional()
    .trim()
    .isMongoId()
    .withMessage('Invalid student ID format'),
  handleValidationErrors
];
