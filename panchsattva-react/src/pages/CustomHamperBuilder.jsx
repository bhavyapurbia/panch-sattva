import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useCartStore, getValidImageUrl } from '../store';
import { productsAPI, hamperAPI } from '../api';
import toast from 'react-hot-toast';
import '../styles/CustomHamper.css';

// 6 Curated Luxury Hamper Boxes
export const HAMPER_BOXES = [
  {
    id: 'box-velvet-trunk',
    name: 'Royal Velvet Keepsake Trunk',
    style: 'Trunk Box with Vintage Brass Clasp',
    color: 'Deep Royal Maroon',
    price: 699,
    mrp: 999,
    capacity: 6,
    dimensions: '10" × 8" × 4.5"',
    image: '/images/psimg/gift1.png',
    badge: 'BESTSELLER',
    description: 'Plush velvet-lined wooden keepsake trunk with antique gold latches. Designed to be treasured as an heirloom jewellery casket forever.'
  },
  {
    id: 'box-gold-rigid',
    name: 'Panch Sattva Signature Gold Foil Box',
    style: 'Magnetic Rigid Chest',
    color: 'Imperial Ivory & Gold',
    price: 449,
    mrp: 699,
    capacity: 4,
    dimensions: '9" × 7" × 3.5"',
    image: '/images/psimg/gift1 (1).jpeg',
    badge: 'SIGNATURE',
    description: 'High-density rigid hardboard box embossed with signature Panch Sattva golden crest and premium concealed magnetic closure.'
  },
  {
    id: 'box-teak-casket',
    name: 'Heritage Teakwood Carved Casket',
    style: 'Hand-Carved Wooden Chest',
    color: 'Natural Teak & Brass',
    price: 899,
    mrp: 1299,
    capacity: 8,
    dimensions: '11" × 9" × 4.5"',
    image: '/images/psimg/gift3.jpeg',
    badge: 'HANDCRAFTED',
    description: 'Artisanal teakwood casket with traditional jali fretwork and crimson silk bedding for majestic presentation.'
  },
  {
    id: 'box-glass-terrarium',
    name: 'Royal Glass & Brass Showcase Box',
    style: 'Hexagonal Glass Showcase',
    color: 'Antique Brass & Glass',
    price: 999,
    mrp: 1499,
    capacity: 5,
    dimensions: '8.5" × 8.5" × 5"',
    image: '/images/psimg/gift 4.jpeg',
    badge: 'LUXURY SHOWCASE',
    description: 'Bespoke hexagonal glass showcase framed in antique brass edges. Allows the royal jewellery and treats inside to shine through.'
  },
  {
    id: 'box-banarasi-potli',
    name: 'Bespoke Banarasi Silk Potli',
    style: 'Brocade Silk Pouch',
    color: 'Crimson Red & Golden Zari',
    price: 299,
    mrp: 499,
    capacity: 3,
    dimensions: '7" × 9"',
    image: '/images/psimg/gift 5.jpeg',
    badge: 'TRADITIONAL',
    description: 'Pure Banarasi zari brocade potli bag adorned with pearl tassels and twisted golden dori for intimate gifts.'
  },
  {
    id: 'box-imperial-tiered',
    name: 'Imperial Grand 2-Tier Celebration Chest',
    style: 'Double-Decker Luxury Box',
    color: 'Emerald Green & Gold',
    price: 1299,
    mrp: 1899,
    capacity: 10,
    dimensions: '12" × 10" × 6"',
    image: '/images/psimg/gift 6.jpeg',
    badge: 'EMPEROR SUITE',
    description: 'Grand two-tier celebration trunk featuring a top velvet compartment and pull-out drawer for multi-item royal gifts.'
  }
];

// Curated Luxury Hamper Extras (Sweets, Candle, Keepsake Coin)
export const HAMPER_EXTRAS = [
  {
    _id: 'extra-chocolates-1',
    id: 'extra-chocolates-1',
    name: 'Artisanal 24K Gold Leaf Truffles (Box of 6)',
    category: 'extras',
    price: 349,
    mrp: 499,
    stock: 25,
    image: '/images/psimg/gift2.jpeg',
    badge: 'GOURMET',
    description: 'Handcrafted rich dark Belgian chocolate truffles crowned with edible 24K gold foil.'
  },
  {
    _id: 'extra-candle-1',
    id: 'extra-candle-1',
    name: 'Royal Oud & Damask Rose Scented Candle',
    category: 'extras',
    price: 399,
    mrp: 599,
    stock: 20,
    image: '/images/psimg/gift 4.jpeg',
    badge: 'AROMATHERAPY',
    description: 'Soy wax luxury candle infused with natural Damask rose and smoky agarwood in frosted glass.'
  },
  {
    _id: 'extra-coin-1',
    id: 'extra-coin-1',
    name: 'Panch Sattva 999 Pure Silver Laxmi-Ganesh Coin (10g)',
    category: 'extras',
    price: 799,
    mrp: 999,
    stock: 15,
    image: '/images/psimg/gift1edit.jpeg',
    badge: 'AUSPICIOUS',
    description: 'Certified 999 pure silver commemorative coin in tamper-proof royal acrylic blister pack.'
  },
  {
    _id: 'extra-rakhi-1',
    id: 'extra-rakhi-1',
    name: 'Handcrafted Royal Moli & Kundan Sacred Thread',
    category: 'extras',
    price: 199,
    mrp: 299,
    stock: 30,
    image: '/images/psimg/gift 5.jpeg',
    badge: 'SACRED',
    description: 'Traditional auspicious red-gold moli thread adorned with kundan centerpiece and freshwater pearls.'
  }
];

export const RIBBON_OPTIONS = [
  { id: 'gold', name: 'Royal Gold', hex: '#c5a059' },
  { id: 'maroon', name: 'Velvet Maroon', hex: '#800020' },
  { id: 'champagne', name: 'Champagne Ivory', hex: '#fdf6e7' },
  { id: 'emerald', name: 'Emerald Green', hex: '#0f5132' },
  { id: 'rose', name: 'Blushing Rose', hex: '#f472b6' }
];

export const OCCASIONS = [
  'Birthday Celebration',
  'Wedding & Reception',
  'Anniversary Milestone',
  'Diwali & Festive Gifting',
  'Bhai Dooj / Raksha Bandhan',
  'Romantic / Valentine',
  'Bridal Shower / Haldi',
  'Self-Love Luxury Treat',
  'Corporate & Royal Privilege',
  'Heartfelt Congratulations'
];

