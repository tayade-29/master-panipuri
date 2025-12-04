const mongoose = require('mongoose');
const PaymentSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    stall: { type: mongoose.Schema.Types.ObjectId, ref: 'Stall', required: true },

    plateCount: { type: Number, required: true },
    paidPlates: { type: Number, default: 0 },
    freePlatesGiven: { type: Number, default: 0 },

    pricePerPlate: { type: Number, required: true },  // ← YE BHI ADD KAR DO (important!)

    amount: { type: Number, default: 0 },  // ← required: true hata diya, default 0

    method: {
      type: String,
      enum: ['ONLINE', 'CASH'],
      default: 'ONLINE',
    },

    status: {
      type: String,
      enum: ['PENDING_VENDOR', 'CONFIRMED', 'FAILED'],
      default: 'PENDING_VENDOR',   // ← YE CHANGE KAR DO!!!
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model('Payment', PaymentSchema);