/**
 * Centralized Validation Exports
 * Requirements: 21.1, 21.2, 21.3, 21.4, 21.5
 * 
 * This file exports all validation middleware for easy import across the application.
 * All validators include:
 * - Required field validation
 * - Data type validation
 * - String length validation
 * - Input sanitization
 * - Standardized error responses
 */

// Core validation utilities
const {
  handleValidationErrors,
  isValidObjectId,
  validateStringLength,
  isValidEmail,
  isValidMobile,
  sanitizeHtml,
  sanitizeInputs
} = require('./validationMiddleware');

// Authentication validators
const {
  registerValidation,
  verifyOTPValidation,
  loginValidation,
  verifyLoginValidation,
  refreshTokenValidation,
  logoutValidation
} = require('./authValidators');

// User management validators
const {
  validateGetAllUsers,
  validateGetUserById,
  validateUpdateUser,
  validateDeactivateUser
} = require('./userValidators');

// Academic structure validators
const {
  createBoardValidation,
  updateBoardValidation,
  boardIdValidation,
  createSubjectValidation,
  updateSubjectValidation,
  subjectIdValidation,
  boardIdParamValidation,
  createChapterValidation,
  updateChapterValidation,
  chapterIdValidation,
  subjectIdParamValidation,
  createConceptValidation,
  updateConceptValidation,
  conceptIdValidation,
  chapterIdParamValidation
} = require('./academicValidators');

// Student work validators
const {
  uploadStudentWorkValidation,
  getStudentWorkValidation,
  getStudentWorkByIdValidation
} = require('./studentWorkValidators');

// Feedback validators
const {
  validateCreateFeedback,
  validateUpdateFeedback,
  validateGetFeedback
} = require('./feedbackValidators');

// Linking validators
const {
  validateCreateParentStudentLink,
  validateDeleteParentStudentLink,
  validateGetParentStudentLinks,
  validateCreateTeacherAssignment,
  validateDeleteTeacherAssignment,
  validateGetTeacherAssignments
} = require('./linkValidators');

module.exports = {
  // Core utilities
  handleValidationErrors,
  isValidObjectId,
  validateStringLength,
  isValidEmail,
  isValidMobile,
  sanitizeHtml,
  sanitizeInputs,

  // Authentication
  registerValidation,
  verifyOTPValidation,
  loginValidation,
  verifyLoginValidation,
  refreshTokenValidation,
  logoutValidation,

  // User management
  validateGetAllUsers,
  validateGetUserById,
  validateUpdateUser,
  validateDeactivateUser,

  // Academic structure
  createBoardValidation,
  updateBoardValidation,
  boardIdValidation,
  createSubjectValidation,
  updateSubjectValidation,
  subjectIdValidation,
  boardIdParamValidation,
  createChapterValidation,
  updateChapterValidation,
  chapterIdValidation,
  subjectIdParamValidation,
  createConceptValidation,
  updateConceptValidation,
  conceptIdValidation,
  chapterIdParamValidation,

  // Student work
  uploadStudentWorkValidation,
  getStudentWorkValidation,
  getStudentWorkByIdValidation,

  // Feedback
  validateCreateFeedback,
  validateUpdateFeedback,
  validateGetFeedback,

  // Linking
  validateCreateParentStudentLink,
  validateDeleteParentStudentLink,
  validateGetParentStudentLinks,
  validateCreateTeacherAssignment,
  validateDeleteTeacherAssignment,
  validateGetTeacherAssignments
};
