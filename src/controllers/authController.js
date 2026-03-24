const User = require('../models/User');
const otpService = require('../services/otpService');
const jwtUtils = require('../utils/jwtUtils');
const logger = require('../utils/logger');

/**
 * Authentication Controller
 * Handles user registration, OTP verification, login, token refresh, and logout
 */

/**
 * Register a new user
 * POST /api/auth/register
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8
 */
async function register(req, res, next) {
  try {
    const { first_name, last_name, email, mobile, password, role } = req.body;

    // Check for duplicate email
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      logger.warn(`Registration attempt with existing email: ${email}`);
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Check for duplicate mobile
    const existingMobile = await User.findOne({ mobile });
    if (existingMobile) {
      logger.warn(`Registration attempt with existing mobile: ${mobile}`);
      return res.status(409).json({
        success: false,
        message: 'Mobile number already registered'
      });
    }

    // Create user with verification_status: false
    // Password will be hashed automatically by the pre-save hook
    const user = await User.create({
      first_name,
      last_name,
      email: email.toLowerCase(),
      mobile,
      password,
      role,
      verification_status: false,
      email_verified: false,
      mobile_verified: false
    });

    logger.info(`User registered: ${user._id}, email: ${email}, role: ${role}`);

    // Generate and send OTPs
    try {
      await otpService.sendOTPs(user, 'registration');
    } catch (otpError) {
      logger.error(`Failed to send OTPs for user ${user._id}:`, otpError);
      // User is created but OTP sending failed
      return res.status(500).json({
        success: false,
        message: 'User registered but failed to send OTP. Please try logging in to resend.',
        userId: user._id.toString()
      });
    }

    res.status(201).json({
      success: true,
      message: 'User registered. OTPs sent to email and mobile for verification.',
      userId: user._id.toString()
    });
  } catch (error) {
    logger.error('Error in register controller:', error);
    next(error);
  }
}

/**
 * Verify OTP for user registration
 * POST /api/auth/verify-otp
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7
 */
async function verifyOTP(req, res, next) {
  try {
    const { userId, emailOTP, mobileOTP } = req.body;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify OTP
    const result = await otpService.verifyOTP(userId, emailOTP, mobileOTP, 'registration');

    if (result.locked) {
      logger.warn(`OTP verification locked for user ${userId}`);
      return res.status(429).json({
        success: false,
        message: result.message
      });
    }

    if (!result.valid) {
      logger.warn(`Invalid OTP for user ${userId}`);
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    // Update user verification status
    user.email_verified = true;
    user.mobile_verified = true;
    user.verification_status = true;
    await user.save();

    logger.info(`User ${userId} verified successfully`);

    res.status(200).json({
      success: true,
      message: 'Verification successful',
      verified: true
    });
  } catch (error) {
    logger.error('Error in verifyOTP controller:', error);
    next(error);
  }
}

/**
 * Login with email/mobile and password
 * POST /api/auth/login
 * Requirements: 3.1, 3.2, 3.7
 */
async function login(req, res, next) {
  try {
    const { identifier, password } = req.body;

    // Find user by email or mobile
    let user;
    if (identifier.includes('@')) {
      // Identifier is email
      user = await User.findOne({ email: identifier.toLowerCase() }).select('+password');
    } else {
      // Identifier is mobile
      user = await User.findOne({ mobile: identifier }).select('+password');
    }

    if (!user) {
      logger.warn(`Login attempt with non-existent identifier: ${identifier}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid email/mobile or password'
      });
    }

    // Check if user is verified
    if (!user.verification_status) {
      logger.warn(`Login attempt by unverified user: ${user._id}`);
      return res.status(403).json({
        success: false,
        message: 'Account not verified. Please complete OTP verification first.',
        userId: user._id.toString()
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      logger.warn(`Invalid password for user: ${user._id}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid email/mobile or password'
      });
    }

    // Generate access and refresh tokens
    const { accessToken, refreshToken } = await jwtUtils.generateTokenPair(user);

    logger.info(`User ${user._id} logged in successfully`);

    // Return tokens and user object
    res.status(200).json({
      success: true,
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: {
        id: user._id.toString(),
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        mobile: user.mobile,
        role: user.role
      }
    });
  } catch (error) {
    logger.error('Error in login controller:', error);
    next(error);
  }
}

/**
 * Verify login OTP and return tokens
 * POST /api/auth/verify-login
 * Requirements: 3.3, 3.4, 3.5, 3.6, 3.8
 * @deprecated This endpoint is no longer used with password-based login
 */
