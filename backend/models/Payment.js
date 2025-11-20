const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema(
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
    stall: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Stall',
    },
    amount: {
      type: Number,
      required: true,
    },
    plateCount: {
      type: Number,
      required: true,
    },
    method: {
      type: String,
      enum: ['UPI', 'CARD', 'CASH', 'QR'],
      default: 'UPI',
    },
    freePlatesGiven: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', PaymentSchema);
