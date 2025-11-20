const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Stall = require('../models/Stall');
const Payment = require('../models/Payment');
const Loyalty = require('../models/Loyalty');

const router = express.Router();

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
// ensure role = vendor
const requireVendor = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'vendor') {
      return res.status(403).json({ message: 'Vendor access only' });
    }

    // optional: enforce approval later
    // if (user.vendorStatus !== 'APPROVED') {
    //   return res.status(403).json({ message: 'Vendor not approved yet.' });
    // }

    req.vendor = user;
    next();
  } catch (err) {
    console.error('requireVendor error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
};


/**
 * POST /api/payments
 * Customer pays a vendor and we update loyalty
 * body: vendorId, stallId, plateCount, amount, method
 */

router.post('/', auth, requireCustomer, async (req, res) => {
  try {
    const { stallId, vendorId, plateCount, pricePerPlate, method } = req.body;

    // ✅ Only check for null / undefined, not falsy (0 etc.)
    if (
      stallId == null ||
      vendorId == null ||
      plateCount == null ||
      pricePerPlate == null
    ) {
      return res.status(400).json({
        message: 'stallId, vendorId, plateCount, pricePerPlate are required',
      });
    }

    const plates = Number(plateCount);
    const price = Number(pricePerPlate);

    if (Number.isNaN(plates) || plates <= 0) {
      return res.status(400).json({ message: 'Invalid plateCount' });
    }
    if (Number.isNaN(price) || price <= 0) {
      return res.status(400).json({ message: 'Invalid pricePerPlate' });
    }

    const vendor = await User.findById(vendorId);
    if (!vendor || vendor.role !== 'vendor') {
      return res.status(400).json({ message: 'Invalid vendor' });
    }

    const stall = await Stall.findById(stallId);
    if (!stall) {
      return res.status(400).json({ message: 'Invalid stall' });
    }

    const amount = plates * price;

    // Loyalty: find or create
    let loyalty = await Loyalty.findOne({
      customer: req.customer._id,
      vendor: vendor._id,
    });

    if (!loyalty) {
      loyalty = await Loyalty.create({
        customer: req.customer._id,
        vendor: vendor._id,
        plateCount: 0,
      });
    }

    loyalty.plateCount += plates;

    let freePlates = 0;
    if (loyalty.plateCount >= 5) {
      freePlates = Math.floor(loyalty.plateCount / 5);
      loyalty.plateCount = loyalty.plateCount % 5;
    }

    await loyalty.save();

    const payment = await Payment.create({
      customer: req.customer._id,
      vendor: vendor._id,
      stall: stall._id,
      amount,
      plateCount: plates,
      method: method || 'UPI',
      freePlatesGiven: freePlates,
    });

    return res.status(201).json({
      message: 'Payment recorded successfully',
      payment,
      loyalty: {
        currentPlateCount: loyalty.plateCount,
        freePlatesEarnedThisPayment: freePlates,
        platesNeededForNextFree: loyalty.plateCount
          ? 5 - loyalty.plateCount
          : 5,
      },
    });
  } catch (err) {
    console.error('Create payment error:', err.message, req.body);
    return res.status(500).json({ message: 'Server error' });
  }
}
);



/**
 * GET /api/payments/vendor/summary
 * Vendor dashboard: today's summary
 */
router.get('/vendor/summary', auth, requireVendor, async (req, res) => {
  try {
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const endOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    );

    const payments = await Payment.find({
      vendor: req.vendor._id,
      createdAt: { $gte: startOfDay, $lt: endOfDay },
    });

    let totalAmount = 0;
    let totalPlates = 0;
    let totalFreePlates = 0;
    const byMethod = {}; // { UPI: amount, CASH: amount, ... }

    payments.forEach((p) => {
      totalAmount += p.amount;
      totalPlates += p.plateCount;
      totalFreePlates += p.freePlatesGiven;
      byMethod[p.method] = (byMethod[p.method] || 0) + p.amount;
    });

    return res.json({
      date: startOfDay.toISOString(),
      totalAmount,
      totalPlates,
      totalFreePlates,
      byMethod,
      count: payments.length,
    });
  } catch (err) {
    console.error('Vendor summary error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
});






module.exports = router;
