// backend/routes/admin.js
const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Stall = require('../models/Stall');

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
 * GET /api/admin/vendors
 * List all vendor-like users (role=vendor or vendorStatus set)
 */
router.get('/vendors', auth, requireAdmin, async (req, res) => {
  try {
    // Show all users that look like vendors:
    // either explicit role=vendor or vendorStatus defined
    const vendors = await User.find({
      $or: [
        { role: 'vendor' },
        { vendorStatus: { $in: ['PENDING', 'APPROVED', 'REJECTED'] } },
      ],
    })
      .sort({ createdAt: -1 })
      .select('fullName email phone vendorStatus createdAt');

    const vendorIds = vendors.map((v) => v._id);

    const stalls = await Stall.find({ vendor: { $in: vendorIds } }).select(
      'vendor name isOpen'
    );

    const stallMap = {};
    stalls.forEach((s) => {
      stallMap[s.vendor.toString()] = {
        stallName: s.name,
        isOpen: s.isOpen,
      };
    });

    const data = vendors.map((v) => {
      const extra = stallMap[v._id.toString()] || {};
      return {
        _id: v._id,
        fullName: v.fullName,
        email: v.email,
        phone: v.phone,
        vendorStatus: v.vendorStatus || 'PENDING',
        createdAt: v.createdAt,
        stallName: extra.stallName || null,
        stallIsOpen: extra.isOpen ?? null,
      };
    });

    console.log('Admin vendors count:', data.length);

    return res.json({ vendors: data });
  } catch (err) {
    console.error('Admin get vendors error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * PATCH /api/admin/vendors/:id/status
 * Body: { status: 'PENDING' | 'APPROVED' | 'REJECTED' }
 */
router.patch('/vendors/:id/status', auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowed = ['PENDING', 'APPROVED', 'REJECTED'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const vendor = await User.findOneAndUpdate(
      { _id: id },
      { vendorStatus: status, role: 'vendor' }, // ensure it is marked as vendor
      { new: true }
    ).select('fullName email phone vendorStatus');

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    return res.json({ message: 'Vendor status updated', vendor });
  } catch (err) {
    console.error('Admin update vendor status error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
