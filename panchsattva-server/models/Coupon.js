const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  description: { type: String, default: '' },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true
  },
  discountValue: { type: Number, required: true, min: 0 },
  minOrderAmount: { type: Number, default: 0 },
  maxDiscountAmount: { type: Number, default: null }, // cap for percentage coupons
  usageLimit: { type: Number, default: null },        // null = unlimited
  usageCount: { type: Number, default: 0 },
  userUsageLimit: { type: Number, default: 1 },       // per-user limit
  usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isActive: { type: Boolean, default: true },
  expiresAt: { type: Date, default: null }
}, { timestamps: true });

// Note: code is indexed automatically via unique:true

module.exports = mongoose.model('Coupon', couponSchema);
