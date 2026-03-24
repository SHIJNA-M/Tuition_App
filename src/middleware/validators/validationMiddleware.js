const { validationResult } = require('express-validator');
const logger = require('../../utils/logger');

/**
 * Centralized validation error handler middleware
 * Requirements: 21.1, 21.2, 21.3, 21.4
 * 
 * This middleware processes validation results from express-validator
 * and returns standardized error responses with specific validation messages.
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    // Log validation failures for monitoring
    logger.warn('Request validation failed', {
      path: req.path,
      method: req.method,
      errors: errors.array(),
      ip: req.ip,
      userId: req.user?.id
    });

    // Return 400 Bad Request with specific validation error messages
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }

  // Validation passed, proceed to next middleware
  next();
};

/**
 * Custom validator to check if value is a valid MongoDB ObjectId
 */
const isValidObjectId = (value) => {
  const mongoose = require('mongoose');
  return mongoose.Types.ObjectId.isValid(value);
};

/**
 * Custom validator to sanitize and validate string length
 * @param {number} min - Minimum length
 * @param {number} max - Maximum length
 */
const validateStringLength = (min, max) => {
  return (value) => {
    if (typeof value !== 'string') {
      throw new Error('Value must be a string');
    }
    const trimmed = value.trim();
    if (trimmed.length < min || trimmed.length > max) {
      throw new Error(`Length must be between ${min} and ${max} characters`);
    }
    return true;
  };
};

/**
 * Custom validator for email format (RFC 5322)
 * Requirements: 21.6
 */
const isValidEmail = (value) => {
  // RFC 5322 compliant email regex (simplified)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(value);
};

/**
 * Custom validator for mobile number format (E.164)
 * Requirements: 21.7
 */
const isValidMobile = (value) => {
  // E.164 format: +[country code][number] (max 15 digits)
  const mobileRegex = /^\+?[1-9]\d{1,14}$/;
  return mobileRegex.test(value);
};

/**
 * Sanitization helper to escape HTML special characters
 * Requirements: 21.5
 */
const sanitizeHtml = (value) => {
  if (typeof value !== 'string') return value;
  
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Middleware to sanitize all string inputs in request body
 * Requirements: 21.5
 */
const sanitizeInputs = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        // Trim whitespace
        req.body[key] = req.body[key].trim();
      }
    });
  }
  next();
};

module.exports = {
  handleValidationErrors,
  isValidObjectId,
  validateStringLength,
  isValidEmail,
  isValidMobile,
  sanitizeHtml,
  sanitizeInputs
};
