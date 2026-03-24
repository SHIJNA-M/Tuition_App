const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  email_otp: {
    type: String,
    required: false,
    length: 6
  },
  mobile_otp: {
    type: String,
    required: false,
    length: 6
  },
  purpose: {
    type: String,
    required: [true, 'Purpose is required'],
    enum: {
      values: ['registration', 'login', 'forgot_password'],
      message: '{VALUE} is not a valid purpose'
    }
  },
  failed_attempts: {
    type: Number,
    default: 0,
    min: 0
  },
  locked_until: {
    type: Date,
    default: null
  },
  expires_at: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Indexes
otpSchema.index({ user_id: 1 });
otpSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 }); // TTL index

const OTP = mongoose.model('OTP', otpSchema);

module.exports = OTP;