async function verifyLogin(req, res, next) {
  try {
    const { mobile, otp } = req.body;

    // Find user by mobile
    const user = await User.findOne({ mobile });
    if (!user) {
      logger.warn(`Login verification attempt with non-existent mobile: ${mobile}`);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify OTP (for login, we only verify mobile OTP)
    const result = await otpService.verifyOTP(user._id, otp, otp, 'login');

    if (result.locked) {
      logger.warn(`Login OTP verification locked for user ${user._id}`);
      return res.status(429).json({
        success: false,
        message: result.message
      });
    }

    if (!result.valid) {
      logger.warn(`Invalid login OTP for user ${user._id}`);
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    // Generate access and refresh tokens
    const { accessToken, refreshToken } = await jwtUtils.generateTokenPair(user);

    logger.info(`User ${user._id} logged in successfully`);

    // Return tokens and user object
    res.status(200).json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user._id.toString(),
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        mobile: user.mobile,
        role: user.role
      }
    });
  } catch (error) {
    logger.error('Error in verifyLogin controller:', error);
    next(error);
  }
}

/**
 * Initiate forgot password by sending OTP to mobile
 * POST /api/auth/forgot-password
 */
async function forgotPassword(req, res, next) {
  try {
    const { mobile } = req.body;

    // Find user by mobile
    const user = await User.findOne({ mobile });
    if (!user) {
      logger.warn(`Forgot password attempt with non-existent mobile: ${mobile}`);
      // Don't reveal if user exists or not for security
      return res.status(200).json({
        success: true,
        message: 'If this mobile number is registered, you will receive an OTP shortly.'
      });
    }

    // Generate and send OTP for password reset
    try {
      const { mobileOTP } = await otpService.generateAndStoreOTPs(user._id, 'forgot_password');
      await otpService.sendSMSOTP(user.mobile, mobileOTP);
      
      logger.info(`Forgot password OTP sent to user ${user._id}`);
      
      res.status(200).json({
        success: true,
        message: 'OTP sent to your mobile number'
      });
    } catch (otpError) {
      logger.error(`Failed to send forgot password OTP for user ${user._id}:`, otpError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please try again.'
      });
    }
  } catch (error) {
    logger.error('Error in forgotPassword controller:', error);
    next(error);
  }
}

/**
 * Reset password with OTP verification
 * POST /api/auth/reset-password
 */
async function resetPassword(req, res, next) {
  try {
    const { mobile, otp, newPassword } = req.body;

    // Find user by mobile
    const user = await User.findOne({ mobile });
    if (!user) {
      logger.warn(`Reset password attempt with non-existent mobile: ${mobile}`);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify OTP
    const result = await otpService.verifyOTP(user._id, otp, otp, 'forgot_password');

    if (result.locked) {
      logger.warn(`Reset password OTP verification locked for user ${user._id}`);
      return res.status(429).json({
        success: false,
        message: result.message
      });
    }

    if (!result.valid) {
      logger.warn(`Invalid reset password OTP for user ${user._id}`);
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    logger.info(`Password reset successful for user ${user._id}`);

    res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now login with your new password.'
    });
  } catch (error) {
    logger.error('Error in resetPassword controller:', error);
    next(error);
  }
}

/**
 * Refresh access token using refresh token
 * POST /api/auth/refresh
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
 */
async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;

    // Verify refresh token
    let decoded;
    try {
      decoded = await jwtUtils.verifyRefreshToken(refreshToken);
    } catch (error) {
      logger.warn(`Invalid or expired refresh token: ${error.message}`);
      return res.status(401).json({
        success: false,
        message: error.message || 'Invalid or expired refresh token. Please login again.'
      });
    }

    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      logger.warn(`Refresh token for non-existent user: ${decoded.userId}`);
      return res.status(401).json({
        success: false,
        message: 'User not found. Please login again.'
      });
    }

    // Generate new access token
    const accessToken = jwtUtils.generateAccessToken(user);

    logger.info(`Access token refreshed for user ${user._id}`);

    res.status(200).json({
      success: true,
      accessToken
    });
  } catch (error) {
    logger.error('Error in refresh controller:', error);
    next(error);
  }
}

/**
 * Logout user by revoking refresh token
 * POST /api/auth/logout
 * Requirements: 19.5
 */
async function logout(req, res, next) {
  try {
    const { refreshToken } = req.body;

    // Revoke refresh token
    const revoked = await jwtUtils.revokeRefreshToken(refreshToken);

    if (!revoked) {
      logger.warn(`Logout attempt with invalid refresh token`);
      return res.status(400).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    logger.info(`User logged out successfully`);

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    logger.error('Error in logout controller:', error);
    next(error);
  }
}

module.exports = {
  register,
  verifyOTP,
  login,
  verifyLogin,
  forgotPassword,
  resetPassword,
  refresh,
  logout
};
