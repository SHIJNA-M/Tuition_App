require('dotenv').config();

/**
 * Configuration Parser and Validator
 * Loads and validates environment variables
 * Requirements: 20.1, 20.2, 20.5
 */

class ConfigurationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

/**
 * Validates required configuration fields
 * @throws {ConfigurationError} if required fields are missing
 */
function validateConfig() {
  const requiredFields = [
    { key: 'MONGODB_URI', description: 'Database connection string' },
    { key: 'JWT_ACCESS_SECRET', description: 'JWT access token secret' },
    { key: 'JWT_REFRESH_SECRET', description: 'JWT refresh token secret' },
    { key: 'EMAIL_SERVICE', description: 'Email service provider' },
    { key: 'EMAIL_USER', description: 'Email user' },
    { key: 'EMAIL_PASSWORD', description: 'Email password' },
    { key: 'TWILIO_ACCOUNT_SID', description: 'Twilio account SID' },
    { key: 'TWILIO_AUTH_TOKEN', description: 'Twilio auth token' },
    { key: 'TWILIO_FROM_NUMBER', description: 'Twilio from number' },
    { key: 'CLOUD_STORAGE_PROVIDER', description: 'Cloud storage provider' }
  ];

  const missingFields = [];

  for (const field of requiredFields) {
    if (!process.env[field.key]) {
      missingFields.push(`${field.key} (${field.description})`);
    }
  }

  // Validate cloud storage credentials based on provider
  const provider = process.env.CLOUD_STORAGE_PROVIDER;
  if (provider === 'cloudinary') {
    if (!process.env.CLOUDINARY_CLOUD_NAME) missingFields.push('CLOUDINARY_CLOUD_NAME');
    if (!process.env.CLOUDINARY_API_KEY) missingFields.push('CLOUDINARY_API_KEY');
    if (!process.env.CLOUDINARY_API_SECRET) missingFields.push('CLOUDINARY_API_SECRET');
  } else if (provider === 's3') {
    if (!process.env.AWS_ACCESS_KEY_ID) missingFields.push('AWS_ACCESS_KEY_ID');
    if (!process.env.AWS_SECRET_ACCESS_KEY) missingFields.push('AWS_SECRET_ACCESS_KEY');
    if (!process.env.AWS_REGION) missingFields.push('AWS_REGION');
    if (!process.env.AWS_S3_BUCKET) missingFields.push('AWS_S3_BUCKET');
  }

  if (missingFields.length > 0) {
    throw new ConfigurationError(
      `Missing required configuration fields:\n${missingFields.map(f => `  - ${f}`).join('\n')}`
    );
  }
}

// Validate configuration on load
validateConfig();

/**
 * Structured configuration object
 */
const config = {
  server: {
    port: parseInt(process.env.PORT, 10) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000']
  },

  database: {
    uri: process.env.MONGODB_URI,
    options: {
      minPoolSize: parseInt(process.env.DB_MIN_POOL_SIZE, 10) || 5,
      maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE, 10) || 20,
      serverSelectionTimeoutMS: 5000
    }
  },

  jwt: {
    accessTokenSecret: process.env.JWT_ACCESS_SECRET,
    refreshTokenSecret: process.env.JWT_REFRESH_SECRET,
    accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '55m',
    refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '30d'
  },

  otp: {
    email: {
      service: process.env.EMAIL_SERVICE,
      user: process.env.EMAIL_USER,
      password: process.env.EMAIL_PASSWORD
    },
    sms: {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      fromNumber: process.env.TWILIO_FROM_NUMBER
    },
    expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES, 10) || 10,
    maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS, 10) || 5,
    lockoutMinutes: parseInt(process.env.OTP_LOCKOUT_MINUTES, 10) || 30
  },

  cloudStorage: {
    provider: process.env.CLOUD_STORAGE_PROVIDER,
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET
    },
    s3: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
      bucket: process.env.AWS_S3_BUCKET
    }
  },

  fileUpload: {
    maxSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 10,
    allowedFormats: process.env.ALLOWED_FILE_FORMATS 
      ? process.env.ALLOWED_FILE_FORMATS.split(',') 
      : ['pdf', 'jpeg', 'png', 'jpg'],
    maxRetries: parseInt(process.env.MAX_UPLOAD_RETRIES, 10) || 3
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    maxFileSizeMB: parseInt(process.env.LOG_MAX_FILE_SIZE_MB, 10) || 100,
    retentionDays: parseInt(process.env.LOG_RETENTION_DAYS, 10) || 90
  }
};

module.exports = config;
