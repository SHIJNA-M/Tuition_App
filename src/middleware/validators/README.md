# API Request Validation

This directory contains all validation middleware for the Tuition Center Management System API.

## Overview

All API endpoints are protected by validation middleware that ensures:
- Required fields are present
- Data types match expected types
- String lengths are within defined limits
- Input is sanitized to prevent injection attacks
- Standardized error responses (400 Bad Request)

**Requirements**: 21.1, 21.2, 21.3, 21.4, 21.5, 21.6, 21.7

## Architecture

### Core Validation Middleware (`validationMiddleware.js`)

Provides centralized validation utilities:

- `handleValidationErrors`: Processes validation results and returns standardized error responses
- `isValidObjectId`: Validates MongoDB ObjectId format
- `validateStringLength`: Custom validator for string length constraints
- `isValidEmail`: RFC 5322 compliant email validation
- `isValidMobile`: E.164 format mobile number validation
- `sanitizeHtml`: Escapes HTML special characters
- `sanitizeInputs`: Middleware to sanitize all request body strings

### Validation Modules

#### Authentication Validators (`authValidators.js`)
- `registerValidation`: User registration (first_name, last_name, email, mobile, role)
- `verifyOTPValidation`: OTP verification (userId, emailOTP, mobileOTP)
- `loginValidation`: Login initiation (mobile)
- `verifyLoginValidation`: Login OTP verification (mobile, otp)
- `refreshTokenValidation`: Token refresh (refreshToken)
- `logoutValidation`: Logout (refreshToken)

#### User Management Validators (`userValidators.js`)
- `validateGetAllUsers`: Query parameters (role, page, limit)
- `validateGetUserById`: User ID parameter
- `validateUpdateUser`: User update fields (first_name, last_name, role, active)
- `validateDeactivateUser`: User ID parameter

#### Academic Structure Validators (`academicValidators.js`)
- Board validators: create, update, get by ID
- Subject validators: create, update, get by ID, get by board
- Chapter validators: create, update, get by ID, get by subject
- Concept validators: create, update, get by ID, get by chapter

#### Student Work Validators (`studentWorkValidators.js`)
- `uploadStudentWorkValidation`: File upload (subjectId, conceptId)
- `getStudentWorkValidation`: Query filters (studentId, status, subjectId)
- `getStudentWorkByIdValidation`: Work ID parameter

#### Feedback Validators (`feedbackValidators.js`)
- `validateCreateFeedback`: Feedback creation (workId, comment)
- `validateUpdateFeedback`: Feedback update (id, comment)
- `validateGetFeedback`: Query filters (workId, studentId)

#### Linking Validators (`linkValidators.js`)
- Parent-Student Link validators: create, delete, get
- Teacher-Student Assignment validators: create, delete, get

## Usage

### Import Validators

```javascript
// Import specific validators
const { registerValidation, loginValidation } = require('./middleware/validators');

// Or import from specific module
const { validateCreateFeedback } = require('./middleware/validators/feedbackValidators');
```

### Apply to Routes

```javascript
const express = require('express');
const router = express.Router();
const { registerValidation } = require('../middleware/validators');
const authController = require('../controllers/authController');

// Apply validation middleware before controller
router.post('/register', registerValidation, authController.register);
```

### Validation Chain

Validators are arrays of express-validator middleware that execute in sequence:

1. Field validation (presence, type, format)
2. Sanitization (trim, escape, normalize)
3. Error handling (collect and format errors)

Example:
```javascript
const registerValidation = [
  body('email').trim().notEmpty().isEmail().normalizeEmail(),
  body('mobile').trim().notEmpty().matches(/^\+?[1-9]\d{1,14}$/),
  handleValidationErrors  // Must be last in chain
];
```

## Validation Rules

### String Length Constraints

| Field | Min | Max | Notes |
|-------|-----|-----|-------|
| first_name, last_name | 2 | 50 | Required |
| email | - | - | RFC 5322 format |
| mobile | - | 15 | E.164 format |
| Board/Subject/Chapter/Concept name | 2 | 100 | Required |
| Description | 0 | 500 | Optional |
| Concept explanation | 1 | 5000 | Required |
| Practice question | 0 | 1000 | Per question |
| Feedback comment | 10 | 2000 | Required |

### Data Type Validation

- **ObjectId**: MongoDB ObjectId format (24 hex characters)
- **Email**: RFC 5322 compliant format
- **Mobile**: E.164 format (+[country][number], max 15 digits)
- **Role**: Enum ['Admin', 'Teacher', 'Student', 'Parent']
- **Review Status**: Enum ['pending', 'reviewed']
- **Boolean**: true/false for active, verified flags

### Sanitization

All string inputs are automatically:
- Trimmed of leading/trailing whitespace
- Escaped for HTML special characters (where applicable)
- Normalized (email addresses converted to lowercase)

## Error Response Format

When validation fails, the API returns:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format",
      "value": "invalid-email"
    },
    {
      "field": "mobile",
      "message": "Mobile number is required"
    }
  ]
}
```

**Status Code**: 400 Bad Request

## Security Features

### Injection Prevention

- All string inputs are sanitized
- HTML special characters are escaped
- Email and mobile formats are strictly validated
- MongoDB ObjectIds are validated before queries

### Input Sanitization

The `sanitizeInputs` middleware can be applied globally:

```javascript
app.use(express.json());
app.use(sanitizeInputs);  // Sanitize all request bodies
```

### Validation Logging

All validation failures are logged with context:
- Request path and method
- Failed validation rules
- User ID (if authenticated)
- IP address

## Testing Validation

### Valid Request Example

```javascript
// POST /api/auth/register
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@example.com",
  "mobile": "+1234567890",
  "role": "Student"
}
// Response: 201 Created
```

### Invalid Request Example

```javascript
// POST /api/auth/register
{
  "first_name": "J",  // Too short
  "email": "invalid-email",  // Invalid format
  "mobile": "123",  // Invalid format
  "role": "InvalidRole"  // Not in enum
}
// Response: 400 Bad Request with validation errors
```

## Adding New Validators

1. Create validation rules using express-validator
2. Add sanitization (trim, escape)
3. Include `handleValidationErrors` as last middleware
4. Export from module
5. Add to `index.js` exports
6. Apply to routes

Example:
```javascript
const { body } = require('express-validator');
const { handleValidationErrors } = require('./validationMiddleware');

const myValidation = [
  body('field')
    .trim()
    .notEmpty().withMessage('Field is required')
    .isLength({ min: 2, max: 50 }).withMessage('Length must be 2-50 chars')
    .escape(),
  handleValidationErrors
];

module.exports = { myValidation };
```

## References

- [express-validator Documentation](https://express-validator.github.io/docs/)
- [RFC 5322 Email Format](https://tools.ietf.org/html/rfc5322)
- [E.164 Phone Number Format](https://en.wikipedia.org/wiki/E.164)
- Requirements: 21.1, 21.2, 21.3, 21.4, 21.5, 21.6, 21.7
