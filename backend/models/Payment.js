const mongoose = require('mongoose');
const PaymentSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    stall: { type: mongoose.Schema.Types.ObjectId, ref: 'Stall', required: true },

    plateCount: { type: Number, required: true },   // total plates ordered
    paidPlates: { type: Number, default: 0 },       // plates actually charged
    freePlatesGiven: { type: Number, default: 0 },  // loyalty free plates

    amount: { type: Number, required: true },

    method: {
      type: String,
      enum: ['ONLINE', 'CASH'],
      default: 'ONLINE',
    },

    status: {
      type: String,
      enum: ['PENDING_VENDOR', 'CONFIRMED', 'FAILED'],
      default: 'CONFIRMED',
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model('Payment', PaymentSchema);