/**
 * Cloud Storage Service
 * Abstraction layer for cloud storage providers (Cloudinary and AWS S3)
 */

const { v4: uuidv4 } = require('uuid');
const path = require('path');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Generate unique filename to prevent collisions
 * @param {string} originalFilename - Original file name
 * @returns {string} - Unique filename with timestamp and UUID
 */
const generateUniqueFilename = (originalFilename) => {
  const timestamp = Date.now();
  const uuid = uuidv4().split('-')[0];
  const extension = path.extname(originalFilename);
  const baseName = path.basename(originalFilename, extension).replace(/[^a-zA-Z0-9]/g, '_');
  
  return `${baseName}_${timestamp}_${uuid}${extension}`;
};

/**
 * Cloudinary Upload Implementation
 */
class CloudinaryStorage {
  constructor() {
    this.cloudinary = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      const cloudinary = require('cloudinary').v2;
      
      cloudinary.config({
        cloud_name: config.cloudStorage.cloudinary.cloudName,
        api_key: config.cloudStorage.cloudinary.apiKey,
        api_secret: config.cloudStorage.cloudinary.apiSecret
      });

      this.cloudinary = cloudinary;
      this.initialized = true;
      logger.info('Cloudinary storage initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Cloudinary', { error: error.message });
      throw new Error('Cloudinary initialization failed');
    }
  }

  async upload(file) {
    await this.initialize();

    const uniqueFilename = generateUniqueFilename(file.originalname);
    const publicId = `student-work/${uniqueFilename.replace(path.extname(uniqueFilename), '')}`;

    try {
      let uploadSource;
      
      // Handle file path (disk storage) or buffer (memory storage)
      if (file.path) {
        uploadSource = file.path;
      } else if (file.buffer) {
        // Convert buffer to base64 data URI for Cloudinary
        uploadSource = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      } else {
        throw new Error('No file path or buffer available');
      }

      const result = await this.cloudinary.uploader.upload(uploadSource, {
        public_id: publicId,
        resource_type: 'auto',
        folder: 'student-work'
      });

      logger.info('File uploaded to Cloudinary', {
        publicId: result.public_id,
        url: result.secure_url,
        format: result.format,
        bytes: result.bytes
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        size: result.bytes
      };
    } catch (error) {
      logger.error('Cloudinary upload failed', {
        filename: file.originalname,
        error: error.message
      });
      throw error;
    }
  }

  async delete(publicId) {
    await this.initialize();

    try {
      const result = await this.cloudinary.uploader.destroy(publicId);
      logger.info('File deleted from Cloudinary', { publicId, result: result.result });
      return result;
    } catch (error) {
      logger.error('Cloudinary deletion failed', {
        publicId,
        error: error.message
      });
      throw error;
    }
  }
}

/**
 * AWS S3 Upload Implementation
 */
class S3Storage {
  constructor() {
    this.s3Client = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      const { S3Client } = require('@aws-sdk/client-s3');
      
      this.s3Client = new S3Client({
        region: config.cloudStorage.s3.region,
        credentials: {
          accessKeyId: config.cloudStorage.s3.accessKeyId,
          secretAccessKey: config.cloudStorage.s3.secretAccessKey
        }
      });

      this.bucket = config.cloudStorage.s3.bucket;
      this.initialized = true;
      logger.info('AWS S3 storage initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize AWS S3', { error: error.message });
      throw new Error('AWS S3 initialization failed');
    }
  }

  async upload(file) {
    await this.initialize();

    const { PutObjectCommand } = require('@aws-sdk/client-s3');
    const uniqueFilename = generateUniqueFilename(file.originalname);
    const key = `student-work/${uniqueFilename}`;

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer || require('fs').readFileSync(file.path),
        ContentType: file.mimetype,
        ACL: 'public-read'
      });

      await this.s3Client.send(command);

      const url = `https://${this.bucket}.s3.${config.cloudStorage.s3.region}.amazonaws.com/${key}`;

      logger.info('File uploaded to S3', {
        key,
        url,
        bucket: this.bucket,
        size: file.size
      });

      return {
        url,
        key,
        bucket: this.bucket,
        size: file.size
      };
    } catch (error) {
      logger.error('S3 upload failed', {
        filename: file.originalname,
        error: error.message
      });
      throw error;
    }
  }

  async delete(key) {
    await this.initialize();

    const { DeleteObjectCommand } = require('@aws-sdk/client-s3');

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key
      });

      const result = await this.s3Client.send(command);
      logger.info('File deleted from S3', { key, bucket: this.bucket });
      return result;
    } catch (error) {
      logger.error('S3 deletion failed', {
        key,
        error: error.message
      });
      throw error;
    }
  }
}

/**
 * Cloud Storage Factory
 * Returns appropriate storage provider based on configuration
 */
class CloudStorageService {
  constructor() {
    this.provider = null;
  }

  getProvider() {
    if (this.provider) return this.provider;

    const providerType = config.cloudStorage.provider;

    if (providerType === 'cloudinary') {
      this.provider = new CloudinaryStorage();
    } else if (providerType === 's3') {
      this.provider = new S3Storage();
    } else {
      throw new Error(`Unsupported cloud storage provider: ${providerType}`);
    }

    return this.provider;
  }

  async uploadFile(file) {
    const provider = this.getProvider();
    return await provider.upload(file);
  }

  async deleteFile(identifier) {
    const provider = this.getProvider();
    return await provider.delete(identifier);
  }
}

module.exports = new CloudStorageService();
module.exports.generateUniqueFilename = generateUniqueFilename;
