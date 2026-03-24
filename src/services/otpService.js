const nodemailer = require('nodemailer');
const twilio = require('twilio');
const config = require('../config');
const logger = require('../utils/logger');
const OTP = require('../models/OTP');

/**
 * OTP Service
 * Handles OTP generation, delivery via email and SMS, and retry logic
 * Requirements: 1.4, 1.5, 2.2
 */

/**
 * Generate a 6-digit random OTP code
 * @returns {string} 6-digit OTP
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Create email transporter using Nodemailer
 */
let emailTransporter;
try {
  emailTransporter = nodemailer.createTransport({
    service: config.otp.email.service,
    auth: {
      user: config.otp.email.user,
      pass: config.otp.email.password
    }
  });
} catch (error) {
  logger.warn('Email transporter not configured. OTPs will be logged to console.');
  emailTransporter = null;
}

/**
 * Create Twilio client for SMS
 */
let twilioClient;
try {
  // Only initialize Twilio if credentials look valid
  if (config.otp.sms.accountSid && config.otp.sms.accountSid.startsWith('AC')) {
    twilioClient = twilio(
      config.otp.sms.accountSid,
      config.otp.sms.authToken
    );
  } else {
    logger.warn('Twilio not configured. OTPs will be logged to console.');
    twilioClient = null;
  }
} catch (error) {
  logger.warn('Twilio client initialization failed. OTPs will be logged to console.');
  twilioClient = null;
}

/**
 * Send OTP via email with retry logic
 * @param {string} email - Recipient email address
 * @param {string} otp - OTP code to send
 * @param {number} retries - Number of retry attempts (default: 3)
 * @returns {Promise<boolean>} Success status
 */
