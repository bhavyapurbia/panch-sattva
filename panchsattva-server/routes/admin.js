const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

/**
 * Product query resolver: matches by _id or custom id
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

// All admin routes require auth + admin role
router.use(protect, adminOnly);

// ─── @GET /api/admin/stats ─────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, totalProducts, totalOrders, revenueData, pendingOrders, recentOrders] = await Promise.all([
      User.countDocuments({ isAdmin: false, isActive: true }),
      Product.countDocuments({ isActive: true }),
      Order.countDocuments(),
      Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Order.countDocuments({ orderStatus: { $in: ['placed', 'confirmed', 'processing'] } }),
      Order.find().sort({ createdAt: -1 }).limit(5).populate('user', 'name email')
    ]);

    // Monthly revenue (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyRevenue = await Order.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Category-wise sales
    const categorySales = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $unwind: '$items' },
      { $group: { _id: '$items.category', count: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
      { $sort: { revenue: -1 } }
    ]);

    const totalRevenue = revenueData[0]?.total || 0;
    res.json({
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      pendingOrders,
      recentOrders,
      monthlyRevenue,
      categorySales
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── @GET /api/admin/orders ────────────────────────────────────────────────────
router.get('/orders', async (req, res) => {
  try {
    const { status, page = 1, limit = 50, search } = req.query;
    const query = {};
    if (status && status !== 'all') query.orderStatus = status;
    if (search) {
      query.$or = [
        { orderId: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({ orders, total, pages: Math.ceil(total / parseInt(limit)), page: parseInt(page) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── @PUT /api/admin/orders/:id ───────────────────────────────────────────────
router.put('/orders/:id', async (req, res) => {
  try {
    const { orderStatus, paymentStatus, notes } = req.body;
    const update = {};
    if (orderStatus) update.orderStatus = orderStatus;
    if (paymentStatus) update.paymentStatus = paymentStatus;
    if (notes !== undefined) update.notes = notes;

    const filter = req.params.id.match(/^[a-f\d]{24}$/i) ? { _id: req.params.id } : { orderId: req.params.id };
    const order = await Order.findOneAndUpdate(filter, update, { new: true })
      .populate('user', 'name email phone');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ─── @GET /api/admin/users ────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 50, search } = req.query;
    const query = { isAdmin: false };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password -refreshTokens -cart')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Augment with order count per user
    const usersWithOrders = await Promise.all(users.map(async (u) => {
      const orderCount = await Order.countDocuments({ user: u._id });
      const totalSpent = await Order.aggregate([
        { $match: { user: u._id, paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]);
      return {
        ...u.toObject(),
        orderCount,
        totalSpent: totalSpent[0]?.total || 0
      };
    }));

    res.json({ users: usersWithOrders, total, pages: Math.ceil(total / parseInt(limit)), page: parseInt(page) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── @PUT /api/admin/users/:id ────────────────────────────────────────────────
router.put('/users/:id', async (req, res) => {
  try {
    const { isActive, isAdmin } = req.body;
    const update = {};
    if (isActive !== undefined) update.isActive = isActive;
    if (isAdmin !== undefined) update.isAdmin = isAdmin;

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password -refreshTokens');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ─── @DELETE /api/admin/users/:id ─────────────────────────────────────────────
router.delete('/users/:id', async (req, res) => {
  try {
    const rawId = (req.params.id || '').trim();
    const filter = rawId.match(/^[a-f\d]{24}$/i)
      ? { _id: rawId }
      : { email: rawId.toLowerCase() };

    const user = await User.findOne(filter);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isAdmin) return res.status(403).json({ message: 'Cannot delete admin accounts.' });

    await User.findOneAndDelete(filter);
    res.json({ message: 'User permanently deleted from database', id: rawId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── @GET /api/admin/products ────────────────────────────────────────────────
router.get('/products', async (req, res) => {
  try {
    const { page = 1, limit = 200, category, search, includeInactive } = req.query;
    const query = includeInactive === 'true' ? {} : { isActive: { $ne: false } };
    if (category && category !== 'all') query.category = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { id: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Product.countDocuments(query);
    const products = await Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));
    res.json({ products, total, pages: Math.ceil(total / parseInt(limit)), page: parseInt(page) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── @PUT /api/admin/products/:id/stock ─────────────────────────────────────
router.put('/products/:id/stock', async (req, res) => {
  try {
    const { stock } = req.body;
    if (stock === undefined) return res.status(400).json({ message: 'Stock value required' });
    const query = resolveProductQuery(req.params.id);
    if (!query) return res.status(400).json({ message: 'Invalid product ID' });
    const product = await Product.findOneAndUpdate(query, { stock: Math.max(0, parseInt(stock, 10) || 0) }, { new: true });
    if (!product) return res.status(404).json({ message: 'Product not found in database' });
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ─── @DELETE /api/admin/products/:id ────────────────────────────────────────
router.delete('/products/:id', async (req, res) => {
  try {
    const query = resolveProductQuery(req.params.id);
    if (!query) return res.status(400).json({ message: 'Invalid product ID' });
    const deleted = await Product.findOneAndDelete(query);
    if (!deleted) return res.status(404).json({ message: 'Product not found in database' });
    res.json({ message: 'Product permanently deleted from database', id: req.params.id, product: deleted });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── @GET /api/admin/coupons ──────────────────────────────────────────────────
router.get('/coupons', async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
