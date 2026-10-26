const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const { seedProducts } = require('./seed');

async function cleanAndSetup() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000
    });
    console.log('✅ Connected to MongoDB');

    // 1. Remove all demo/test users and keep/create only ONE admin account
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@panchsattva.com').toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

    // Delete all users except we'll re-create or keep the single admin
    await User.deleteMany({});
    console.log('🗑️ Removed all demo/old users');

    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    const adminUser = await User.create({
      name: 'Panch Sattva Admin',
      email: adminEmail,
      phone: '6375247046',
      password: hashedPassword,
      isAdmin: true,
      isActive: true
    });
    console.log(`👑 Created single admin account: ${adminUser.email} (Password: ${adminPassword})`);

    // 2. Remove all demo orders
    await Order.deleteMany({});
    console.log('🗑️ Cleared all demo orders');

    // 3. Ensure products are seeded
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      console.log('📦 Seeding products catalog...');
      await seedProducts();
    } else {
      console.log(`📦 Verified ${productCount} products in database`);
    }

    // 4. Seed official store coupons in database
    await Coupon.deleteMany({});
    const officialCoupons = [
      {
        code: 'PANCH10',
        description: '10% OFF on all handcrafted jewellery orders above ₹499',
        discountType: 'percentage',
        discountValue: 10,
        minOrderAmount: 499,
        maxDiscountAmount: 500,
        isActive: true,
        expiresAt: new Date('2028-12-31')
      },
      {
        code: 'NEW100',
        description: '15% OFF for new patrons on orders above ₹999',
        discountType: 'percentage',
        discountValue: 15,
        minOrderAmount: 999,
        maxDiscountAmount: 750,
        isActive: true,
        expiresAt: new Date('2028-12-31')
      },
      {
        code: 'FESTIVE20',
        description: 'Festive Delight: 20% OFF on orders above ₹1,499',
        discountType: 'percentage',
        discountValue: 20,
        minOrderAmount: 1499,
        maxDiscountAmount: 1000,
        isActive: true,
        expiresAt: new Date('2028-12-31')
      },
      {
        code: 'ROYAL500',
        description: 'Flat ₹500 OFF on luxury royal collections above ₹2,499',
        discountType: 'fixed',
        discountValue: 500,
        minOrderAmount: 2499,
        maxDiscountAmount: 500,
        isActive: true,
        expiresAt: new Date('2028-12-31')
      }
    ];

    await Coupon.insertMany(officialCoupons);
    console.log(`🎟️ Seeded ${officialCoupons.length} official coupons in database`);

    console.log('\n✨ Database cleaned and configured successfully:');
    console.log(' - Admin Account: ' + adminEmail);
    console.log(' - Admin Password: ' + adminPassword);
    console.log(' - Users count: 1 (Admin only)');
    console.log(' - Orders count: 0 (No demo orders)');
    console.log(' - Coupons count: ' + officialCoupons.length);
    console.log(' - Products count: ' + (await Product.countDocuments()));

    process.exit(0);
  } catch (err) {
    console.error('❌ Clean & Setup error:', err);
    process.exit(1);
  }
}

cleanAndSetup();
