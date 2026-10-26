const mongoose = require('mongoose');

const hamperChocolateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Chocolate name is required'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price must be positive']
  },
  mrp: {
    type: Number,
    default: function() {
      return Math.round(this.price * 1.3);
    }
  },
  image: {
    type: String,
    default: '/images/psimg/gift2.jpeg',
    trim: true
  },
  pieces: {
    type: String,
    default: 'Pack of 6',
    trim: true
  },
  badge: {
    type: String,
    default: 'GOURMET',
    trim: true
  },
  description: {
    type: String,
    default: 'Artisanal gourmet chocolate treats curated for royal hampers.',
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

module.exports = mongoose.model('HamperChocolate', hamperChocolateSchema);
