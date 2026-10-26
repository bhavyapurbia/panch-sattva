const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], default: 'Other' },
  dob: { type: String, default: '' },
  isAdmin: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  address: {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    pincode: { type: String, default: '' }
  },
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  cart: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    id: String,
    name: String,
    price: Number,
    mrp: Number,
    image: String,
    category: String,
    stock: Number,
    size: { type: String, default: '-' },
    quantity: { type: Number, default: 1 }
  }],
  refreshTokens: [{ type: String }],       // array allows multiple devices
  passwordChangedAt: { type: Date },
  loginCount: { type: Number, default: 0 },
  lastLoginAt: { type: Date }
}, { timestamps: true });

// Note: email and phone are indexed automatically via unique:true

// Instance method – check if password was changed after a JWT was issued
userSchema.methods.passwordChangedAfter = function (jwtIssuedAt) {
  if (this.passwordChangedAt) {
    const changedAt = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return jwtIssuedAt < changedAt;
  }
  return false;
};

module.exports = mongoose.model('User', userSchema);
