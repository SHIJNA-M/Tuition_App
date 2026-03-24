const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const {
  registerValidation,
  verifyOTPValidation,
  loginValidation,
  verifyLoginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  refreshTokenValidation,
  logoutValidation
} = require('../middleware/validators/authValidators');

/**
 * Authentication Routes
 * Base path: /api/auth
 */

// POST /api/auth/register - Register new user with password
router.post('/register', registerValidation, authController.register);

// POST /api/auth/verify-otp - Verify OTP for registration (email + mobile)
router.post('/verify-otp', verifyOTPValidation, authController.verifyOTP);

// POST /api/auth/login - Login with email/mobile and password
router.post('/login', loginValidation, authController.login);

// POST /api/auth/verify-login - Verify login OTP (deprecated - kept for backward compatibility)
router.post('/verify-login', verifyLoginValidation, authController.verifyLogin);

// POST /api/auth/forgot-password - Request password reset OTP
router.post('/forgot-password', forgotPasswordValidation, authController.forgotPassword);

// POST /api/auth/reset-password - Reset password with OTP
router.post('/reset-password', resetPasswordValidation, authController.resetPassword);

// POST /api/auth/refresh - Refresh access token
router.post('/refresh', refreshTokenValidation, authController.refresh);

// POST /api/auth/logout - Logout user (revoke refresh token)
router.post('/logout', logoutValidation, authController.logout);

module.exports = router;
