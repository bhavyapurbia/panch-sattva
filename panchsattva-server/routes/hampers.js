const express = require('express');
const router = express.Router();
const HamperBox = require('../models/HamperBox');
const HamperChocolate = require('../models/HamperChocolate');
const { protect, adminOnly } = require('../middleware/auth');

// Default initial boxes seed
const DEFAULT_BOXES = [
  {
    name: 'Royal Velvet Keepsake Trunk',
    price: 699,
    mrp: 999,
    capacity: 6,
    color: 'Deep Royal Maroon',
    style: 'Trunk Box with Vintage Brass Clasp',
    dimensions: '10" × 8" × 4.5"',
    image: '/images/psimg/gift1.png',
    badge: 'BESTSELLER',
    description: 'Plush velvet-lined wooden keepsake trunk with antique gold latches. Designed to be treasured as an heirloom jewellery casket forever.'
  },
  {
    name: 'Panch Sattva Signature Gold Foil Box',
    price: 449,
    mrp: 699,
    capacity: 4,
    color: 'Imperial Ivory & Gold',
    style: 'Magnetic Rigid Chest',
    dimensions: '9" × 7" × 3.5"',
    image: '/images/psimg/gift1 (1).jpeg',
    badge: 'SIGNATURE',
    description: 'High-density rigid hardboard box embossed with signature Panch Sattva golden crest and premium concealed magnetic closure.'
  },
  {
    name: 'Heritage Teakwood Carved Casket',
    price: 899,
    mrp: 1299,
    capacity: 8,
    color: 'Natural Teak & Brass',
    style: 'Hand-Carved Wooden Chest',
    dimensions: '11" × 9" × 4.5"',
    image: '/images/psimg/gift3.jpeg',
    badge: 'HANDCRAFTED',
    description: 'Artisanal teakwood casket with traditional jali fretwork and crimson silk bedding for majestic presentation.'
  },
  {
    name: 'Royal Glass & Brass Showcase Box',
    price: 999,
    mrp: 1499,
    capacity: 5,
    color: 'Antique Brass & Glass',
    style: 'Hexagonal Glass Showcase',
    dimensions: '8.5" × 8.5" × 5"',
    image: '/images/psimg/gift 4.jpeg',
    badge: 'LUXURY SHOWCASE',
    description: 'Bespoke hexagonal glass showcase framed in antique brass edges. Allows the royal jewellery and treats inside to shine through.'
  },
  {
    name: 'Bespoke Banarasi Silk Potli',
    price: 299,
    mrp: 499,
    capacity: 3,
    color: 'Crimson Red & Golden Zari',
    style: 'Brocade Silk Pouch',
    dimensions: '7" × 9"',
    image: '/images/psimg/gift 5.jpeg',
    badge: 'TRADITIONAL',
    description: 'Pure Banarasi zari brocade potli bag adorned with pearl tassels and twisted golden dori for intimate gifts.'
  },
  {
    name: 'Imperial Grand 2-Tier Celebration Chest',
    price: 1299,
    mrp: 1899,
    capacity: 10,
    color: 'Emerald Green & Gold',
    style: 'Double-Decker Luxury Box',
    dimensions: '12" × 10" × 6"',
    image: '/images/psimg/gift 6.jpeg',
    badge: 'EMPEROR SUITE',
    description: 'Grand two-tier celebration trunk featuring a top velvet compartment and pull-out drawer for multi-item royal gifts.'
  }
];

// Default initial chocolates seed
const DEFAULT_CHOCOLATES = [
  {
    name: 'Artisanal 24K Gold Leaf Dark Truffles',
    price: 349,
    mrp: 499,
    pieces: 'Box of 6',
    image: '/images/psimg/gift2.jpeg',
    badge: 'GOURMET',
    description: 'Handcrafted rich dark Belgian chocolate truffles crowned with edible 24K gold foil.'
  },
  {
    name: 'Belgian Roasted Almond & Hazelnut Pralines',
    price: 399,
    mrp: 549,
    pieces: 'Box of 8',
    image: '/images/psimg/gift 4.jpeg',
    badge: 'PRALINE',
    description: 'Silky milk chocolate shells filled with roasted California almonds and hazelnut paste.'
  },
  {
    name: 'Royal Saffron & Pistachio White Chocolates',
    price: 449,
    mrp: 599,
    pieces: 'Box of 6',
    image: '/images/psimg/gift1edit.jpeg',
    badge: 'ROYAL BLEND',
    description: 'Creamy Kashmiri saffron infused white chocolate infused with Iranian pistachios.'
  },
  {
    name: 'Luxury Dark Chocolate Silk Bars Assortment',
    price: 299,
    mrp: 399,
    pieces: 'Pack of 3 Bars',
    image: '/images/psimg/gift 5.jpeg',
    badge: 'CLASSIC',
    description: 'Selection of 70% dark cocoa, roasted almond silk, and salted caramel chocolate bars.'
  }
];

// ─────────────────────────────────────────────────────────────
// HAMPER BOXES ROUTES
// ─────────────────────────────────────────────────────────────

