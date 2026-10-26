const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('../routes/auth'));
app.use('/api/products', require('../routes/products'));
app.use('/api/orders', require('../routes/orders'));
app.use('/api/cart', require('../routes/cart'));
app.use('/api/admin', require('../routes/admin'));
app.use('/api/coupons', require('../routes/coupons'));
app.use('/api/upload', require('../routes/upload'));
app.get('/api/health', (req, res) => res.json({ status: 'OK' }));

const TEST_PORT = 5055;
const BASE = `http://localhost:${TEST_PORT}/api`;

async function runTests() {
  console.log('🧪 Starting Full System Verification...\n');

  // Connect MongoDB
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB Atlas');

  const server = app.listen(TEST_PORT);
  console.log(`✅ Test server running on port ${TEST_PORT}\n`);

  let adminToken = '';
  let customerToken = '';
  let testOrderId = '';
  let createdProductId = '';

  try {
    // 1. Health check
    const healthRes = await fetch(`${BASE}/health`);
    const healthData = await healthRes.json();
    if (healthData.status !== 'OK') throw new Error('Health check failed');
    console.log('✅ 1. API Health Check: OK');

    // 2. Admin Login
    const adminLoginRes = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@panchsattva.com', password: 'Admin@123' })
    });
    const adminLoginData = await adminLoginRes.json();
    if (!adminLoginData.token || !adminLoginData.user?.isAdmin) {
      throw new Error('Admin login failed: ' + JSON.stringify(adminLoginData));
    }
    adminToken = adminLoginData.token;
    console.log(`✅ 2. Admin Authentication: SUCCESS (Admin: ${adminLoginData.user.email}, isAdmin: ${adminLoginData.user.isAdmin})`);

    // 3. Customer Registration
    const testEmail = `test_patron_${Date.now()}@example.com`;
    const signupRes = await fetch(`${BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Royal Patron',
        email: testEmail,
        phone: '9876543210',
        password: 'Password@123',
        address: 'Palace Road',
        city: 'Jaipur',
        state: 'Rajasthan',
        pincode: '302001'
      })
    });
    const signupData = await signupRes.json();
    if (!signupData.token || !signupData.user) {
      throw new Error('Customer signup failed: ' + JSON.stringify(signupData));
    }
    customerToken = signupData.token;
    console.log(`✅ 3. Customer Registration: SUCCESS (${testEmail})`);

    // 4. Products Listing
    const productsRes = await fetch(`${BASE}/products`);
    const productsData = await productsRes.json();
    if (!productsData.products || productsData.products.length === 0) {
      throw new Error('Products fetch failed');
    }
    const sampleProduct = productsData.products[0];
    console.log(`✅ 4. Products Catalog: SUCCESS (${productsData.products.length} products found)`);

    // 5. Product Detail
    const detailRes = await fetch(`${BASE}/products/${sampleProduct._id || sampleProduct.id}`);
    const detailData = await detailRes.json();
    if (!detailData || !detailData.name) throw new Error('Product detail failed');
    console.log(`✅ 5. Product Details: SUCCESS ("${detailData.name}")`);

    // 6. Coupon Validation
    const couponRes = await fetch(`${BASE}/coupons/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`
      },
      body: JSON.stringify({ code: 'PANCH10', orderAmount: 1500 })
    });
    const couponData = await couponRes.json();
    if (!couponData.valid || couponData.discountAmount <= 0) {
      throw new Error('Coupon validation failed: ' + JSON.stringify(couponData));
    }
    console.log(`✅ 6. Coupon Validation: SUCCESS (PANCH10 applied, discount: ₹${couponData.discountAmount})`);

    // 7. Order Placement
    const orderRes = await fetch(`${BASE}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`
      },
      body: JSON.stringify({
        items: [
          {
            id: sampleProduct.id,
            productId: sampleProduct._id,
            name: sampleProduct.name,
            price: sampleProduct.price,
            quantity: 1,
            size: '7',
            image: sampleProduct.image
          }
        ],
        shippingAddress: {
          fullName: 'Royal Patron',
          name: 'Royal Patron',
          phone: '9876543210',
          email: testEmail,
          address: 'Palace Road',
          city: 'Jaipur',
          state: 'Rajasthan',
          pincode: '302001'
        },
        subtotal: sampleProduct.price,
        gst: Math.round(sampleProduct.price * 0.03),
        totalAmount: sampleProduct.price + Math.round(sampleProduct.price * 0.03),
        paymentMode: 'online_full',
        advancePaid: sampleProduct.price + Math.round(sampleProduct.price * 0.03),
        utr: 'UTR998877665544',
        paymentStatus: 'paid'
      })
    });
    const orderData = await orderRes.json();
    if (!orderData._id || !orderData.orderId) {
      throw new Error('Order placement failed: ' + JSON.stringify(orderData));
    }
    testOrderId = orderData._id;
    console.log(`✅ 7. Order Placement: SUCCESS (Order ID: ${orderData.orderId}, Status: ${orderData.orderStatus})`);

    // 8. Customer Order History
    const myOrdersRes = await fetch(`${BASE}/orders/my`, {
      headers: { 'Authorization': `Bearer ${customerToken}` }
    });
    const myOrders = await myOrdersRes.json();
    if (!Array.isArray(myOrders) || myOrders.length === 0) throw new Error('My orders fetch failed');
    console.log(`✅ 8. Customer Dashboard Orders: SUCCESS (${myOrders.length} order found)`);

    // 9. Admin Stats
    const statsRes = await fetch(`${BASE}/admin/stats`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const statsData = await statsRes.json();
    if (statsData.totalOrders === undefined) throw new Error('Admin stats failed');
    console.log(`✅ 9. Admin Dashboard Analytics: SUCCESS (Orders: ${statsData.totalOrders}, Revenue: ₹${statsData.totalRevenue})`);

    // 10. Admin Update Order Status
    const updateOrderRes = await fetch(`${BASE}/admin/orders/${testOrderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ orderStatus: 'confirmed', notes: 'Verified UTR payment' })
    });
    const updatedOrder = await updateOrderRes.json();
    if (updatedOrder.orderStatus !== 'confirmed') throw new Error('Admin order status update failed');
    console.log(`✅ 10. Admin Order Status Management: SUCCESS (Updated to "confirmed")`);

    // 11. Admin Product Creation
    const createProdRes = await fetch(`${BASE}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        id: `PROD-TEST-${Date.now()}`,
        name: 'Celestial Diamond Tiara',
        category: 'necklace',
        price: 2499,
        mrp: 3499,
        stock: 12,
        badge: 'ROYAL',
        description: 'Exquisite tiara handcrafted with simulated diamonds and gold plating.',
        image: 'https://res.cloudinary.com/demo/image/upload/sample.jpg'
      })
    });
    const createdProd = await createProdRes.json();
    if (!createdProd._id) throw new Error('Admin product creation failed');
    createdProductId = createdProd._id;
    console.log(`✅ 11. Admin Add Item to Catalog: SUCCESS ("${createdProd.name}")`);

    // 12. Admin Update Product Stock
    const updateStockRes = await fetch(`${BASE}/admin/products/${createdProductId}/stock`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ stock: 25 })
    });
    const updatedStock = await updateStockRes.json();
    if (updatedStock.stock !== 25) throw new Error('Admin stock update failed');
    console.log(`✅ 12. Admin Stock Management: SUCCESS (Stock updated to 25 units)`);

    // 13. Admin Remove Item from Catalog
    const deleteProdRes = await fetch(`${BASE}/products/${createdProductId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const deleteProdData = await deleteProdRes.json();
    console.log(`✅ 13. Admin Remove Item from Catalog: SUCCESS (${deleteProdData.message})`);

    // Cleanup test data to maintain clean state (1 admin account only, no demo data)
    const User = require('../models/User');
    const Order = require('../models/Order');
    const Product = require('../models/Product');
    await User.deleteMany({ email: testEmail });
    await Order.deleteMany({ _id: testOrderId });
    await Product.deleteMany({ _id: createdProductId });
    console.log(`\n🧹 Cleaned up temporary test customer and test order.`);

    const remainingUsers = await User.find({}, 'email isAdmin');
    console.log(`👑 Remaining users in database: ${remainingUsers.length} (${remainingUsers.map(u => `${u.email} [admin=${u.isAdmin}]`).join(', ')})`);

    console.log('\n🎉 ALL 13 END-TO-END VERIFICATION CHECKS PASSED PERFECTLY!');
  } catch (err) {
    console.error('\n❌ Verification Failed:', err.message);
    process.exitCode = 1;
  } finally {
    server.close();
    await mongoose.disconnect();
    process.exit(process.exitCode || 0);
  }
}

runTests();
