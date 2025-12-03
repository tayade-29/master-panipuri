const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['customer', 'vendor', 'admin'],
      required: true,
    },
    vendorStatus: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: null,
    },
    referralCode: {
      type: String,
      unique: true,
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // NEW: For edit permissions
    editRequestStatus: {
      type: String,
      enum: ['NONE', 'PENDING', 'APPROVED'],
      default: 'NONE',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);