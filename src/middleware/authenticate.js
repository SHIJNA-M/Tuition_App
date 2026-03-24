const { verifyAccessToken } = require('../utils/jwtUtils');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * JWT Authentication Middleware
 * Validates JWT access token and attaches user object to request
 * Requirements: 5.7, 19.3, 19.4, 19.7
 */

/**
 * Authenticate middleware - validates JWT token
 * Extracts token from Authorization header, validates it, and attaches user to request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
async function authenticate(req, res, next) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      logger.warn('Authentication failed: No authorization header');
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No authorization header provided.'
      });
    }

    // Check if header follows "Bearer <token>" format
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      logger.warn('Authentication failed: Invalid authorization header format');
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization header format. Expected: Bearer <token>'
      });
    }

    const token = parts[1];

    // Validate token signature and expiry
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (error) {
      logger.warn(`Token validation failed: ${error.message}`);
      return res.status(401).json({
        success: false,
        message: error.message === 'Access token expired' 
          ? 'Access token expired. Please refresh your token.'
          : 'Invalid access token. Authentication failed.'
      });
    }

    // Fetch user from database
    const user = await User.findById(decoded.userId);

    if (!user) {
      logger.warn(`User not found for token: ${decoded.userId}`);
      return res.status(401).json({
        success: false,
        message: 'User not found. Authentication failed.'
      });
    }

    // Check if user is active
    if (!user.active) {
      logger.warn(`Inactive user attempted access: ${user._id}`);
      return res.status(401).json({
        success: false,
        message: 'User account is inactive. Please contact administrator.'
      });
    }

    // Attach user object to request
    req.user = {
      id: user._id,
      userId: user._id, // Alias for compatibility
      role: user.role,
      email: user.email,
      mobile: user.mobile,
      first_name: user.first_name,
      last_name: user.last_name,
      verified: user.verification_status
    };

    logger.info(`User authenticated: ${user._id} (${user.role})`);
    next();
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication'
    });
  }
}

module.exports = authenticate;
