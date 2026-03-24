/**
 * File Validation Utility
 * Validates file format and size for student work uploads
 */

const ALLOWED_FORMATS = ['pdf', 'jpeg', 'jpg', 'png'];
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

/**
 * Validate file format
 * @param {Object} file - Multer file object
 * @returns {Object} - { valid: boolean, error: string }
 */
const validateFileFormat = (file) => {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  const mimetype = file.mimetype.toLowerCase();
  const extension = file.originalname.split('.').pop().toLowerCase();

  const validMimetypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png'
  ];

  if (!validMimetypes.includes(mimetype)) {
    return {
      valid: false,
      error: `Invalid file format. Only PDF, JPEG, and PNG files are allowed. Received: ${mimetype}`
    };
  }

  if (!ALLOWED_FORMATS.includes(extension)) {
    return {
      valid: false,
      error: `Invalid file extension. Only .pdf, .jpeg, .jpg, and .png extensions are allowed. Received: .${extension}`
    };
  }

  return { valid: true, error: null };
};

/**
 * Validate file size
 * @param {Object} file - Multer file object
 * @returns {Object} - { valid: boolean, error: string }
 */
const validateFileSize = (file) => {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (!file.size) {
    return { valid: false, error: 'File size information missing' };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `File size exceeds maximum limit. Maximum allowed: ${MAX_FILE_SIZE_MB}MB, received: ${fileSizeMB}MB`
    };
  }

  if (file.size === 0) {
    return { valid: false, error: 'File is empty (0 bytes)' };
  }

  return { valid: true, error: null };
};

/**
 * Validate file (format and size)
 * @param {Object} file - Multer file object
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
const validateFile = (file) => {
  const errors = [];

  const formatValidation = validateFileFormat(file);
  if (!formatValidation.valid) {
    errors.push(formatValidation.error);
  }

  const sizeValidation = validateFileSize(file);
  if (!sizeValidation.valid) {
    errors.push(sizeValidation.error);
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

module.exports = {
  validateFile,
  validateFileFormat,
  validateFileSize,
  ALLOWED_FORMATS,
  MAX_FILE_SIZE_MB,
  MAX_FILE_SIZE_BYTES
};
