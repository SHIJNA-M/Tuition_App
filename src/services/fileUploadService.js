/**
 * File Upload Service with Retry Logic
 * Handles file uploads with exponential backoff retry mechanism
 */

const cloudStorageService = require('./cloudStorageService');
const { validateFile } = require('../utils/fileValidator');
const logger = require('../utils/logger');
const config = require('../config');

const MAX_RETRIES = config.fileUpload?.maxRetries || 3;
const INITIAL_DELAY_MS = 1000;

/**
 * Sleep utility for retry delays
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise}
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Calculate exponential backoff delay
 * @param {number} attempt - Current attempt number (0-indexed)
 * @returns {number} - Delay in milliseconds
 */
const calculateBackoffDelay = (attempt) => {
  return INITIAL_DELAY_MS * Math.pow(2, attempt);
};

/**
 * Upload file with retry logic
 * @param {Object} file - Multer file object
 * @param {Object} metadata - Additional metadata (studentId, subjectId, conceptId)
 * @returns {Promise<Object>} - Upload result with URL
 */
const uploadFileWithRetry = async (file, metadata = {}) => {
  // Validate file before attempting upload
  const validation = validateFile(file);
  if (!validation.valid) {
    const error = new Error('File validation failed');
    error.validationErrors = validation.errors;
    error.statusCode = 400;
    
    logger.error('File validation failed', {
      filename: file.originalname,
      errors: validation.errors,
      metadata
    });
    
    throw error;
  }

  let lastError = null;
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      logger.info(`Attempting file upload (attempt ${attempt + 1}/${MAX_RETRIES})`, {
        filename: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        metadata
      });

      const result = await cloudStorageService.uploadFile(file);

      logger.info('File upload successful', {
        filename: file.originalname,
        url: result.url,
        attempt: attempt + 1,
        metadata
      });

      return {
        success: true,
        url: result.url,
        filename: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        uploadedAt: new Date(),
        ...result
      };

    } catch (error) {
      lastError = error;
      
      logger.warn(`File upload attempt ${attempt + 1} failed`, {
        filename: file.originalname,
        error: error.message,
        attempt: attempt + 1,
        maxRetries: MAX_RETRIES,
        metadata
      });

      // If this is not the last attempt, wait before retrying
      if (attempt < MAX_RETRIES - 1) {
        const delay = calculateBackoffDelay(attempt);
        logger.info(`Retrying upload after ${delay}ms delay`, {
          filename: file.originalname,
          nextAttempt: attempt + 2
        });
        await sleep(delay);
      }
    }
  }

  // All retries failed
  logger.error('File upload failed after all retry attempts', {
    filename: file.originalname,
    attempts: MAX_RETRIES,
    lastError: lastError.message,
    metadata
  });

  const error = new Error(`File upload failed after ${MAX_RETRIES} attempts: ${lastError.message}`);
  error.statusCode = 500;
  error.originalError = lastError;
  throw error;
};

/**
 * Delete file from cloud storage
 * @param {string} identifier - File identifier (publicId for Cloudinary, key for S3)
 * @returns {Promise<Object>} - Deletion result
 */
const deleteFile = async (identifier) => {
  try {
    logger.info('Attempting file deletion', { identifier });
    
    const result = await cloudStorageService.deleteFile(identifier);
    
    logger.info('File deletion successful', { identifier });
    
    return {
      success: true,
      identifier,
      result
    };
  } catch (error) {
    logger.error('File deletion failed', {
      identifier,
      error: error.message
    });

    // Don't throw error - handle gracefully
    return {
      success: false,
      identifier,
      error: error.message
    };
  }
};

/**
 * Validate and upload file
 * Main entry point for file uploads
 * @param {Object} file - Multer file object
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<Object>} - Upload result
 */
const uploadFile = async (file, metadata = {}) => {
  if (!file) {
    const error = new Error('No file provided');
    error.statusCode = 400;
    throw error;
  }

  return await uploadFileWithRetry(file, metadata);
};

module.exports = {
  uploadFile,
  deleteFile,
  uploadFileWithRetry,
  calculateBackoffDelay
};
