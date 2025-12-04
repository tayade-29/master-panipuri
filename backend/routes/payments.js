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
    return res.status(500).json({ message: 'Server error' });
  }
};

const requireVendor = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'vendor') {
      return res.status(403).json({ message: 'Vendor access only' });
    }
    req.vendor = user;
    next();
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * POST /api/payments
 * Customer pays a vendor and we update loyalty
 * body: { stallId, vendorId, plateCount, pricePerPlate, method }
 * method: 'ONLINE' | 'CASH'
 */
// In backend/routes/payments.js → replace only the POST / route
// backend/routes/payments.js


// backend/routes/payments.js → POST '/' route ko replace kar do

router.post('/', auth, requireCustomer, async (req, res) => {
  try {
    const { stallId, plateCount, method } = req.body; // vendorId ki zarurat nahi

    const plates = parseInt(plateCount) || 0;
    if (plates <= 0 || !stallId) {
      return res.status(400).json({ message: 'Invalid data' });
    }

    // STALL SE PRICE LE RAHE HAIN — YEH SABSE BADI BAAT HAI
    const stall = await Stall.findById(stallId);
    if (!stall || !stall.isOpen) {
      return res.status(400).json({ message: 'Stall not found or closed' });
    }

    const pricePerPlate = stall.pricePerPlate || 50; // fallback
    const totalAmount = plates * pricePerPlate;

    const payment = await Payment.create({
      customer: req.customer._id,
      vendor: stall.vendor,
      stall: stallId,
      plateCount: plates,
      pricePerPlate: pricePerPlate,        // STALL SE AAYA
      amount: totalAmount,
      method: method === 'CASH' ? 'CASH' : 'ONLINE',
      status: 'PENDING_VENDOR',
      freePlatesGiven: 0,
      paidPlates: 0,
    });

    res.status(201).json({
      message: 'Payment request sent!',
      payment,
    });
  } catch (err) {
    console.error('Payment create error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/payments/vendor/summary
 * Vendor dashboard: today's summary (only CONFIRMED payments)
 */
/**
 * GET /api/payments/vendor/summary
 * Vendor dashboard summary with dynamic period
 * Query params:
 *   period = 'today' (default) | 'yesterday' | 'all'
 */
router.get('/vendor/summary', auth, requireVendor, async (req, res) => {
  try {
    const period = req.query.period || 'today'; // today, yesterday, all

    let startOfDay, endOfDay;

    const now = new Date();

    if (period === 'yesterday') {
      // Yesterday
      startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === 'all') {
      // From the beginning of time
      startOfDay = new Date(0); // 1970
      endOfDay = new Date();    // now
    } else {
      // Today (default)
      startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    }

    // Only confirmed payments
    const payments = await Payment.find({
      vendor: req.vendor._id,
      status: 'CONFIRMED',
      createdAt: { $gte: startOfDay, $lt: endOfDay },
    });

    let totalAmount = 0;
    let totalPlates = 0;
    let totalFreePlates = 0;
    const byMethod = { ONLINE: 0, CASH: 0 };

    payments.forEach((p) => {
      const amount = p.amount || 0;
      totalAmount += amount;
      totalPlates += p.plateCount;
      totalFreePlates += p.freePlatesGiven || 0;

      if (p.method === 'ONLINE') byMethod.ONLINE += amount;
      if (p.method === 'CASH') byMethod.CASH += amount;
    });

    res.json({
      period,
      date: startOfDay.toISOString().split('T')[0],
      totalAmount,
      totalPlates,
      totalFreePlates,
      byMethod,
      count: payments.length,
    });
  } catch (err) {
    console.error('Vendor summary error:', err.message);
    res.status(500).json({ message: 'Server error' });
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
// GET /api/payments/vendor/list  → SHOW ALL PAYMENTS (PENDING + CONFIRMED)
router.get('/vendor/list', auth, requireVendor, async (req, res) => {
  try {
    const payments = await Payment.find({ vendor: req.vendor._id })
      .populate('customer', 'fullName phone')
      .populate('stall', 'name')
      .sort({ createdAt: -1 });

    const confirmedTotal = payments
      .filter(p => p.status === 'CONFIRMED')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    res.json({
      payments,
      totalAmount: confirmedTotal,
      totalPlates: payments.reduce((sum, p) => sum + p.plateCount, 0),
      count: payments.length,
    });
  } catch (err) {
    console.error('List error:', err);
    res.status(500).json({ message: 'Server error' });
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
// VENDOR CONFIRM ROUTE — YEHI SABSE BADA FIX HAI
router.post('/vendor/confirm/:id', auth, requireVendor, async (req, res) => {
  try {
    const payment = await Payment.findOne({
      _id: req.params.id,
      vendor: req.vendor._id,
      status: 'PENDING_VENDOR'
    });

    if (!payment) return res.status(404).json({ message: 'Not found or already confirmed' });

    const customer = await User.findById(payment.customer);
    if (!customer) return res.status(400).json({ message: 'Customer not found' });

    let loyalty = await Loyalty.findOne({
      customer: customer._id,
      vendor: req.vendor._id
    }) || new Loyalty({ customer: customer._id, vendor: req.vendor._id, plateCount: 0 });

    loyalty.plateCount += payment.plateCount;
    const freePlates = Math.floor(loyalty.plateCount / 5);
    loyalty.plateCount %= 5;
    await loyalty.save();

    const paidPlates = payment.plateCount - freePlates;
    const price = payment.pricePerPlate || 50; // old payments ke liye fallback
    const finalAmount = Math.max(0, paidPlates * price);

    payment.status = 'CONFIRMED';
    payment.paidPlates = paidPlates;
    payment.freePlatesGiven = freePlates;
    payment.amount = finalAmount;
    await payment.save();

    res.json({ message: 'Confirmed!', payment, freePlatesGiven: freePlates });

  } catch (err) {
    console.error('Confirm error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