// @GET /api/hampers/boxes - Get all hamper boxes (No dummy auto-seeding)
router.get('/boxes', async (req, res) => {
  try {
    const boxes = await HamperBox.find({ isActive: true }).sort({ price: 1 });
    res.json({ success: true, count: boxes.length, boxes });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching hamper boxes: ' + err.message });
  }
});

// @POST /api/hampers/boxes - Admin create new hamper box
router.post('/boxes', protect, adminOnly, async (req, res) => {
  try {
    const { name, price, mrp, capacity, color, style, dimensions, image, badge, description } = req.body;
    if (!name || !price) {
      return res.status(400).json({ message: 'Box name and price are required' });
    }

    const priceNum = Math.max(0, Number(price) || 0);
    const box = await HamperBox.create({
      name: name.trim(),
      price: priceNum,
      mrp: mrp ? Math.max(priceNum, Number(mrp)) : Math.round(priceNum * 1.3),
      capacity: Math.max(1, parseInt(capacity, 10) || 5),
      color: (color && color.trim()) || 'Royal Gold & Maroon',
      style: (style && style.trim()) || 'Keepsake Box',
      dimensions: (dimensions && dimensions.trim()) || '9" × 7" × 3.5"',
      image: (image && image.trim()) || '/images/psimg/gift1.png',
      badge: badge ? badge.trim() : '',
      description: (description && description.trim()) || 'Handcrafted luxury keepsake box designed to be treasured forever.'
    });

    res.status(201).json({ success: true, box });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// @PUT /api/hampers/boxes/:id - Admin update hamper box
router.put('/boxes/:id', protect, adminOnly, async (req, res) => {
  try {
    const box = await HamperBox.findById(req.params.id);
    if (!box) return res.status(404).json({ message: 'Hamper box not found' });

    const updates = { ...req.body };
    if (updates.price) updates.price = Math.max(0, Number(updates.price));
    if (updates.mrp) updates.mrp = Math.max(updates.price || box.price, Number(updates.mrp));
    if (updates.capacity) updates.capacity = Math.max(1, parseInt(updates.capacity, 10) || 1);

    const updated = await HamperBox.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    res.json({ success: true, box: updated });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// @DELETE /api/hampers/boxes/:id - Admin delete hamper box
router.delete('/boxes/:id', protect, adminOnly, async (req, res) => {
  try {
    const box = await HamperBox.findById(req.params.id);
    if (!box) return res.status(404).json({ message: 'Hamper box not found' });

    await HamperBox.findByIdAndDelete(req.params.id);
    res.json({ message: 'Hamper box deleted successfully', id: req.params.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// HAMPER CHOCOLATES ROUTES
// ─────────────────────────────────────────────────────────────

// @GET /api/hampers/chocolates - Get all chocolates (No dummy auto-seeding)
router.get('/chocolates', async (req, res) => {
  try {
    const chocolates = await HamperChocolate.find({ isActive: true }).sort({ price: 1 });
    res.json({ success: true, count: chocolates.length, chocolates });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching hamper chocolates: ' + err.message });
  }
});

// @POST /api/hampers/chocolates - Admin create new chocolate item
router.post('/chocolates', protect, adminOnly, async (req, res) => {
  try {
    const { name, price, mrp, image, pieces, badge, description } = req.body;
    if (!name || !price) {
      return res.status(400).json({ message: 'Chocolate name and price are required' });
    }

    const priceNum = Math.max(0, Number(price) || 0);
    const chocolate = await HamperChocolate.create({
      name: name.trim(),
      price: priceNum,
      mrp: mrp ? Math.max(priceNum, Number(mrp)) : Math.round(priceNum * 1.3),
      image: (image && image.trim()) || '/images/psimg/gift2.jpeg',
      pieces: (pieces && pieces.trim()) || 'Box of 6',
      badge: badge ? badge.trim() : 'GOURMET',
      description: (description && description.trim()) || 'Artisanal gourmet chocolate treats curated for royal hampers.'
    });

    res.status(201).json({ success: true, chocolate });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// @PUT /api/hampers/chocolates/:id - Admin update chocolate
router.put('/chocolates/:id', protect, adminOnly, async (req, res) => {
  try {
    const chocolate = await HamperChocolate.findById(req.params.id);
    if (!chocolate) return res.status(404).json({ message: 'Chocolate item not found' });

    const updates = { ...req.body };
    if (updates.price) updates.price = Math.max(0, Number(updates.price));
    if (updates.mrp) updates.mrp = Math.max(updates.price || chocolate.price, Number(updates.mrp));

    const updated = await HamperChocolate.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    res.json({ success: true, chocolate: updated });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// @DELETE /api/hampers/chocolates/:id - Admin delete chocolate
router.delete('/chocolates/:id', protect, adminOnly, async (req, res) => {
  try {
    const chocolate = await HamperChocolate.findById(req.params.id);
    if (!chocolate) return res.status(404).json({ message: 'Chocolate item not found' });

    await HamperChocolate.findByIdAndDelete(req.params.id);
    res.json({ message: 'Chocolate item deleted successfully', id: req.params.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
