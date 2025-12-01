// backend/routes/referrals.js
const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

/**
 * GET /api/referrals/summary
 * Authenticated user: see their code and who they referred
 */
router.get('/summary', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const referralCode = user.referralCode;

    const referredUsers = await User.find({ referredBy: user._id }).select(
      'fullName email phone role createdAt'
    );

    return res.json({
      referralCode,
      totalReferred: referredUsers.length,
      referredUsers,
    });
  } catch (err) {
    console.error('Referral summary error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
