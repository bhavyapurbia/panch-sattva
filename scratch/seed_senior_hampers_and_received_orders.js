const API_BASE = 'http://localhost:5000/api';

async function req(url, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, {
    ...options,
    headers
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || `HTTP ${res.status}`);
    err.data = data;
    throw err;
  }
  return data;
}

const LUXURY_BOXES = [
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

const LUXURY_CHOCOLATES = [
  {
    name: 'Artisanal 24K Gold Leaf Dark Truffles',
    price: 349,
    mrp: 499,
    pieces: 'Box of 6 Truffles',
    image: '/images/psimg/gift2.jpeg',
    badge: 'GOURMET',
    description: 'Handcrafted rich dark Belgian chocolate truffles crowned with edible 24K gold foil.'
  },
  {
    name: 'Belgian Roasted Almond & Hazelnut Pralines',
    price: 399,
    mrp: 549,
    pieces: 'Box of 8 Pralines',
    image: '/images/psimg/gift 4.jpeg',
    badge: 'BESTSELLER',
    description: 'Silky milk chocolate shells filled with roasted California almonds and hazelnut paste.'
  },
  {
    name: 'Royal Saffron & Pistachio White Chocolates',
    price: 449,
    mrp: 599,
    pieces: 'Box of 6 Truffles',
    image: '/images/psimg/gift1edit.jpeg',
    badge: 'ROYAL BLEND',
    description: 'Creamy Kashmiri saffron infused white chocolate with Iranian pistachios.'
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

async function seed() {
  console.log('👑 STARTING DATABASE SEED FOR HAMPER SECTION & RECEIVED ORDERS...\n');

  try {
    // 1. Authenticate as Admin
    console.log('1️⃣ Logging in as Admin...');
    const login = await req(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@panchsattva.com', password: 'Admin@123' })
    });
    const token = login.token;
    console.log('   ✅ Authenticated as Admin:', login.user?.email, '\n');

    // 2. Fetch current boxes & chocolates
    const existingBoxes = await req(`${API_BASE}/hampers/boxes`);
    const existingChocs = await req(`${API_BASE}/hampers/chocolates`);

    // 3. Insert Luxury Boxes
    console.log('2️⃣ Adding Luxury Hamper Boxes to Database...');
    const savedBoxes = [];
    for (const boxData of LUXURY_BOXES) {
      const match = existingBoxes.boxes?.find(b => b.name.toLowerCase() === boxData.name.toLowerCase());
      if (match) {
        console.log(`   ℹ️ Box already exists: "${boxData.name}"`);
        savedBoxes.push(match);
      } else {
        const res = await req(`${API_BASE}/hampers/boxes`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify(boxData)
        });
        console.log(`   ✨ Added Box: "${res.box.name}" (Price: ₹${res.box.price})`);
        savedBoxes.push(res.box);
      }
    }
    console.log(`   ✅ Total Boxes Active in DB: ${savedBoxes.length}\n`);

    // 4. Insert Luxury Chocolates
    console.log('3️⃣ Adding Exclusive Hamper Chocolates to Database...');
    const savedChocs = [];
    for (const chocData of LUXURY_CHOCOLATES) {
      const match = existingChocs.chocolates?.find(c => c.name.toLowerCase() === chocData.name.toLowerCase());
      if (match) {
        console.log(`   ℹ️ Chocolate already exists: "${chocData.name}"`);
        savedChocs.push(match);
      } else {
        const res = await req(`${API_BASE}/hampers/chocolates`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify(chocData)
        });
        console.log(`   🍫 Added Chocolate: "${res.chocolate.name}" (Price: ₹${res.chocolate.price})`);
        savedChocs.push(res.chocolate);
      }
    }
    console.log(`   ✅ Total Chocolates Active in DB: ${savedChocs.length}\n`);

    // 5. Add Received Hamper Orders with status 'Order Received (Verification in 24h)'
    console.log('4️⃣ Adding "Order Received" Hamper Orders to Database with Full Specifications...');

    const trunkBox = savedBoxes.find(b => b.name.includes('Velvet')) || savedBoxes[0];
    const signatureBox = savedBoxes.find(b => b.name.includes('Signature')) || savedBoxes[1];
    const grandChest = savedBoxes.find(b => b.name.includes('Grand')) || savedBoxes[savedBoxes.length - 1];

    const goldTruffles = savedChocs.find(c => c.name.includes('Gold Leaf')) || savedChocs[0];
    const hazelnutPralines = savedChocs.find(c => c.name.includes('Pralines')) || savedChocs[1];

    // Order 1: Full Royal Hamper with Ring, Necklace, Truffles & Handwritten Card
    const order1Payload = {
      orderId: 'PS-HAMP-REC-8921',
      items: [
        {
          name: `Royal ${trunkBox.name}`,
          price: (Number(trunkBox.price) || 699) + 1499 + 2499 + (Number(goldTruffles?.price) || 349),
          quantity: 1,
          size: `Box: ${trunkBox.name}`,
          isHamper: true,
          hamperData: {
            box: trunkBox,
            products: [
              {
                productId: 'ring-kundan-solitaire-01',
                product: {
                  _id: 'ring-kundan-solitaire-01',
                  name: 'Regal Kundan Solitaire Ring',
                  price: 1499,
                  category: 'ring',
                  selectedVariant: 'Design A (Floral Bloom)',
                  image: '/images/psimg/ring1.jpg'
                },
                quantity: 1,
                unitPrice: 1499
              },
              {
                productId: 'necklace-polki-choker-02',
                product: {
                  _id: 'necklace-polki-choker-02',
                  name: 'Royal Heritage Polki Choker',
                  price: 2499,
                  category: 'necklace',
                  selectedVariant: 'Design B (Peacock Crest)',
                  image: '/images/psimg/nackless.jpg'
                },
                quantity: 1,
                unitPrice: 2499
              },
              {
                productId: goldTruffles?._id || 'choc-truffles-01',
                product: {
                  _id: goldTruffles?._id || 'choc-truffles-01',
                  name: goldTruffles?.name || 'Artisanal 24K Gold Leaf Dark Truffles',
                  price: Number(goldTruffles?.price) || 349,
                  category: 'chocolates',
                  isChocolate: true,
                  pieces: 'Box of 6 Truffles',
                  image: goldTruffles?.image || '/images/psimg/gift2.jpeg'
                },
                quantity: 1,
                unitPrice: Number(goldTruffles?.price) || 349
              }
            ],
            personalization: {
              recipientName: 'Princess Gayatri Devi',
              senderName: 'Maharani Divya & Family',
              occasion: 'Royal Wedding Celebration',
              ribbonColor: 'Royal Gold',
              cardDesign: 'Panch Sattva Signature Gold Foil Card',
              giftMessage: 'May this heirloom keepsake casket bring endless grace, regal beauty, and timeless joy into your new royal journey. With all our love and deepest blessings.'
            },
            totalPrice: (Number(trunkBox.price) || 699) + 1499 + 2499 + (Number(goldTruffles?.price) || 349)
          }
        }
      ],
      shippingAddress: {
        fullName: 'Princess Gayatri Devi',
        name: 'Princess Gayatri Devi',
        phone: '9829012345',
        mobile: '9829012345',
        email: 'gayatri.devi@heritagehotels.in',
        address: 'Palace Suite 12, Royal Umaid Residency, Circuit House Road',
        city: 'Jodhpur',
        state: 'Rajasthan',
        pincode: '342006'
      },
      subtotal: (Number(trunkBox.price) || 699) + 1499 + 2499 + (Number(goldTruffles?.price) || 349),
      gst: 151,
      shipping: 0,
      totalAmount: (Number(trunkBox.price) || 699) + 1499 + 2499 + (Number(goldTruffles?.price) || 349) + 151,
      paymentMode: 'Cash on Delivery (Advance Paid ₹99)',
      advancePaid: 99,
      codBalance: (Number(trunkBox.price) || 699) + 1499 + 2499 + (Number(goldTruffles?.price) || 349) + 151 - 99,
      utr: 'UPI/428901928374/HDFC',
      orderStatus: 'Order Received (Verification in 24h)'
    };

    // Order 2: Hamper with Custom Chocolate User Request
    const order2Payload = {
      orderId: 'PS-HAMP-REC-7734',
      items: [
        {
          name: `Royal ${signatureBox.name}`,
          price: (Number(signatureBox.price) || 449) + 1199 + 399 + 499,
          quantity: 1,
          size: `Box: ${signatureBox.name}`,
          isHamper: true,
          hamperData: {
            box: signatureBox,
            products: [
              {
                productId: 'earrings-emerald-cut-01',
                product: {
                  _id: 'earrings-emerald-cut-01',
                  name: 'Emerald Cut Royal Solitaire Earrings',
                  price: 1199,
                  category: 'earring',
                  image: '/images/psimg/earrings1.jpg'
                },
                quantity: 1,
                unitPrice: 1199
              },
              {
                productId: hazelnutPralines?._id || 'choc-praline-01',
                product: {
                  _id: hazelnutPralines?._id || 'choc-praline-01',
                  name: hazelnutPralines?.name || 'Belgian Roasted Almond & Hazelnut Pralines',
                  price: Number(hazelnutPralines?.price) || 399,
                  category: 'chocolates',
                  isChocolate: true,
                  pieces: 'Box of 8 Pralines',
                  image: hazelnutPralines?.image || '/images/psimg/gift 4.jpeg'
                },
                quantity: 1,
                unitPrice: Number(hazelnutPralines?.price) || 399
              },
              {
                productId: 'custom-choc-ferrero-01',
                product: {
                  id: 'custom-choc-ferrero-01',
                  name: 'Ferrero Rocher Special Edition 16 Pcs (User Request)',
                  price: 499,
                  category: 'chocolates',
                  isChocolate: true,
                  isCustomChocolate: true,
                  customNotes: 'Please arrange 16 Pcs fresh gold-wrapped Ferrero Rocher pyramid and tie with golden organza bow.'
                },
                quantity: 1,
                unitPrice: 499
              }
            ],
            personalization: {
              recipientName: 'Ananya Singhania',
              senderName: 'Vikramaditya',
              occasion: 'Anniversary Celebration',
              ribbonColor: 'Velvet Maroon',
              cardDesign: 'Royal Velvet Floral Letterpress Card',
              giftMessage: 'To my beloved Ananya, forever my greatest treasure. May your smile always radiate as brilliantly as these handcrafted jewels. Happy Anniversary!'
            },
            totalPrice: (Number(signatureBox.price) || 449) + 1199 + 399 + 499
          }
        }
      ],
      shippingAddress: {
        fullName: 'Vikramaditya Singhania',
        name: 'Vikramaditya Singhania',
        phone: '9876541230',
        mobile: '9876541230',
        email: 'vikram.singhania@gmail.com',
        address: 'Villa 42, Palm Meadows Luxury Villas, Whitefield',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560066'
      },
      subtotal: (Number(signatureBox.price) || 449) + 1199 + 399 + 499,
      gst: 76,
      shipping: 0,
      totalAmount: (Number(signatureBox.price) || 449) + 1199 + 399 + 499 + 76,
      paymentMode: 'Online Razorpay (Prepaid)',
      advancePaid: (Number(signatureBox.price) || 449) + 1199 + 399 + 499 + 76,
      codBalance: 0,
      utr: 'RZP_PAY_9281928301_PASS',
      orderStatus: 'Order Received (Verification in 24h)'
    };

    // Order 3: Hamper with Jewellery ONLY (Testing user didn't add chocolate, chocolate is optional)
    const order3Payload = {
      orderId: 'PS-HAMP-REC-6310',
      items: [
        {
          name: `Royal ${grandChest.name}`,
          price: (Number(grandChest.price) || 1299) + 1899 + 999,
          quantity: 1,
          size: `Box: ${grandChest.name}`,
          isHamper: true,
          hamperData: {
            box: grandChest,
            products: [
              {
                productId: 'bangle-temple-set-01',
                product: {
                  _id: 'bangle-temple-set-01',
                  name: 'Royal Temple Bangle Set',
                  price: 1899,
                  category: 'bangle',
                  selectedVariant: 'Size: 2.6 (Free Size)',
                  image: '/images/psimg/bangle1.jpg'
                },
                quantity: 1,
                unitPrice: 1899
              },
              {
                productId: 'ring-classic-solitaire-02',
                product: {
                  _id: 'ring-classic-solitaire-02',
                  name: 'Classic Solitaire Diamond Ring',
                  price: 999,
                  category: 'ring',
                  selectedVariant: 'Design C',
                  image: '/images/psimg/ring2.jpeg'
                },
                quantity: 1,
                unitPrice: 999
              }
            ],
            personalization: {
              recipientName: 'Pooja Verma',
              senderName: 'Rohit Verma',
              occasion: 'Birthday Celebration',
              ribbonColor: 'Emerald Green',
              cardDesign: 'Imperial Crest Foil Card',
              giftMessage: 'Happy Birthday to the most wonderful person! May this handcrafted hamper bring you boundless joy and elegance today and always.'
            },
            totalPrice: (Number(grandChest.price) || 1299) + 1899 + 999
          }
        }
      ],
      shippingAddress: {
        fullName: 'Rohit Verma',
        name: 'Rohit Verma',
        phone: '9123456789',
        mobile: '9123456789',
        email: 'rohit.verma@techmail.com',
        address: 'Flat 802, Prestige Tower, Malabar Hill',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400006'
      },
      subtotal: (Number(grandChest.price) || 1299) + 1899 + 999,
      gst: 125,
      shipping: 0,
      totalAmount: (Number(grandChest.price) || 1299) + 1899 + 999 + 125,
      paymentMode: 'Cash on Delivery (Advance Paid ₹99)',
      advancePaid: 99,
      codBalance: (Number(grandChest.price) || 1299) + 1899 + 999 + 125 - 99,
      utr: 'UPI/999120485721/ICICI',
      orderStatus: 'Order Received (Verification in 24h)'
    };

    for (const [idx, orderPayload] of [order1Payload, order2Payload, order3Payload].entries()) {
      try {
        const createdOrder = await req(`${API_BASE}/orders`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify(orderPayload)
        });
        const oId = createdOrder.order?.orderId || createdOrder.orderId || orderPayload.orderId;
        console.log(`   🎁 [${idx + 1}/3] Created Received Order #${oId} (${orderPayload.shippingAddress.fullName}) - Status: "${orderPayload.orderStatus}"`);
      } catch (err) {
        console.log(`   ℹ️ [${idx + 1}/3] Order #${orderPayload.orderId} note:`, err.data?.message || err.message);
      }
    }

    console.log('\n🌟 DATABASE SEEDING FOR HAMPER SECTION & RECEIVED ORDERS COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ SEEDING FAILED:', err.data || err.message);
    process.exit(1);
  }
}

seed();
