// backend/routes/stalls.js
const express = require('express');
const auth = require('../middleware/auth');
const Stall = require('../models/Stall');
const User = require('../models/User');

const router = express.Router();

// Middleware: vendor-only access
const requireVendor = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user || user.role !== 'vendor') {
      return res.status(403).json({ message: 'Vendor access only' });
    }

    // For now you can comment this during dev if approvals not built yet:
    // if (user.vendorStatus !== 'APPROVED') {
    //   return res
    //     .status(403)
    //     .json({ message: 'Vendor not approved yet. Please wait for approval.' });
    // }

    req.vendor = user;
    next();
  } catch (err) {
    console.error('requireVendor error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
};
router.post('/request-edit', auth, requireVendor, async (req, res) => {
  try {
    const user = req.vendor;
    const stall = await Stall.findOne({ vendor: user._id });

    if (!stall) {
      return res.status(400).json({ message: 'No stall to edit' });
    }

    if (user.editRequestStatus === 'PENDING') {
      return res.status(400).json({ message: 'Edit request already pending' });
    }

    if (user.editRequestStatus === 'APPROVED') {
      return res.status(400).json({ message: 'Edit already approved - proceed to edit' });
    }

    user.editRequestStatus = 'PENDING';
    await user.save();

    return res.json({ message: 'Edit request sent to admin for approval' });
  } catch (err) {
    console.error('Request edit error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
});
/**
 * GET /api/stalls
 * Public - list of open stalls, optionally near lat/lng
 * Query:
 *   lat, lng (optional)
 *   radius (meters, optional; default 3000)
 */
router.get('/', async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;
    let stalls;

    if (lat && lng) {
      const latitude = Number(lat);
      const longitude = Number(lng);
      const radiusInMeters = radius ? Number(radius) : 3000; // 3 km

      if (
        Number.isNaN(latitude) ||
        Number.isNaN(longitude) ||
        Number.isNaN(radiusInMeters)
      ) {
        return res.status(400).json({ message: 'Invalid lat/lng/radius' });
      }

      stalls = await Stall.find({
        isOpen: true,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude], // [lng, lat]
            },
            $maxDistance: radiusInMeters,
          },
        },
      }).populate('vendor', 'fullName');
    } else {
      // No location provided -> just return all open stalls
      stalls = await Stall.find({ isOpen: true }).populate(
        'vendor',
        'fullName'
      );
    }

    return res.json({ stalls });
  } catch (err) {
    console.error('Get stalls error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/stalls/mine
 * Private - get current vendor's stall
 */
router.get('/mine', auth, requireVendor, async (req, res) => {
  try {
    const stall = await Stall.findOne({ vendor: req.vendor._id });
    return res.json({ stall });
  } catch (err) {
    console.error('Get my stall error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/stalls/mine
 * Private - create or update vendor's stall
 * Body:
 *   name (required)
 *   description, address, pricePerPlate, tags[], isOpen, lat, lng
 */

// backend/routes/stalls.js
router.post('/mine', auth, requireVendor, async (req, res) => {
  try {
    const {
      name,
      description,
      address,
      pricePerPlate,
      tags,
      isOpen,
      lat,
      lng,
      upiId,
      qrImageUrl,
    } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Stall name is required' });
    }

    const updateData = {
      name,
      description: description || '',
      address: address || '',
      pricePerPlate: pricePerPlate || 0,
      tags: Array.isArray(tags) ? tags : [],
      upiId: upiId || '',
      qrImageUrl: qrImageUrl || '',
    };

    if (typeof isOpen === 'boolean') {
      updateData.isOpen = isOpen;
    }

    if (typeof lat === 'number' && typeof lng === 'number') {
      updateData.location = {
        type: 'Point',
        coordinates: [lng, lat], // [lng, lat]
      };
    }

    let stall = await Stall.findOne({ vendor: req.vendor._id });
    const isEdit = !!stall;

    // For edits, check approval
    if (isEdit && req.vendor.editRequestStatus !== 'APPROVED') {
      return res.status(403).json({
        message: 'Edit permission required. Please request approval from admin first.',
      });
    }

    if (!stall) {
      stall = await Stall.create({
        vendor: req.vendor._id,
        ...updateData,
      });
    } else {
      stall.set(updateData);
      await stall.save();
    }

    // If it was an edit, reset the permission after successful save
    if (isEdit) {
      req.vendor.editRequestStatus = 'NONE';
      await req.vendor.save();
    }

    return res.json({ message: 'Stall saved successfully', stall });
  } catch (err) {
    console.error('Save my stall error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
