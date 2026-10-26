const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// ─── Token helpers ─────────────────────────────────────────────────────────────
const signAccessToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

const signRefreshToken = (id) =>
  jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh', { expiresIn: '30d' });

const formatUser = (user) => ({
  _id: user._id,
  id: 'USR-' + user._id.toString().slice(-4).toUpperCase(),
  name: user.name,
  email: user.email,
  phone: user.phone,
  mobile: user.phone,
  gender: user.gender,
  dob: user.dob,
  address: user.address?.street || '',
  city: user.address?.city || '',
  state: user.address?.state || '',
  pincode: user.address?.pincode || '',
  fullAddress: user.address || {},
  isAdmin: user.isAdmin,
  role: user.isAdmin ? 'admin' : 'customer',
  wishlist: user.wishlist || [],
  createdAt: user.createdAt || user.createdAt
});

// ─── POST /api/auth/signup ─────────────────────────────────────────────────────
router.post('/signup', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
    }

    const { name, email, phone, password, address, city, state, pincode, gender, dob } = req.body;

    const cleanEmail = email.toLowerCase().trim();
    const cleanPhone = (phone || '').replace(/\D/g, '');

    // Check uniqueness
    const existsQuery = [{ email: cleanEmail }];
    if (cleanPhone.length >= 10) existsQuery.push({ phone: cleanPhone });
    const exists = await User.findOne({ $or: existsQuery });
    if (exists) {
      return res.status(400).json({ message: 'An account with this email or mobile is already registered.' });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      phone: cleanPhone || phone || '0000000000',
      password: hashed,
      gender: gender || 'Other',
      dob: dob || '',
      address: typeof address === 'object'
        ? address
        : { street: address || '', city: city || '', state: state || '', pincode: pincode || '' }
    });

    const accessToken = signAccessToken(user._id);
    const refreshToken = signRefreshToken(user._id);

    // Store refresh token
    await User.findByIdAndUpdate(user._id, { $push: { refreshTokens: refreshToken } });

    res.status(201).json({
      token: accessToken,
      refreshToken,
      user: formatUser(user)
    });
  } catch (err) {
    console.error('Signup error:', err);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Email or phone already registered.' });
    }
    res.status(500).json({ message: 'Server error during signup. Please try again.' });
  }
});

// ─── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, identifier, password } = req.body;
    const loginId = (identifier || email || '').trim();

    if (!loginId || !password) {
      return res.status(400).json({ message: 'Email/Mobile and password are required' });
    }

    const cleanEmail = loginId.toLowerCase();
    const cleanPhone = loginId.replace(/\D/g, '');

    // Build query
    const query = [{ email: cleanEmail }];
    if (cleanPhone.length >= 10) query.push({ phone: cleanPhone });

    const user = await User.findOne({ $or: query });

    if (!user) {
      return res.status(404).json({ message: 'Account not found. Please sign up first!' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Your account has been deactivated. Please contact support.' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Incorrect password. Please check and try again.' });
    }

    const accessToken = signAccessToken(user._id);
    const refreshToken = signRefreshToken(user._id);

    // Store refresh token & update login info
    await User.findByIdAndUpdate(user._id, {
      $push: { refreshTokens: refreshToken },
      $inc: { loginCount: 1 },
      lastLoginAt: new Date()
    });

    res.json({
      token: accessToken,
      refreshToken,
      user: formatUser(user)
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login. Please try again.' });
  }
});

// ─── POST /api/auth/refresh ────────────────────────────────────────────────────
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ message: 'Refresh token required' });

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh'
    );

    const user = await User.findById(decoded.id);
    if (!user || !user.refreshTokens.includes(refreshToken)) {
      return res.status(401).json({ message: 'Invalid or expired refresh token. Please log in again.' });
    }

    // Rotate refresh token (invalidate old, issue new)
    const newAccessToken = signAccessToken(user._id);
    const newRefreshToken = signRefreshToken(user._id);

    await User.findByIdAndUpdate(user._id, {
      $pull: { refreshTokens: refreshToken },
      $push: { refreshTokens: newRefreshToken }
    });

    res.json({ token: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Refresh token expired. Please log in again.', code: 'REFRESH_EXPIRED' });
    }
    res.status(401).json({ message: 'Invalid refresh token', code: 'INVALID_REFRESH' });
  }
});

// ─── POST /api/auth/logout ─────────────────────────────────────────────────────
router.post('/logout', protect, async (req, res) => {
  try {
    const { refreshToken } = req.body;
    // Remove specific refresh token (or all if none provided)
    const update = refreshToken
      ? { $pull: { refreshTokens: refreshToken } }
      : { $set: { refreshTokens: [] } };

    await User.findByIdAndUpdate(req.user._id, update);
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -refreshTokens').populate('wishlist', 'name price image category');
    res.json(formatUser(user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── PUT /api/auth/profile ─────────────────────────────────────────────────────
router.put('/profile', protect, [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { name, phone, gender, dob, address, city, state, pincode } = req.body;

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (phone) updateData.phone = phone.replace(/\D/g, '');
    if (gender) updateData.gender = gender;
    if (dob !== undefined) updateData.dob = dob;

    // Handle address (both flat and nested formats)
    if (address || city || state || pincode) {
      const existingUser = await User.findById(req.user._id);
      updateData.address = {
        street: address || existingUser.address?.street || '',
        city: city || existingUser.address?.city || '',
        state: state || existingUser.address?.state || '',
        pincode: pincode || existingUser.address?.pincode || ''
      };
    }

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true
    }).select('-password -refreshTokens');

    res.json({ message: 'Profile updated successfully', user: formatUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── PUT /api/auth/change-password ────────────────────────────────────────────
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user._id);
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await User.findByIdAndUpdate(req.user._id, {
      password: hashed,
      passwordChangedAt: new Date(),
      $set: { refreshTokens: [] }  // Invalidate all existing sessions
    });

    res.json({ message: 'Password changed successfully. Please log in again.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── POST /api/auth/check-email ───────────────────────────────────────────────
router.post('/check-email', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required' });
    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    res.json({ exists: !!exists });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
