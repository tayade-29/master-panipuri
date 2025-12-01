// backend/routes/offers.js
const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Offer = require('../models/Offer');

const router = express.Router();

// Middleware to ensure the logged-in user is admin
const requireAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access only' });
    }
    req.admin = user;
    next();
  } catch (err) {
    console.error('requireAdmin error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/offers
 * Public: list offers for customers (mobile app)
 * For now: return all active offers, ignoring date filters to keep it simple.
 */
router.get('/', async (req, res) => {
  try {
    const offers = await Offer.find({
      // comment out isActive filter if your model doesn't have it yet
      // isActive: true,
    }).sort({ createdAt: -1 });

    return res.json({ offers });
  } catch (err) {
    console.error('Get offers error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/offers/admin
 * Admin only: list all offers for admin panel
 */
router.get('/admin', auth, requireAdmin, async (req, res) => {
  try {
    const offers = await Offer.find().sort({ createdAt: -1 });
    return res.json({ offers });
  } catch (err) {
    console.error('Admin get offers error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/offers
 * Admin only: create a new offer
 */
router.post('/', auth, requireAdmin, async (req, res) => {
  try {
    const {
      title,
      description,
      code,
      discountType,
      discountValue,
      minOrderAmount,
      validFrom,
      validTo,
      applicableVendors,
    } = req.body;

    if (!title || !code || !discountType || discountValue == null) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const existing = await Offer.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ message: 'Offer code already exists' });
    }

    const offer = await Offer.create({
      title,
      description,
      code: code.toUpperCase(),
      discountType,
      discountValue,
      minOrderAmount: minOrderAmount || 0,
      validFrom: validFrom ? new Date(validFrom) : new Date(),
      validTo: validTo ? new Date(validTo) : null,
      applicableVendors: applicableVendors || [],
      isActive: true,
    });

    return res.status(201).json({ message: 'Offer created', offer });
  } catch (err) {
    console.error('Create offer error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
