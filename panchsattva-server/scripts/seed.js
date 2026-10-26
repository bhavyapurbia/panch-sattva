const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config();

const products = [
  { id: 'PROD-001', name: 'Diamond Solitaire Ring', category: 'ring', price: 999, mrp: 1499, image: 'images/psimg/ring1.jpg', badge: 'NEW', description: 'Exquisite handcrafted diamond solitaire ring with high-grade finish, traditional elegance, and modern luxury aesthetics.', stock: 50, rating: 4.8 },
  { id: 'PROD-002', name: 'Royal Heritage Bangles', category: 'bangle', price: 799, mrp: 1199, image: 'images/psimg/bangle4.jpeg', badge: 'HOT', description: 'Traditional handcrafted wooden bangles with ornate gold leaf finish, timeless royal charm.', stock: 35, rating: 4.6 },
  { id: 'PROD-003', name: 'Luxury Keepsake Gift Box', category: 'gift', price: 999, mrp: 1499, image: 'images/psimg/gift3.jpeg', badge: 'NEW', description: 'Customized gift set curated with premium jewellery, elegant velvet box, and personalized note.', stock: 20, rating: 4.7 },
  { id: 'PROD-004', name: 'Velvet Bridal Gift Hamper', category: 'gift', price: 899, mrp: 1299, image: 'images/psimg/gift 4.jpeg', badge: 'SALE', description: 'Bespoke bridal celebration hamper with luxury embellishments and handcrafted surprise accessories.', stock: 15, rating: 4.5 },
  { id: 'PROD-005', name: 'Golden Temple Pendant Necklace', category: 'necklace', price: 799, mrp: 1199, image: 'images/psimg/pandent/pendant (2).jpg', badge: '', description: 'Intricately carved deity pendant suspended on a fine twisted gold chain with antique sheen.', stock: 30, rating: 4.7 },
  { id: 'PROD-006', name: 'Vintage Floral Ring', category: 'ring', price: 799, mrp: 1099, image: 'images/psimg/ring2.jpeg', badge: 'NEW', description: 'Floral motif gemstone ring in gleaming antique brass and simulated precious stones.', stock: 40, rating: 4.5 },
  { id: 'PROD-007', name: 'Traditional Carved Bangles', category: 'bangle', price: 799, mrp: 999, image: 'images/psimg/bangle3.jpeg', badge: '', description: 'Hand-carved traditional bangles with intricate paisley motifs in warm gold tones.', stock: 25, rating: 4.4 },
  { id: 'PROD-008', name: 'Royal Necklace Set', category: 'necklace', price: 799, mrp: 999, image: 'images/psimg/nackless.jpg', badge: 'SALE', description: 'Exquisite handcrafted royal necklace set with coordinating earrings.', stock: 20, rating: 4.6 },
  { id: 'PROD-009', name: 'Heritage Pendant Necklace', category: 'necklace', price: 799, mrp: 999, image: 'images/psimg/pandent/pendant (3).jpg', badge: '', description: 'Statement heritage pendant with layered chain and antique finish.', stock: 30, rating: 4.5 },
  { id: 'PROD-010', name: 'Festival Gift Ensemble', category: 'gift', price: 999, mrp: 1249, image: 'images/psimg/gift 5.jpeg', badge: 'NEW', description: 'Premium festival gift ensemble with handpicked jewellery and decorative packaging.', stock: 18, rating: 4.8 },
  { id: 'PROD-011', name: 'Gold-plated Luxury Bangles', category: 'bangle', price: 799, mrp: 999, image: 'images/psimg/goldbangle3.jpeg', badge: '', description: 'Gold-plated luxury bangles with mirror-polished finish for weddings and special occasions.', stock: 35, rating: 4.6 },
  { id: 'PROD-012', name: 'Gemstone Statement Ring', category: 'ring', price: 799, mrp: 999, image: 'images/psimg/ring3.jpeg', badge: 'NEW', description: 'Bold statement ring with multi-faceted gemstone centerpiece and ornate setting.', stock: 28, rating: 4.7 },
  { id: 'PROD-013', name: 'Artisan Wooden Bangles', category: 'bangle', price: 799, mrp: 999, image: 'images/psimg/bangle2.jpeg', badge: '', description: 'Eco-friendly artisan wooden bangles with hand-painted tribal patterns.', stock: 22, rating: 4.3 },
  { id: 'PROD-014', name: 'Chandelier Drop Earrings', category: 'earring', price: 599, mrp: 749, image: 'images/psimg/earrings1.jpg', badge: '', description: 'Dramatic chandelier earrings with cascading golden tiers and pearl accents.', stock: 40, rating: 4.6 },
  { id: 'PROD-015', name: 'Bridal Ceremony Bangles', category: 'bangle', price: 799, mrp: 999, image: 'images/psimg/bangle1.jpg', badge: '', description: 'Complete bridal bangle set with intricate meenakari work and stone studding.', stock: 15, rating: 4.8 },
  { id: 'PROD-016', name: 'Anniversary Gift Collection', category: 'gift', price: 999, mrp: 1249, image: 'images/psimg/gift1.png', badge: 'NEW', description: 'Curated anniversary gift collection with his-and-hers jewellery in a luxe gift box.', stock: 12, rating: 4.9 },
  { id: 'PROD-017', name: 'Peacock Feather Earrings', category: 'earring', price: 599, mrp: 749, image: 'images/psimg/earring3.jpeg', badge: '', description: 'Nature-inspired peacock feather earrings with iridescent enamel work.', stock: 35, rating: 4.5 },
  { id: 'PROD-018', name: 'Premium Gold Bangles Set', category: 'bangle', price: 799, mrp: 999, image: 'images/psimg/goldbangle1.jpeg', badge: '', description: 'Set of premium gold-tone bangles with intricate filigree border detailing.', stock: 25, rating: 4.7 },
  { id: 'PROD-019', name: 'Floral Temple Pendant', category: 'necklace', price: 799, mrp: 999, image: 'images/psimg/pandent/pendant (4).jpg', badge: '', description: 'Ornate floral temple pendant with ruby-red stone insets and gold-plated chain.', stock: 20, rating: 4.6 },
  { id: 'PROD-020', name: 'Stackable Gold Bangles', category: 'bangle', price: 799, mrp: 999, image: 'images/psimg/goldbangle5.jpeg', badge: '', description: 'Set of stackable slim gold bangles, perfect for layered styling at celebrations.', stock: 30, rating: 4.4 },
  { id: 'PROD-021', name: 'Personalised Gift Hamper', category: 'gift', price: 999, mrp: 1249, image: 'images/psimg/gift2.jpeg', badge: 'NEW', description: 'Fully personalised gift hamper with engraved jewellery and hand-tied ribbon.', stock: 10, rating: 4.8 },
  { id: 'PROD-022', name: 'Diamond-Cut Stacking Ring', category: 'ring', price: 799, mrp: 999, image: 'images/psimg/ring4.jpeg', badge: 'NEW', description: 'Precision diamond-cut stacking ring in gleaming 22K gold-tone finish.', stock: 32, rating: 4.6 },
  { id: 'PROD-023', name: 'Festive Gift Box Deluxe', category: 'gift', price: 999, mrp: 1249, image: 'images/psimg/gift 6.jpeg', badge: 'NEW', description: 'Deluxe festive gift box with curated luxury jewellery set and occasion card.', stock: 8, rating: 4.7 },
  { id: 'PROD-024', name: 'Bridal Gold Bangles Set', category: 'bangle', price: 799, mrp: 999, image: 'images/psimg/goldbangle2.jpeg', badge: '', description: 'Complete 12-piece bridal gold bangle set with polished mirror finish.', stock: 18, rating: 4.9 },
  { id: 'PROD-025', name: 'Kundan Stone Pendant', category: 'necklace', price: 799, mrp: 999, image: 'images/psimg/pandent/pendant (1).jpg', badge: '', description: 'Traditional kundan pendant with uncut stone setting, perfect for ethnic ensembles.', stock: 22, rating: 4.7 },
  { id: 'PROD-026', name: 'Jhumka Drop Earrings', category: 'earring', price: 599, mrp: 749, image: 'images/psimg/earring2.jpeg', badge: '', description: 'Classic jhumka earrings with intricate bell chamber and beaded fringe.', stock: 45, rating: 4.8 },
  { id: 'PROD-027', name: 'Long Chain Pendant Necklace', category: 'necklace', price: 799, mrp: 999, image: 'images/psimg/pandent/pendant (5).jpg', badge: '', description: 'Long layered chain pendant necklace with ornate centerpiece charm.', stock: 20, rating: 4.5 },
  { id: 'PROD-028', name: 'Classic Gold Bangles', category: 'bangle', price: 799, mrp: 999, image: 'images/psimg/goldbangle4.jpeg', badge: '', description: 'Timeless classic gold bangles with plain polished surface, ideal for everyday elegance.', stock: 40, rating: 4.6 }
];

const seedProducts = async () => {
  for (const p of products) {
    await Product.findOneAndUpdate({ id: p.id }, p, { upsert: true, new: true });
  }
  console.log(`✅ ${products.length} products seeded`);
};

const runSeed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');
  await Product.deleteMany({});
  await seedProducts();
  console.log('Seeding complete');
  process.exit(0);
};

if (require.main === module) runSeed();

module.exports = { seedProducts };
