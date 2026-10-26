const express = require('express');
const User = require('../models/User');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Helper to resolve product by id or custom string id
const resolveProduct = async (pid) => {
  if (!pid) return null;
  return Product.findOne({
    $or: [
      { _id: pid.match && pid.match(/^[a-f\d]{24}$/i) ? pid : null },
      { id: pid }
    ]
  });
};

// Cart is stored as embedded array in User model for logged-in users
// For guests, it stays in localStorage (handled by frontend)

// @GET /api/cart – Get server-side cart
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('cart');
    const cart = user.cart || [];
    res.json({ cart, count: cart.reduce((s, i) => s + i.quantity, 0) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @POST /api/cart/sync – Sync local cart with server
router.post('/sync', protect, async (req, res) => {
  try {
    const { items } = req.body; // array of { id, quantity, size }
    if (!Array.isArray(items)) {
      return res.status(400).json({ message: 'items must be an array' });
    }

    const cartItems = [];
    for (const item of items) {
      const product = await resolveProduct(item.id || item._id || item.productId);
      if (!product || product.isActive === false) continue;

      const qty = Math.min(
        Math.max(1, Number(item.quantity) || 1),
        product.stock
      );

      cartItems.push({
        productId: product._id,
        id: product.id || product._id.toString(),
        name: product.name,
        price: product.price,
        mrp: product.mrp,
        image: product.image,
        category: product.category,
        stock: product.stock,
        size: item.size || '-',
        quantity: qty
      });
    }

    await User.findByIdAndUpdate(req.user._id, { $set: { cart: cartItems } });
    res.json({ cart: cartItems, synced: cartItems.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @DELETE /api/cart – Clear server cart
router.delete('/', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { $set: { cart: [] } });
    res.json({ message: 'Cart cleared' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
