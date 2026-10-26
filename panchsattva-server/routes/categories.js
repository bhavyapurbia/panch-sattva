const express = require('express');
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Product = require('../models/Product');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Default starter categories
const DEFAULT_CATEGORIES = [
  { name: 'Rings', slug: 'ring', description: 'Handcrafted royal 925 silver rings and bands', icon: 'fa-ring' },
  { name: 'Necklaces', slug: 'necklace', description: 'Royal temple and heritage silver necklaces', icon: 'fa-gem' },
  { name: 'Earrings', slug: 'earring', description: 'Timeless luxury studs, drops and jhumkas', icon: 'fa-sparkles' },
  { name: 'Bangles', slug: 'bangle', description: 'Antique and carved traditional bangles', icon: 'fa-circle-dot' },
  { name: 'Customized Gifts', slug: 'gift', description: 'Luxury gift hampers and keepsake boxes', icon: 'fa-gift' },
  { name: 'Bracelets', slug: 'bracelet', description: 'Minimalist and luxury statement bracelets', icon: 'fa-wand-magic-sparkles' }
];

// @GET /api/categories - Public list of all categories
router.get('/', async (req, res) => {
  try {
    let categories = await Category.find({ isActive: true }).sort({ createdAt: 1 });

    // Pre-seed default categories if empty
    if (categories.length === 0) {
      try {
        await Category.insertMany(DEFAULT_CATEGORIES);
        categories = await Category.find({ isActive: true }).sort({ createdAt: 1 });
      } catch (seedErr) {
        console.warn('Category seed notice:', seedErr.message);
      }
    }

    // Attach product counts for each category
    const counts = await Product.aggregate([
      { $match: { isActive: { $ne: false } } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    const countMap = {};
    counts.forEach(c => {
      if (c._id) countMap[c._id.toLowerCase()] = c.count;
    });

    const result = categories.map(cat => ({
      _id: cat._id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      icon: cat.icon,
      image: cat.image,
      productCount: countMap[cat.slug.toLowerCase()] || 0
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @POST /api/categories - Admin only (Add new category)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { name, slug, description, icon, image } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const cleanName = name.trim();
    const cleanSlug = (slug && slug.trim()) ? slug.trim().toLowerCase().replace(/\s+/g, '-') : cleanName.toLowerCase().replace(/\s+/g, '-');

    const existing = await Category.findOne({ slug: cleanSlug });
    if (existing) {
      return res.status(400).json({ message: `Category with key "${cleanSlug}" already exists` });
    }

    const category = await Category.create({
      name: cleanName,
      slug: cleanSlug,
      description: description ? description.trim() : '',
      icon: icon ? icon.trim() : 'fa-gem',
      image: image ? image.trim() : '',
      isActive: true
    });

    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// @DELETE /api/categories/:id - Admin only (Delete category)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const rawId = req.params.id.trim();
    const isObjectId = mongoose.Types.ObjectId.isValid(rawId) && rawId.length === 24;

    const filter = isObjectId
      ? { $or: [{ _id: rawId }, { slug: rawId.toLowerCase() }] }
      : { slug: rawId.toLowerCase() };

    const deleted = await Category.findOneAndDelete(filter);
    if (!deleted) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({ message: `Category "${deleted.name}" permanently deleted`, id: rawId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