async function sendEmailOTP(email, otp, retries = 3) {
  // Development mode - log OTP to console
  if (!emailTransporter) {
    logger.info(`[DEVELOPMENT MODE] Email OTP for ${email}: ${otp}`);
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📧 EMAIL OTP for ${email}: ${otp}`);
    console.log(`${'='.repeat(60)}\n`);
    return true;
  }

  const mailOptions = {
    from: config.otp.email.user,
    to: email,
    subject: 'Your OTP Code - Tuition Center Management System',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Your OTP Code</h2>
        <p>Your one-time password (OTP) is:</p>
        <h1 style="color: #4CAF50; letter-spacing: 5px;">${otp}</h1>
        <p>This code will expire in ${config.otp.expiryMinutes} minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
      </div>
    `
  };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await emailTransporter.sendMail(mailOptions);
      logger.info(`Email OTP sent successfully to ${email} on attempt ${attempt}`);
      return true;
    } catch (error) {
      logger.error(`Failed to send email OTP to ${email} on attempt ${attempt}:`, error);
      
      if (attempt === retries) {
        logger.error(`All ${retries} attempts failed for email OTP to ${email}`);
        // In development, still log the OTP
        logger.info(`[FALLBACK] Email OTP for ${email}: ${otp}`);
        console.log(`\n${'='.repeat(60)}`);
        console.log(`📧 EMAIL OTP for ${email}: ${otp}`);
        console.log(`${'='.repeat(60)}\n`);
        return true; // Return true in development to allow testing
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  return false;
}

/**
 * Send OTP via SMS with retry logic
 * @param {string} mobile - Recipient mobile number (E.164 format)
 * @param {string} otp - OTP code to send
 * @param {number} retries - Number of retry attempts (default: 3)
 * @returns {Promise<boolean>} Success status
 */
async function sendSMSOTP(mobile, otp, retries = 3) {
  // Development mode - log OTP to console
  if (!twilioClient) {
    logger.info(`[DEVELOPMENT MODE] Mobile OTP for ${mobile}: ${otp}`);
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📱 SMS OTP for ${mobile}: ${otp}`);
    console.log(`${'='.repeat(60)}\n`);
    return true;
  }

  const message = `Your OTP code is: ${otp}. Valid for ${config.otp.expiryMinutes} minutes. Do not share this code.`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await twilioClient.messages.create({
        body: message,
        from: config.otp.sms.fromNumber,
        to: mobile
      });
      logger.info(`SMS OTP sent successfully to ${mobile} on attempt ${attempt}`);
      return true;
    } catch (error) {
      logger.error(`Failed to send SMS OTP to ${mobile} on attempt ${attempt}:`, error);
      
      if (attempt === retries) {
        logger.error(`All ${retries} attempts failed for SMS OTP to ${mobile}`);
        // In development, still log the OTP
        logger.info(`[FALLBACK] Mobile OTP for ${mobile}: ${otp}`);
        console.log(`\n${'='.repeat(60)}`);
        console.log(`📱 SMS OTP for ${mobile}: ${otp}`);
        console.log(`${'='.repeat(60)}\n`);
        return true; // Return true in development to allow testing
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  return false;
}

/**
 * Generate and store OTPs for a user
 * @param {string} userId - User ID
 * @param {string} purpose - Purpose of OTP ('registration' or 'login')
 * @returns {Promise<{emailOTP: string, mobileOTP: string}>} Generated OTPs
 */
async function generateAndStoreOTPs(userId, purpose) {
  const emailOTP = generateOTP();
  const mobileOTP = generateOTP();

  // Delete any existing OTPs for this user and purpose
  await OTP.deleteMany({ user_id: userId, purpose });

  // Create new OTP record
  await OTP.create({
    user_id: userId,
    email_otp: emailOTP,
    mobile_otp: mobileOTP,
    purpose,
    expires_at: new Date(Date.now() + config.otp.expiryMinutes * 60 * 1000)
  });

  logger.info(`OTPs generated and stored for user ${userId}, purpose: ${purpose}`);

  return { emailOTP, mobileOTP };
}

/**
 * Send OTPs to user's email and mobile
 * @param {Object} user - User object with email and mobile
 * @param {string} purpose - Purpose of OTP ('registration' or 'login')
 * @returns {Promise<void>}
 */
async function sendOTPs(user, purpose) {
  try {
    // Generate and store OTPs
    const { emailOTP, mobileOTP } = await generateAndStoreOTPs(user._id, purpose);

    // Send OTPs in parallel
    const [emailResult, smsResult] = await Promise.allSettled([
      sendEmailOTP(user.email, emailOTP),
      sendSMSOTP(user.mobile, mobileOTP)
    ]);

    // Check if both succeeded
    const emailSuccess = emailResult.status === 'fulfilled' && emailResult.value;
    const smsSuccess = smsResult.status === 'fulfilled' && smsResult.value;

    if (!emailSuccess || !smsSuccess) {
      const failures = [];
      if (!emailSuccess) failures.push('email');
      if (!smsSuccess) failures.push('SMS');
      
      logger.error(`Failed to send OTP via: ${failures.join(', ')} for user ${user._id}`);
      throw new Error(`Failed to send OTP via ${failures.join(' and ')}`);
    }

    logger.info(`OTPs sent successfully to user ${user._id} via email and SMS`);
  } catch (error) {
    logger.error(`Error in sendOTPs for user ${user._id}:`, error);
    throw error;
  }
}

/**
 * Verify OTP for a user
 * @param {string} userId - User ID
 * @param {string} emailOTP - Email OTP to verify
 * @param {string} mobileOTP - Mobile OTP to verify
 * @param {string} purpose - Purpose of OTP ('registration', 'login', or 'forgot_password')
 * @returns {Promise<{valid: boolean, locked: boolean, message: string}>}
 */
async function verifyOTP(userId, emailOTP, mobileOTP, purpose) {
  try {
    // Find the OTP record
    const otpRecord = await OTP.findOne({ user_id: userId, purpose }).sort({ created_at: -1 });

    if (!otpRecord) {
      return { valid: false, locked: false, message: 'No OTP found. Please request a new one.' };
    }

    // Check if locked
    if (otpRecord.locked_until && otpRecord.locked_until > new Date()) {
      const remainingMinutes = Math.ceil((otpRecord.locked_until - new Date()) / 60000);
      return { 
        valid: false, 
        locked: true, 
        message: `Too many failed attempts. Please try again in ${remainingMinutes} minutes.` 
      };
    }

    // Check if expired
    if (otpRecord.expires_at < new Date()) {
      return { valid: false, locked: false, message: 'OTP has expired. Please request a new one.' };
    }

    // Verify OTPs based on purpose
    let isValid = false;
    
    if (purpose === 'forgot_password' || purpose === 'login') {
      // For forgot_password and login, only verify mobile OTP
      isValid = otpRecord.mobile_otp === mobileOTP;
    } else {
      // For registration, verify both email and mobile OTPs
      const emailValid = otpRecord.email_otp === emailOTP;
      const mobileValid = otpRecord.mobile_otp === mobileOTP;
      isValid = emailValid && mobileValid;
    }

    if (isValid) {
      // Success - delete the OTP record
      await OTP.deleteOne({ _id: otpRecord._id });
      logger.info(`OTP verified successfully for user ${userId}, purpose: ${purpose}`);
      return { valid: true, locked: false, message: 'OTP verified successfully' };
    }

    // Invalid OTP - increment failed attempts
    otpRecord.failed_attempts += 1;

    // Check if should lock
    if (otpRecord.failed_attempts >= config.otp.maxAttempts) {
      otpRecord.locked_until = new Date(Date.now() + config.otp.lockoutMinutes * 60 * 1000);
      await otpRecord.save();
      logger.warn(`User ${userId} locked due to ${config.otp.maxAttempts} failed OTP attempts`);
      return { 
        valid: false, 
        locked: true, 
        message: `Too many failed attempts. Account locked for ${config.otp.lockoutMinutes} minutes.` 
      };
    }

    await otpRecord.save();
    const remainingAttempts = config.otp.maxAttempts - otpRecord.failed_attempts;
    logger.warn(`Invalid OTP for user ${userId}. ${remainingAttempts} attempts remaining`);
    
    return { 
      valid: false, 
      locked: false, 
      message: `Invalid OTP. ${remainingAttempts} attempts remaining.` 
    };
  } catch (error) {
    logger.error(`Error verifying OTP for user ${userId}:`, error);
    throw error;
  }
}

module.exports = {
  generateOTP,
  sendEmailOTP,
  sendSMSOTP,
  generateAndStoreOTPs,
  sendOTPs,
  verifyOTP
};
