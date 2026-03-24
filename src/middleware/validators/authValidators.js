const { body, validationResult } = require('express-validator');

/**
 * Validation middleware for authentication endpoints
 * Requirements: 21.1, 21.2, 21.3, 21.4, 21.5, 21.6, 21.7
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

/**
 * Registration validation rules
 */
const registerValidation = [
  body('first_name')
    .trim()
    .notEmpty().withMessage('First name is required')
    .isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters')
    .escape(),
  
  body('last_name')
    .trim()
    .notEmpty().withMessage('Last name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters')
    .escape(),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  
  body('mobile')
    .trim()
    .notEmpty().withMessage('Mobile number is required')
    .matches(/^\+?[1-9]\d{1,14}$/).withMessage('Invalid mobile number format (E.164 format required)'),
  
  body('password')
    .trim()
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('role')
    .notEmpty().withMessage('Role is required')
    .isIn(['Admin', 'Teacher', 'Student', 'Parent']).withMessage('Invalid role'),
  
  handleValidationErrors
];

/**
 * OTP verification validation rules
 */
const verifyOTPValidation = [
  body('userId')
    .trim()
    .notEmpty().withMessage('User ID is required')
    .isMongoId().withMessage('Invalid user ID format'),
  
  body('emailOTP')
    .trim()
    .notEmpty().withMessage('Email OTP is required')
    .isLength({ min: 6, max: 6 }).withMessage('Email OTP must be 6 digits')
    .isNumeric().withMessage('Email OTP must contain only numbers'),
  
  body('mobileOTP')
    .trim()
    .notEmpty().withMessage('Mobile OTP is required')
    .isLength({ min: 6, max: 6 }).withMessage('Mobile OTP must be 6 digits')
    .isNumeric().withMessage('Mobile OTP must contain only numbers'),
  
  handleValidationErrors
];

/**
 * Login validation rules
 */
const loginValidation = [
  body('identifier')
    .trim()
    .notEmpty().withMessage('Email or mobile number is required'),
  
  body('password')
    .trim()
    .notEmpty().withMessage('Password is required'),
  
  handleValidationErrors
];

/**
 * Verify login OTP validation rules
 */
const verifyLoginValidation = [
  body('mobile')
    .trim()
    .notEmpty().withMessage('Mobile number is required')
    .matches(/^\+?[1-9]\d{1,14}$/).withMessage('Invalid mobile number format (E.164 format required)'),
  
  body('otp')
    .trim()
    .notEmpty().withMessage('OTP is required')
    .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
    .isNumeric().withMessage('OTP must contain only numbers'),
  
  handleValidationErrors
];

/**
 * Forgot password validation rules
 */
const forgotPasswordValidation = [
  body('mobile')
    .trim()
    .notEmpty().withMessage('Mobile number is required')
    .matches(/^\+?[1-9]\d{1,14}$/).withMessage('Invalid mobile number format (E.164 format required)'),
  
  handleValidationErrors
];

/**
 * Reset password validation rules
 */
const resetPasswordValidation = [
  body('mobile')
    .trim()
    .notEmpty().withMessage('Mobile number is required')
    .matches(/^\+?[1-9]\d{1,14}$/).withMessage('Invalid mobile number format (E.164 format required)'),
  
  body('otp')
    .trim()
    .notEmpty().withMessage('OTP is required')
    .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
    .isNumeric().withMessage('OTP must contain only numbers'),
  
  body('newPassword')
    .trim()
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  handleValidationErrors
];

/**
 * Refresh token validation rules
 */
const refreshTokenValidation = [
  body('refreshToken')
    .trim()
    .notEmpty().withMessage('Refresh token is required'),
  
  handleValidationErrors
];

/**
 * Logout validation rules
 */
const logoutValidation = [
  body('refreshToken')
    .trim()
    .notEmpty().withMessage('Refresh token is required'),
  
  handleValidationErrors
];

module.exports = {
  registerValidation,
  verifyOTPValidation,
  loginValidation,
  verifyLoginValidation,
  refreshTokenValidation,
  logoutValidation,
  forgotPasswordValidation,
  resetPasswordValidation
};
