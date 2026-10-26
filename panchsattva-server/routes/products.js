const express = require('express');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

/**
 * Universal product query resolver:
 * Matches by _id (if valid ObjectId) or by custom id (case-insensitively) or by exact name
 */
const resolveProductQuery = (rawParam) => {
  if (!rawParam) return null;
  const rawId = String(rawParam).trim();
  const isObjectId = mongoose.Types.ObjectId.isValid(rawId) && rawId.length === 24;
  if (isObjectId) {
    return {
      $or: [
        { _id: rawId },
        { id: rawId },
        { id: { $regex: new RegExp(`^${rawId}$`, 'i') } }
      ]
    };
  }
  return {
    $or: [
      { id: rawId },
      { id: { $regex: new RegExp(`^${rawId}$`, 'i') } }
    ]
  };
};

/**
 * Normalize category to avoid enum validation mismatch
 */
const normalizeCategory = (cat) => {
  if (!cat || typeof cat !== 'string') return 'ring';
  const c = cat.toLowerCase().trim();
  if (c.includes('ring')) return 'ring';
  if (c.includes('earring')) return 'earring';
  if (c.includes('bangle')) return 'bangle';
  if (c.includes('necklace') || c.includes('pendant')) return 'necklace';
  if (c.includes('bracelet')) return 'bracelet';
  if (c.includes('gift') || c.includes('hamper') || c.includes('box')) return 'gift';
  return c;
};

// @GET /api/products
router.get('/', async (req, res) => {
  try {
    const { category, search, sort, page = 1, limit = 100 } = req.query;
    const query = { isActive: { $ne: false } };
    if (category && category !== 'all') query.category = category;
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
    let sortObj = { createdAt: -1 };
    if (sort === 'price_asc') sortObj = { price: 1 };
    if (sort === 'price_desc') sortObj = { price: -1 };
    if (sort === 'name') sortObj = { name: 1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Product.countDocuments(query);
    const products = await Product.find(query).sort(sortObj).skip(skip).limit(parseInt(limit));

    res.json({ products, total, pages: Math.ceil(total / parseInt(limit)), page: parseInt(page) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const query = resolveProductQuery(req.params.id);
    if (!query) return res.status(400).json({ message: 'Invalid product ID' });

    const product = await Product.findOne(query);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @POST /api/products - Admin only
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const payload = { ...req.body };
    delete payload._id;

    if (!payload.name || typeof payload.name !== 'string' || !payload.name.trim()) {
      return res.status(400).json({ message: 'Product name is required' });
    }
    payload.name = payload.name.trim();

    // Generate unique product ID if empty or missing
    if (!payload.id || (typeof payload.id === 'string' && payload.id.trim() === '')) {
      payload.id = 'PROD-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(100 + Math.random() * 900);
    } else {
      payload.id = payload.id.trim();
    }

    // Normalize category
    payload.category = normalizeCategory(payload.category);

    // Number sanitization
    payload.price = Math.max(0, Number(payload.price) || 0);
    payload.mrp = Math.max(payload.price, Number(payload.mrp) || Math.round(payload.price * 1.3) || payload.price);
    payload.stock = Math.max(0, parseInt(payload.stock, 10) || 50);

    // Image fallback
    if (!payload.image || typeof payload.image !== 'string' || !payload.image.trim()) {
      payload.image = '/images/psimg/ring1.jpg';
    } else {
      payload.image = payload.image.trim();
    }

    // Description fallback
    if (!payload.description || typeof payload.description !== 'string' || !payload.description.trim()) {
      payload.description = `${payload.name} - Handcrafted royal 925 sterling silver designer luxury jewellery by Panch Sattva.`;
    } else {
      payload.description = payload.description.trim();
    }

    // Single image ABCD / 1234 Design Variants
    if (payload.hasDesignVariants !== undefined) {
      payload.hasDesignVariants = Boolean(payload.hasDesignVariants);
    }
    if (payload.variantType !== undefined) {
      payload.variantType = String(payload.variantType || 'none');
    }
    if (payload.variantOptions !== undefined && Array.isArray(payload.variantOptions)) {
      payload.variantOptions = payload.variantOptions.map(o => String(o).trim()).filter(Boolean);
    }

    const product = await Product.create(payload);
    res.status(201).json(product);
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(400).json({ message: err.message });
  }
});

// @PUT /api/products/:id - Admin only
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const query = resolveProductQuery(req.params.id);
    if (!query) return res.status(400).json({ message: 'Invalid product ID' });

    const updateData = { ...req.body };
    delete updateData._id;

    if (updateData.name) {
      updateData.name = updateData.name.trim();
    }

    if (updateData.id && typeof updateData.id === 'string' && updateData.id.trim() === '') {
      delete updateData.id;
    } else if (updateData.id) {
      updateData.id = updateData.id.trim();
    }

    if (updateData.category) {
      updateData.category = normalizeCategory(updateData.category);
    }

    if (updateData.price !== undefined) {
      updateData.price = Math.max(0, Number(updateData.price) || 0);
    }

    if (updateData.mrp !== undefined) {
      updateData.mrp = Math.max(0, Number(updateData.mrp) || (updateData.price ? Math.round(updateData.price * 1.3) : 0));
    }

    if (updateData.stock !== undefined) {
      updateData.stock = Math.max(0, parseInt(updateData.stock, 10) || 0);
    }

    if (updateData.image !== undefined) {
      if (!updateData.image || typeof updateData.image !== 'string' || !updateData.image.trim()) {
        delete updateData.image; // Do not overwrite with empty
      } else {
        updateData.image = updateData.image.trim();
      }
    }

    if (updateData.description !== undefined) {
      if (!updateData.description || typeof updateData.description !== 'string' || !updateData.description.trim()) {
        delete updateData.description; // Do not overwrite with empty
      } else {
        updateData.description = updateData.description.trim();
      }
    }

    if (updateData.hasDesignVariants !== undefined) {
      updateData.hasDesignVariants = Boolean(updateData.hasDesignVariants);
    }
    if (updateData.variantType !== undefined) {
      updateData.variantType = String(updateData.variantType || 'none');
    }
    if (updateData.variantOptions !== undefined && Array.isArray(updateData.variantOptions)) {
      updateData.variantOptions = updateData.variantOptions.map(o => String(o).trim()).filter(Boolean);
    }

    const product = await Product.findOneAndUpdate(query, updateData, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ message: 'Product not found in database' });
    res.json(product);
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(400).json({ message: err.message });
  }
});

