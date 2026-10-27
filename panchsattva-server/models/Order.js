const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.Mixed, ref: 'Product' },
  productId: String,
  id: String,
  name: String,
  image: String,
  price: Number,
  size: { type: String, default: '-' },
  variant: { type: String, default: '' },
  isHamper: { type: Boolean, default: false },
  hamperData: { type: mongoose.Schema.Types.Mixed },
  quantity: { type: Number, default: 1 }
});

const orderSchema = new mongoose.Schema({
  orderId: { type: String, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [orderItemSchema],
  shippingAddress: {
    fullName: { type: String },
    name: { type: String },
    phone: { type: String },
    mobile: { type: String },
    email: { type: String },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String }
  },
  subtotal: { type: Number, required: true },
  gst: { type: Number, default: 0 },
  shipping: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  paymentMode: { type: String, default: 'online' },
  advancePaid: { type: Number, default: 0 },
  codBalance: { type: Number, default: 0 },
  utr: { type: String, default: '' },
  paymentScreenshot: { type: String, default: '' },
  screenshotName: { type: String, default: '' },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded', 'observed'],
    default: 'pending'
  },
  orderStatus: {
    type: String,
    enum: ['placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'Order Received (Verification in 24h)'],
    default: 'placed'
  },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  // ─── YOUPI PG Payment Fields ───────────────────────────────────────────────
  paymentProvider: {
    type: String,
    enum: ['youpi', 'razorpay', 'manual', null],
    default: null
  },
  youpiPaymentId: { type: String, default: null, index: true },       // YOUPI gateway payment session UUID
  youpiDeliveryId: { type: String, default: null },      // Idempotency key: X-Gateway-Delivery-Id header
  youpiEvent: { type: String, default: null },           // Last processed webhook event
  paymentConfirmedAt: { type: Date, default: null },     // Set only on RECONCILED or COD SUCCESS
  stockDeducted: { type: Boolean, default: false },      // Prevents duplicate stock deductions on duplicate webhooks
  // ──────────────────────────────────────────────────────────────────────────
  notes: String,
  createdAt: { type: Date, default: Date.now }
});

// Auto-generate orderId before save if not provided
orderSchema.pre('save', function(next) {
  if (!this.orderId) {
    this.orderId = 'PS-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);

