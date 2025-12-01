// backend/models/Offer.js
const mongoose = require('mongoose');

const OfferSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ['PERCENT', 'FLAT', 'FREE_PLATE', 'CASHBACK'],
      required: true,
    },
    discountValue: {
      type: Number,
      default: 0,
    },
    minOrderAmount: {
      type: Number,
      default: 0,
    },
    validFrom: {
      type: Date,
      required: true,
    },
    validTo: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    applicableVendors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // vendor users
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Offer', OfferSchema);
