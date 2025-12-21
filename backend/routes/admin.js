// backend/routes/admin.js
const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Stall = require('../models/Stall');
const Payment = require('../models/Payment');


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
    const vendors = await User.find({
      $or: [
        { role: 'vendor' },
        { vendorStatus: { $in: ['PENDING', 'APPROVED', 'REJECTED'] } },
      ],
    })
      .sort({ createdAt: -1 })
      .select('fullName email phone vendorStatus createdAt editRequestStatus');  // NEW: include editRequestStatus

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
        editRequestStatus: v.editRequestStatus || 'NONE',  // NEW
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
router.patch('/vendors/:id/approve-edit', auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const vendor = await User.findOneAndUpdate(
      { _id: id, role: 'vendor' },
      { editRequestStatus: 'APPROVED' },
      { new: true }
    ).select('fullName email phone vendorStatus editRequestStatus');

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    return res.json({ message: 'Edit permission approved', vendor });
  } catch (err) {
    console.error('Admin approve edit error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
});
router.patch('/vendors/:id/reject-edit', auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const vendor = await User.findOneAndUpdate(
      { _id: id, role: 'vendor' },
      { editRequestStatus: 'NONE' },
      { new: true }
    ).select('fullName email phone vendorStatus editRequestStatus');

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    return res.json({ message: 'Edit request rejected', vendor });
  } catch (err) {
    console.error('Admin reject edit error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
});

// ✅ GET ALL CUSTOMERS WITH FULL ACTIVITY SUMMARY (SAFE VERSION)
router.get('/customers', auth, requireAdmin, async (req, res) => {
  try {
    const customers = await User.find({ role: 'customer' })
      .select('fullName phone createdAt')
      .sort({ createdAt: -1 })
      .lean();

    if (!customers.length) {
      return res.json({ customers: [] });
    }

    const customerIds = customers.map(c => c._id);

    const payments = await Payment.find({
      customer: { $in: customerIds },
      status: 'CONFIRMED'
    }).lean();

    const customerMap = {};

    // Initialize customer map
    customers.forEach(c => {
      customerMap[c._id.toString()] = {
        _id: c._id,
        fullName: c.fullName,
        phone: c.phone,
        totalPlates: 0,
        totalFreePlates: 0,
        totalAmountSpent: 0,
        lastVisitedAt: null,
      };
    });

    // Aggregate payments safely
    payments.forEach(p => {
      const id = p.customer?.toString();
      if (!customerMap[id]) return;

      customerMap[id].totalPlates += p.plateCount || 0;
      customerMap[id].totalFreePlates += p.freePlatesGiven || 0;
      customerMap[id].totalAmountSpent += p.amount || 0;

      if (
        !customerMap[id].lastVisitedAt ||
        customerMap[id].lastVisitedAt < p.createdAt
      ) {
        customerMap[id].lastVisitedAt = p.createdAt;
      }
    });

    return res.json({
      customers: Object.values(customerMap),
    });
  } catch (err) {
    console.error('ADMIN CUSTOMER API CRASH:', err); // 👈 VERY IMPORTANT LOG
    return res.status(500).json({ message: 'Admin customers API failed' });
  }
});



module.exports = router;
