// backend/models/Stall.js
const mongoose = require('mongoose');

const StallSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // one stall per vendor
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    address: {
      type: String,
      default: '',
    },
    // GeoJSON location
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        // [lng, lat]
        type: [Number],
        default: [0, 0],
      },
    },
    pricePerPlate: {
      type: Number,
      default: 0,
    },
    tags: {
      type: [String],
      default: [],
    },
    isOpen: {
      type: Boolean,
      default: true,
    },
    rating: {
      type: Number,
      default: 0,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
     upiId: {
    type: String, // e.g. "vendor@upi"
  },
  qrImageUrl: {
    type: String, // uploaded image URL of the scanner
  },
  },
  { timestamps: true }
);

// For $near queries
StallSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Stall', StallSchema);
