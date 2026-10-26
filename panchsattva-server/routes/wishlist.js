const express = require('express');
const User = require('../models/User');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All wishlist routes require authentication
router.use(protect);

// @GET /api/wishlist – Get user's wishlist
router.get('/', async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('wishlist', 'name price mrp image category badge stock isActive');
    const activeWishlist = (user.wishlist || []).filter(p => p.isActive !== false);
    res.json({ wishlist: activeWishlist, count: activeWishlist.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @POST /api/wishlist/:productId – Toggle product in wishlist
router.post('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    // Resolve product (by MongoDB _id or custom id field)
    const product = await Product.findOne({
      $or: [
        { _id: productId.match(/^[a-f\d]{24}$/i) ? productId : null },
        { id: productId }
      ]
    });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const user = await User.findById(req.user._id);
    const idx = user.wishlist.findIndex(id => id.toString() === product._id.toString());

    let action;
    if (idx > -1) {
      user.wishlist.splice(idx, 1);
      action = 'removed';
    } else {
      user.wishlist.push(product._id);
      action = 'added';
    }

    await user.save();
    res.json({ action, productId: product._id, wishlistCount: user.wishlist.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @DELETE /api/wishlist/:productId – Remove from wishlist
router.delete('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findOne({
      $or: [
        { _id: productId.match(/^[a-f\d]{24}$/i) ? productId : null },
        { id: productId }
      ]
    });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    await User.findByIdAndUpdate(req.user._id, { $pull: { wishlist: product._id } });
    res.json({ message: 'Removed from wishlist' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @DELETE /api/wishlist – Clear entire wishlist
router.delete('/', async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { $set: { wishlist: [] } });
    res.json({ message: 'Wishlist cleared' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
