const mongoose = require('mongoose');

const hamperBoxSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Box name is required'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Box price is required'],
    min: [0, 'Price must be positive']
  },
  mrp: {
    type: Number,
    default: function() {
      return Math.round(this.price * 1.3);
    }
  },
  capacity: {
    type: Number,
    default: 5,
    min: 1
  },
  color: {
    type: String,
    default: 'Royal Gold & Maroon',
    trim: true
  },
  style: {
    type: String,
    default: 'Keepsake Trunk Box',
    trim: true
  },
  dimensions: {
    type: String,
    default: '9" × 7" × 3.5"',
    trim: true
  },
  image: {
    type: String,
    default: '/images/psimg/gift1.png',
    trim: true
  },
  badge: {
    type: String,
    default: '',
    trim: true
  },
  description: {
    type: String,
    default: 'Handcrafted luxury keepsake box designed to be treasured forever.',
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('HamperBox', hamperBoxSchema);
