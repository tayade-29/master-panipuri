const mongoose = require('mongoose');

const LoyaltySchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // plates counted towards NEXT free plate
    plateCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

LoyaltySchema.index({ customer: 1, vendor: 1 }, { unique: true });

module.exports = mongoose.model('Loyalty', LoyaltySchema);
