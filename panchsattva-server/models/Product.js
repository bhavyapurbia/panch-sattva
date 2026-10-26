const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true, trim: true }
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  id: { type: String, unique: true, sparse: true },
  name: { type: String, required: true, trim: true },
  category: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    default: 'ring'
  },
  price: { type: Number, required: true, min: 0 },
  mrp: { type: Number, required: true, min: 0 },
  image: { type: String, required: true, default: '/images/psimg/ring1.jpg' },
  images: [{ type: String }],             // additional images
  badge: { type: String, default: '' },
  description: { type: String, default: 'Handcrafted luxury jewellery by Panch Sattva.' },
  stock: { type: Number, default: 50, min: 0 },
  rating: { type: Number, default: 4.5, min: 0, max: 5 },
  numReviews: { type: Number, default: 0 },
  reviewsList: [reviewSchema],
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  tags: [{ type: String }],
  material: { type: String, default: '' },
  weight: { type: String, default: '' },
  // Single image ABCD or 1234 Design Variants
  hasDesignVariants: { type: Boolean, default: false },
  variantType: { type: String, default: 'none' }, // 'none', 'abcd', '1234', 'custom'
  variantOptions: [{ type: String }] // e.g. ['Design A', 'Design B', 'Design C', 'Design D']
}, { timestamps: true });

// Index for search performance
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ price: 1 });

module.exports = mongoose.model('Product', productSchema);
