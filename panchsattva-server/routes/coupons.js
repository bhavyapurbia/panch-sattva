const express = require('express');
const Coupon = require('../models/Coupon');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// @POST /api/coupons/validate – Validate and apply a coupon
router.post('/validate', protect, async (req, res) => {
  try {
    const { code, orderAmount } = req.body;
    if (!code) return res.status(400).json({ message: 'Coupon code is required' });

    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim(), isActive: true });

    if (!coupon) return res.status(404).json({ message: 'Invalid or expired coupon code.' });

    // Check expiry
    if (coupon.expiresAt && new Date() > coupon.expiresAt) {
      return res.status(400).json({ message: 'This coupon has expired.' });
    }

    // Check global usage limit
    if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
      return res.status(400).json({ message: 'This coupon has reached its usage limit.' });
    }

    // Check per-user usage
    const userUsed = coupon.usedBy.filter(id => id.toString() === req.user._id.toString()).length;
    if (userUsed >= coupon.userUsageLimit) {
      return res.status(400).json({ message: 'You have already used this coupon.' });
    }

    // Check minimum order amount
    if (orderAmount < coupon.minOrderAmount) {
      return res.status(400).json({
        message: `Minimum order amount of ₹${coupon.minOrderAmount.toLocaleString('en-IN')} required for this coupon.`
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = Math.round((orderAmount * coupon.discountValue) / 100);
      if (coupon.maxDiscountAmount) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
      }
    } else {
      discountAmount = Math.min(coupon.discountValue, orderAmount);
    }

    res.json({
      valid: true,
      coupon: {
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        maxDiscountAmount: coupon.maxDiscountAmount
      },
      discountAmount,
      finalAmount: Math.max(0, orderAmount - discountAmount)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @GET /api/coupons/active – List all active coupons for users/customers
router.get('/active', async (req, res) => {
  try {
    const now = new Date();
    const coupons = await Coupon.find({
      isActive: true,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gte: now } }
      ]
    })
      .select('code description discountType discountValue minOrderAmount maxDiscountAmount')
      .sort({ createdAt: -1 });

    res.json(coupons);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Admin-only routes ─────────────────────────────────────────────────────────

// @GET /api/coupons – List all coupons (admin)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @POST /api/coupons – Create coupon (admin)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const {
      code, description, discountType, discountValue,
      minOrderAmount, maxDiscountAmount, usageLimit, userUsageLimit, expiresAt
    } = req.body;

    if (!code || !discountType || discountValue === undefined) {
      return res.status(400).json({ message: 'Code, discount type, and discount value are required' });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase().trim(),
      description,
      discountType,
      discountValue: Number(discountValue),
      minOrderAmount: Number(minOrderAmount) || 0,
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
      usageLimit: usageLimit ? Number(usageLimit) : null,
      userUsageLimit: Number(userUsageLimit) || 1,
      expiresAt: expiresAt ? new Date(expiresAt) : null
    });

    res.status(201).json(coupon);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Coupon code already exists.' });
    res.status(400).json({ message: err.message });
  }
});

// @PUT /api/coupons/:id – Update coupon (admin)
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const rawId = (req.params.id || '').trim();
    const filter = rawId.match(/^[a-f\d]{24}$/i) ? { _id: rawId } : { code: rawId.toUpperCase() };
    const coupon = await Coupon.findOneAndUpdate(filter, req.body, { new: true, runValidators: true });
    if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
    res.json(coupon);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// @DELETE /api/coupons/:id – Delete coupon (admin)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const rawId = (req.params.id || '').trim();
    const filter = rawId.match(/^[a-f\d]{24}$/i) ? { _id: rawId } : { code: rawId.toUpperCase() };
    const coupon = await Coupon.findOneAndDelete(filter);
    if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
    res.json({ message: 'Coupon deleted from database', code: coupon.code });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
