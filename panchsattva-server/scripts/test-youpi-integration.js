/**
 * Comprehensive Integration & Security Test Suite for YOUPI PG in Panch Sattva
 * Validates all 16 scenarios mandated in the Master Prompt.
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const http = require('http');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');
const Coupon = require('../models/Coupon');

const YOUPI_WEBHOOK_SECRET = process.env.YOUPI_WEBHOOK_SECRET || 'd1defb3fc730e3546ba37f80d457309d7fa9971c1ec24dc4ddcd39fa75f66532';
const JWT_SECRET = process.env.JWT_SECRET || 'panchsattva_super_secret_jwt_key_2024';

let server;
let baseUrl;
let testUser1;
let testUser2;
let tokenUser1;
let tokenUser2;
let sampleProduct;

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failCount++;
    throw new Error(`Assertion failed: ${message}`);
  }
}

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const headers = { ...(options.headers || {}) };

    let bodyData = null;
    if (options.body) {
      if (typeof options.body === 'string' || Buffer.isBuffer(options.body)) {
        bodyData = options.body;
      } else {
        bodyData = JSON.stringify(options.body);
        if (!headers['Content-Type']) headers['Content-Type'] = 'application/json';
      }
      if (!headers['Content-Length']) {
        headers['Content-Length'] = Buffer.byteLength(bodyData);
      }
    }

    const req = http.request(url, {
      method: options.method || 'GET',
      headers
    }, (res) => {
      let chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8');
        let json = null;
        try { json = JSON.parse(raw); } catch {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: json || raw,
          raw
        });
      });
    });

    req.on('error', reject);
    if (bodyData) req.write(bodyData);
    req.end();
  });
}

async function runTests() {
  console.log('\n============================================================');
  console.log('🧪 PANCH SATTVA × YOUPI PG — INTEGRATION & SECURITY TEST SUITE');
  console.log('============================================================\n');

  // Connect to MongoDB
  console.log('[Setup] Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('  Connected to MongoDB.\n');

  // Load Express app from server.js logic without starting on 5000
  const express = require('express');
  const app = express();

  app.use(express.json({
    limit: '50mb',
    verify: (req, res, buf) => {
      req.rawBody = buf;
    }
  }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  app.use('/api/payment/youpi', require('../routes/youpiPayment'));
  app.post('/api/webhook', (req, res, next) => {
    req.url = '/webhook';
    require('../routes/youpiPayment')(req, res, next);
  });

  server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      console.log(`  Test server listening on ${baseUrl}\n`);
      resolve();
    });
  });

  // Setup test users & products
  console.log('[Setup] Preparing test fixture data in MongoDB...');
  testUser1 = await User.findOne({ email: 'test_youpi_user1@example.com' });
  if (!testUser1) {
    testUser1 = await User.create({
      name: 'Aditi Sharma',
      email: 'test_youpi_user1@example.com',
      password: 'HashedPassword123!',
      phone: '9876543210'
    });
  }
  tokenUser1 = jwt.sign({ id: testUser1._id }, JWT_SECRET, { expiresIn: '1d' });

  testUser2 = await User.findOne({ email: 'test_youpi_user2@example.com' });
  if (!testUser2) {
    testUser2 = await User.create({
      name: 'Vikram Mehta',
      email: 'test_youpi_user2@example.com',
      password: 'HashedPassword123!',
      phone: '9876543211'
    });
  }
  tokenUser2 = jwt.sign({ id: testUser2._id }, JWT_SECRET, { expiresIn: '1d' });

  sampleProduct = await Product.findOne({ stock: { $gt: 5 } });
  if (!sampleProduct) {
    sampleProduct = await Product.create({
      name: 'Kundan Royal Choker Necklace',
      price: 4500,
      stock: 25,
      category: 'Necklaces'
    });
  }
  console.log(`  Sample Product: "${sampleProduct.name}" (Price: ₹${sampleProduct.price}, Stock: ${sampleProduct.stock})\n`);

  // ─────────────────────────────────────────────────────────────────────────────
  // SCENARIO 1: Unauthenticated checkout is strictly rejected
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('--- Test Suite 1: Authentication & Cart Validation ---');
  {
    const res = await request('/api/payment/youpi/create-session', {
      method: 'POST',
      body: { items: [{ id: sampleProduct._id, quantity: 1 }] }
    });
    assert(res.status === 401, '1. Rejects unauthenticated customer with 401 Unauthorized');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SCENARIO 2: Empty or invalid cart is rejected
  // ─────────────────────────────────────────────────────────────────────────────
  {
    const resEmpty = await request('/api/payment/youpi/create-session', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser1}` },
      body: { items: [], shippingAddress: { fullName: 'Aditi', address: '123 Fort St', city: 'Jaipur', state: 'Rajasthan', pincode: '302001' } }
    });
    assert(resEmpty.status === 400, '2. Rejects empty cart array with 400 Bad Request');

    const resNoItems = await request('/api/payment/youpi/create-session', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser1}` },
      body: { shippingAddress: { fullName: 'Aditi', address: '123 Fort St', city: 'Jaipur', state: 'Rajasthan', pincode: '302001' } }
    });
    assert(resNoItems.status === 400, '3. Rejects missing items field with 400 Bad Request');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SCENARIO 3: Shipping address validation
  // ─────────────────────────────────────────────────────────────────────────────
  {
    const resNoAddress = await request('/api/payment/youpi/create-session', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser1}` },
      body: {
        items: [{ id: String(sampleProduct._id), quantity: 1 }],
        shippingAddress: { fullName: 'Aditi', address: '', city: 'Jaipur', state: 'Rajasthan', pincode: '302001' }
      }
    });
    assert(resNoAddress.status === 400, '4. Rejects empty delivery address with 400 Bad Request');

    const resInvalidPin = await request('/api/payment/youpi/create-session', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser1}` },
      body: {
        items: [{ id: String(sampleProduct._id), quantity: 1 }],
        shippingAddress: { fullName: 'Aditi', address: '123 Royal Palace', city: 'Jaipur', state: 'Rajasthan', pincode: '123' }
      }
    });
    assert(resInvalidPin.status === 400, '5. Rejects invalid PIN code with 400 Bad Request');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SCENARIO 4: Client-side Price Manipulation Resistance
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- Test Suite 2: Price Calculation & Security Invariants ---');
  let testOrderId;
  let testExpectedTotal;
  {
    // Client attempts to send forged price = 1 INR
    // Real DB price is sampleProduct.price
    const subtotal = sampleProduct.price * 1;
    const gst = Math.round(subtotal * 0.03);
    const baseTotal = subtotal + gst;
    const onlineDiscount = Math.round(baseTotal * 0.05);
    testExpectedTotal = Math.max(1, baseTotal - onlineDiscount);

    // Notice we intercept the external fetch to YOUPI_API_URL so test can run offline or mock gateway response
    const origFetch = global.fetch;
    global.fetch = async (url, opts) => {
      if (url.includes('/api/v1/payments')) {
        return {
          ok: true,
          status: 201,
          json: async () => ({
            paymentId: 'pay_test_' + crypto.randomUUID(),
            orderId: JSON.parse(opts.body).orderId,
            amount: JSON.parse(opts.body).amount,
            checkoutUrl: `http://localhost:7000/checkout/pay_test_uuid`
          })
        };
      }
      return origFetch(url, opts);
    };

    const res = await request('/api/payment/youpi/create-session', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser1}` },
      body: {
        items: [{ id: String(sampleProduct._id), name: sampleProduct.name, price: 1.00, quantity: 1 }], // TAMPERED PRICE
        shippingAddress: {
          fullName: 'Aditi Sharma',
          address: '45 Lake Palace Rd',
          city: 'Udaipur',
          state: 'Rajasthan',
          pincode: '313001'
        }
      }
    });

    global.fetch = origFetch; // restore

    assert(res.status === 201, '6. Successfully creates pending session');
    assert(res.body.orderId && res.body.checkoutUrl, '7. Returns orderId and hosted checkoutUrl');

    testOrderId = res.body.orderId;

    // Verify in MongoDB that totalAmount was calculated from database, NOT client-sent ₹1.00
    const savedOrder = await Order.findOne({ orderId: testOrderId });
    assert(savedOrder !== null, '8. Order saved in MongoDB');
    assert(savedOrder.totalAmount === testExpectedTotal, `9. Tampered client price ₹1.00 IGNORED; server calculated authoritative ₹${testExpectedTotal}`);
    assert(savedOrder.paymentStatus === 'pending', '10. Initial paymentStatus is "pending"');
    assert(savedOrder.stockDeducted === false, '11. Stock is NOT deducted prematurely at session initiation');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SCENARIO 5: Customer Privacy & Order Ownership Isolation
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- Test Suite 3: Order Ownership & Authorization ---');
  {
    // Customer 2 tries to read Customer 1's order status
    const resForbidden = await request(`/api/payment/youpi/status/${testOrderId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenUser2}` }
    });
    assert(resForbidden.status === 403, '12. Customer 2 is forbidden (403) from accessing Customer 1\'s order');

    // Customer 1 reads their own order status
    const resOwner = await request(`/api/payment/youpi/status/${testOrderId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenUser1}` }
    });
    assert(resOwner.status === 200, '13. Customer 1 (owner) successfully retrieves order status');
    assert(resOwner.body.paymentStatus === 'pending', '14. Owner reads authoritative MongoDB status "pending"');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SCENARIO 6: Webhook Signature Verification & Cryptographic Rejection
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- Test Suite 4: Webhook Cryptography & Security ---');
  {
    const dummyPayload = JSON.stringify({ event: 'RECONCILED', orderId: testOrderId, amountPaise: testExpectedTotal * 100 });

    // 1. Missing signature header
    const resNoSig = await request('/api/payment/youpi/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: dummyPayload
    });
    assert(resNoSig.status === 401, '15. Rejects webhook with missing signature header (401)');

    // 2. Tampered / invalid signature
    const resBadSig = await request('/api/payment/youpi/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Gateway-Signature': 'sha256=ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
      },
      body: dummyPayload
    });
    assert(resBadSig.status === 401, '16. Rejects forged/invalid HMAC-SHA256 signature (401)');

    // 3. Signature over modified body
    const validSigForDummy = 'sha256=' + crypto.createHmac('sha256', YOUPI_WEBHOOK_SECRET).update(dummyPayload).digest('hex');
    const tamperedPayload = JSON.stringify({ event: 'RECONCILED', orderId: testOrderId, amountPaise: 9999999 });
    const resTamperedBody = await request('/api/payment/youpi/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Gateway-Signature': validSigForDummy
      },
      body: tamperedPayload
    });
    assert(resTamperedBody.status === 401, '17. Rejects payload where body was modified after signature generation (401)');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SCENARIO 7: OBSERVED_SUCCESS Webhook Lifecycle (Hold, Do NOT Fulfill)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- Test Suite 5: Payment Status Lifecycle & Webhooks ---');
  {
    const initialProductStock = (await Product.findById(sampleProduct._id)).stock;

    const deliveryId1 = crypto.randomUUID();
    const observedPayloadObj = {
      event: 'OBSERVED_SUCCESS',
      deliveryId: deliveryId1,
      orderId: testOrderId,
      amountPaise: testExpectedTotal * 100,
      currency: 'INR',
      method: 'UPI',
      utr: '123456789012'
    };
    const rawObserved = JSON.stringify(observedPayloadObj);
    const sigObserved = 'sha256=' + crypto.createHmac('sha256', YOUPI_WEBHOOK_SECRET).update(rawObserved).digest('hex');

    const resObs = await request('/api/payment/youpi/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Gateway-Signature': sigObserved,
        'X-Gateway-Delivery-Id': deliveryId1,
        'X-Gateway-Event': 'OBSERVED_SUCCESS'
      },
      body: rawObserved
    });

    assert(resObs.status === 200, '18. OBSERVED_SUCCESS webhook accepted (200)');

    const orderAfterObs = await Order.findOne({ orderId: testOrderId });
    assert(orderAfterObs.paymentStatus === 'observed', '19. Order transitions to "observed" (NOT paid)');
    assert(orderAfterObs.stockDeducted === false, '20. Stock is NOT fulfilled on OBSERVED_SUCCESS alone');

    const productStockAfterObs = (await Product.findById(sampleProduct._id)).stock;
    assert(productStockAfterObs === initialProductStock, '21. Product stock untouched during observation hold');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SCENARIO 8: Idempotency (Duplicate Delivery Deduplication)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    const existingOrder = await Order.findOne({ orderId: testOrderId });
    const duplicateDeliveryId = existingOrder.youpiDeliveryId;

    const duplicatePayload = JSON.stringify({
      event: 'OBSERVED_SUCCESS',
      deliveryId: duplicateDeliveryId,
      orderId: testOrderId,
      amountPaise: testExpectedTotal * 100
    });
    const dupSig = 'sha256=' + crypto.createHmac('sha256', YOUPI_WEBHOOK_SECRET).update(duplicatePayload).digest('hex');

    const resDup = await request('/api/payment/youpi/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Gateway-Signature': dupSig,
        'X-Gateway-Delivery-Id': duplicateDeliveryId
      },
      body: duplicatePayload
    });

    assert(resDup.status === 200, '22. Duplicate webhook delivery returns 200');
    assert(resDup.body.duplicate === true, '23. Idempotency recognized (duplicate: true without side-effects)');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SCENARIO 9: RECONCILED Webhook (Authoritative UPI Confirmation & Stock Deduction)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- Test Suite 6: Authoritative Settlement & Fulfillment ---');
  let stockBeforePaid;
  {
    stockBeforePaid = (await Product.findById(sampleProduct._id)).stock;

    const deliveryIdReconciled = crypto.randomUUID();
    const reconciledPayloadObj = {
      event: 'RECONCILED',
      deliveryId: deliveryIdReconciled,
      orderId: testOrderId,
      paymentId: 'youpi_pay_session_8888',
      amountPaise: testExpectedTotal * 100,
      currency: 'INR',
      method: 'UPI',
      utr: '987654321098'
    };
    const rawReconciled = JSON.stringify(reconciledPayloadObj);
    const sigReconciled = 'sha256=' + crypto.createHmac('sha256', YOUPI_WEBHOOK_SECRET).update(rawReconciled).digest('hex');

    const resRec = await request('/api/payment/youpi/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Gateway-Signature': sigReconciled,
        'X-Gateway-Delivery-Id': deliveryIdReconciled,
        'X-Gateway-Event': 'RECONCILED'
      },
      body: rawReconciled
    });

    assert(resRec.status === 200, '24. RECONCILED webhook processed successfully (200)');

    const orderPaid = await Order.findOne({ orderId: testOrderId });
    assert(orderPaid.paymentStatus === 'paid', '25. Order marked "paid" ONLY after bank statement RECONCILED event');
    assert(orderPaid.orderStatus === 'confirmed', '26. Order status confirmed');
    assert(orderPaid.paymentConfirmedAt !== null, '27. paymentConfirmedAt timestamp recorded');
    assert(orderPaid.utr === '987654321098', '28. Authoritative bank UTR saved to order');
    assert(orderPaid.stockDeducted === true, '29. stockDeducted flag set to true');

    const stockAfterPaid = (await Product.findById(sampleProduct._id)).stock;
    assert(stockAfterPaid === stockBeforePaid - 1, `30. Stock properly deducted by 1 (from ${stockBeforePaid} to ${stockAfterPaid})`);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SCENARIO 10: Protection Against Out-of-Order Webhook Downgrades
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- Test Suite 7: Out-of-Order Delivery & State Invariants ---');
  {
    const deliveryIdLateFail = crypto.randomUUID();
    const lateFailPayloadObj = {
      event: 'FAILED',
      deliveryId: deliveryIdLateFail,
      orderId: testOrderId,
      amountPaise: testExpectedTotal * 100
    };
    const rawLateFail = JSON.stringify(lateFailPayloadObj);
    const sigLateFail = 'sha256=' + crypto.createHmac('sha256', YOUPI_WEBHOOK_SECRET).update(rawLateFail).digest('hex');

    const resLate = await request('/api/payment/youpi/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Gateway-Signature': sigLateFail,
        'X-Gateway-Delivery-Id': deliveryIdLateFail,
        'X-Gateway-Event': 'FAILED'
      },
      body: rawLateFail
    });

    assert(resLate.status === 200, '31. Delayed FAILED webhook accepted without error (200)');

    const orderAfterLateFail = await Order.findOne({ orderId: testOrderId });
    assert(orderAfterLateFail.paymentStatus === 'paid', '32. INVARIANT: Paid order was NOT downgraded by delayed FAILED event');
    assert(orderAfterLateFail.orderStatus === 'confirmed', '33. Order remains confirmed');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SCENARIO 11: Duplicate Fulfillment Protection (Stock Not Deducted Twice)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    const currentStock = (await Product.findById(sampleProduct._id)).stock;

    // Simulate another RECONCILED delivery with a new deliveryId
    const deliveryIdRec2 = crypto.randomUUID();
    const rec2Payload = JSON.stringify({
      event: 'RECONCILED',
      deliveryId: deliveryIdRec2,
      orderId: testOrderId,
      amountPaise: testExpectedTotal * 100
    });
    const sigRec2 = 'sha256=' + crypto.createHmac('sha256', YOUPI_WEBHOOK_SECRET).update(rec2Payload).digest('hex');

    await request('/api/payment/youpi/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Gateway-Signature': sigRec2,
        'X-Gateway-Delivery-Id': deliveryIdRec2
      },
      body: rec2Payload
    });

    const stockAfterSecondRec = (await Product.findById(sampleProduct._id)).stock;
    assert(stockAfterSecondRec === currentStock, '34. Duplicate RECONCILED delivery does NOT deduct inventory twice');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SCENARIO 12: Route Aliasing (Both /api/payment/youpi/webhook and /api/webhook)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- Test Suite 8: Route Compatibility & Alias Verification ---');
  {
    const testPayload = JSON.stringify({ event: 'OBSERVED_SUCCESS', orderId: testOrderId, amountPaise: testExpectedTotal * 100 });
    const sig = 'sha256=' + crypto.createHmac('sha256', YOUPI_WEBHOOK_SECRET).update(testPayload).digest('hex');

    const resAlias = await request('/api/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Gateway-Signature': sig,
        'X-Gateway-Delivery-Id': crypto.randomUUID()
      },
      body: testPayload
    });

    assert(resAlias.status === 200, '35. Legacy/Demo /api/webhook alias is fully active and reachable');
  }

  console.log('\n============================================================');
  console.log(`🎉 TEST SUMMARY: ${passCount} Passed, ${failCount} Failed.`);
  console.log('============================================================\n');

  // Clean up test order & close server
  await Order.deleteOne({ orderId: testOrderId });
  server.close();
  await mongoose.disconnect();
  process.exit(failCount === 0 ? 0 : 1);
}

runTests().catch(err => {
  console.error('\n❌ Unhandled test runner error:', err);
  if (server) server.close();
  mongoose.disconnect();
  process.exit(1);
});

