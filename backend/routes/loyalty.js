// backend/routes/loyalty.js
const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Loyalty = require('../models/Loyalty');
const Payment = require('../models/Payment');

const router = express.Router();

// ensure role = customer
const requireCustomer = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'customer') {
      return res.status(403).json({ message: 'Customer access only' });
    }
    req.customer = user;
    next();
  } catch (err) {
    console.error('requireCustomer error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/loyalty/summary
 * Customer loyalty + stats across all vendors
 * Returns:
 *  - totalPlates
 *  - totalFreePlates
 *  - totalAmountSpent
 *  - vendorStats[]
 */
router.get('/summary', auth, requireCustomer, async (req, res) => {
  try {
    const customerId = req.customer._id;

    // All loyalty records for this customer
    const loyalties = await Loyalty.find({ customer: customerId }).populate(
      'vendor',
      'fullName phone'
    );

    // All payments for this customer
    const payments = await Payment.find({ customer: customerId });

    let totalPlates = 0;
    let totalFreePlates = 0;
    let totalAmountSpent = 0;

    // per-vendor aggregates from payments
    const vendorAgg = {}; // { vendorId: { totalPlates, totalFreePlates, totalAmount, lastVisitedAt } }

    payments.forEach((p) => {
      const vId = p.vendor.toString();
      totalPlates += p.plateCount;
      totalFreePlates += p.freePlatesGiven;
      totalAmountSpent += p.amount;

      if (!vendorAgg[vId]) {
        vendorAgg[vId] = {
          totalPlatesWithVendor: 0,
          totalFreePlatesWithVendor: 0,
          totalAmountWithVendor: 0,
          lastVisitedAt: null,
        };
      }

      vendorAgg[vId].totalPlatesWithVendor += p.plateCount;
      vendorAgg[vId].totalFreePlatesWithVendor += p.freePlatesGiven;
      vendorAgg[vId].totalAmountWithVendor += p.amount;
      if (
        !vendorAgg[vId].lastVisitedAt ||
        vendorAgg[vId].lastVisitedAt < p.createdAt
      ) {
        vendorAgg[vId].lastVisitedAt = p.createdAt;
      }
    });

    const vendorStats = loyalties.map((l) => {
      const vId = l.vendor._id.toString();
      const agg = vendorAgg[vId] || {
        totalPlatesWithVendor: 0,
        totalFreePlatesWithVendor: 0,
        totalAmountWithVendor: 0,
        lastVisitedAt: null,
      };

      const currentPlateCount = l.plateCount || 0;
      const platesNeededForNextFree = currentPlateCount
        ? 5 - currentPlateCount
        : 5;

      return {
        vendorId: vId,
        vendorName: l.vendor.fullName,
        vendorPhone: l.vendor.phone,
        currentPlateCount,
        platesNeededForNextFree,
        totalPlatesWithVendor: agg.totalPlatesWithVendor,
        totalFreePlatesWithVendor: agg.totalFreePlatesWithVendor,
        totalAmountWithVendor: agg.totalAmountWithVendor,
        lastVisitedAt: agg.lastVisitedAt,
      };
    });

    return res.json({
      totalPlates,
      totalFreePlates,
      totalAmountSpent,
      vendorStats,
    });
  } catch (err) {
    console.error('Loyalty summary error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
