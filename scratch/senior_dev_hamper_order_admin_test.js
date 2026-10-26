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

async function runTest() {
  console.log('👑 STARTING SENIOR DEVELOPER HAMPER ORDER & DUMMY DATA VERIFICATION...\n');

  try {
    // 1. Verify Hamper Endpoints have NO hardcoded dummy data (Royal Velvet Keepsake Trunk, Signature Gold Foil Box, Teakwood Carved Casket etc.)
    console.log('1️⃣ Checking /api/hampers/boxes and /api/hampers/chocolates for any dummy data...');
    const boxesData = await req(`${API_BASE}/hampers/boxes`);
    const chocsData = await req(`${API_BASE}/hampers/chocolates`);

    console.log(`   Boxes count: ${boxesData.count}`);
    console.log(`   Chocolates count: ${chocsData.count}`);

    // Verify none of the 6 dummy box names or 4 dummy chocolate names exist
    const DUMMY_BOX_NAMES = [
      'Royal Velvet Keepsake Trunk',
      'Panch Sattva Signature Gold Foil Box',
      'Heritage Teakwood Carved Casket',
      'Royal Glass & Brass Showcase Box',
      'Bespoke Banarasi Silk Potli',
      'Imperial Grand 2-Tier Celebration Chest'
    ];
    const DUMMY_CHOC_NAMES = [
      'Artisanal 24K Gold Leaf Dark Truffles',
      'Belgian Roasted Almond & Hazelnut Pralines',
      'Royal Saffron & Pistachio White Chocolates',
      'Luxury Dark Chocolate Silk Bars Assortment'
    ];

    const hasDummyBox = boxesData.boxes.some(b => DUMMY_BOX_NAMES.includes(b.name));
    const hasDummyChoc = chocsData.chocolates.some(c => DUMMY_CHOC_NAMES.includes(c.name));

    if (hasDummyBox || hasDummyChoc) {
      throw new Error(`Seeded dummy data found! Dummy box: ${hasDummyBox}, Dummy choc: ${hasDummyChoc}`);
    }
    console.log('   ✅ PASS: No seeded dummy boxes or chocolates exist in the hamper section.\n');

    // 2. Admin Login
    console.log('2️⃣ Admin authenticating...');
    const loginData = await req(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@panchsattva.com', password: 'Admin@123' })
    });
    const token = loginData.token;
    console.log('   ✅ PASS: Admin logged in successfully.\n');

    // 3. Get or Create real Box
    let testBox = boxesData.boxes[0];
    if (!testBox) {
      console.log('3️⃣ Admin adding a luxury Hamper Box...');
      const newBoxData = await req(`${API_BASE}/hampers/boxes`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: 'Bespoke Royal Heritage Velvet Box',
          price: 599,
          mrp: 899,
          capacity: 5,
          color: 'Deep Royal Maroon',
          style: 'Handcrafted Velvet Keepsake Box',
          dimensions: '10" × 8" × 4"',
          image: '/images/psimg/gift1.png',
          badge: 'ROYAL BESPOKE',
          description: 'Plush handcrafted velvet box with antique golden crest and silk lining.'
        })
      });
      testBox = newBoxData.box;
      console.log(`   ✅ PASS: Box created: "${testBox.name}" (ID: ${testBox._id}, Price: ₹${testBox.price})\n`);
    } else {
      console.log(`3️⃣ Using existing active box: "${testBox.name}" (Price: ₹${testBox.price})\n`);
    }

    // 4. Test Hamper with Jewellery ONLY (Chocolate is strictly Optional)
    console.log('4️⃣ Placing Order A: Custom Hamper with Jewellery ONLY (No Chocolates - Testing Optional Feature)...');
    const orderAPayload = {
      orderId: 'PS-HAMPER-JEWEL-ONLY-' + Date.now().toString(36).toUpperCase(),
      items: [
        {
          name: `Royal ${testBox.name}`,
          price: (Number(testBox.price) || 299) + 999, // Box + Ring 999
          quantity: 1,
          size: `Box: ${testBox.name}`,
          isHamper: true,
          hamperData: {
            box: testBox,
            products: [
              {
                productId: 'ring-kundan-01',
                product: {
                  _id: 'ring-kundan-01',
                  name: 'Regal Kundan Solitaire Ring',
                  price: 999,
                  category: 'ring',
                  selectedVariant: 'Design A (Floral)'
                },
                quantity: 1,
                unitPrice: 999
              }
            ],
            personalization: {
              recipientName: 'Rani Meera Bai',
              senderName: 'Yuvraj Pratap',
              occasion: 'Anniversary Celebration',
              ribbonColor: 'Royal Gold',
              cardDesign: 'Panch Sattva Signature Gold Card',
              giftMessage: 'May your life shine brighter than gold with unending love and radiance.'
            },
            totalPrice: (Number(testBox.price) || 299) + 999
          }
        }
      ],
      shippingAddress: {
        fullName: 'Yuvraj Pratap',
        phone: '9876543210',
        email: 'pratap@royalpanch.com',
        address: 'Palace Road, Haveli 4',
        city: 'Udaipur',
        state: 'Rajasthan',
        pincode: '313001'
      },
      subtotal: (Number(testBox.price) || 299) + 999,
      gst: 48,
      shipping: 0,
      totalAmount: (Number(testBox.price) || 299) + 999 + 48,
      paymentMode: 'online',
      orderStatus: 'placed'
    };

    const orderAData = await req(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(orderAPayload)
    });
    const placedOrderA = orderAData.order || orderAData;
    console.log(`   ✅ PASS: Placed Order A #${placedOrderA.orderId} (Jewellery Only, No Chocolates - Optional feature verified).\n`);

    // 5. Test Hamper with Jewellery AND Custom Chocolate Request
    console.log('5️⃣ Placing Order B: Custom Hamper with Full Details (Box, Personal Message, Ribbon, Recipient & Custom Chocolate Request)...');
    const orderBPayload = {
      orderId: 'PS-HAMPER-FULL-' + Date.now().toString(36).toUpperCase(),
      items: [
        {
          name: `Royal ${testBox.name}`,
          price: (Number(testBox.price) || 299) + 1299 + 299, // Box + Necklace + Custom Choc
          quantity: 1,
          size: `Box: ${testBox.name}`,
          isHamper: true,
          hamperData: {
            box: testBox,
            products: [
              {
                productId: 'neck-kundan-02',
                product: {
                  _id: 'neck-kundan-02',
                  name: 'Royal Heritage Polki Choker',
                  price: 1299,
                  category: 'necklace',
                  selectedVariant: 'Design B (Peacock)'
                },
                quantity: 1,
                unitPrice: 1299
              },
              {
                productId: 'custom-choc-lindt-01',
                product: {
                  id: 'custom-choc-lindt-01',
                  name: 'Lindt Swiss Dark Sea Salt Chocolate (Custom Request)',
                  price: 299,
                  category: 'chocolates',
                  isChocolate: true,
                  isCustomChocolate: true,
                  customNotes: 'Please wrap each bar in golden tissue with handwritten tag "Sweetest Moments"'
                },
                quantity: 1,
                unitPrice: 299
              }
            ],
            personalization: {
              recipientName: 'Princess Ananya Sharma',
              senderName: 'Kabir & Family',
              occasion: 'Royal Wedding Gift',
              ribbonColor: 'Velvet Maroon',
              cardDesign: 'Imperial Crest Foil Card',
              giftMessage: 'Heartiest congratulations on your auspicious wedding day! May your journey be filled with eternal elegance and happiness.'
            },
            totalPrice: (Number(testBox.price) || 299) + 1299 + 299
          }
        }
      ],
      shippingAddress: {
        fullName: 'Princess Ananya Sharma',
        phone: '9123456780',
        email: 'ananya@weddings.com',
        address: '104 Imperial Greens, Civil Lines',
        city: 'Jaipur',
        state: 'Rajasthan',
        pincode: '302006'
      },
      subtotal: (Number(testBox.price) || 299) + 1299 + 299,
      gst: 66,
      shipping: 0,
      totalAmount: (Number(testBox.price) || 299) + 1299 + 299 + 66,
      paymentMode: 'online',
      orderStatus: 'placed'
    };

    const orderBData = await req(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(orderBPayload)
    });
    const placedOrderB = orderBData.order || orderBData;
    console.log(`   ✅ PASS: Placed Order B #${placedOrderB.orderId} with full hamper specifications.\n`);

    // 6. Admin inspects the orders via Admin API
    console.log('6️⃣ Admin inspecting Order B via GET /api/admin/orders...');
    const adminOrdersData = await req(`${API_BASE}/admin/orders?search=${placedOrderB.orderId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const foundOrder = (adminOrdersData.orders || []).find(o => o.orderId === placedOrderB.orderId);
    if (!foundOrder) {
      throw new Error(`Order ${placedOrderB.orderId} not found in admin orders list!`);
    }

    const hamperItem = foundOrder.items.find(i => i.isHamper || i.hamperData);
    if (!hamperItem) {
      throw new Error(`Hamper item not preserved in order ${placedOrderB.orderId}!`);
    }

    const hData = hamperItem.hamperData;
    console.log('\n👑 INSPECTING HAMPER DETAILS VISIBLE IN ADMIN PANEL:');
    console.log(`   📦 Box Name: "${hData.box?.name}" (Price: ₹${hData.box?.price}, Capacity: ${hData.box?.capacity} items)`);
    console.log(`   💌 Recipient (To): "${hData.personalization?.recipientName}"`);
    console.log(`   👤 Sender (From): "${hData.personalization?.senderName}"`);
    console.log(`   🎉 Occasion: "${hData.personalization?.occasion}"`);
    console.log(`   🎀 Ribbon Selected: "${hData.personalization?.ribbonColor}"`);
    console.log(`   📜 Greeting Card: "${hData.personalization?.cardDesign}"`);
    console.log(`   ✍️ Handwritten Message: "${hData.personalization?.giftMessage}"`);
    console.log(`   💎 Included Jewellery Items (${hData.products.filter(p => !p.product?.isChocolate).length}):`);
    hData.products.filter(p => !p.product?.isChocolate).forEach((p, idx) => {
      console.log(`      ${idx + 1}. ${p.product?.name} (Design: ${p.product?.selectedVariant}, Price: ₹${p.unitPrice})`);
    });
    console.log(`   🍫 Included Chocolates (${hData.products.filter(p => p.product?.isChocolate).length}):`);
    hData.products.filter(p => p.product?.isChocolate).forEach((p, idx) => {
      console.log(`      ${idx + 1}. ${p.product?.name} (Custom Request: ${p.product?.isCustomChocolate ? 'YES' : 'NO'}, Price: ₹${p.unitPrice})`);
      if (p.product?.customNotes) {
        console.log(`         📝 Customer Notes / Instructions: "${p.product.customNotes}"`);
      }
    });

    // Validations
    if (!hData.personalization?.giftMessage) throw new Error('Missing gift message in hamper order!');
    if (!hData.personalization?.ribbonColor) throw new Error('Missing ribbon color in hamper order!');
    if (!hData.personalization?.recipientName) throw new Error('Missing recipient name in hamper order!');
    if (!hData.products.some(p => p.product?.isChocolate && p.product?.customNotes)) {
      throw new Error('Missing custom chocolate request or instructions in hamper order!');
    }

    console.log('\n🌟 ALL CHECKS PASSED PERFECTLY! 100% SUCCESS!');
  } catch (err) {
    console.error('❌ VERIFICATION FAILED:', err.data || err.message);
    process.exit(1);
  }
}

runTest();
