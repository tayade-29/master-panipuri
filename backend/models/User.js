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
      lowercase: true,
      unique: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ['customer', 'vendor', 'admin'],
      default: 'customer',
    },
    vendorStatus: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', null],
      default: null,
    },
      referralCode: {
    type: String,
    unique: true,
    sparse: true,
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },

  },
  { timestamps: true }
  
);
UserSchema.pre('save', function (next) {
  if (!this.isNew || this.referralCode) {
    return next();
  }
  // Simple code: PAN + last 6 chars of _id
  this.referralCode = (
    'PAN' + this._id.toString().slice(-6)
  ).toUpperCase();
  next();
});

module.exports = mongoose.model('User', UserSchema);