export default function CustomHamperBuilder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editHamperId = searchParams.get('edit');
  const cart = useCartStore();

  // Builder Steps: 1: Box, 2: Products, 3: Personalize, 4: Review
  const [currentStep, setCurrentStep] = useState(1);

  // Dynamic Hamper Boxes & Chocolates from Backend (No dummy data)
  const [boxesList, setBoxesList] = useState([]);
  const [chocolatesList, setChocolatesList] = useState([]);

  // Custom Chocolate User Request Modal & Form
  const [showCustomChocModal, setShowCustomChocModal] = useState(false);
  const [customChocForm, setCustomChocForm] = useState({
    name: '',
    notes: '',
    price: 299
  });

  // Selections State
  const [selectedBox, setSelectedBox] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]); // [{ product, quantity, unitPrice }]
  const [personalization, setPersonalization] = useState({
    recipientName: '',
    senderName: '',
    occasion: 'Birthday Celebration',
    giftMessage: 'May this handcrafted royal treasure bring you endless joy, elegance, and timeless grace. With warm love and heartfelt wishes!',
    ribbonColor: 'Royal Gold',
    cardDesign: 'Panch Sattva Royal Gold Foil Card'
  });

  // Product Catalog State (Jewellery Only - Gifts & Chocolates Excluded)
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Quick Detail Modal
  const [detailProduct, setDetailProduct] = useState(null);

  // Success Confirmation Modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [completedHamperId, setCompletedHamperId] = useState(null);

  // 2-second notification of adding chocolate in the hamper
  const [showChoc2sNotification, setShowChoc2sNotification] = useState(false);
  const [addedItemForChocNotif, setAddedItemForChocNotif] = useState(null);
  const chocNotifTimerRef = useRef(null);

  // Load Real Catalog Products & Hamper Configuration from Backend
  useEffect(() => {
    let isMounted = true;
    setLoadingCatalog(true);

    // 1. Fetch Dynamic Hamper Boxes from Admin Database
    hamperAPI.getBoxes()
      .then(res => {
        if (!isMounted) return;
        if (res.data && Array.isArray(res.data.boxes)) {
          const activeBoxes = res.data.boxes.filter(b => b.isActive !== false);
          setBoxesList(activeBoxes);
          if (activeBoxes.length > 0) {
            setSelectedBox(prev => {
              const matched = activeBoxes.find(b => (b._id || b.id) === (prev?._id || prev?.id));
              return matched || activeBoxes[0];
            });
          } else {
            setSelectedBox(null);
          }
        }
      })
      .catch(() => {});

    // 2. Fetch Dynamic Hamper Chocolates from Admin Database
    hamperAPI.getChocolates()
      .then(res => {
        if (!isMounted) return;
        if (res.data && Array.isArray(res.data.chocolates)) {
          const activeChocs = res.data.chocolates.filter(c => c.isActive !== false);
          setChocolatesList(activeChocs);
        }
      })
      .catch(() => {});

    // 3. Fetch Jewellery Catalog (Strictly exclude gifts as per user instruction)
    productsAPI.getAll({ limit: 100 })
      .then(res => {
        if (!isMounted) return;
        const fetched = (res.data && res.data.products) || (Array.isArray(res.data) ? res.data : []);
        // Strictly filter out 'gift' and 'customized gift' so they are not mixed into the items section
        const jewelleryOnly = fetched.filter(p => {
          const cat = (p.category || '').toLowerCase();
          return cat !== 'gift' && cat !== 'customized gift' && cat !== 'extras';
        });
        setCatalogProducts(jewelleryOnly);
      })
      .catch(() => {
        if (!isMounted) return;
        setCatalogProducts([]);
      })
      .finally(() => {
        if (isMounted) setLoadingCatalog(false);
      });

    return () => { isMounted = false; };
  }, []);

  // Handle Editing an existing hamper from cart or restoring draft
  useEffect(() => {
    if (editHamperId) {
      const existingInCart = cart.items.find(i => (i.id === editHamperId || i._id === editHamperId) && i.isHamper);
      if (existingInCart && existingInCart.hamperData) {
        const data = existingInCart.hamperData;
        if (data.box) setSelectedBox(data.box);
        if (Array.isArray(data.products)) setSelectedProducts(data.products);
        if (data.personalization) setPersonalization(prev => ({ ...prev, ...data.personalization }));
        toast('Loaded your saved custom hamper for editing!', { icon: '🎁' });
        return;
      }
    }

    // Otherwise check draft in localStorage
    try {
      const savedDraft = localStorage.getItem('panch_hamper_draft');
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed.selectedBox) setSelectedBox(parsed.selectedBox);
        if (Array.isArray(parsed.selectedProducts) && parsed.selectedProducts.length > 0) {
          setSelectedProducts(parsed.selectedProducts);
        }
        if (parsed.personalization) {
          setPersonalization(prev => ({ ...prev, ...parsed.personalization }));
        }
      }
    } catch (_) {}
  }, [editHamperId]);

  // Persist draft to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('panch_hamper_draft', JSON.stringify({
        selectedBox,
        selectedProducts,
        personalization
      }));
    } catch (_) {}
  }, [selectedBox, selectedProducts, personalization]);

  // Calculations
  const boxPrice = Number(selectedBox?.price) || 0;
  const productsSubtotal = useMemo(() => {
    return selectedProducts.reduce((sum, item) => {
      const price = Number(item.unitPrice || item.product?.price) || 0;
      const qty = Number(item.quantity) || 1;
      return sum + (price * qty);
    }, 0);
  }, [selectedProducts]);

  const totalItemsCount = useMemo(() => {
    return selectedProducts.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
  }, [selectedProducts]);

  const packagingFee = 0; // Complimentary luxury packaging
  const hamperTotalPrice = boxPrice + productsSubtotal + packagingFee;

  // Box Capacity Progress
  const maxCapacity = selectedBox?.capacity || 6;
  const capacityPercent = Math.min(100, Math.round((totalItemsCount / maxCapacity) * 100));

  // Product Selection Handlers
  const handleAddProduct = (product) => {
    const prodId = product._id || product.id || product.name;
    const existingIndex = selectedProducts.findIndex(p => (p.product._id === prodId || p.product.id === prodId || p.product.name === product.name));

    if (existingIndex > -1) {
      const updated = [...selectedProducts];
      updated[existingIndex].quantity = (Number(updated[existingIndex].quantity) || 1) + 1;
      setSelectedProducts(updated);
    } else {
      setSelectedProducts([
        ...selectedProducts,
        {
          productId: prodId,
          product: {
            id: prodId,
            _id: product._id || prodId,
            name: product.name,
            price: Number(product.price) || 0,
            image: getValidImageUrl(product),
            category: product.category || '',
            isChocolate: Boolean(product.isChocolate || product.category === 'chocolates'),
            isCustomChocolate: Boolean(product.isCustomChocolate),
            customNotes: product.customNotes || '',
            pieces: product.pieces || ''
          },
          quantity: 1,
          unitPrice: Number(product.price) || 0
        }
      ]);
    }

    const isChoc = product.category === 'chocolates' || product.isChocolate || product.isCustomChocolate;

    // 2-SECOND TOAST NOTIFICATION
    if (isChoc) {
      toast.success(`🍫 Added "${product.name}" to your hamper!`, {
        id: 'hamper-choc-2s-toast',
        duration: 2000,
        style: {
          background: '#2b0008',
          color: '#fdf6e7',
          border: '1.5px solid #c5a059',
          fontSize: '13.5px',
          padding: '12px 18px',
          borderRadius: '10px',
          fontWeight: '600',
          boxShadow: '0 6px 20px rgba(0,0,0,0.3)'
        }
      });
    } else {
      toast(`✨ Added "${product.name}"! You can also add chocolates in the hamper (optional) 🍫`, {
        id: 'hamper-choc-suggest-toast',
        duration: 2000,
        icon: '🍫',
        style: {
          background: '#2b0008',
          color: '#fdf6e7',
          border: '1.5px solid #c5a059',
          fontSize: '13.5px',
          padding: '12px 18px',
          borderRadius: '10px',
          fontWeight: '600',
          boxShadow: '0 6px 20px rgba(0,0,0,0.3)'
        }
      });
    }

    // 2-SECOND FLOATING BANNER NOTIFICATION
    setAddedItemForChocNotif(product);
    setShowChoc2sNotification(true);
    if (chocNotifTimerRef.current) clearTimeout(chocNotifTimerRef.current);
    chocNotifTimerRef.current = setTimeout(() => {
      setShowChoc2sNotification(false);
    }, 2000); // Automatically dismiss after 2 seconds
  };

  const handleDecreaseProduct = (productId) => {
    const existingIndex = selectedProducts.findIndex(p => p.productId === productId || p.product?._id === productId || p.product?.id === productId);
    if (existingIndex === -1) return;

    const currentQty = Number(selectedProducts[existingIndex].quantity) || 1;
    if (currentQty <= 1) {
      setSelectedProducts(selectedProducts.filter((_, idx) => idx !== existingIndex));
    } else {
      const updated = [...selectedProducts];
      updated[existingIndex].quantity = currentQty - 1;
      setSelectedProducts(updated);
    }
  };

  const handleRemoveProduct = (productId) => {
    setSelectedProducts(selectedProducts.filter(p => !(p.productId === productId || p.product?._id === productId || p.product?.id === productId)));
    toast('Removed item from hamper', { icon: '🗑️' });
  };

  const getProductQtyInHamper = (product) => {
    const prodId = product._id || product.id || product.name;
    const found = selectedProducts.find(p => p.productId === prodId || p.product?._id === prodId || p.product?.id === prodId || p.product?.name === product.name);
    return found ? (Number(found.quantity) || 0) : 0;
  };

  // Handle User Adding Custom Chocolate Request
  const handleAddCustomChocolate = (e) => {
    e.preventDefault();
    if (!customChocForm.name.trim()) {
      toast.error('Please enter the chocolate name or brand');
      return;
    }
    const customItem = {
      _id: 'custom-choc-' + Date.now(),
      id: 'custom-choc-' + Date.now(),
      name: customChocForm.name.trim(),
      price: Number(customChocForm.price) || 299,
      category: 'chocolates',
      badge: 'CUSTOM REQUEST',
      image: '/images/psimg/gift2.jpeg',
      description: customChocForm.notes ? `User Request: ${customChocForm.notes}` : 'Custom chocolate request',
      isCustomChocolate: true,
      customNotes: customChocForm.notes
    };
    handleAddProduct(customItem);
    setShowCustomChocModal(false);
    setCustomChocForm({ name: '', notes: '', price: 299 });
  };

  // Filter Catalog Products (Jewellery or Exclusive Hamper Chocolates)
  const filteredProducts = useMemo(() => {
    if (activeCategory === 'chocolates') {
      const q = searchQuery.toLowerCase().trim();
      return chocolatesList.filter(c => {
        return !q || c.name?.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q);
      });
    }

    return catalogProducts.filter(p => {
      const cat = (p.category || '').toLowerCase();
      // Strictly exclude gifts from hamper items selection as requested
      if (cat === 'gift' || cat === 'customized gift' || cat === 'extras') return false;

      const matchCat =
        activeCategory === 'all' ||
        (activeCategory === 'ring' && (cat === 'ring' || cat === 'rings')) ||
        (activeCategory === 'necklace' && (cat === 'necklace' || cat === 'necklaces')) ||
        (activeCategory === 'earring' && (cat === 'earring' || cat === 'earrings')) ||
        (activeCategory === 'bangle' && (cat === 'bangle' || cat === 'bangles' || cat === 'bracelet'));

      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q);

      return matchCat && matchSearch;
    });
  }, [catalogProducts, chocolatesList, activeCategory, searchQuery]);

  // Validation before advancing steps
  const handleProceedToStep2 = () => {
    if (!selectedBox) {
      toast.error('Please choose a hamper box first!');
      return;
    }
    setCurrentStep(2);
    window.scrollTo({ top: 150, behavior: 'smooth' });
  };

  const handleProceedToStep3 = () => {
    if (selectedProducts.length === 0) {
      toast.error('Please add at least 1 product to your hamper before continuing!');
      return;
    }
    setCurrentStep(3);
    window.scrollTo({ top: 150, behavior: 'smooth' });
  };

  const handleProceedToStep4 = () => {
    setCurrentStep(4);
    window.scrollTo({ top: 150, behavior: 'smooth' });
  };

  // Final Action: Add Completed Hamper to Shopping Bag
  const handleAddHamperToCart = () => {
    if (!selectedBox) {
      toast.error('Hamper box missing!');
      setCurrentStep(1);
      return;
    }
    if (selectedProducts.length === 0) {
      toast.error('Your hamper is empty! Add products to proceed.');
      setCurrentStep(2);
      return;
    }

    const hamperPayload = {
      id: editHamperId || ('HAMPER-' + Date.now()),
      title: `Royal ${selectedBox?.name || 'Hamper'}`,
      box: selectedBox,
      products: selectedProducts,
      personalization,
      packagingFee,
      totalPrice: hamperTotalPrice,
      totalMrp: Math.round(hamperTotalPrice * 1.3)
    };

    const res = cart.addHamperItem(hamperPayload);
    if (res && res.success) {
      setCompletedHamperId(res.hamperId);
      setShowSuccessModal(true);
      // Clean draft
      try { localStorage.removeItem('panch_hamper_draft'); } catch (_) {}
    }
  };

  return (
    <div className="hamper-builder-page">
      {/* Hero Header */}
      <div className="hamper-hero-header">
        <span className="hamper-badge-tag">
          <i className="fa-solid fa-crown" style={{ color: '#c5a059' }}></i>
          PANCH SATTVA BESPOKE GIFTING
        </span>
        <h1 className="hamper-hero-title">
          Build Your <span>Custom Luxury Hamper</span>
        </h1>
        <p className="hamper-hero-desc">
          Handcraft a regal gifting experience in 4 simple steps. Select an heirloom keepsake box, fill it with your favorite royal jewellery & treats, add personalized greetings, and have it dispatched in certified luxury presentation.
        </p>
      </div>

      {/* Stepper Navigation Bar */}
      <div className="hamper-stepper-wrap">
        <div className="hamper-stepper">
          {/* Step 1 */}
          <button
            type="button"
            className={`stepper-step ${currentStep === 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}
            onClick={() => setCurrentStep(1)}
          >
            <div className="stepper-num">
              {currentStep > 1 ? <i className="fa-solid fa-check"></i> : '1'}
            </div>
            <div className="stepper-label-box">
              <span className="stepper-sub">Step 1</span>
              <span className="stepper-title">Choose Box</span>
            </div>
          </button>

          <div className={`stepper-divider ${currentStep > 1 ? 'active' : ''}`}></div>

          {/* Step 2 */}
          <button
            type="button"
            className={`stepper-step ${currentStep === 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}
            onClick={handleProceedToStep2}
          >
            <div className="stepper-num">
              {currentStep > 2 ? <i className="fa-solid fa-check"></i> : '2'}
            </div>
            <div className="stepper-label-box">
              <span className="stepper-sub">Step 2</span>
              <span className="stepper-title">Add Products ({totalItemsCount})</span>
            </div>
          </button>

          <div className={`stepper-divider ${currentStep > 2 ? 'active' : ''}`}></div>

          {/* Step 3 */}
          <button
            type="button"
            className={`stepper-step ${currentStep === 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}
            onClick={() => {
              if (selectedProducts.length === 0) {
                toast.error('Add items to your hamper first!');
              } else {
                handleProceedToStep3();
              }
            }}
          >
            <div className="stepper-num">
              {currentStep > 3 ? <i className="fa-solid fa-check"></i> : '3'}
            </div>
            <div className="stepper-label-box">
              <span className="stepper-sub">Step 3</span>
              <span className="stepper-title">Personalize</span>
            </div>
          </button>

          <div className={`stepper-divider ${currentStep > 3 ? 'active' : ''}`}></div>

          {/* Step 4 */}
          <button
            type="button"
            className={`stepper-step ${currentStep === 4 ? 'active' : ''}`}
            onClick={() => {
              if (selectedProducts.length === 0) {
                toast.error('Add items to your hamper first!');
              } else {
                handleProceedToStep4();
              }
            }}
          >
            <div className="stepper-num">4</div>
            <div className="stepper-label-box">
              <span className="stepper-sub">Step 4</span>
              <span className="stepper-title">Review & Bag</span>
            </div>
          </button>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="hamper-main-layout">
        {/* LEFT COLUMN: ACTIVE STEP CONTENT */}
        <div className="hamper-step-content">
          {/* ====================================================
               STEP 1: CHOOSE A HAMPER BOX
          ===================================================== */}
          {currentStep === 1 && (
            <div>
              <div className="step-section-header">
                <div>
                  <h2 className="step-section-title">
                    <i className="fa-solid fa-box-open" style={{ color: '#c5a059', marginRight: '8px' }}></i>
                    Step 1: Select Your Keepsake Hamper Box
                  </h2>
                  <p className="step-section-desc">
                    Each Panch Sattva box is handcrafted with luxurious textures, royal linings, and designed to be retained as an heirloom treasure.
                  </p>
                </div>
                {selectedBox && (
                  <span style={{ fontSize: '13px', color: '#800020', fontWeight: '700' }}>
                    Selected: <strong>{selectedBox.name}</strong> (₹{Number(selectedBox.price).toLocaleString('en-IN')})
                  </span>
                )}
              </div>

              {boxesList.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '44px 20px',
                  background: '#fffdfa',
                  border: '1.5px dashed #c5a059',
                  borderRadius: '16px',
                  margin: '20px 0'
                }}>
                  <div style={{ fontSize: '42px', color: '#c5a059', marginBottom: '10px' }}>📦</div>
                  <h3 style={{ fontFamily: 'Cinzel, serif', color: '#800020', margin: '0 0 8px' }}>
                    No Hamper Packaging Boxes Available Yet
                  </h3>
                  <p style={{ color: '#6b7280', fontSize: '13px', maxWidth: '480px', margin: '0 auto 18px' }}>
                    All dummy boxes have been removed from the store. If you are an administrator, please visit the Admin Panel &gt; Custom Hampers section to add keepsake packaging boxes.
                  </p>
                  <Link to="/products" className="hamper-btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fa-solid fa-gem"></i> Explore Handcrafted Jewellery
                  </Link>
                </div>
              ) : (
                <div className="boxes-grid">
                  {boxesList.map(box => {
                    const boxId = box._id || box.id;
                    const isSelected = (selectedBox?._id || selectedBox?.id) === boxId;
                    return (
                      <div
                        key={boxId}
                        className={`box-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedBox(box)}
                      >
                        {isSelected && (
                          <div className="box-selected-badge">
                            <i className="fa-solid fa-check"></i> Selected
                          </div>
                        )}

                        <div className="box-card-img-wrap">
                          <img
                            src={box.image || '/images/psimg/gift1.png'}
                            alt={box.name}
                            className="box-card-img"
                            onError={(e) => { e.target.src = '/images/psimg/gift1.png'; }}
                          />
                          <span className="box-capacity-tag">
                            <i className="fa-solid fa-gem" style={{ marginRight: '4px', color: '#c5a059' }}></i>
                            Fits {box.capacity || 4} luxury items
                          </span>
                          {box.badge && (
                            <span style={{
                              position: 'absolute',
                              top: '10px',
                              left: '10px',
                              background: '#800020',
                              color: '#fff',
                              fontSize: '10px',
                              fontWeight: '700',
                              padding: '3px 8px',
                              borderRadius: '12px',
                              letterSpacing: '0.5px'
                            }}>
                              {box.badge}
                            </span>
                          )}
                        </div>

                        <div className="box-card-body">
                          <div className="box-card-header">
                            <h3 className="box-card-title">{box.name}</h3>
                            <div style={{ textAlign: 'right' }}>
                              <span className="box-card-price">₹{Number(box.price).toLocaleString('en-IN')}</span>
                              {box.mrp && Number(box.mrp) > Number(box.price) && (
                                <span style={{ display: 'block', fontSize: '11px', textDecoration: 'line-through', color: '#9ca3af' }}>
                                  ₹{Number(box.mrp).toLocaleString('en-IN')}
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="box-card-desc">{box.description}</p>

                          <div className="box-card-footer">
                            <span><i className="fa-solid fa-palette" style={{ marginRight: '4px' }}></i>{box.color || 'Royal Velvet'}</span>
                            <span><i className="fa-solid fa-ruler-combined" style={{ marginRight: '4px' }}></i>{box.dimensions || 'Standard'}</span>
                          </div>

                          <button
                            type="button"
                            className="btn-select-box"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBox(box);
                            }}
                          >
                            {isSelected ? '✓ Box Selected' : 'Choose This Box'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div style={{ marginTop: '30px', textAlign: 'right' }}>
                <button
                  type="button"
                  className="btn-builder-next"
                  style={{ display: 'inline-flex', width: 'auto', padding: '12px 28px' }}
                  onClick={handleProceedToStep2}
                >
                  <span>Continue to Add Products</span>
                  <i className="fa-solid fa-arrow-right"></i>
                </button>
              </div>
            </div>
          )}

          {/* ====================================================
               STEP 2: SELECT PRODUCTS FROM CATALOG
          ===================================================== */}
          {currentStep === 2 && (
            <div>
              <div className="step-section-header">
                <div>
                  <h2 className="step-section-title">
                    <i className="fa-solid fa-gem" style={{ color: '#c5a059', marginRight: '8px' }}></i>
                    Step 2: Add Royal Treasures to Your Hamper
                  </h2>
                  <p className="step-section-desc">
                    Choose authentic handcrafted jewellery pieces. Adding chocolates is completely <strong>OPTIONAL</strong> — build your hamper with jewellery only, or pair it with gourmet chocolates or custom chocolate requests as desired.
                  </p>
                </div>
              </div>

              {/* Box Capacity Status Banner */}
              <div className="hamper-capacity-banner">
                <div className="capacity-info">
                  <div className="capacity-icon">
                    <i className="fa-solid fa-gift"></i>
                  </div>
                  <div>
                    <h4 className="capacity-title">{selectedBox?.name || 'Luxury Keepsake Box'}</h4>
                    <p className="capacity-subtitle">
                      Recommended capacity: {selectedBox?.capacity || 4} pieces • Currently: {totalItemsCount} items added
                    </p>
                  </div>
                </div>

                <div className="capacity-bar-wrap">
                  <div className="capacity-bar-track">
                    <div
                      className="capacity-bar-fill"
                      style={{
                        width: `${capacityPercent}%`,
                        background: capacityPercent >= 100 ? '#15803d' : 'linear-gradient(90deg, #c5a059, #800020)'
                      }}
                    ></div>
                  </div>
                  <div className="capacity-bar-label">
                    <span>{totalItemsCount} of {selectedBox?.capacity || 4} items</span>
                    <span>{capacityPercent}% filled</span>
                  </div>
                </div>
              </div>

              {/* Categories & Search Filter Bar */}
              <div className="hamper-filter-bar">
                <div className="hamper-cat-chips">
                  {[
                    { key: 'all', label: 'All Jewellery' },
                    { key: 'ring', label: 'Rings' },
                    { key: 'necklace', label: 'Necklaces' },
                    { key: 'earring', label: 'Earrings' },
                    { key: 'bangle', label: 'Bangles & Bracelets' },
                    { key: 'chocolates', label: '🍫 Chocolates (Optional)' }
                  ].map(cat => (
                    <button
                      key={cat.key}
                      type="button"
                      className={`hamper-cat-chip ${activeCategory === cat.key ? 'active' : ''}`}
                      onClick={() => setActiveCategory(cat.key)}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <div className="hamper-search-input-box">
                  <i className="fa-solid fa-magnifying-glass" style={{ color: '#800020' }}></i>
                  <input
                    type="text"
                    placeholder="Search jewellery or chocolates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <i
                      className="fa-solid fa-xmark"
                      style={{ cursor: 'pointer', color: '#999' }}
                      onClick={() => setSearchQuery('')}
                    ></i>
                  )}
                </div>
              </div>

              {/* DEDICATED CHOCOLATE CONCIERGE BANNER (Shown in Chocolates Section) */}
              {activeCategory === 'chocolates' && (
                <div style={{
                  background: 'linear-gradient(135deg, #2b0008, #550015)',
                  border: '1px solid rgba(197,160,89,0.4)',
                  borderRadius: '14px',
                  padding: '16px 20px',
                  marginBottom: '22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '14px',
                  color: '#fff',
                  boxShadow: '0 4px 16px rgba(43,0,8,0.2)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      background: 'rgba(197,160,89,0.2)',
                      border: '1px solid #c5a059',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '22px',
                      flexShrink: 0
                    }}>
                      🍫
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '15px', color: '#f5e6cb', fontFamily: 'Cinzel, serif', letterSpacing: '0.5px' }}>
                        Want a Specific Chocolate or Sweet?
                      </h4>
                      <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#e5e7eb', maxWidth: '520px', lineHeight: '1.4' }}>
                        Tell us which brand you want (e.g. Ferrero Rocher, Lindt Swiss Dark, Cadbury Silk, Hazelnut Truffles) and our royal concierge will include it in your custom hamper!
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-gold"
                    onClick={() => setShowCustomChocModal(true)}
                    style={{ padding: '9px 18px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                  >
                    <i className="fa-solid fa-paper-plane"></i> Request Custom Chocolate
                  </button>
                </div>
              )}

              {/* Products Grid */}
              {loadingCatalog ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#800020' }}>
                  <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '32px', marginBottom: '12px' }}></i>
                  <p style={{ fontWeight: '600' }}>Loading royal treasures...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
                  {activeCategory === 'chocolates' ? (
                    <div style={{
                      background: '#fffdfa',
                      border: '1.5px dashed #c5a059',
                      borderRadius: '12px',
                      padding: '24px',
                      maxWidth: '520px',
                      margin: '0 auto'
                    }}>
                      <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>🍫</span>
                      <h4 style={{ fontFamily: 'Cinzel, serif', color: '#800020', margin: '0 0 6px' }}>
                        Chocolates are 100% Optional
                      </h4>
                      <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 14px' }}>
                        You can build your hamper with jewellery only, or request ANY specific chocolate brand you love (Ferrero Rocher, Cadbury Silk, Lindt, etc.) using our concierge!
                      </p>
                      <button
                        type="button"
                        className="btn-gold"
                        style={{ padding: '8px 18px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        onClick={() => setShowCustomChocModal(true)}
                      >
                        <i className="fa-solid fa-paper-plane"></i> Request Custom Chocolate
                      </button>
                    </div>
                  ) : (
                    <>
                      <i className="fa-solid fa-box-open" style={{ fontSize: '36px', color: '#c5a059', marginBottom: '10px' }}></i>
                      <p>No jewellery items match your search or category filter.</p>
                      <button
                        type="button"
                        className="hamper-cat-chip"
                        onClick={() => { setActiveCategory('all'); setSearchQuery(''); }}
                      >
                        View All Jewellery
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div className="hamper-products-grid">
                  {filteredProducts.map(prod => {
                    const prodId = prod._id || prod.id || prod.name;
                    const inCartQty = getProductQtyInHamper(prod);
                    const isInHamper = inCartQty > 0;

                    return (
                      <div
                        key={prodId}
                        className={`hamper-prod-card ${isInHamper ? 'in-hamper' : ''}`}
                      >
                        {prod.badge && <span className="hamper-prod-badge">{prod.badge}</span>}
                        {isInHamper && (
                          <span className="hamper-prod-qty-badge">
                            {inCartQty} in Box
                          </span>
                        )}

                        <div
                          className="hamper-prod-img-wrap"
                          onClick={() => setDetailProduct(prod)}
                          title="Click to view full details"
                        >
                          <img
                            src={getValidImageUrl(prod)}
                            alt={prod.name}
                            className="hamper-prod-img"
                            onError={(e) => { e.target.src = '/images/psimg/ring1.jpg'; }}
                          />
                        </div>

                        <div className="hamper-prod-body">
                          <span className="hamper-prod-category">{prod.category || 'Jewellery'}</span>
                          <h4 className="hamper-prod-title" title={prod.name}>{prod.name}</h4>

                          <div className="hamper-prod-price-row">
                            <span className="hamper-prod-price">₹{Number(prod.price).toLocaleString('en-IN')}</span>
                            {prod.mrp && <span className="hamper-prod-mrp">₹{Number(prod.mrp).toLocaleString('en-IN')}</span>}
                          </div>

                          <div className="hamper-prod-actions">
                            {!isInHamper ? (
                              <button
                                type="button"
                                className="btn-add-to-hamper"
                                onClick={() => handleAddProduct(prod)}
                              >
                                <i className="fa-solid fa-plus"></i> Add to Box
                              </button>
                            ) : (
                              <div className="hamper-qty-control">
                                <button
                                  type="button"
                                  className="hamper-qty-btn"
                                  onClick={() => handleDecreaseProduct(prodId)}
                                  title="Decrease quantity"
                                >
                                  <i className="fa-solid fa-minus"></i>
                                </button>
                                <span className="hamper-qty-val">{inCartQty}</span>
                                <button
                                  type="button"
                                  className="hamper-qty-btn"
                                  onClick={() => handleAddProduct(prod)}
                                  title="Add another"
                                >
                                  <i className="fa-solid fa-plus"></i>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Bottom Nav Buttons */}
              <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn-builder-back"
                  style={{ width: 'auto', padding: '10px 20px' }}
                  onClick={() => setCurrentStep(1)}
                >
                  <i className="fa-solid fa-arrow-left" style={{ marginRight: '6px' }}></i> Change Box
                </button>

                <button
                  type="button"
                  className="btn-builder-next"
                  style={{ width: 'auto', padding: '12px 28px' }}
                  disabled={selectedProducts.length === 0}
                  onClick={handleProceedToStep3}
                >
                  <span>Personalize & Preview ({totalItemsCount} items)</span>
                  <i className="fa-solid fa-arrow-right"></i>
                </button>
              </div>
            </div>
          )}

          {/* ====================================================
               STEP 3: CUSTOMIZE & VISUAL PREVIEW STUDIO
          ===================================================== */}
          {currentStep === 3 && (
            <div>
              <div className="step-section-header">
                <div>
                  <h2 className="step-section-title">
                    <i className="fa-solid fa-feather-pointed" style={{ color: '#c5a059', marginRight: '8px' }}></i>
                    Step 3: Personalization & Interactive Studio
                  </h2>
                  <p className="step-section-desc">
                    Customize your handwritten royal greeting card, select satin packaging ribbons, and inspect your visual hamper composition in real time.
                  </p>
                </div>
              </div>

              <div className="personalization-grid">
                {/* Form Controls Column */}
                <div className="personalization-form-col">
                  {/* Recipient Name */}
                  <div className="p-field-group">
                    <label>
                      <span>Recipient's Name (To) *</span>
                      <small style={{ color: '#c5a059' }}>Handwritten on Card</small>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Priya Sharma / Mom / My Queen"
                      value={personalization.recipientName}
                      onChange={(e) => setPersonalization({ ...personalization, recipientName: e.target.value })}
                    />
                  </div>

                  {/* Occasion */}
                  <div className="p-field-group">
                    <label>Gift Occasion</label>
                    <select
                      value={personalization.occasion}
                      onChange={(e) => setPersonalization({ ...personalization, occasion: e.target.value })}
                    >
                      {OCCASIONS.map(occ => (
                        <option key={occ} value={occ}>{occ}</option>
                      ))}
                    </select>
                  </div>

                  {/* Satin Ribbon Choice */}
                  <div className="p-field-group">
                    <label>Satin Ribbon Packaging Accent</label>
                    <div className="ribbon-swatches">
                      {RIBBON_OPTIONS.map(rib => (
                        <div
                          key={rib.id}
                          className={`ribbon-swatch ${personalization.ribbonColor === rib.name ? 'active' : ''}`}
                          onClick={() => setPersonalization({ ...personalization, ribbonColor: rib.name })}
                        >
                          <span className="swatch-circle" style={{ background: rib.hex }}></span>
                          <span>{rib.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Handwritten Message */}
                  <div className="p-field-group">
                    <label>
                      <span>Personal Gift Message (Handwritten Note)</span>
                      <small style={{ color: '#888' }}>{personalization.giftMessage.length}/280 chars</small>
                    </label>
                    <textarea
                      rows="4"
                      maxLength={280}
                      placeholder="Write your heartfelt blessing or words of appreciation..."
                      value={personalization.giftMessage}
                      onChange={(e) => setPersonalization({ ...personalization, giftMessage: e.target.value })}
                    ></textarea>
                  </div>

                  {/* Sender Name */}
                  <div className="p-field-group">
                    <label>Sender Signature (From)</label>
                    <input
                      type="text"
                      placeholder="e.g. With Love, Rohit & Family"
                      value={personalization.senderName}
                      onChange={(e) => setPersonalization({ ...personalization, senderName: e.target.value })}
                    />
                  </div>
                </div>

                {/* VISUAL LAYERED HAMPER PREVIEW PANEL */}
                <div className="visual-hamper-preview-panel">
                  <div className="preview-crown-crest">
                    <i className="fa-solid fa-crown"></i>
                    <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: '15px', color: '#c5a059', margin: '4px 0 0 0', letterSpacing: '1px' }}>
                      PANCH SATTVA ROYAL ATELIER
                    </h3>
                    <span style={{ fontSize: '11px', color: '#d1d5db', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      Interactive Hamper Preview
                    </span>
                  </div>

                  {/* Box Showcase */}
                  <div className="preview-box-showcase">
                    <span className="preview-box-badge">SELECTED BOX</span>
                    <h4 className="preview-box-name">{selectedBox?.name || 'Luxury Box'}</h4>
                    <span style={{ fontSize: '11.5px', color: '#e5e7eb' }}>
                      {selectedBox?.color || 'Royal'} • {selectedBox?.dimensions || 'Standard'}
                    </span>

                    <div className="preview-box-img-wrap">
                      <img
                        src={selectedBox?.image || '/images/psimg/gift1.png'}
                        alt={selectedBox?.name || 'Box'}
                        className="preview-box-img"
                        onError={(e) => { e.target.src = '/images/psimg/gift1.png'; }}
                      />
                      <span className="preview-ribbon-tag">
                        🎀 {personalization.ribbonColor} Ribbon
                      </span>
                    </div>
                  </div>

                  {/* Arranged Inside Products Layer */}
                  <div className="preview-products-layer">
                    <div className="preview-section-heading">
                      <span>Treasures Inside ({totalItemsCount} items)</span>
                      <span>₹{productsSubtotal.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="preview-items-row">
                      {selectedProducts.map((p, idx) => (
                        <div key={idx} className="preview-thumb-card">
                          <span className="preview-thumb-qty">{p.quantity}</span>
                          <img
                            src={getValidImageUrl(p.product)}
                            alt={p.product?.name}
                            className="preview-thumb-img"
                            onError={(e) => { e.target.src = '/images/psimg/ring1.jpg'; }}
                          />
                          <span className="preview-thumb-name">{p.product?.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Handwritten Greeting Card Preview */}
                  <div className="preview-greeting-card">
                    <i className="fa-solid fa-stamp card-stamp"></i>
                    <h5 className="card-occasion-title">
                      {personalization.occasion}
                    </h5>

                    {personalization.recipientName && (
                      <p style={{ fontWeight: '700', fontSize: '13px', color: '#800020', margin: '0 0 4px 0' }}>
                        Dearest {personalization.recipientName},
                      </p>
                    )}

                    <p className="card-handwritten-text">
                      "{personalization.giftMessage || 'Warmest wishes from Panch Sattva.'}"
                    </p>

                    <div style={{ textAlign: 'right' }}>
                      <span className="card-recipient-sign">
                        {personalization.senderName ? `— ${personalization.senderName}` : '— Panch Sattva Luxury Suite'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Nav Buttons */}
              <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn-builder-back"
                  style={{ width: 'auto', padding: '10px 20px' }}
                  onClick={() => setCurrentStep(2)}
                >
                  <i className="fa-solid fa-arrow-left" style={{ marginRight: '6px' }}></i> Adjust Products
                </button>

                <button
                  type="button"
                  className="btn-builder-next"
                  style={{ width: 'auto', padding: '12px 28px' }}
                  onClick={handleProceedToStep4}
                >
                  <span>Review Final Hamper</span>
                  <i className="fa-solid fa-arrow-right"></i>
                </button>
              </div>
            </div>
          )}

          {/* ====================================================
               STEP 4: REVIEW & ADD TO CART
          ===================================================== */}
          {currentStep === 4 && (
            <div>
              <div className="step-section-header">
                <div>
                  <h2 className="step-section-title">
                    <i className="fa-solid fa-clipboard-check" style={{ color: '#c5a059', marginRight: '8px' }}></i>
                    Step 4: Review Your Custom Luxury Hamper
                  </h2>
                  <p className="step-section-desc">
                    Review itemized details and pricing. Once added to your bag, your complete hamper is treated as a unified luxury gift with full personalization.
                  </p>
                </div>
              </div>

              <div className="hamper-review-container">
                {/* Itemized Table */}
                <table className="review-itemized-table">
                  <thead>
                    <tr>
                      <th>Hamper Component</th>
                      <th>Quantity</th>
                      <th>Price</th>
                      <th style={{ textAlign: 'right' }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Box Row */}
                    <tr>
                      <td>
                        <div className="review-prod-item">
                          <img
                            src={selectedBox?.image || '/images/psimg/gift1.png'}
                            alt={selectedBox?.name || 'Box'}
                            className="review-prod-thumb"
                            onError={(e) => { e.target.src = '/images/psimg/gift1.png'; }}
                          />
                          <div>
                            <strong>{selectedBox?.name || 'Keepsake Box'}</strong>
                            <small style={{ display: 'block', color: '#666' }}>
                              Keepsake Packaging • {selectedBox?.color || 'Royal'}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>1 Box</td>
                      <td>₹{(Number(selectedBox?.price) || 0).toLocaleString('en-IN')}</td>
                      <td style={{ textAlign: 'right', fontWeight: '700', color: '#800020' }}>
                        ₹{(Number(selectedBox?.price) || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>

                    {/* Products Rows */}
                    {selectedProducts.map((p, idx) => {
                      const itemTotal = (Number(p.unitPrice || p.product?.price) || 0) * (Number(p.quantity) || 1);
                      return (
                        <tr key={idx}>
                          <td>
                            <div className="review-prod-item">
                              <img
                                src={getValidImageUrl(p.product)}
                                alt={p.product?.name}
                                className="review-prod-thumb"
                                onError={(e) => { e.target.src = '/images/psimg/ring1.jpg'; }}
                              />
                              <div>
                                <strong>{p.product?.name}</strong>
                                <small style={{ display: 'block', color: '#666' }}>
                                  Category: {p.product?.category || 'Jewellery'}
                                </small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{p.quantity}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveProduct(p.productId || p.product?._id)}
                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '11px' }}
                                title="Remove item"
                              >
                                <i className="fa-solid fa-trash"></i>
                              </button>
                            </div>
                          </td>
                          <td>₹{Number(p.unitPrice || p.product?.price).toLocaleString('en-IN')}</td>
                          <td style={{ textAlign: 'right', fontWeight: '700', color: '#800020' }}>
                            ₹{itemTotal.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      );
                    })}

                    {/* Satin Ribbon & Packaging */}
                    <tr>
                      <td>
                        <div className="review-prod-item">
                          <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '8px',
                            background: '#faf4ec',
                            border: '1px solid #ebd7be',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '20px',
                            color: '#c5a059'
                          }}>
                            🎀
                          </div>
                          <div>
                            <strong>{personalization.ribbonColor} Satin Ribbon & Seal</strong>
                            <small style={{ display: 'block', color: '#666' }}>
                              Royal Gold Wax Seal & Silk Lining
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>1 Set</td>
                      <td><span style={{ textDecoration: 'line-through', color: '#999' }}>₹199</span> Free</td>
                      <td style={{ textAlign: 'right', fontWeight: '700', color: '#15803d' }}>
                        ₹0 (Complimentary)
                      </td>
                    </tr>

                    {/* Greeting Card */}
                    <tr>
                      <td>
                        <div className="review-prod-item">
                          <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '8px',
                            background: '#faf4ec',
                            border: '1px solid #ebd7be',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '20px',
                            color: '#800020'
                          }}>
                            ✉️
                          </div>
                          <div>
                            <strong>Handwritten Gold Foil Greeting Card</strong>
                            <small style={{ display: 'block', color: '#666' }}>
                              Occasion: {personalization.occasion} • To: {personalization.recipientName || 'Valued Recipient'}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>1 Card</td>
                      <td><span style={{ textDecoration: 'line-through', color: '#999' }}>₹149</span> Free</td>
                      <td style={{ textAlign: 'right', fontWeight: '700', color: '#15803d' }}>
                        ₹0 (Complimentary)
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Personalization Summary Card */}
                <div className="review-summary-card">
                  <h4 style={{ fontFamily: 'Cinzel, serif', color: '#800020', margin: '0 0 12px 0', fontSize: '15px' }}>
                    <i className="fa-solid fa-envelope-open-text" style={{ color: '#c5a059', marginRight: '8px' }}></i>
                    Personalization & Handwritten Card Summary
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', display: 'block' }}>Recipient</span>
                      <strong style={{ color: '#800020' }}>{personalization.recipientName || 'Not specified'}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', display: 'block' }}>Occasion</span>
                      <strong>{personalization.occasion}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', display: 'block' }}>Ribbon Color</span>
                      <strong>{personalization.ribbonColor}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', display: 'block' }}>Sender</span>
                      <strong>{personalization.senderName || 'Anonymous / Self'}</strong>
                    </div>
                  </div>

                  <div style={{ background: '#fff', border: '1px dashed #c5a059', padding: '12px 14px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                      Handwritten Note Content:
                    </span>
                    <p style={{ margin: 0, fontStyle: 'italic', fontSize: '13px', color: '#374151', lineHeight: '1.5' }}>
                      "{personalization.giftMessage}"
                    </p>
                  </div>
                </div>

                {/* Final Total Calculation Box */}
                <div className="review-summary-card">
                  <div className="review-summary-row">
                    <span>Keepsake Box Price:</span>
                    <span>₹{boxPrice.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="review-summary-row">
                    <span>Curated Treasures ({totalItemsCount} items):</span>
                    <span>₹{productsSubtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="review-summary-row">
                    <span>Satin Ribbon & Gold Wax Seal:</span>
                    <span style={{ color: '#15803d', fontWeight: '600' }}>FREE (₹0)</span>
                  </div>
                  <div className="review-summary-row">
                    <span>Handwritten Greeting Card:</span>
                    <span style={{ color: '#15803d', fontWeight: '600' }}>FREE (₹0)</span>
                  </div>
                  <div className="review-summary-row">
                    <span>Pan-India Insured Express Shipping:</span>
                    <span style={{ color: '#15803d', fontWeight: '600' }}>FREE</span>
                  </div>

                  <div className="review-summary-row total-row">
                    <span>Final Hamper Total:</span>
                    <span>₹{hamperTotalPrice.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn-builder-back"
                    style={{ width: 'auto', padding: '12px 24px' }}
                    onClick={() => setCurrentStep(3)}
                  >
                    <i className="fa-solid fa-arrow-left" style={{ marginRight: '6px' }}></i> Back to Personalize
                  </button>

                  <button
                    type="button"
                    className="btn-builder-next"
                    style={{ width: 'auto', padding: '14px 34px', fontSize: '15px' }}
                    onClick={handleAddHamperToCart}
                  >
                    <i className="fa-solid fa-bag-shopping"></i>
                    <span>Add Complete Hamper to Shopping Bag (₹{hamperTotalPrice.toLocaleString('en-IN')})</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: STICKY ORDER SUMMARY (DESKTOP) */}
        <aside className="hamper-sidebar-sticky">
          <h3 className="sidebar-summary-title">
            <span>Hamper Summary</span>
            <span style={{ fontSize: '12px', color: '#c5a059', fontWeight: '600' }}>Step {currentStep} of 4</span>
          </h3>

          {/* Selected Box Card */}
          {selectedBox && (
            <div className="sidebar-box-preview-compact">
              <img
                src={selectedBox.image || '/images/psimg/gift1.png'}
                alt={selectedBox.name}
                className="sidebar-box-thumb"
                onError={(e) => { e.target.src = '/images/psimg/gift1.png'; }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#c5a059', fontWeight: '700' }}>Box Choice</span>
                <strong style={{ display: 'block', fontSize: '13px', color: '#800020', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {selectedBox.name}
                </strong>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>₹{Number(selectedBox.price).toLocaleString('en-IN')}</span>
              </div>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                style={{ background: 'none', border: 'none', color: '#800020', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Change
              </button>
            </div>
          )}

          {/* Products Inside */}
          <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Items Inside ({totalItemsCount})
            </span>
            {selectedProducts.length > 0 && (
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                style={{ background: 'none', border: 'none', color: '#800020', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline' }}
              >
                + Add More
              </button>
            )}
          </div>

          <div className="sidebar-items-list">
            {selectedProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 10px', color: '#9ca3af', fontSize: '12.5px' }}>
                <i className="fa-solid fa-gift" style={{ fontSize: '24px', color: '#ebd7be', marginBottom: '6px', display: 'block' }}></i>
                No treasures added yet. Go to Step 2 to select products!
              </div>
            ) : (
              selectedProducts.map((p, idx) => {
                const itemTotal = (Number(p.unitPrice || p.product?.price) || 0) * (Number(p.quantity) || 1);
                return (
                  <div key={idx} className="sidebar-item-row">
                    <div className="sidebar-item-left">
                      <img
                        src={getValidImageUrl(p.product)}
                        alt={p.product?.name}
                        className="sidebar-item-img"
                        onError={(e) => { e.target.src = '/images/psimg/ring1.jpg'; }}
                      />
                      <div>
                        <strong style={{ fontSize: '12px', display: 'block', maxWidth: '140px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.product?.name}
                        </strong>
                        <span style={{ fontSize: '11px', color: '#888' }}>Qty: {p.quantity}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <strong style={{ color: '#800020' }}>₹{itemTotal.toLocaleString('en-IN')}</strong>
                      <button
                        type="button"
                        onClick={() => handleRemoveProduct(p.productId || p.product?._id)}
                        style={{ display: 'block', margin: '2px 0 0 auto', background: 'none', border: 'none', color: '#ef4444', fontSize: '11px', cursor: 'pointer' }}
                        title="Remove"
                      >
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pricing Breakdown */}
          <div className="sidebar-price-breakdown">
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
              <span>Box:</span>
              <span>₹{boxPrice.toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
              <span>Products Subtotal:</span>
              <span>₹{productsSubtotal.toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
              <span>Luxury Gift Ribbon:</span>
              <span style={{ color: '#15803d' }}>FREE</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
              <span>Handwritten Card:</span>
              <span style={{ color: '#15803d' }}>FREE</span>
            </div>
          </div>

          <div className="sidebar-total-amount">
            <span>Hamper Total:</span>
            <strong>₹{hamperTotalPrice.toLocaleString('en-IN')}</strong>
          </div>

          {/* Contextual Step Button */}
          {currentStep === 1 && (
            <button
              type="button"
              className="btn-builder-next"
              onClick={handleProceedToStep2}
            >
              <span>Add Products to Box</span>
              <i className="fa-solid fa-arrow-right"></i>
            </button>
          )}

          {currentStep === 2 && (
            <button
              type="button"
              className="btn-builder-next"
              disabled={selectedProducts.length === 0}
              onClick={handleProceedToStep3}
            >
              <span>Personalize Hamper ({totalItemsCount})</span>
              <i className="fa-solid fa-arrow-right"></i>
            </button>
          )}

          {currentStep === 3 && (
            <button
              type="button"
              className="btn-builder-next"
              onClick={handleProceedToStep4}
            >
              <span>Review Complete Hamper</span>
              <i className="fa-solid fa-arrow-right"></i>
            </button>
          )}

          {currentStep === 4 && (
            <button
              type="button"
              className="btn-builder-next"
              onClick={handleAddHamperToCart}
            >
              <i className="fa-solid fa-bag-shopping"></i>
              <span>Add to Shopping Bag</span>
            </button>
          )}

          {currentStep > 1 && (
            <button
              type="button"
              className="btn-builder-back"
              onClick={() => setCurrentStep(prev => prev - 1)}
            >
              Back to Previous Step
            </button>
          )}
        </aside>
      </div>

      {/* MOBILE STICKY BOTTOM BAR */}
      <div className="hamper-mobile-bottom-bar">
        <div className="mobile-bar-content">
          <div className="mobile-bar-total">
            <span>Hamper ({totalItemsCount} items):</span>
            <strong>₹{hamperTotalPrice.toLocaleString('en-IN')}</strong>
          </div>

          {currentStep === 1 && (
            <button
              type="button"
              className="btn-builder-next"
              style={{ width: 'auto', padding: '10px 20px' }}
              onClick={handleProceedToStep2}
            >
              Next: Items <i className="fa-solid fa-arrow-right"></i>
            </button>
          )}

          {currentStep === 2 && (
            <button
              type="button"
              className="btn-builder-next"
              style={{ width: 'auto', padding: '10px 20px' }}
              disabled={selectedProducts.length === 0}
              onClick={handleProceedToStep3}
            >
              Next: Personalize <i className="fa-solid fa-arrow-right"></i>
            </button>
          )}

          {currentStep === 3 && (
            <button
              type="button"
              className="btn-builder-next"
              style={{ width: 'auto', padding: '10px 20px' }}
              onClick={handleProceedToStep4}
            >
              Review <i className="fa-solid fa-arrow-right"></i>
            </button>
          )}

          {currentStep === 4 && (
            <button
              type="button"
              className="btn-builder-next"
              style={{ width: 'auto', padding: '10px 20px' }}
              onClick={handleAddHamperToCart}
            >
              <i className="fa-solid fa-bag-shopping"></i> Add to Bag
            </button>
          )}
        </div>
      </div>

      {/* QUICK PRODUCT DETAIL MODAL */}
      {detailProduct && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px'
          }}
          onClick={() => setDetailProduct(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setDetailProduct(null)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.6)',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2
              }}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>

            <img
              src={getValidImageUrl(detailProduct)}
              alt={detailProduct.name}
              style={{ width: '100%', height: '260px', objectFit: 'cover' }}
              onError={(e) => { e.target.src = '/images/psimg/ring1.jpg'; }}
            />

            <div style={{ padding: '20px' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#c5a059', fontWeight: '700' }}>
                {detailProduct.category || 'Jewellery'}
              </span>
              <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: '18px', color: '#800020', margin: '4px 0 8px 0' }}>
                {detailProduct.name}
              </h3>
              <p style={{ fontSize: '13px', color: '#4b5563', lineHeight: '1.5', margin: '0 0 16px 0' }}>
                {detailProduct.description || 'Exquisite handcrafted jewellery piece by Panch Sattva with 100% genuine certification.'}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #ebd7be', paddingTop: '14px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#888', display: 'block' }}>Price</span>
                  <strong style={{ fontSize: '20px', color: '#800020' }}>
                    ₹{Number(detailProduct.price).toLocaleString('en-IN')}
                  </strong>
                </div>

                <button
                  type="button"
                  className="btn-builder-next"
                  style={{ width: 'auto', padding: '10px 24px' }}
                  onClick={() => {
                    handleAddProduct(detailProduct);
                    setDetailProduct(null);
                  }}
                >
                  <i className="fa-solid fa-plus"></i> Add into Hamper
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS CONFIRMATION MODAL */}
      {showSuccessModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(43,0,8,0.7)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10001,
            padding: '20px'
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              maxWidth: '480px',
              width: '100%',
              textAlign: 'center',
              padding: '36px 28px',
              boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
              border: '2px solid #c5a059'
            }}
          >
            <div style={{
              width: '70px',
              height: '70px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #c5a059, #800020)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              margin: '0 auto 16px auto',
              boxShadow: '0 8px 20px rgba(128,0,32,0.3)'
            }}>
              🎁
            </div>

            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#c5a059', fontWeight: '800' }}>
              ROYAL CREATION COMPLETED
            </span>
            <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: '24px', color: '#800020', margin: '6px 0 10px 0' }}>
              Your Custom Hamper is Ready!
            </h2>
            <p style={{ fontSize: '13.5px', color: '#4b5563', lineHeight: '1.5', margin: '0 0 24px 0' }}>
              Your bespoke <strong>{selectedBox?.name || 'Luxury Hamper'}</strong> with <strong>{totalItemsCount} treasures</strong> and personalized handwritten card has been placed into your shopping bag.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link
                to="/cart"
                className="btn-builder-next"
                style={{ textDecoration: 'none', justifyContent: 'center' }}
              >
                <i className="fa-solid fa-bag-shopping"></i> View in Shopping Bag ({cart.count})
              </Link>

              <Link
                to="/checkout"
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  background: '#c5a059',
                  color: '#1a0208',
                  fontWeight: '700',
                  fontSize: '13.5px',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <i className="fa-solid fa-shield-check"></i> Proceed Directly to Checkout
              </Link>

              <button
                type="button"
                className="btn-builder-back"
                onClick={() => {
                  setShowSuccessModal(false);
                  setSelectedProducts([]);
                  setCurrentStep(1);
                  navigate('/custom-hamper');
                }}
              >
                Build Another Custom Hamper
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM CHOCOLATE REQUEST MODAL */}
      {showCustomChocModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px'
          }}
          onClick={() => setShowCustomChocModal(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '480px',
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              background: 'linear-gradient(135deg, #2b0008, #550015)',
              padding: '20px 24px',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>🍫</span>
                <div>
                  <h3 style={{ margin: 0, fontFamily: 'Cinzel, serif', fontSize: '18px', color: '#c5a059' }}>
                    Request Custom Chocolate
                  </h3>
                  <span style={{ fontSize: '11px', color: '#d1d5db' }}>
                    Add your favorite chocolates or brand into your hamper
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomChocModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  fontSize: '20px',
                  cursor: 'pointer'
                }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddCustomChocolate} style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                  Chocolate Brand / Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ferrero Rocher 16 Pieces / Lindt Swiss Dark 85% / Cadbury Silk"
                  value={customChocForm.name}
                  onChange={(e) => setCustomChocForm({ ...customChocForm, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '13.5px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                  {['Ferrero Rocher (16 Pcs)', 'Lindt Excellence Dark', 'Cadbury Dairy Milk Silk', 'Artisan Belgian Truffles', 'Patchi Luxury Box'].map(suggestion => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setCustomChocForm({ ...customChocForm, name: suggestion })}
                      style={{
                        fontSize: '11px',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: '#f8f4ed',
                        border: '1px solid #e8e2d8',
                        color: '#800020',
                        cursor: 'pointer'
                      }}
                    >
                      + {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                  Flavor / Notes / Specific Instructions
                </label>
                <textarea
                  rows="3"
                  placeholder="e.g. Eggless only, dark chocolate preference, tie golden ribbon around box, etc."
                  value={customChocForm.notes}
                  onChange={(e) => setCustomChocForm({ ...customChocForm, notes: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                ></textarea>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                  Procurement / Item Value (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={customChocForm.price}
                  onChange={(e) => setCustomChocForm({ ...customChocForm, price: Number(e.target.value) || 0 })}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '13.5px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <span style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginTop: '4px' }}>
                  Our concierge team will procure authentic sealed packs fresh for your hamper.
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn-builder-back"
                  style={{ width: 'auto', padding: '10px 20px' }}
                  onClick={() => setShowCustomChocModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-builder-next"
                  style={{ width: 'auto', padding: '10px 24px' }}
                >
                  <i className="fa-solid fa-plus"></i> Add into Hamper
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2-SECOND NOTIFICATION OF ADDING CHOCOLATE IN HAMPER */}
      {showChoc2sNotification && (
        <div
          className="hamper-choc-notification-2s"
          style={{
            position: 'fixed',
            bottom: '30px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 99999,
            background: 'linear-gradient(135deg, #1f0107, #42020e)',
            border: '2px solid #c5a059',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
            borderRadius: '50px',
            padding: '12px 24px',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            animation: 'fadeInScale 0.25s ease-out',
            maxWidth: '92vw'
          }}
        >
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            background: 'rgba(197,160,89,0.25)',
            border: '1px solid #c5a059',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            flexShrink: 0
          }}>
            🍫
          </div>
          <div style={{ lineHeight: '1.3' }}>
            <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#f5e6cb' }}>
              {addedItemForChocNotif?.category === 'chocolates' || addedItemForChocNotif?.isChocolate
                ? `🍫 Added "${addedItemForChocNotif.name}" to Hamper!`
                : `✨ Added "${addedItemForChocNotif?.name}"! You can also add chocolates in the hamper.`}
            </div>
            <div style={{ fontSize: '11.5px', color: '#cbd5e1' }}>
              {addedItemForChocNotif?.category === 'chocolates' || addedItemForChocNotif?.isChocolate
                ? 'Artisanal sweet treat added to your luxury hamper.'
                : 'Pair with gourmet chocolates or custom brands (100% optional).'}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setActiveCategory('chocolates');
              setShowChoc2sNotification(false);
            }}
            style={{
              background: '#c5a059',
              color: '#2b0008',
              border: 'none',
              borderRadius: '20px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 8px rgba(197,160,89,0.4)'
            }}
          >
            Add Chocolates 🍫
          </button>
          <button
            type="button"
            onClick={() => setShowChoc2sNotification(false)}
            style={{
              background: 'none',
              border: 'none',
              color: '#cbd5e1',
              fontSize: '16px',
              cursor: 'pointer',
              padding: '0 4px',
              lineHeight: 1
            }}
          >
            &times;
          </button>
        </div>
      )}
    </div>
  );
}
