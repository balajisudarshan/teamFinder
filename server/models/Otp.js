const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    rollNumber: {
      type: String,
      uppercase: true,
      trim: true,
      default: '',
    },
    otp: {
      type: String,
      required: true,
      trim: true,
    },
    purpose: {
      type: String,
      enum: ['registration', 'forgot_password'],
      default: 'registration',
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 300, // Document automatically removed after 300 seconds (5 minutes)
    },
  },
  {
    timestamps: false,
  }
);

module.exports = mongoose.model('Otp', otpSchema);
