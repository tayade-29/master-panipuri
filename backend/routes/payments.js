const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Stall = require('../models/Stall');
const Payment = require('../models/Payment');
const Loyalty = require('../models/Loyalty');

const router = express.Router();

/**
 * Middleware: require customer role
 */
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
 * Middleware: require vendor role
 */
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
 * body: { stallId, vendorId, plateCount, pricePerPlate, method }
 * method: 'ONLINE' | 'CASH'
 */
router.post('/', auth, requireCustomer, async (req, res) => {
  try {
    const { stallId, vendorId, plateCount, pricePerPlate, method } = req.body;

    // Only check for null / undefined, not falsy (0 etc.)
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

    // Loyalty: find or create for (customer, vendor)
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

    // calculate free plates based on total loyalty count
    let freePlates = 0;
    if (loyalty.plateCount >= 5) {
      freePlates = Math.floor(loyalty.plateCount / 5);
      loyalty.plateCount = loyalty.plateCount % 5;
    }

    await loyalty.save();

    // ✅ free plates are not charged
    const paidPlates = Math.max(0, plates - freePlates);
    const amount = paidPlates * price;

    // Normalize payment method
    let paymentMethod = 'ONLINE';
    if (method === 'CASH') {
      paymentMethod = 'CASH';
    }

    // Customer paying in CASH → pending vendor confirmation
    const status = paymentMethod === 'CASH' ? 'PENDING_VENDOR' : 'CONFIRMED';

    const payment = await Payment.create({
      customer: req.customer._id,
      vendor: vendor._id,
      stall: stall._id,
      amount,
      plateCount: plates, // total plates including free ones
      paidPlates,
      method: paymentMethod,
      status,
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
});

/**
 * GET /api/payments/vendor/summary
 * Vendor dashboard: today's summary (only CONFIRMED payments)
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
      status: 'CONFIRMED',
      createdAt: { $gte: startOfDay, $lt: endOfDay },
    });

    let totalAmount = 0;
    let totalPlates = 0;
    let totalFreePlates = 0;
    const byMethod = {}; // { ONLINE: amount, CASH: amount, ... }

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

/**
 * GET /api/payments/vendor/list
 * Vendor - list recent payments with optional date & status filters
 * Query:
 *   from   (ISO string, optional)
 *   to     (ISO string, optional)
 *   status (optional: PENDING_VENDOR, CONFIRMED, FAILED)
 */
router.get('/vendor/list', auth, requireVendor, async (req, res) => {
  try {
    const { from, to, status } = req.query;

    let fromDate;
    let toDate;

    if (from) {
      fromDate = new Date(from);
      if (isNaN(fromDate.getTime())) {
        return res.status(400).json({ message: 'Invalid from date' });
      }
    }

    if (to) {
      toDate = new Date(to);
      if (isNaN(toDate.getTime())) {
        return res.status(400).json({ message: 'Invalid to date' });
      }
    }

    // default: last 7 days
    if (!fromDate && !toDate) {
      const now = new Date();
      toDate = now;
      fromDate = new Date();
      fromDate.setDate(now.getDate() - 7);
    }

    const query = {
      vendor: req.vendor._id,
    };

    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = fromDate;
      if (toDate) query.createdAt.$lte = toDate;
    }

    // by default list only CONFIRMED payments unless status is provided
    if (status) {
      query.status = status;
    } else {
      query.status = 'CONFIRMED';
    }

    const payments = await Payment.find(query)
      .sort({ createdAt: -1 })
      .populate('customer', 'fullName phone')
      .populate('stall', 'name');

    let totalAmount = 0;
    let totalPlates = 0;
    let totalFreePlates = 0;

    payments.forEach((p) => {
      totalAmount += p.amount;
      totalPlates += p.plateCount;
      totalFreePlates += p.freePlatesGiven;
    });

    return res.json({
      totalAmount,
      totalPlates,
      totalFreePlates,
      count: payments.length,
      payments,
    });
  } catch (err) {
    console.error('Vendor payments list error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/payments/vendor/serve
 * Vendor serving a customer (with app account)
 * Body: { customerPhone, stallId, plateCount, pricePerPlate, method }
 * method: 'ONLINE' | 'CASH'
 *
 * Since vendor is the one creating this, we treat payments as CONFIRMED.
 */
router.post('/vendor/serve', auth, requireVendor, async (req, res) => {
  try {
    const {
      customerPhone,
      stallId,
      plateCount,
      pricePerPlate,
      method,
    } = req.body;

    if (!customerPhone || !stallId || plateCount == null || pricePerPlate == null) {
      return res.status(400).json({
        message:
          'customerPhone, stallId, plateCount, pricePerPlate are required',
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

    const customer = await User.findOne({
      phone: customerPhone,
      role: 'customer',
    });

    if (!customer) {
      return res.status(400).json({
        message:
          'Customer not found with this phone. Ask them to register in the app.',
      });
    }

    // ensure stall belongs to this vendor
    const stall = await Stall.findOne({
      _id: stallId,
      vendor: req.vendor._id,
    });

    if (!stall) {
      return res.status(400).json({ message: 'Invalid stall for this vendor' });
    }

    // Loyalty for (customer, vendor)
    let loyalty = await Loyalty.findOne({
      customer: customer._id,
      vendor: req.vendor._id,
    });

    if (!loyalty) {
      loyalty = await Loyalty.create({
        customer: customer._id,
        vendor: req.vendor._id,
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

    // ✅ same free-plate logic: do not charge for free plates
    const paidPlates = Math.max(0, plates - freePlates);
    const amount = paidPlates * price;

    // Normalize method; default to CASH for vendor serve if not given
    let paymentMethod = 'CASH';
    if (method === 'ONLINE') {
      paymentMethod = 'ONLINE';
    }

    // Vendor creating this → we treat as already confirmed
    const status = 'CONFIRMED';

    const payment = await Payment.create({
      customer: customer._id,
      vendor: req.vendor._id,
      stall: stall._id,
      amount,
      plateCount: plates,
      paidPlates,
      method: paymentMethod,
      status,
      freePlatesGiven: freePlates,
    });

    return res.status(201).json({
      message: 'Payment recorded successfully',
      payment,
      customer: {
        id: customer._id,
        fullName: customer.fullName,
        phone: customer.phone,
      },
      loyalty: {
        currentPlateCount: loyalty.plateCount,
        freePlatesEarnedThisPayment: freePlates,
        platesNeededForNextFree: loyalty.plateCount
          ? 5 - loyalty.plateCount
          : 5,
      },
    });
  } catch (err) {
    console.error('Vendor serve error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/payments/vendor/confirm/:id
 * Vendor confirms a pending CASH payment created by the customer flow
 */
router.post('/vendor/confirm/:id', auth, requireVendor, async (req, res) => {
  try {
    const paymentId = req.params.id;

    const payment = await Payment.findOne({
      _id: paymentId,
      vendor: req.vendor._id,
      method: 'CASH',
      status: 'PENDING_VENDOR',
    });

    if (!payment) {
      return res
        .status(404)
        .json({ message: 'Pending cash payment not found for this vendor' });
    }

    payment.status = 'CONFIRMED';
    await payment.save();

    return res.json({ message: 'Payment confirmed', payment });
  } catch (err) {
    console.error('Vendor confirm payment error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