// @DELETE /api/products/:id - Admin only (permanent deletion from database)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const query = resolveProductQuery(req.params.id);
    if (!query) return res.status(400).json({ message: 'Invalid product ID' });

    const deleted = await Product.findOneAndDelete(query);
    if (!deleted) return res.status(404).json({ message: 'Product not found in database' });
    res.json({ message: 'Product permanently deleted from database', id: req.params.id, product: deleted });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ message: err.message });
  }
});

// @POST /api/products/:id/reviews - Authenticated users only
router.post('/:id/reviews', protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || !comment) return res.status(400).json({ message: 'Rating and comment are required' });
    if (rating < 1 || rating > 5) return res.status(400).json({ message: 'Rating must be between 1 and 5' });

    const filter = req.params.id.match(/^[a-f\d]{24}$/i) ? { _id: req.params.id } : { id: req.params.id };
    const product = await Product.findOne(filter);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // One review per user per product
    const alreadyReviewed = product.reviewsList.find(r => r.user.toString() === req.user._id.toString());
    if (alreadyReviewed) return res.status(400).json({ message: 'You have already reviewed this product' });

    const review = {
      user: req.user._id,
      name: req.user.name,
      rating: Number(rating),
      comment: comment.trim()
    };

    product.reviewsList.push(review);
    product.numReviews = product.reviewsList.length;
    product.rating = product.reviewsList.reduce((sum, r) => sum + r.rating, 0) / product.reviewsList.length;
    await product.save();

    res.status(201).json({ message: 'Review added', rating: product.rating, numReviews: product.numReviews });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
