const { body, param, validationResult } = require('express-validator');

/**
 * Validation middleware for academic structure endpoints
 * Requirements: 21.1, 21.2, 21.3, 21.4
 */

/**
 * Handle validation errors
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
}

// ==================== BOARD VALIDATORS ====================

/**
 * Board creation validation rules
 */
const createBoardValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Board name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Board name must be between 2 and 100 characters')
    .escape(),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description must not exceed 500 characters')
    .escape(),
  
  handleValidationErrors
];

/**
 * Board update validation rules
 */
const updateBoardValidation = [
  param('id')
    .trim()
    .notEmpty().withMessage('Board ID is required')
    .isMongoId().withMessage('Invalid board ID format'),
  
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('Board name cannot be empty')
    .isLength({ min: 2, max: 100 }).withMessage('Board name must be between 2 and 100 characters')
    .escape(),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description must not exceed 500 characters')
    .escape(),
  
  handleValidationErrors
];

/**
 * Board ID parameter validation
 */
const boardIdValidation = [
  param('id')
    .trim()
    .notEmpty().withMessage('Board ID is required')
    .isMongoId().withMessage('Invalid board ID format'),
  
  handleValidationErrors
];

// ==================== SUBJECT VALIDATORS ====================

/**
 * Subject creation validation rules
 */
const createSubjectValidation = [
  param('boardId')
    .trim()
    .notEmpty().withMessage('Board ID is required')
    .isMongoId().withMessage('Invalid board ID format'),
  
  body('name')
    .trim()
    .notEmpty().withMessage('Subject name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Subject name must be between 2 and 100 characters')
    .escape(),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description must not exceed 500 characters')
    .escape(),
  
  handleValidationErrors
];

/**
 * Subject update validation rules
 */
const updateSubjectValidation = [
  param('id')
    .trim()
    .notEmpty().withMessage('Subject ID is required')
    .isMongoId().withMessage('Invalid subject ID format'),
  
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('Subject name cannot be empty')
    .isLength({ min: 2, max: 100 }).withMessage('Subject name must be between 2 and 100 characters')
    .escape(),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description must not exceed 500 characters')
    .escape(),
  
  handleValidationErrors
];

/**
 * Subject ID parameter validation
 */
const subjectIdValidation = [
  param('id')
    .trim()
    .notEmpty().withMessage('Subject ID is required')
    .isMongoId().withMessage('Invalid subject ID format'),
  
  handleValidationErrors
];

/**
 * Board ID parameter validation for subject routes
 */
const boardIdParamValidation = [
  param('boardId')
    .trim()
    .notEmpty().withMessage('Board ID is required')
    .isMongoId().withMessage('Invalid board ID format'),
  
  handleValidationErrors
];

// ==================== CHAPTER VALIDATORS ====================

/**
 * Chapter creation validation rules
 */
const createChapterValidation = [
  param('subjectId')
    .trim()
    .notEmpty().withMessage('Subject ID is required')
    .isMongoId().withMessage('Invalid subject ID format'),
  
  body('name')
    .trim()
    .notEmpty().withMessage('Chapter name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Chapter name must be between 2 and 100 characters')
    .escape(),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description must not exceed 500 characters')
    .escape(),
  
  handleValidationErrors
];

/**
 * Chapter update validation rules
 */
const updateChapterValidation = [
  param('id')
    .trim()
    .notEmpty().withMessage('Chapter ID is required')
    .isMongoId().withMessage('Invalid chapter ID format'),
  
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('Chapter name cannot be empty')
    .isLength({ min: 2, max: 100 }).withMessage('Chapter name must be between 2 and 100 characters')
    .escape(),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description must not exceed 500 characters')
    .escape(),
  
  handleValidationErrors
];

/**
 * Chapter ID parameter validation
 */
const chapterIdValidation = [
  param('id')
    .trim()
    .notEmpty().withMessage('Chapter ID is required')
    .isMongoId().withMessage('Invalid chapter ID format'),
  
  handleValidationErrors
];

/**
 * Subject ID parameter validation for chapter routes
 */
const subjectIdParamValidation = [
  param('subjectId')
    .trim()
    .notEmpty().withMessage('Subject ID is required')
    .isMongoId().withMessage('Invalid subject ID format'),
  
  handleValidationErrors
];

// ==================== CONCEPT VALIDATORS ====================

/**
 * Concept creation validation rules
 */
const createConceptValidation = [
  param('chapterId')
    .trim()
    .notEmpty().withMessage('Chapter ID is required')
    .isMongoId().withMessage('Invalid chapter ID format'),
  
  body('name')
    .trim()
    .notEmpty().withMessage('Concept name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Concept name must be between 2 and 100 characters')
    .escape(),
  
  body('explanation')
    .trim()
    .notEmpty().withMessage('Explanation is required')
    .isLength({ min: 1, max: 5000 }).withMessage('Explanation must be between 1 and 5000 characters'),
  
  body('practice_questions')
    .optional()
    .isArray().withMessage('Practice questions must be an array')
    .custom((value) => {
      if (value && value.length > 0) {
        for (const question of value) {
          if (typeof question !== 'string') {
            throw new Error('Each practice question must be a string');
          }
          if (question.length > 1000) {
            throw new Error('Each practice question must not exceed 1000 characters');
          }
        }
      }
      return true;
    }),
  
  handleValidationErrors
];

/**
 * Concept update validation rules
 */
const updateConceptValidation = [
  param('id')
    .trim()
    .notEmpty().withMessage('Concept ID is required')
    .isMongoId().withMessage('Invalid concept ID format'),
  
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('Concept name cannot be empty')
    .isLength({ min: 2, max: 100 }).withMessage('Concept name must be between 2 and 100 characters')
    .escape(),
  
  body('explanation')
    .optional()
    .trim()
    .notEmpty().withMessage('Explanation cannot be empty')
    .isLength({ min: 1, max: 5000 }).withMessage('Explanation must be between 1 and 5000 characters'),
  
  body('practice_questions')
    .optional()
    .isArray().withMessage('Practice questions must be an array')
    .custom((value) => {
      if (value && value.length > 0) {
        for (const question of value) {
          if (typeof question !== 'string') {
            throw new Error('Each practice question must be a string');
          }
          if (question.length > 1000) {
            throw new Error('Each practice question must not exceed 1000 characters');
          }
        }
      }
      return true;
    }),
  
  handleValidationErrors
];

/**
 * Concept ID parameter validation
 */
const conceptIdValidation = [
  param('id')
    .trim()
    .notEmpty().withMessage('Concept ID is required')
    .isMongoId().withMessage('Invalid concept ID format'),
  
  handleValidationErrors
];

/**
 * Chapter ID parameter validation for concept routes
 */
const chapterIdParamValidation = [
  param('chapterId')
    .trim()
    .notEmpty().withMessage('Chapter ID is required')
    .isMongoId().withMessage('Invalid chapter ID format'),
  
  handleValidationErrors
];

module.exports = {
  // Board validators
  createBoardValidation,
  updateBoardValidation,
  boardIdValidation,
  // Subject validators
  createSubjectValidation,
  updateSubjectValidation,
  subjectIdValidation,
  boardIdParamValidation,
  // Chapter validators
  createChapterValidation,
  updateChapterValidation,
  chapterIdValidation,
  subjectIdParamValidation,
  // Concept validators
  createConceptValidation,
  updateConceptValidation,
  conceptIdValidation,
  chapterIdParamValidation
};
