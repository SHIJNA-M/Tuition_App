const jwt = require('jsonwebtoken');
const config = require('../config');
const RefreshToken = require('../models/RefreshToken');
const logger = require('./logger');

/**
 * JWT Token Utilities
 * Handles access token and refresh token generation, validation, and storage
 * Requirements: 3.4, 3.5, 19.1, 19.2
 */

/**
 * Generate access token (15 minutes expiry)
 * @param {Object} user - User object with _id and role
 * @returns {string} JWT access token
 */
function generateAccessToken(user) {
  const payload = {
    userId: user._id.toString(),
    role: user.role
  };

  const token = jwt.sign(payload, config.jwt.accessTokenSecret, {
    expiresIn: config.jwt.accessTokenExpiry
  });

  logger.info(`Access token generated for user ${user._id}`);
  return token;
}

/**
 * Generate refresh token (30 days expiry) and store in database
 * @param {Object} user - User object with _id and role
 * @returns {Promise<string>} JWT refresh token
 */
async function generateRefreshToken(user) {
  const payload = {
    userId: user._id.toString(),
    role: user.role
  };

  const token = jwt.sign(payload, config.jwt.refreshTokenSecret, {
    expiresIn: config.jwt.refreshTokenExpiry
  });

  // Store refresh token in database
  await RefreshToken.create({
    user_id: user._id,
    token,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  });

  logger.info(`Refresh token generated and stored for user ${user._id}`);
  return token;
}

/**
 * Verify access token
 * @param {string} token - JWT access token
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
function verifyAccessToken(token) {
  try {
    const decoded = jwt.verify(token, config.jwt.accessTokenSecret);
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Access token expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid access token');
    }
    throw error;
  }
}

/**
 * Verify refresh token
 * @param {string} token - JWT refresh token
 * @returns {Promise<Object>} Decoded token payload
 * @throws {Error} If token is invalid, expired, or revoked
 */
async function verifyRefreshToken(token) {
  try {
    // Verify JWT signature and expiry
    const decoded = jwt.verify(token, config.jwt.refreshTokenSecret);

    // Check if token exists in database and is not revoked
    const tokenRecord = await RefreshToken.findOne({ token, revoked: false });
    
    if (!tokenRecord) {
      throw new Error('Refresh token not found or has been revoked');
    }

    // Check if token is expired in database
    if (tokenRecord.expires_at < new Date()) {
      throw new Error('Refresh token expired');
    }

    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid refresh token');
    }
    throw error;
  }
}

/**
 * Revoke refresh token (for logout)
 * @param {string} token - JWT refresh token to revoke
 * @returns {Promise<boolean>} Success status
 */
async function revokeRefreshToken(token) {
  try {
    const result = await RefreshToken.updateOne(
      { token },
      { revoked: true }
    );

    if (result.modifiedCount === 0) {
      logger.warn(`Attempted to revoke non-existent token`);
      return false;
    }

    logger.info(`Refresh token revoked successfully`);
    return true;
  } catch (error) {
    logger.error('Error revoking refresh token:', error);
    throw error;
  }
}

/**
 * Generate both access and refresh tokens
 * @param {Object} user - User object with _id and role
 * @returns {Promise<{accessToken: string, refreshToken: string}>}
 */
async function generateTokenPair(user) {
  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user);

  return { accessToken, refreshToken };
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  revokeRefreshToken,
  generateTokenPair
};
