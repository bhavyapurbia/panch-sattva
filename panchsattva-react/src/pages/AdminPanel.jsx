import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore, getValidImageUrl } from '../store';
import '../styles/admin.css';
import { productsAPI, adminAPI, couponsAPI, ordersAPI, uploadAPI, categoriesAPI, hamperAPI } from '../api';
import toast from 'react-hot-toast';
import AdminLogin from '../components/AdminLogin';

export default function AdminPanel() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  // Active Tab
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(typeof window !== 'undefined' ? window.innerWidth > 992 : true);

  const handleNavClick = (tab) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined' && window.innerWidth <= 992) {
      setSidebarOpen(false);
    }
  };
  // Data State from backend
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [offers, setOffers] = useState(() => {
    try {
      const saved = localStorage.getItem('panch_offers');
      return saved ? JSON.parse(saved) : [
        {
          id: 'OFFER-1',
          badge: 'FESTIVE SALE',
          title: 'Flat 10% OFF Sitewide',
          description: 'Use code PANCH10 on orders above ₹999 for instant savings.',
          couponCode: 'PANCH10',
          active: true
        },
        {
          id: 'OFFER-2',
          badge: 'NEW USER',
          title: 'Welcome Luxury Privileges',
          description: 'Flat ₹200 OFF on your first royal purchase with code WELCOME200.',
          couponCode: 'WELCOME200',
          active: true
        }
      ];
    } catch {
      return [];
    }
  });
  const [customers, setCustomers] = useState([]);
  const [serverStats, setServerStats] = useState({
    totalRevenue: 0, totalOrders: 0, pendingOrders: 0, totalProducts: 0, totalUsers: 0
  });

  // Filters & Search
  const [productSearch, setProductSearch] = useState('');
  const [productCategory, setProductCategory] = useState('all');
  const [productSort, setProductSort] = useState('newest');

  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatus, setOrderStatus] = useState('all');

  const [customerSearch, setCustomerSearch] = useState('');
  const [customerGender, setCustomerGender] = useState('all');

  // Coupon Test Tool
  const [testCouponCode, setTestCouponCode] = useState('');
  const [testCartAmount, setTestCartAmount] = useState(1999);
  const [testResult, setTestResult] = useState(null);
  const [loadingTest, setLoadingTest] = useState(false);

  // Marquee config (stored in localStorage)
  const [marqueeConfig, setMarqueeConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('panch_marquee');
      return saved ? JSON.parse(saved) : {
        enabled: true,
        text: '✨ Exclusive Privilege: Flat 10% OFF on Handcrafted Luxury Jewellery with code PANCH10 • Free Pan-India Insured Express Shipping on Orders Above ₹999 • Certified 100% Authentic ✨',
        speed: 7,
        bgColor: '#2b0008',
        textColor: '#f8f4ed',
        pauseOnHover: true
      };
    } catch (e) {
      return { enabled: true, text: '', speed: 7, bgColor: '#2b0008', textColor: '#f8f4ed', pauseOnHover: true };
    }
  });

  // Store & Admin Config
  const [storeConfig, setStoreConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('panch_admin_config');
      return saved ? JSON.parse(saved) : {
        storeName: 'PANCH SATTVA',
        razorpayKey: 'rzp_test_YOUR_KEY_ID_HERE',
        storeMobile: '6375247046',
        storeEmail: 'support@panchsattva.com',
        adminEmail: 'admin@panchsattva.com',
        adminPassword: '••••••••'
      };
    } catch (e) {
      return {
        storeName: 'PANCH SATTVA',
        razorpayKey: '',
        storeMobile: '6375247046',
        storeEmail: 'support@panchsattva.com',
        adminEmail: 'admin@panchsattva.com',
        adminPassword: ''
      };
    }
  });

  // Modals
  const [modalState, setModalState] = useState({
    product: false,
    category: false,
    price: false,
    stock: false,
    coupon: false,
    offer: false,
    order: false,
    customer: false,
    hamperBox: false,
    hamperChocolate: false
  });

  // Selected item for modals
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingPriceProd, setEditingPriceProd] = useState(null);
  const [newPriceVal, setNewPriceVal] = useState('');
  const [editingStockProd, setEditingStockProd] = useState(null);
  const [newStockVal, setNewStockVal] = useState('');
  const [viewingOrder, setViewingOrder] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Hamper state
  const [hamperBoxes, setHamperBoxes] = useState([]);
  const [hamperChocolates, setHamperChocolates] = useState([]);
  const [editingHamperBox, setEditingHamperBox] = useState(null);
  const [editingHamperChocolate, setEditingHamperChocolate] = useState(null);

  // Forms
  const [productForm, setProductForm] = useState({
    name: '',
    category: 'ring',
    badge: 'NEW',
    price: '',
    mrp: '',
    stock: 50,
    image: '',
    description: '',
    hasDesignVariants: false,
    variantType: 'abcd',
    customVariantsText: 'Design A, Design B, Design C, Design D'
  });

  const [hamperBoxForm, setHamperBoxForm] = useState({
    name: '',
    price: '',
    mrp: '',
    capacity: 4,
    color: 'Deep Royal Maroon',
    style: 'Trunk Box with Vintage Brass Clasp',
    dimensions: '10" × 8" × 4.5"',
    image: '/images/psimg/gift1.png',
    badge: 'BESTSELLER',
    description: '',
    isActive: true
  });

  const [hamperChocolateForm, setHamperChocolateForm] = useState({
    name: '',
    price: '',
    mrp: '',
    pieces: '4 Pcs Artisanal Truffles',
    image: '/images/psimg/gift2.jpeg',
    badge: 'HANDCRAFTED',
    description: '',
    isActive: true
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    slug: '',
    description: '',
    icon: 'fa-solid fa-gem',
    image: '',
    isActive: true
  });

  const [couponForm, setCouponForm] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: '',
    minSpend: 999,
    expiryDate: ''
  });

  const [offerForm, setOfferForm] = useState({
    badge: 'FESTIVE SALE',
    title: '',
    description: '',
    couponCode: '',
    active: true
  });

  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    mobile: '',
    gender: 'Female',
    address: ''
  });

  // Load Initial Data from backend
  const refreshData = async () => {
    try {
      // Load stats
      adminAPI.getStats().then(res => {
        if (res.data) setServerStats({
          totalRevenue: res.data.totalRevenue || 0,
          totalOrders: res.data.totalOrders || 0,
          pendingOrders: res.data.pendingOrders || 0,
          totalProducts: res.data.totalProducts || 0,
          totalUsers: res.data.totalUsers || 0
        });
      }).catch(() => {});

      // Load products
      adminAPI.getProducts({ limit: 200 }).then(res => {
        if (res.data && res.data.products) setProducts(res.data.products);
      }).catch(() => {
        productsAPI.getAll({ limit: 200 }).then(res => {
          if (res.data && res.data.products) setProducts(res.data.products);
        }).catch(() => {});
      });

      // Load orders
      adminAPI.getOrders({ limit: 100 }).then(res => {
        if (res.data && res.data.orders) setOrders(res.data.orders);
      }).catch(() => {});

      // Load coupons
      adminAPI.getCoupons().then(res => {
        if (res.data && Array.isArray(res.data)) setCoupons(res.data);
      }).catch(() => {
        couponsAPI.getActive().then(res => {
          if (res.data && Array.isArray(res.data)) setCoupons(res.data);
        }).catch(() => {});
      });

      // Load categories
      categoriesAPI.getAll().then(res => {
        if (res.data && Array.isArray(res.data)) setCategories(res.data);
      }).catch(() => {});

      // Load users
      adminAPI.getUsers({ limit: 200 }).then(res => {
        if (res.data && res.data.users) setCustomers(res.data.users);
      }).catch(() => {});

      // Load hamper boxes
      hamperAPI.getBoxes().then(res => {
        if (res.data && res.data.boxes) setHamperBoxes(res.data.boxes);
      }).catch(() => {});

      // Load hamper chocolates
      hamperAPI.getChocolates().then(res => {
        if (res.data && res.data.chocolates) setHamperChocolates(res.data.chocolates);
      }).catch(() => {});
    } catch (e) {
      console.error('Error loading admin data', e);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleAdminLogout = () => {
    logout();
    navigate('/');
    toast.success('Logged out of Admin Portal.');
  };

  // --- STATS CALCULATIONS ---
  const stats = useMemo(() => {
    const totalRev = orders.reduce((sum, o) => sum + (Number(o.totalAmount || o.total) || 0), 0);
    const pendingCount = orders.filter(o => !['delivered', 'cancelled'].includes((o.orderStatus || o.status || '').toLowerCase())).length;
    return {
      revenue: serverStats.totalRevenue || totalRev,
      ordersCount: serverStats.totalOrders || orders.length,
      pendingOrders: serverStats.pendingOrders !== undefined ? serverStats.pendingOrders : pendingCount,
      productsCount: serverStats.totalProducts || products.length,
      customersCount: serverStats.totalUsers || customers.length
    };
  }, [orders, products, customers, serverStats]);

  // --- FILTERED PRODUCTS ---
  const filteredProducts = useMemo(() => {
    return products
      .filter(p => {
        const catMatch = productCategory === 'all' || p.category?.toLowerCase() === productCategory;
        const q = productSearch.toLowerCase().trim();
        const searchMatch = !q || p.name?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q) || (p.id && p.id.toLowerCase().includes(q));
        return catMatch && searchMatch;
      })
      .sort((a, b) => {
        if (productSort === 'price-asc') return Number(a.price) - Number(b.price);
        if (productSort === 'price-desc') return Number(b.price) - Number(a.price);
        if (productSort === 'name') return a.name.localeCompare(b.name);
        return 0; // newest
      });
  }, [products, productCategory, productSearch, productSort]);

  // --- FILTERED ORDERS ---
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const currentStatus = o.orderStatus || o.status || '';
      const statusMatch = orderStatus === 'all' || currentStatus.toLowerCase() === orderStatus.toLowerCase();
      const q = orderSearch.toLowerCase().trim();
      const searchMatch =
        !q ||
        o.orderId?.toLowerCase().includes(q) ||
        o.shippingAddress?.fullName?.toLowerCase().includes(q) ||
        o.shippingAddress?.name?.toLowerCase().includes(q) ||
        o.customer?.name?.toLowerCase().includes(q) ||
        o.shippingAddress?.phone?.includes(q) ||
        o.customer?.mobile?.includes(q) ||
        o.utr?.toLowerCase().includes(q);
      return statusMatch && searchMatch;
    });
  }, [orders, orderStatus, orderSearch]);

  // --- FILTERED CUSTOMERS ---
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const genderMatch = customerGender === 'all' || (c.gender || '').toLowerCase() === customerGender.toLowerCase();
      const q = customerSearch.toLowerCase().trim();
      const searchMatch =
        !q ||
        c.name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        (c.phone || c.mobile || '').includes(q);
      return genderMatch && searchMatch;
    });
  }, [customers, customerGender, customerSearch]);

  // --- ACTIONS: PRODUCT & CLOUDINARY UPLOAD ---
  const fileInputRef = useRef(null);

  const SAMPLE_PRESETS = [
    { label: 'Diamond Ring', url: 'images/psimg/ring1.jpg', cat: 'ring' },
    { label: 'Gold Ring', url: 'images/psimg/ring2.jpeg', cat: 'ring' },
    { label: 'Royal Necklace', url: 'images/psimg/nackless.jpg', cat: 'necklace' },
    { label: 'Traditional Bangles', url: 'images/psimg/bangle1.jpg', cat: 'bangle' },
    { label: 'Luxury Earrings', url: 'images/psimg/earrings1.jpg', cat: 'earring' },
    { label: 'Gift Hamper', url: 'images/psimg/gift1.png', cat: 'gift' },
    { label: 'Jewellery Jar', url: 'images/psimg/gift 4.jpeg', cat: 'gift' }
  ];

  const QUICK_COUPONS = [
    { code: 'PANCH10', discountType: 'percentage', discountValue: 10, minSpend: 999, expiryDate: '2028-12-31' },
    { code: 'ROYAL500', discountType: 'flat', discountValue: 500, minSpend: 2499, expiryDate: '2028-12-31' },
    { code: 'FESTIVE25', discountType: 'percentage', discountValue: 25, minSpend: 1999, expiryDate: '2028-12-31' },
    { code: 'FIRSTBUY', discountType: 'percentage', discountValue: 15, minSpend: 499, expiryDate: '2028-12-31' }
  ];

  const handleImageFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (JPG, PNG, WEBP)');
      return;
    }

    setUploadingImage(true);
    const toastId = toast.loading('Uploading product image to Cloudinary...');

    try {
      const res = await uploadAPI.uploadImage(file);
      if (res.data && res.data.url) {
        setProductForm(prev => ({ ...prev, image: res.data.url }));
        toast.success('Image successfully uploaded to Cloudinary!', { id: toastId });
      } else {
        toast.error('Failed to get Cloudinary image URL', { id: toastId });
      }
    } catch (err) {
      console.warn('Cloudinary upload error, reading directly from device:', err);
      // Seamless local FileReader fallback
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductForm(prev => ({ ...prev, image: reader.result }));
        toast.success('Image loaded directly from your device!', { id: toastId });
      };
      reader.onerror = () => {
        toast.error('Could not read image file.', { id: toastId });
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingImage(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleQuickAddCoupon = async (preset) => {
    const existing = coupons.find(c => c.code.toUpperCase() === preset.code.toUpperCase());
    if (existing) {
      toast.error(`Coupon ${preset.code} already exists!`);
      return;
    }
    try {
      await adminAPI.createCoupon({
        code: preset.code,
        discountType: preset.discountType === 'flat' ? 'fixed' : preset.discountType,
        discountValue: Number(preset.discountValue),
        minOrderAmount: Number(preset.minSpend) || 0,
        expiresAt: preset.expiryDate || '2028-12-31',
        description: `${preset.discountType === 'flat' ? '₹' + preset.discountValue : preset.discountValue + '%'} OFF coupon for ${preset.code}`
      });
      toast.success(`Coupon ${preset.code} created and activated!`);
      refreshData();
    } catch (err) {
      toast.error('Failed to create coupon: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      category: categories[0]?.slug || 'ring',
      badge: 'NEW',
      price: '',
      mrp: '',
      stock: 50,
      image: '',
      description: '',
      hasDesignVariants: false,
      variantType: 'abcd',
      customVariantsText: 'Design A, Design B, Design C, Design D'
    });
    setModalState(prev => ({ ...prev, product: true }));
  };

  const handleEditProduct = (prod) => {
    setEditingProduct(prod);
    let variantsText = 'Design A, Design B, Design C, Design D';
    if (Array.isArray(prod.variantOptions) && prod.variantOptions.length > 0) {
      variantsText = prod.variantOptions.join(', ');
    }
    setProductForm({
      name: prod.name,
      category: prod.category || 'ring',
      badge: prod.badge || '',
      price: prod.price,
      mrp: prod.mrp || Math.round(prod.price * 1.3),
      stock: prod.stock !== undefined ? prod.stock : 50,
      image: prod.image,
      description: prod.description || '',
      hasDesignVariants: Boolean(prod.hasDesignVariants),
      variantType: prod.variantType || 'abcd',
      customVariantsText: variantsText
    });
    setModalState(prev => ({ ...prev, product: true }));
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price) {
      toast.error('Product Name and Price are required.');
      return;
    }

    const priceNum = Math.max(0, Number(productForm.price) || 0);
    const mrpNum = Math.max(priceNum, Number(productForm.mrp) || Math.round(priceNum * 1.3));
    const stockNum = Math.max(0, parseInt(productForm.stock, 10) || 0);
    const categoryVal = (productForm.category || 'ring').toLowerCase().trim();
    const imageVal = productForm.image || editingProduct?.image || '/images/psimg/ring1.jpg';
    const descVal = (productForm.description && productForm.description.trim()) ||
      `${productForm.name.trim()} - Handcrafted luxury jewellery by Panch Sattva.`;

    let variantOptionsArr = [];
    if (productForm.hasDesignVariants) {
      if (productForm.customVariantsText && productForm.customVariantsText.trim()) {
        variantOptionsArr = productForm.customVariantsText
          .split(',')
          .map(v => v.trim())
          .filter(Boolean);
      }
      if (variantOptionsArr.length === 0) {
        if (productForm.variantType === '1234') {
          variantOptionsArr = ['Option 1', 'Option 2', 'Option 3', 'Option 4'];
        } else {
          variantOptionsArr = ['Design A', 'Design B', 'Design C', 'Design D'];
        }
      }
    }

    const payload = {
      name: productForm.name.trim(),
      category: categoryVal,
      badge: productForm.badge || '',
      price: priceNum,
      mrp: mrpNum,
      stock: stockNum,
      image: imageVal,
      description: descVal,
      hasDesignVariants: Boolean(productForm.hasDesignVariants),
      variantType: productForm.variantType || 'abcd',
      variantOptions: variantOptionsArr
    };

    try {
      if (editingProduct) {
        const prodId = editingProduct._id || editingProduct.id;
        const res = await productsAPI.update(prodId, payload);
        toast.success(`"${productForm.name}" updated successfully in database!`);
        if (res.data) {
          setProducts(prev => prev.map(p => (p._id === prodId || p.id === prodId) ? { ...p, ...res.data } : p));
        }
      } else {
        const res = await productsAPI.create(payload);
        toast.success('New product created and saved to database!');
        if (res.data) setProducts(prev => [res.data, ...prev]);
      }
      setModalState(prev => ({ ...prev, product: false }));
      refreshData();
    } catch (err) {
      toast.error('Failed to save product: ' + (err.response?.data?.message || err.message));
    }
  };

  // --- ACTIONS: CATEGORY MANAGEMENT ---
  const handleOpenAddCategory = () => {
    setCategoryForm({
      name: '',
      slug: '',
      description: '',
      icon: 'fa-solid fa-gem',
      image: '',
      isActive: true
    });
    setModalState(prev => ({ ...prev, category: true }));
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      toast.error('Category name is required');
      return;
    }
    try {
      const slugVal = categoryForm.slug?.trim() || categoryForm.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
      const payload = {
        name: categoryForm.name.trim(),
        slug: slugVal,
        description: categoryForm.description?.trim() || '',
        icon: categoryForm.icon?.trim() || 'fa-solid fa-gem',
        image: categoryForm.image?.trim() || '',
        isActive: categoryForm.isActive
      };
      await categoriesAPI.create(payload);
      toast.success(`Category "${payload.name}" created successfully!`);
      setModalState(prev => ({ ...prev, category: false }));
      refreshData();
    } catch (err) {
      toast.error('Failed to create category: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteCategory = async (cat) => {
    const id = cat._id || cat.id;
    if (!window.confirm(`Are you sure you want to delete category "${cat.name}"? Products in this category won't be deleted, but the category filter will be removed.`)) {
      return;
    }
    try {
      await categoriesAPI.delete(id);
      toast.success(`Category "${cat.name}" deleted!`);
      refreshData();
    } catch (err) {
      toast.error('Failed to delete category: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (!id) {
      toast.error('Product ID missing.');
      return;
    }
    if (window.confirm(`Are you sure you want to delete "${name}" from the store catalog?`)) {
      try {
        await productsAPI.delete(id);
        toast.success(`"${name}" deleted from database.`);
        setProducts(prev => prev.filter(p => p._id !== id && p.id !== id));
        refreshData();
      } catch (err) {
        toast.error('Failed to delete product: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleOpenPriceModal = (prod) => {
    setEditingPriceProd(prod);
    setNewPriceVal(prod.price);
    setModalState(prev => ({ ...prev, price: true }));
  };

  const handleSaveQuickPrice = async (e) => {
    e.preventDefault();
    if (!editingPriceProd || !newPriceVal) return;
    const prodId = editingPriceProd._id || editingPriceProd.id;
    try {
      await productsAPI.update(prodId, { price: Number(newPriceVal) });
      toast.success(`Price updated to ₹${Number(newPriceVal).toLocaleString('en-IN')} in database!`);
      setProducts(prev => prev.map(p => (p._id === prodId || p.id === prodId) ? { ...p, price: Number(newPriceVal) } : p));
      setModalState(prev => ({ ...prev, price: false }));
      refreshData();
    } catch (err) {
      toast.error('Failed to update price');
    }
  };

  const handleOpenStockModal = (prod) => {
    setEditingStockProd(prod);
    setNewStockVal(prod.stock !== undefined ? prod.stock : 15);
    setModalState(prev => ({ ...prev, stock: true }));
  };

  const handleSaveQuickStock = async (e) => {
    e.preventDefault();
    if (!editingStockProd || newStockVal === '') return;
    const prodId = editingStockProd._id || editingStockProd.id;
    const val = Math.max(0, parseInt(newStockVal) || 0);
    try {
      await adminAPI.updateProductStock(prodId, val);
      toast.success(`Stock updated to ${val} units in database!`);
      setProducts(prev => prev.map(p => (p._id === prodId || p.id === prodId) ? { ...p, stock: val } : p));
      setModalState(prev => ({ ...prev, stock: false }));
      refreshData();
    } catch (err) {
      toast.error('Failed to update stock');
    }
  };

  // --- ACTIONS: COUPONS ---
  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    if (!couponForm.code || !couponForm.discountValue) {
      toast.error('Code and Discount Value are required.');
      return;
    }
    const cleanCode = couponForm.code.trim().toUpperCase();
    try {
      await adminAPI.createCoupon({
        code: cleanCode,
        discountType: couponForm.discountType === 'flat' ? 'fixed' : (couponForm.discountType || 'percentage'),
        discountValue: Number(couponForm.discountValue),
        minOrderAmount: Number(couponForm.minSpend) || 0,
        expiresAt: couponForm.expiryDate || '2028-12-31',
        description: couponForm.description || `${couponForm.discountType === 'flat' ? '₹' + couponForm.discountValue : couponForm.discountValue + '%'} OFF coupon for ${cleanCode}`
      });
      toast.success(`Coupon "${cleanCode}" created successfully!`);
      setCouponForm({
        code: '',
        discountType: 'percentage',
        discountValue: '',
        minSpend: 499,
        expiryDate: '2028-12-31',
        description: ''
      });
      setModalState(prev => ({ ...prev, coupon: false }));
      refreshData();
    } catch (err) {
      toast.error('Failed to create coupon: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleToggleCoupon = async (coupon) => {
    try {
      const code = typeof coupon === 'object' ? coupon.code : coupon;
      const target = typeof coupon === 'object' ? coupon : coupons.find(c => c.code === code || c._id === coupon);
      const id = target?._id || target?.code || code;
      const currentActive = target?.isActive !== false;
      await adminAPI.updateCoupon(id, { isActive: !currentActive });
      toast.success(`Coupon "${code}" ${!currentActive ? 'activated (ON)' : 'disabled (OFF)'}.`);
      setCoupons(prev => prev.map(c => (c.code === code || c._id === id) ? { ...c, isActive: !currentActive } : c));
      refreshData();
    } catch (err) {
      toast.error('Failed to update coupon status');
    }
  };

  const handleDeleteCoupon = async (coupon) => {
    const code = typeof coupon === 'object' ? coupon.code : coupon;
    const target = typeof coupon === 'object' ? coupon : coupons.find(c => c.code === code || c._id === coupon);
    const id = target?._id || target?.code || code;
    if (window.confirm(`Permanently delete coupon "${code}" from database?`)) {
      try {
        await adminAPI.deleteCoupon(id);
        toast.success(`Coupon "${code}" permanently deleted.`);
        setCoupons(prev => prev.filter(c => c._id !== id && c.code !== code));
        refreshData();
      } catch (err) {
        toast.error('Failed to delete coupon: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleTestCoupon = async () => {
    if (!testCouponCode.trim()) return;
    setLoadingTest(true);
    try {
      const res = await couponsAPI.validate(testCouponCode.trim().toUpperCase(), Number(testCartAmount));
      setTestResult(res.data);
    } catch (err) {
      setTestResult({ valid: false, message: err.response?.data?.message || 'Invalid coupon' });
    } finally {
      setLoadingTest(false);
    }
  };

  // --- ACTIONS: TOP MARQUEE BANNER TAG ---
  const handleToggleMarquee = () => {
    const updated = { ...marqueeConfig, enabled: !marqueeConfig.enabled };
    setMarqueeConfig(updated);
    try {
      localStorage.setItem('panch_marquee', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('panch_marquee_updated', { detail: updated }));
    } catch (e) {}
    toast.success(`Top Marquee Tag is now ${updated.enabled ? 'ACTIVE (ON)' : 'DISABLED (OFF)'}`);
  };

  const handleSaveMarquee = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!marqueeConfig.text || !marqueeConfig.text.trim()) {
      toast.error('Marquee text cannot be empty.');
      return;
    }
    try {
      localStorage.setItem('panch_marquee', JSON.stringify(marqueeConfig));
      window.dispatchEvent(new CustomEvent('panch_marquee_updated', { detail: marqueeConfig }));
    } catch (e) {}
    toast.success('Marquee announcement tag saved & updated live!');
  };

  const handleMarqueeTextPreset = (text) => {
    setMarqueeConfig(prev => ({ ...prev, text }));
    toast.success('Preset loaded. Click "Save & Publish Marquee Tag" to apply.');
  };

  // --- ACTIONS: OFFERS ---
  const handleSaveOffer = (e) => {
    e.preventDefault();
    if (!offerForm.title || !offerForm.title.trim()) {
      toast.error('Deal headline is required.');
      return;
    }
    const newOffer = {
      id: 'OFFER-' + Date.now(),
      badge: (offerForm.badge && offerForm.badge.trim()) || 'SPECIAL DEAL',
      title: offerForm.title.trim(),
      description: (offerForm.description && offerForm.description.trim()) || '',
      couponCode: (offerForm.couponCode && offerForm.couponCode.trim().toUpperCase()) || '',
      active: true
    };
    const updated = [newOffer, ...offers];
    setOffers(updated);
    try {
      localStorage.setItem('panch_offers', JSON.stringify(updated));
    } catch {}
    toast.success('Promotional deal created & saved!');
    setOfferForm({
      badge: 'FESTIVE SALE',
      title: '',
      description: '',
      couponCode: '',
      active: true
    });
    setModalState(prev => ({ ...prev, offer: false }));
  };

  const handleToggleOffer = (id) => {
    const updated = offers.map(off => off.id === id ? { ...off, active: !off.active } : off);
    setOffers(updated);
    try {
      localStorage.setItem('panch_offers', JSON.stringify(updated));
    } catch {}
    toast.success('Deal status updated.');
  };

  const handleDeleteOffer = (id) => {
    if (window.confirm('Delete this promotional deal?')) {
      const updated = offers.filter(off => off.id !== id);
      setOffers(updated);
      try {
        localStorage.setItem('panch_offers', JSON.stringify(updated));
      } catch {}
      toast.success('Offer removed.');
    }
  };

  // --- ACTIONS: HAMPER BOXES ---
  const handleOpenAddHamperBox = () => {
    setEditingHamperBox(null);
    setHamperBoxForm({
      name: '',
      price: '',
      mrp: '',
      capacity: 4,
      color: 'Deep Royal Maroon',
      style: 'Trunk Box with Vintage Brass Clasp',
      dimensions: '10" × 8" × 4.5"',
      image: '/images/psimg/gift1.png',
      badge: 'BESTSELLER',
      description: '',
      isActive: true
    });
    setModalState(prev => ({ ...prev, hamperBox: true }));
  };

  const handleOpenEditHamperBox = (box) => {
    setEditingHamperBox(box);
    setHamperBoxForm({
      name: box.name || '',
      price: box.price || '',
      mrp: box.mrp || '',
      capacity: box.capacity || 4,
      color: box.color || '',
      style: box.style || '',
      dimensions: box.dimensions || '',
      image: box.image || '/images/psimg/gift1.png',
      badge: box.badge || '',
      description: box.description || '',
      isActive: box.isActive !== false
    });
    setModalState(prev => ({ ...prev, hamperBox: true }));
  };

  const handleSaveHamperBox = async (e) => {
    e.preventDefault();
    if (!hamperBoxForm.name || !hamperBoxForm.price) {
      toast.error('Box name and price are required.');
      return;
    }
    try {
      const payload = {
        name: hamperBoxForm.name,
        price: Number(hamperBoxForm.price) || 0,
        mrp: Number(hamperBoxForm.mrp) || Number(hamperBoxForm.price) || 0,
        capacity: Number(hamperBoxForm.capacity) || 4,
        color: hamperBoxForm.color || 'Royal Maroon',
        style: hamperBoxForm.style || 'Luxury Trunk Box',
        dimensions: hamperBoxForm.dimensions || '10" × 8" × 4"',
        image: hamperBoxForm.image || '/images/psimg/gift1.png',
        badge: hamperBoxForm.badge || '',
        description: hamperBoxForm.description || '',
        isActive: hamperBoxForm.isActive !== false
      };

      if (editingHamperBox) {
        const id = editingHamperBox._id || editingHamperBox.id;
        await hamperAPI.updateBox(id, payload);
        toast.success(`Hamper box "${payload.name}" updated!`);
      } else {
        await hamperAPI.createBox(payload);
        toast.success(`Hamper box "${payload.name}" added to catalog!`);
      }
      setModalState(prev => ({ ...prev, hamperBox: false }));
      refreshData();
    } catch (err) {
      toast.error('Failed to save hamper box: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteHamperBox = async (box) => {
    const id = box._id || box.id;
    if (window.confirm(`Delete hamper box "${box.name}"?`)) {
      try {
        await hamperAPI.deleteBox(id);
        toast.success(`Hamper box "${box.name}" deleted.`);
        setHamperBoxes(prev => prev.filter(b => (b._id || b.id) !== id));
        refreshData();
      } catch (err) {
        toast.error('Failed to delete hamper box: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // --- ACTIONS: HAMPER CHOCOLATES ---
  const handleOpenAddChocolate = () => {
    setEditingHamperChocolate(null);
    setHamperChocolateForm({
      name: '',
      price: '',
      mrp: '',
      pieces: '4 Pcs Artisanal Truffles',
      image: '/images/psimg/gift2.jpeg',
      badge: 'HANDCRAFTED',
      description: '',
      isActive: true
    });
    setModalState(prev => ({ ...prev, hamperChocolate: true }));
  };

  const handleOpenEditChocolate = (choc) => {
    setEditingHamperChocolate(choc);
    setHamperChocolateForm({
      name: choc.name || '',
      price: choc.price || '',
      mrp: choc.mrp || '',
      pieces: choc.pieces || '',
      image: choc.image || '/images/psimg/gift2.jpeg',
      badge: choc.badge || '',
      description: choc.description || '',
      isActive: choc.isActive !== false
    });
    setModalState(prev => ({ ...prev, hamperChocolate: true }));
  };

  const handleSaveChocolate = async (e) => {
    e.preventDefault();
    if (!hamperChocolateForm.name || !hamperChocolateForm.price) {
      toast.error('Chocolate name and price are required.');
      return;
    }
    try {
      const payload = {
        name: hamperChocolateForm.name,
        price: Number(hamperChocolateForm.price) || 0,
        mrp: Number(hamperChocolateForm.mrp) || Number(hamperChocolateForm.price) || 0,
        pieces: hamperChocolateForm.pieces || '',
        image: hamperChocolateForm.image || '/images/psimg/gift2.jpeg',
        badge: hamperChocolateForm.badge || '',
        description: hamperChocolateForm.description || '',
        isActive: hamperChocolateForm.isActive !== false
      };

      if (editingHamperChocolate) {
        const id = editingHamperChocolate._id || editingHamperChocolate.id;
        await hamperAPI.updateChocolate(id, payload);
        toast.success(`Chocolate "${payload.name}" updated!`);
      } else {
        await hamperAPI.createChocolate(payload);
        toast.success(`Chocolate "${payload.name}" added to hamper treats!`);
      }
      setModalState(prev => ({ ...prev, hamperChocolate: false }));
      refreshData();
    } catch (err) {
      toast.error('Failed to save chocolate: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteChocolate = async (choc) => {
    const id = choc._id || choc.id;
    if (window.confirm(`Delete chocolate "${choc.name}"?`)) {
      try {
        await hamperAPI.deleteChocolate(id);
        toast.success(`Chocolate "${choc.name}" deleted.`);
        setHamperChocolates(prev => prev.filter(c => (c._id || c.id) !== id));
        refreshData();
      } catch (err) {
        toast.error('Failed to delete chocolate: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // --- ACTIONS: ORDERS ---
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await adminAPI.updateOrder(orderId, { orderStatus: newStatus });
      toast.success(`Order ${orderId} status updated to: ${newStatus}`);
      refreshData();
    } catch (err) {
      toast.error('Failed to update order status');
    }
  };

  const handleOpenOrderDetail = (order) => {
    setViewingOrder(order);
    setModalState(prev => ({ ...prev, order: true }));
  };

  const handleWhatsAppCustomer = (order) => {
    if (!order) return;
    const phone = order.shippingAddress?.phone || order.shippingAddress?.mobile || order.customer?.mobile || '6375247046';
    const name = order.shippingAddress?.fullName || order.shippingAddress?.name || order.customer?.name || 'Customer';
    const oid = order.orderId || order._id;
    const status = order.orderStatus || order.status || 'Received';
    const total = order.totalAmount || order.total || 0;
    const msg =
      `✨ *PANCH SATTVA - LUXURY JEWELLERY*\n` +
      `Hello ${name},\n` +
      `Your order *${oid}* status is: *${status}*.\n` +
      `Total: ₹${Number(total).toLocaleString('en-IN')}.\n` +
      `Thank you for shopping with PANCH SATTVA!`;
    window.open(`https://api.whatsapp.com/send?phone=91${phone}&text=${encodeURIComponent(msg)}`, '_blank');
  };

  // --- ACTIONS: CUSTOMERS ---
  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    if (!customerForm.name || !customerForm.email || !customerForm.mobile) {
      toast.error('Name, Email, and Mobile are required.');
      return;
    }
    try {
      toast.success('Customer registered successfully!');
      setModalState(prev => ({ ...prev, customer: false }));
      refreshData();
    } catch (err) {
      toast.error('Failed to save customer');
    }
  };

  const handleDeleteCustomer = async (id, name = 'this customer') => {
    if (!id) {
      toast.error('User identifier missing');
      return;
    }
    if (window.confirm(`Are you sure you want to permanently delete "${name}" from the database?`)) {
      try {
        await adminAPI.deleteUser(id);
        toast.success(`User "${name}" permanently deleted.`);
        setCustomers(prev => prev.filter(c => c._id !== id && c.id !== id && c.email !== id));
        refreshData();
      } catch (err) {
        toast.error('Failed to delete customer: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // --- ACTIONS: SETTINGS ---
  const handleSaveSettings = (e) => {
    e.preventDefault();
    try {
      localStorage.setItem('panch_admin_config', JSON.stringify(storeConfig));
    } catch (err) {}
    toast.success('Store & Admin configuration saved!');
  };

  const handleExportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({ products, orders, coupons, customers }, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `panchsattva_backup_${Date.now()}.json`);
    dlAnchor.click();
    toast.success('Store backup downloaded.');
  };

  const handlePurgeDemo = async () => {
    if (window.confirm('Are you sure you want to clean up demo and duplicate records?')) {
      localStorage.removeItem('panch_products');
      localStorage.removeItem('PANCHSATWA_OrderHistory');
      localStorage.removeItem('panch_admin_session');
      toast.success('Cleaned up demo records! Refreshing live database...');
      await refreshData();
    }
  };

  const isAdmin = Boolean(user && (user.isAdmin || user.role === 'admin'));

  if (!isAdmin) {
    return <AdminLogin onLoginSuccess={refreshData} />;
  }

  // ==========================================================
  // VIEW 2: FULL ADMIN DASHBOARD LAYOUT
  // ==========================================================
  return (
    <div className="admin-layout" id="adminDashboardLayout" style={{ display: 'flex', position: 'relative' }}>
      {/* MOBILE BACKDROP */}
      {sidebarOpen && (
        <div
          className="admin-mobile-backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'mobile-open' : 'collapsed'}`} id="adminSidebar">
        <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src="/images/psimg/pslogo.png"
              alt="Panch Sattva Logo"
              style={{
                width: '44px',
                height: '44px',
                maxWidth: '44px',
                maxHeight: '44px',
                borderRadius: '50%',
                objectFit: 'contain',
                flexShrink: 0,
                display: 'inline-block'
              }}
            />
            <div className="sidebar-brand-text">
              <h2>PANCH <span>SATTVA</span></h2>
              <span className="admin-badge">Admin Suite</span>
            </div>
          </div>
          <button
            className="mobile-close-sidebar"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close Sidebar"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="sidebar-nav">
          <div className="nav-section-title">Overview</div>
          <ul>
            <li className="nav-item">
              <a
                className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => handleNavClick('dashboard')}
              >
                <i className="fa-solid fa-chart-pie"></i>
                <span>Dashboard</span>
              </a>
            </li>
          </ul>

          <div className="nav-section-title">Catalog & Marketing</div>
          <ul>
            <li className="nav-item">
              <a
                className={`nav-link ${activeTab === 'products' ? 'active' : ''}`}
                onClick={() => handleNavClick('products')}
              >
                <i className="fa-solid fa-gem"></i>
                <span>Products</span>
                <span className="nav-badge" id="sidebarProductCount">{products.length}</span>
              </a>
            </li>
            <li className="nav-item">
              <a
                className={`nav-link ${activeTab === 'coupons' ? 'active' : ''}`}
                onClick={() => handleNavClick('coupons')}
              >
                <i className="fa-solid fa-ticket"></i>
                <span>Offers & Coupons</span>
                <span className="nav-badge" id="sidebarCouponCount">{coupons.length}</span>
              </a>
            </li>
            <li className="nav-item">
              <a
                className={`nav-link ${activeTab === 'hampers' ? 'active' : ''}`}
                onClick={() => handleNavClick('hampers')}
              >
                <i className="fa-solid fa-gift"></i>
                <span>Custom Hampers</span>
                <span className="nav-badge" id="sidebarHamperCount" style={{ background: '#800020', color: '#fff' }}>
                  {hamperBoxes.length + hamperChocolates.length}
                </span>
              </a>
            </li>
            <li className="nav-item">
              <a
                className={`nav-link ${activeTab === 'marquee' ? 'active' : ''}`}
                onClick={() => handleNavClick('marquee')}
              >
                <i className="fa-solid fa-bullhorn"></i>
                <span>Top Marquee Tag</span>
                <span
                  className="nav-badge"
                  style={{
                    background: marqueeConfig.enabled ? '#10b981' : '#6b7280',
                    color: '#fff',
                    fontSize: '10px',
                    fontWeight: '700'
                  }}
                >
                  {marqueeConfig.enabled ? 'ON' : 'OFF'}
                </span>
              </a>
            </li>
          </ul>

          <div className="nav-section-title">Sales & Customers</div>
          <ul>
            <li className="nav-item">
              <a
                className={`nav-link ${activeTab === 'orders' ? 'active' : ''}`}
                onClick={() => handleNavClick('orders')}
              >
                <i className="fa-solid fa-box-archive"></i>
                <span>Orders Received</span>
                <span className="nav-badge" id="sidebarOrderCount">{orders.length}</span>
              </a>
            </li>
            <li className="nav-item">
              <a
                className={`nav-link ${activeTab === 'customers' ? 'active' : ''}`}
                onClick={() => handleNavClick('customers')}
              >
                <i className="fa-solid fa-users"></i>
                <span>Registered Users</span>
                <span className="nav-badge" id="sidebarCustomerCount">{customers.length}</span>
              </a>
            </li>
          </ul>

          <div className="nav-section-title">System</div>
          <ul>
            <li className="nav-item">
              <a
                className={`nav-link ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => handleNavClick('settings')}
              >
                <i className="fa-solid fa-sliders"></i>
                <span>Settings & Backup</span>
              </a>
            </li>
          </ul>
        </div>

        <div className="sidebar-footer">
          <div className="admin-user-info">
            <div className="admin-avatar">PS</div>
            <div className="admin-details">
              <p id="sidebarAdminEmail">{storeConfig.adminEmail}</p>
              <span>Store Manager</span>
            </div>
          </div>
          <button
            className="logout-icon-btn"
            id="sidebarLogoutBtn"
            title="Logout"
            onClick={handleAdminLogout}
          >
            <i className="fa-solid fa-power-off"></i>
          </button>
        </div>
      </aside>

      {/* MAIN VIEW */}
      <main className="admin-main">
        {/* TOPBAR */}
        <header className="admin-topbar">
          <div className="topbar-left">
            <button className="menu-toggle-btn" id="menuToggleBtn" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <i className="fa-solid fa-bars"></i>
            </button>
            <div className="breadcrumb-area">
              <h1 id="topbarPageTitle">
                {activeTab === 'dashboard' && 'Dashboard Overview'}
                {activeTab === 'products' && 'Product Catalog & Price Controller'}
                {activeTab === 'coupons' && 'Active Coupons & Promo Deals'}
                {activeTab === 'hampers' && 'Custom Hamper Boxes & Chocolates'}
                {activeTab === 'marquee' && 'Top Marquee Tag & Live Announcement Banner'}
                {activeTab === 'orders' && 'Customer Orders & Payments'}
                {activeTab === 'customers' && 'Registered Customers Directory'}
                {activeTab === 'settings' && 'Store Configuration & Backup'}
              </h1>
              <p id="topbarPageSub">
                {activeTab === 'dashboard' && 'Manage products, pricing, orders, and customer accounts'}
                {activeTab === 'products' && 'Add, delete, or update product prices instantly across the entire store'}
                {activeTab === 'coupons' && 'Create and manage discount promo codes and promotional offers'}
                {activeTab === 'hampers' && 'Manage keepsake hamper packaging boxes, pricing, capacities, and exclusive hamper chocolates'}
                {activeTab === 'marquee' && 'Admin can write marquee tag text as needed, set scroll speed & colors, and turn it ON or OFF'}
                {activeTab === 'orders' && 'Real-time orders, payment mode, customer shipping address & status'}
                {activeTab === 'customers' && 'Browse, search, and manage registered customer profiles'}
                {activeTab === 'settings' && 'Store details, Razorpay credentials, and JSON backup exports'}
              </p>
            </div>
          </div>

          <div className="topbar-right">
            <div className="live-store-chip">
              <span className="pulse-dot"></span>
              <span>Store Live</span>
            </div>
            <Link to="/" target="_blank" className="btn-view-store">
              <i className="fa-solid fa-arrow-up-right-from-square"></i> Visit Store
            </Link>
          </div>
        </header>

        {/* TAB CONTENTS */}
        <div className="content-wrapper">
          {/* ==============================================
               TAB 1: DASHBOARD OVERVIEW
          =============================================== */}
          {activeTab === 'dashboard' && (
            <div className="tab-pane active" id="tab-dashboard">
              {/* KPI Metric Cards */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon revenue">
                    <i className="fa-solid fa-indian-rupee-sign"></i>
                  </div>
                  <div className="stat-details">
                    <h3 id="statTotalRevenue">₹{stats.revenue.toLocaleString('en-IN')}</h3>
                    <p>Total Store Revenue</p>
                    <span className="stat-trend positive">
                      <i className="fa-solid fa-arrow-trend-up"></i> Verified Prepaid
                    </span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon orders">
                    <i className="fa-solid fa-cart-shopping"></i>
                  </div>
                  <div className="stat-details">
                    <h3 id="statTotalOrders">{stats.ordersCount}</h3>
                    <p>Orders Received</p>
                    <span className="stat-trend positive" id="statPendingOrders">
                      {stats.pendingOrders} Active / Pending
                    </span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon products">
                    <i className="fa-solid fa-gem"></i>
                  </div>
                  <div className="stat-details">
                    <h3 id="statTotalProducts">{stats.productsCount}</h3>
                    <p>Active Products</p>
                    <span className="stat-trend" id="statCategoriesCount">5 Categories</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon users">
                    <i className="fa-solid fa-users"></i>
                  </div>
                  <div className="stat-details">
                    <h3 id="statTotalCustomers">{stats.customersCount}</h3>
                    <p>Registered Customers</p>
                    <span className="stat-trend positive">Fully Searchable</span>
                  </div>
                </div>
              </div>

              {/* Quick Action Shortcuts */}
              <div className="card-panel" style={{ padding: '18px 24px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '15px', color: '#800020' }}>
                      <i className="fa-solid fa-bolt" style={{ color: '#c5a059' }}></i> Quick Manager Shortcuts
                    </h3>
                    <p style={{ fontSize: '12px', color: '#6b7280' }}>Perform common actions in one click</p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button className="btn-gold" onClick={handleOpenAddProduct}>
                      <i className="fa-solid fa-plus"></i> Add Product
                    </button>
                    <button className="btn-outline" onClick={() => setModalState(prev => ({ ...prev, coupon: true }))}>
                      <i className="fa-solid fa-ticket"></i> Create Coupon
                    </button>
                    <button className="btn-outline" onClick={() => setActiveTab('orders')}>
                      <i className="fa-solid fa-box-archive"></i> View All Orders
                    </button>
                    <button className="btn-outline" onClick={() => setActiveTab('customers')}>
                      <i className="fa-solid fa-user-group"></i> Search Customers
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent Orders Preview */}
              <div className="card-panel">
                <div className="panel-header">
                  <div>
                    <h2>Recent Orders Received</h2>
                    <p style={{ fontSize: '12.5px', color: '#6b7280' }}>Real-time customer orders with payment details</p>
                  </div>
                  <div className="panel-actions">
                    <button className="btn-outline" onClick={() => setActiveTab('orders')}>
                      View All Orders ➔
                    </button>
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Payment</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody id="dashboardRecentOrdersTableBody">
                      {orders.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#666' }}>
                            No orders received yet.
                          </td>
                        </tr>
                      ) : (
                        orders.slice(0, 5).map(o => (
                          <tr key={o.orderId}>
                            <td><strong>{o.orderId}</strong></td>
                            <td>{o.customer?.name} ({o.customer?.mobile})</td>
                            <td>{o.date}</td>
                            <td><strong>₹{Number(o.total).toLocaleString('en-IN')}</strong></td>
                            <td><span style={{ fontSize: '12px', color: '#1d4ed8' }}>{o.paymentMode || 'Online'}</span></td>
                            <td>
                              <span className={`status-badge ${o.status?.toLowerCase() || 'confirmed'}`}>
                                {o.status || 'Confirmed'}
                              </span>
                            </td>
                            <td>
                              <button className="btn-outline" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => handleOpenOrderDetail(o)}>
                                View
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==============================================
               TAB 2: PRODUCTS CATALOG & PRICE CONTROLLER
          =============================================== */}
          {activeTab === 'products' && (
            <div className="tab-pane active" id="tab-products">
              <div className="card-panel">
                <div className="panel-header">
                  <div>
                    <h2>Product Catalog & Price Controller</h2>
                    <p style={{ fontSize: '12.5px', color: '#6b7280' }}>
                      Add, delete, or update product prices instantly across the entire store.
                    </p>
                  </div>
                  <div className="panel-actions">
                    <button className="btn-gold" id="btnOpenAddProductModal" onClick={handleOpenAddProduct}>
                      <i className="fa-solid fa-plus"></i> Add New Product
                    </button>
                  </div>
                </div>

                {/* Dynamic Store Category Manager */}
                <div style={{
                  background: '#fffdfa',
                  border: '1px solid #ebd7be',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  marginBottom: '20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#800020', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <i className="fa-solid fa-tags" style={{ color: '#c5a059' }}></i>
                        Store Categories ({categories.length})
                      </h3>
                      <p style={{ fontSize: '12px', color: '#6b7280', margin: '3px 0 0 0' }}>
                        Add, delete, and manage jewellery categories dynamically across the entire store.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn-gold"
                      style={{ padding: '7px 15px', fontSize: '12.5px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      onClick={handleOpenAddCategory}
                    >
                      <i className="fa-solid fa-plus"></i> Add New Category
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => setProductCategory('all')}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        border: productCategory === 'all' ? '2px solid #800020' : '1px solid #e5e7eb',
                        background: productCategory === 'all' ? '#800020' : '#fff',
                        color: productCategory === 'all' ? '#fff' : '#374151',
                        fontSize: '12.5px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span>All Products</span>
                      <span style={{
                        fontSize: '11px',
                        padding: '1px 6px',
                        borderRadius: '10px',
                        background: productCategory === 'all' ? 'rgba(255,255,255,0.25)' : '#f3f4f6',
                        color: productCategory === 'all' ? '#fff' : '#6b7280'
                      }}>
                        {products.length}
                      </span>
                    </button>

                    {categories.map(cat => {
                      const isSelected = productCategory === cat.slug;
                      const count = cat.productCount !== undefined ? cat.productCount : products.filter(p => p.category?.toLowerCase() === cat.slug?.toLowerCase()).length;
                      return (
                        <div
                          key={cat._id || cat.slug}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '5px 12px',
                            borderRadius: '20px',
                            border: isSelected ? '2px solid #800020' : '1px solid #e5e7eb',
                            background: isSelected ? '#800020' : '#fff',
                            color: isSelected ? '#fff' : '#374151',
                            fontSize: '12.5px',
                            fontWeight: '600',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                          }}
                        >
                          <span
                            onClick={() => setProductCategory(cat.slug)}
                            style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            title={`Filter products in ${cat.name}`}
                          >
                            <i className={cat.icon || 'fa-solid fa-gem'} style={{ color: isSelected ? '#ffd700' : '#c5a059', fontSize: '11px' }}></i>
                            <span>{cat.name}</span>
                          </span>
                          <span style={{
                            fontSize: '10.5px',
                            padding: '1px 6px',
                            borderRadius: '10px',
                            background: isSelected ? 'rgba(255,255,255,0.25)' : '#f3f4f6',
                            color: isSelected ? '#fff' : '#6b7280',
                            fontWeight: '700'
                          }}>
                            {count}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat)}
                            title={`Delete Category "${cat.name}"`}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: isSelected ? '#fca5a5' : '#ef4444',
                              cursor: 'pointer',
                              padding: '2px',
                              marginLeft: '3px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              fontSize: '11.5px',
                              opacity: 0.85
                            }}
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="filter-bar">
                  <div className="search-input-box">
                    <i className="fa-solid fa-magnifying-glass"></i>
                    <input
                      type="text"
                      id="productSearchInput"
                      placeholder="Search products by title, category, or ID..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                    />
                  </div>

                  <div className="filter-selects">
                    <select
                      id="productCategoryFilter"
                      value={productCategory}
                      onChange={(e) => setProductCategory(e.target.value)}
                    >
                      <option value="all">All Categories ({products.length})</option>
                      {categories.map(c => (
                        <option key={c._id || c.slug} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                    </select>

                    <select
                      id="productSortFilter"
                      value={productSort}
                      onChange={(e) => setProductSort(e.target.value)}
                    >
                      <option value="newest">Sort: Newest First</option>
                      <option value="price-asc">Price: Low to High</option>
                      <option value="price-desc">Price: High to Low</option>
                      <option value="name">Alphabetical (A-Z)</option>
                    </select>
                  </div>
                </div>

                {/* Desktop View Table */}
                <div className="table-responsive admin-desktop-table">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Category</th>
                        <th>Current Price (₹)</th>
                        <th>MRP (₹)</th>
                        <th>Stock Qty</th>
                        <th>Status</th>
                        <th>Badge</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody id="productsTableBody">
                      {filteredProducts.length === 0 ? (
                        <tr>
                          <td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: '#666' }}>
                            No products match your criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredProducts.map(p => {
                          const stock = p.stock !== undefined ? p.stock : 50;
                          const prodId = p._id || p.id;
                          return (
                            <tr key={prodId}>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <img
                                    src={getValidImageUrl(p)}
                                    alt={p.name}
                                    style={{ width: '42px', height: '42px', objectFit: 'cover', borderRadius: '6px' }}
                                    onError={(e) => { e.target.src = '/images/psimg/ring1.jpg'; }}
                                  />
                                  <div>
                                    <strong>{p.name}</strong>
                                    <span style={{ display: 'block', fontSize: '11px', color: '#666' }}>{p.id || p._id}</span>
                                  </div>
                                </div>
                              </td>
                              <td style={{ textTransform: 'capitalize' }}>{p.category}</td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <strong style={{ color: '#800020' }}>₹{Number(p.price).toLocaleString('en-IN')}</strong>
                                  <button
                                    className="btn-outline"
                                    style={{ padding: '2px 6px', fontSize: '11px' }}
                                    title="Quick Edit Price"
                                    onClick={() => handleOpenPriceModal(p)}
                                  >
                                    <i className="fa-solid fa-pencil"></i>
                                  </button>
                                </div>
                              </td>
                              <td>₹{p.mrp || Math.round(p.price * 1.3)}</td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <strong style={{ color: stock > 0 ? '#111827' : '#dc2626' }}>{stock}</strong>
                                  <button
                                    className="btn-outline"
                                    style={{ padding: '2px 6px', fontSize: '11px' }}
                                    title="Quick Edit Stock Quantity"
                                    onClick={() => handleOpenStockModal(p)}
                                  >
                                    <i className="fa-solid fa-boxes-stacked"></i>
                                  </button>
                                </div>
                              </td>
                              <td>
                                <span className={`status-badge ${stock > 0 ? 'confirmed' : 'danger'}`}>
                                  {stock > 0 ? 'In Stock' : 'Out of Stock'}
                                </span>
                              </td>
                              <td>{p.badge ? <span className="badge new">{p.badge}</span> : '-'}</td>
                              <td style={{ textAlign: 'right' }}>
                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                  <button
                                    className="btn-outline"
                                    style={{ padding: '4px 8px', fontSize: '12px' }}
                                    title="Edit Full Product"
                                    onClick={() => handleEditProduct(p)}
                                  >
                                    <i className="fa-solid fa-pen-to-square"></i>
                                  </button>
                                  <button
                                    className="btn-outline"
                                    style={{ padding: '4px 8px', fontSize: '12px', color: '#dc2626', borderColor: '#fca5a5' }}
                                    title="Delete Product"
                                    onClick={() => handleDeleteProduct(prodId, p.name)}
                                  >
                                    <i className="fa-solid fa-trash"></i>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Easy Touch Product Cards */}
                <div className="admin-mobile-product-list">
                  {filteredProducts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px', color: '#666', background: '#fff', borderRadius: '10px' }}>
                      No products match your criteria.
                    </div>
                  ) : (
                    filteredProducts.map(p => {
                      const stock = p.stock !== undefined ? p.stock : 50;
                      const prodId = p._id || p.id;
                      return (
                        <div className="mobile-product-card" key={prodId}>
                          <div className="mp-card-top">
                            <img
                              src={getValidImageUrl(p)}
                              alt={p.name}
                              className="mp-img"
                              onError={(e) => { e.target.src = '/images/psimg/ring1.jpg'; }}
                            />
                            <div className="mp-details">
                              <div className="mp-badge-row">
                                <span className="mp-category">{p.category}</span>
                                {p.badge && <span className="badge new">{p.badge}</span>}
                                <span className={`status-badge ${stock > 0 ? 'confirmed' : 'danger'}`}>
                                  {stock > 0 ? `${stock} in stock` : 'Out of stock'}
                                </span>
                              </div>
                              <h4 className="mp-title">{p.name}</h4>
                              <div className="mp-price-row">
                                <span className="mp-price">₹{Number(p.price).toLocaleString('en-IN')}</span>
                                {p.mrp && <span className="mp-mrp">₹{p.mrp}</span>}
                                <button
                                  type="button"
                                  className="mp-quick-edit-price"
                                  onClick={() => handleOpenPriceModal(p)}
                                  title="Quick Edit Price"
                                >
                                  <i className="fa-solid fa-pencil"></i> Edit Price
                                </button>
                              </div>
                            </div>
                          </div>
                          <div className="mp-actions-row">
                            <button
                              type="button"
                              className="btn-outline mp-btn"
                              onClick={() => handleEditProduct(p)}
                            >
                              <i className="fa-solid fa-pen-to-square"></i> Full Edit
                            </button>
                            <button
                              type="button"
                              className="btn-outline mp-btn mp-btn-delete"
                              onClick={() => handleDeleteProduct(prodId, p.name)}
                            >
                              <i className="fa-solid fa-trash"></i> Delete
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ==============================================
               TAB: TOP MARQUEE TAG (DEDICATED VIEW)
          =============================================== */}
          {activeTab === 'marquee' && (
            <div className="tab-pane active" id="tab-marquee">
              <div className="marquee-controller-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', borderBottom: '1px solid #e8e2d8', paddingBottom: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <h2 style={{ fontSize: '18px', color: '#800020', margin: 0 }}>
                        <i className="fa-solid fa-bullhorn" style={{ color: '#c5a059', marginRight: '8px' }}></i>
                        Top Marquee Tag & Announcement Bar
                      </h2>
                      <span className={`coupon-status-badge ${marqueeConfig.enabled ? 'active' : 'inactive'}`} style={{ fontSize: '11px', padding: '3px 10px' }}>
                        <span className="status-dot"></span>
                        {marqueeConfig.enabled ? 'ACTIVE (ON)' : 'DISABLED (OFF)'}
                      </span>
                    </div>
                    <p style={{ fontSize: '12.5px', color: '#6b7280', margin: '4px 0 0 0' }}>
                      Make a marquee tag as needed for promotions, announcements, and greetings. Turn ON or OFF anytime.
                    </p>
                  </div>

                  {/* Master Turn ON / OFF Switch */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      type="button"
                      className={`btn-toggle-coupon ${marqueeConfig.enabled ? 'btn-turn-off' : 'btn-turn-on'}`}
                      onClick={handleToggleMarquee}
                      style={{ padding: '8px 18px', fontSize: '13px', fontWeight: '600' }}
                      id="btnMasterToggleMarquee"
                    >
                      <i className={`fa-solid ${marqueeConfig.enabled ? 'fa-toggle-on' : 'fa-toggle-off'}`} style={{ fontSize: '16px' }}></i>
                      <span>{marqueeConfig.enabled ? 'Turn OFF Marquee' : 'Turn ON Marquee'}</span>
                    </button>
                  </div>
                </div>

                {/* Live Website Preview Banner */}
                <div className="marquee-preview-wrap">
                  <div className="marquee-preview-header">
                    <span>
                      <i className="fa-solid fa-desktop" style={{ marginRight: '6px' }}></i>
                      Live Website Marquee Preview (Simulated Top of Site)
                    </span>
                    <span style={{ color: marqueeConfig.enabled ? '#15803d' : '#dc2626', fontWeight: 'bold' }}>
                      {marqueeConfig.enabled ? '● Currently Visible Live on Site' : '○ Currently Hidden (Turned OFF)'}
                    </span>
                  </div>
                  <div
                    className="marquee-preview-content"
                    style={{
                      background: marqueeConfig.bgColor || '#2b0008',
                      color: marqueeConfig.textColor || '#f8f4ed'
                    }}
                  >
                    <marquee
                      behavior="scroll"
                      direction="left"
                      scrollamount={Number(marqueeConfig.speed) || 7}
                      onMouseEnter={(e) => marqueeConfig.pauseOnHover !== false && e.target.stop()}
                      onMouseLeave={(e) => marqueeConfig.pauseOnHover !== false && e.target.start()}
                      style={{ width: '100%', margin: 0, padding: 0 }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', paddingRight: '40px' }}>
                        {marqueeConfig.text || '✨ Enter your announcement text in the box below... ✨'}
                      </span>
                    </marquee>
                  </div>
                  {!marqueeConfig.enabled && (
                    <div style={{ background: '#fffbeb', color: '#b45309', padding: '8px 14px', fontSize: '11.5px', borderTop: '1px dashed #fcd34d', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="fa-solid fa-triangle-exclamation"></i>
                      <span>The marquee tag is currently <strong>TURNED OFF</strong>. Customers visiting the store cannot see it until you click <strong>"Turn ON Marquee"</strong>.</span>
                    </div>
                  )}
                </div>

                {/* Marquee Customizer Form */}
                <form onSubmit={handleSaveMarquee} style={{ marginTop: '16px' }}>
                  <div className="form-group" style={{ marginBottom: '14px' }}>
                    <label style={{ fontWeight: '600', fontSize: '12.5px', color: '#1e1e24', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>
                        <i className="fa-solid fa-pen-nib" style={{ color: '#c5a059', marginRight: '6px' }}></i>
                        Marquee Tag Text (Write any message as needed)
                      </span>
                      <span style={{ fontSize: '11px', color: '#6b7280' }}>
                        {marqueeConfig.text ? `${marqueeConfig.text.length} chars` : 'Empty'}
                      </span>
                    </label>
                    <textarea
                      rows="2"
                      className="form-control"
                      id="marqueeTextInput"
                      value={marqueeConfig.text || ''}
                      onChange={(e) => setMarqueeConfig({ ...marqueeConfig, text: e.target.value })}
                      placeholder="e.g. ✨ Special Privilege: Flat 10% OFF on all Handcrafted Jewellery with code PANCH10 • Free Pan-India Insured Express Shipping ✨"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                        fontFamily: 'inherit',
                        fontSize: '13px',
                        lineHeight: '1.5'
                      }}
                    />
                  </div>

                  {/* Quick Presets for Announcement Text */}
                  <div style={{ marginBottom: '18px' }}>
                    <label style={{ fontSize: '11.5px', fontWeight: '600', color: '#800020', marginBottom: '6px', display: 'block' }}>
                      <i className="fa-solid fa-wand-magic-sparkles" style={{ color: '#c5a059', marginRight: '6px' }}></i>
                      Click to Insert Quick Announcement Preset:
                    </label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="marquee-preset-chip"
                        onClick={() => handleMarqueeTextPreset('✨ Special Privilege: Flat 10% OFF on Handcrafted Jewellery with code PANCH10 • Free Insured Pan-India Express Delivery ✨')}
                      >
                        🎁 10% Off Privilege
                      </button>
                      <button
                        type="button"
                        className="marquee-preset-chip"
                        onClick={() => handleMarqueeTextPreset('🚚 Free Express Shipping Across India on all orders above ₹999 • 100% Insured & Safe Packaging ✨')}
                      >
                        🚚 Free Shipping Alert
                      </button>
                      <button
                        type="button"
                        className="marquee-preset-chip"
                        onClick={() => handleMarqueeTextPreset('💎 New Heritage Collection Live: Handcrafted Designer Wooden Bangles, Rings & Keepsake Gift Sets • Shop Now ✨')}
                      >
                        💎 New Collection Live
                      </button>
                      <button
                        type="button"
                        className="marquee-preset-chip"
                        onClick={() => handleMarqueeTextPreset('🌸 Festive Mega Celebration: Complimentary Luxury Velvet Keepsake Gift Box with every purchase above ₹1,999 ✨')}
                      >
                        🌸 Free Keepsake Gift
                      </button>
                    </div>
                  </div>

                  {/* Styling & Speed Controls */}
                  <div className="form-row-3" style={{ marginBottom: '18px' }}>
                    {/* Scroll Speed */}
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>
                        <i className="fa-solid fa-gauge-high" style={{ color: '#c5a059', marginRight: '6px' }}></i>
                        Scroll Speed:
                      </label>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {[
                          { label: 'Slow (4)', val: 4 },
                          { label: 'Normal (7)', val: 7 },
                          { label: 'Fast (11)', val: 11 }
                        ].map(s => (
                          <button
                            key={s.val}
                            type="button"
                            className={`speed-option-btn ${Number(marqueeConfig.speed) === s.val ? 'selected' : ''}`}
                            onClick={() => setMarqueeConfig({ ...marqueeConfig, speed: s.val })}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Background Color */}
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>
                        <i className="fa-solid fa-palette" style={{ color: '#c5a059', marginRight: '6px' }}></i>
                        Background Color:
                      </label>
                      <div className="color-palette-group">
                        {[
                          { color: '#2b0008', title: 'Regal Maroon' },
                          { color: '#800020', title: 'Royal Crimson' },
                          { color: '#111111', title: 'Midnight Charcoal' },
                          { color: '#0a2e1d', title: 'Deep Emerald' },
                          { color: '#0b1d3a', title: 'Imperial Navy' }
                        ].map(c => (
                          <button
                            key={c.color}
                            type="button"
                            title={c.title}
                            className={`color-option-btn ${marqueeConfig.bgColor === c.color ? 'selected' : ''}`}
                            style={{ backgroundColor: c.color }}
                            onClick={() => setMarqueeConfig({ ...marqueeConfig, bgColor: c.color })}
                          />
                        ))}
                        <input
                          type="color"
                          value={marqueeConfig.bgColor || '#2b0008'}
                          onChange={(e) => setMarqueeConfig({ ...marqueeConfig, bgColor: e.target.value })}
                          style={{ width: '28px', height: '28px', padding: 0, border: 'none', borderRadius: '50%', cursor: 'pointer' }}
                          title="Custom Background Color"
                        />
                      </div>
                    </div>

                    {/* Text Color */}
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>
                        <i className="fa-solid fa-font" style={{ color: '#c5a059', marginRight: '6px' }}></i>
                        Text Color:
                      </label>
                      <div className="color-palette-group">
                        {[
                          { color: '#f8f4ed', title: 'Champagne Ivory' },
                          { color: '#c5a059', title: 'Royal Gold' },
                          { color: '#facc15', title: 'Vibrant Yellow' },
                          { color: '#ffffff', title: 'Pure White' }
                        ].map(c => (
                          <button
                            key={c.color}
                            type="button"
                            title={c.title}
                            className={`color-option-btn ${marqueeConfig.textColor === c.color ? 'selected' : ''}`}
                            style={{ backgroundColor: c.color }}
                            onClick={() => setMarqueeConfig({ ...marqueeConfig, textColor: c.color })}
                          />
                        ))}
                        <input
                          type="color"
                          value={marqueeConfig.textColor || '#f8f4ed'}
                          onChange={(e) => setMarqueeConfig({ ...marqueeConfig, textColor: e.target.value })}
                          style={{ width: '28px', height: '28px', padding: 0, border: 'none', borderRadius: '50%', cursor: 'pointer' }}
                          title="Custom Text Color"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Options & Action Buttons */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', paddingTop: '14px', borderTop: '1px solid #e8e2d8' }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12.5px', color: '#4b5563' }}>
                      <input
                        type="checkbox"
                        checked={marqueeConfig.pauseOnHover !== false}
                        onChange={(e) => setMarqueeConfig({ ...marqueeConfig, pauseOnHover: e.target.checked })}
                      />
                      <span>Pause marquee scrolling when visitor hovers mouse</span>
                    </label>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <button
                        type="button"
                        className="btn-outline"
                        onClick={() => {
                          setMarqueeConfig({
                            enabled: true,
                            text: '✨ Exclusive Privilege: Flat 10% OFF on Handcrafted Luxury Jewellery with code PANCH10 • Free Pan-India Insured Express Shipping on Orders Above ₹999 • Certified 100% Authentic ✨',
                            speed: 7,
                            bgColor: '#2b0008',
                            textColor: '#f8f4ed',
                            pauseOnHover: true
                          });
                          toast.success('Reset to default marquee values.');
                        }}
                        style={{ padding: '8px 14px', fontSize: '12.5px' }}
                      >
                        Reset Default
                      </button>

                      <button
                        type="submit"
                        className="btn-gold"
                        id="btnSaveMarqueeConfig"
                        style={{ padding: '8px 22px', fontSize: '13px', fontWeight: '600' }}
                      >
                        <i className="fa-solid fa-floppy-disk" style={{ marginRight: '6px' }}></i>
                        Save & Publish Marquee Tag
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ==============================================
               TAB 3: OFFERS & COUPONS MANAGEMENT
          =============================================== */}
          {activeTab === 'coupons' && (
            <div className="tab-pane active" id="tab-coupons">
              {/* Quick Marquee Announcement Ticker Status Bar */}
              <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e8e2d8', padding: '16px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: marqueeConfig.enabled ? '#dcfce7' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: marqueeConfig.enabled ? '#15803d' : '#6b7280', fontSize: '18px' }}>
                    <i className="fa-solid fa-bullhorn"></i>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '14px', color: '#1e1e24' }}>Top Marquee Tag Announcement</strong>
                      <span className={`coupon-status-badge ${marqueeConfig.enabled ? 'active' : 'inactive'}`} style={{ fontSize: '10.5px' }}>
                        <span className="status-dot"></span>
                        {marqueeConfig.enabled ? 'ACTIVE (ON)' : 'DISABLED (OFF)'}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0 0' }}>
                      {marqueeConfig.enabled ? 'Currently scrolling at top of site' : 'Currently turned off (hidden from visitors)'}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    type="button"
                    className={`btn-toggle-coupon ${marqueeConfig.enabled ? 'btn-turn-off' : 'btn-turn-on'}`}
                    onClick={handleToggleMarquee}
                    style={{ padding: '6px 14px', fontSize: '12px' }}
                  >
                    <i className={`fa-solid ${marqueeConfig.enabled ? 'fa-toggle-on' : 'fa-toggle-off'}`}></i>
                    <span>{marqueeConfig.enabled ? 'Turn OFF' : 'Turn ON'}</span>
                  </button>
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={() => handleNavClick('marquee')}
                    style={{ padding: '6px 14px', fontSize: '12px' }}
                  >
                    <i className="fa-solid fa-pen-to-square"></i> Customize Tag
                  </button>
                </div>
              </div>
              <div className="card-panel">
                <div className="panel-header">
                  <div>
                    <h2>Active Coupons & Promo Codes</h2>
                    <p style={{ fontSize: '12.5px', color: '#6b7280' }}>
                      Create and manage discount coupons that apply dynamically on customer cart and checkout.
                    </p>
                  </div>
                  <div className="panel-actions">
                    <button
                      className="btn-gold"
                      id="btnOpenAddCouponModal"
                      onClick={() => setModalState(prev => ({ ...prev, coupon: true }))}
                    >
                      <i className="fa-solid fa-plus"></i> Create New Coupon
                    </button>
                  </div>
                </div>

                {/* Quick Presets Bar */}
                <div className="quick-presets-bar">
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#800020' }}>
                    <i className="fa-solid fa-wand-magic-sparkles" style={{ color: '#c5a059', marginRight: '5px' }}></i>
                    Quick Preset Deals:
                  </span>
                  {QUICK_COUPONS.map(qc => (
                    <button
                      key={qc.code}
                      type="button"
                      className="btn-preset-coupon"
                      onClick={() => handleQuickAddCoupon(qc)}
                    >
                      + {qc.code} ({qc.discountType === 'percentage' ? `${qc.discountValue}%` : `₹${qc.discountValue}`} OFF)
                    </button>
                  ))}
                </div>

                {/* Luxury Coupon Tickets Grid */}
                <div className="luxury-coupon-grid" id="couponsContainer">
                  {coupons.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px', color: '#666', background: '#fff', borderRadius: '12px', gridColumn: '1 / -1' }}>
                      No active discount coupons. Click "Create New Coupon" or tap a Quick Preset above!
                    </div>
                  ) : (
                    coupons.map(c => {
                      const isActive = c.isActive !== false;
                      const discountStr = (c.discountType === 'flat' || c.discountType === 'fixed')
                        ? `₹${c.discountValue}`
                        : `${c.discountValue}%`;
                      const minCart = c.minOrderAmount !== undefined ? c.minOrderAmount : (c.minSpend || c.minOrder || 0);
                      const expDate = c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('en-IN') : (c.expiryDate || 'No Expiry');

                      return (
                        <div className={`luxury-coupon-ticket ${isActive ? 'is-active' : 'is-inactive'}`} key={c._id || c.code}>
                          <div className="ticket-left">
                            <span className="ticket-discount-val">
                              {discountStr}
                            </span>
                            <span className="ticket-discount-sub">OFF</span>
                          </div>
                          <div className="ticket-divider">
                            <div className="notch notch-top"></div>
                            <div className="notch notch-bottom"></div>
                          </div>
                          <div className="ticket-right">
                            <div className="ticket-header-row">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span className="ticket-code">{c.code}</span>
                                <button
                                  type="button"
                                  className="btn-copy-code"
                                  onClick={() => {
                                    if (navigator.clipboard) {
                                      navigator.clipboard.writeText(c.code);
                                      toast.success(`Copied "${c.code}" to clipboard!`);
                                    }
                                  }}
                                  title="Copy Code"
                                >
                                  <i className="fa-regular fa-copy"></i>
                                </button>
                              </div>

                              {/* Coupon Status Pill */}
                              <span className={`coupon-status-badge ${isActive ? 'active' : 'inactive'}`}>
                                <span className="status-dot"></span>
                                {isActive ? 'ACTIVE (ON)' : 'DISABLED (OFF)'}
                              </span>
                            </div>

                            <p className="ticket-min-spend">
                              <i className="fa-solid fa-bag-shopping" style={{ color: '#c5a059', marginRight: '5px' }}></i>
                              Min cart: <strong>₹{Number(minCart).toLocaleString('en-IN')}</strong>
                            </p>

                            {c.description && (
                              <p style={{ fontSize: '11px', color: '#6b7280', margin: '2px 0 6px 0', lineHeight: '1.3' }}>
                                {c.description}
                              </p>
                            )}

                            <div className="ticket-footer-row">
                              <span>
                                <i className="fa-regular fa-clock" style={{ marginRight: '4px' }}></i>
                                {expDate}
                              </span>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {/* Admin ON / OFF Switch */}
                                <button
                                  type="button"
                                  className={`btn-toggle-coupon ${isActive ? 'btn-turn-off' : 'btn-turn-on'}`}
                                  onClick={() => handleToggleCoupon(c)}
                                  title={isActive ? `Turn OFF ${c.code}` : `Turn ON ${c.code}`}
                                >
                                  <i className={`fa-solid ${isActive ? 'fa-toggle-on' : 'fa-toggle-off'}`}></i>
                                  <span>{isActive ? 'Turn OFF' : 'Turn ON'}</span>
                                </button>

                                <button
                                  type="button"
                                  className="btn-ticket-delete"
                                  onClick={() => handleDeleteCoupon(c)}
                                  title="Delete Coupon"
                                >
                                  <i className="fa-solid fa-trash"></i>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Promotional Deals Section */}
                <div style={{ borderTop: '1px solid #e8e2d8', paddingTop: '24px', marginTop: '24px' }}>
                  <div className="panel-header">
                    <div>
                      <h3 style={{ fontSize: '16px', color: '#800020' }}>Promotional Deals & Flash Offers</h3>
                      <p style={{ fontSize: '12px', color: '#6b7280' }}>Highlight announcements or seasonal deals</p>
                    </div>
                    <button
                      className="btn-outline"
                      onClick={() => setModalState(prev => ({ ...prev, offer: true }))}
                    >
                      <i className="fa-solid fa-bullhorn"></i> Add Promotional Deal
                    </button>
                  </div>

                  <div className="table-responsive">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Badge</th>
                          <th>Headline</th>
                          <th>Deal Details</th>
                          <th>Coupon Code</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody id="offersTableBody">
                        {offers.length === 0 ? (
                          <tr>
                            <td colSpan="6" style={{ textAlign: 'center', padding: '16px', color: '#666' }}>
                              No promotional offers active.
                            </td>
                          </tr>
                        ) : (
                          offers.map(off => (
                            <tr key={off.id}>
                              <td><span className="badge sale">{off.badge}</span></td>
                              <td><strong>{off.title}</strong></td>
                              <td>{off.description}</td>
                              <td><code>{off.couponCode || '-'}</code></td>
                              <td>
                                <span className={`status-badge ${off.active !== false ? 'confirmed' : 'pending'}`}>
                                  {off.active !== false ? 'Active' : 'Paused'}
                                </span>
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button
                                    type="button"
                                    className="btn-outline"
                                    style={{ padding: '2px 8px', fontSize: '11px', color: '#800020' }}
                                    onClick={() => handleToggleOffer(off.id)}
                                    title="Toggle Active Status"
                                  >
                                    {off.active !== false ? 'Pause' : 'Activate'}
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-outline"
                                    style={{ padding: '2px 8px', fontSize: '11px', color: '#dc2626' }}
                                    onClick={() => handleDeleteOffer(off.id)}
                                    title="Delete Offer"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Live Coupon Test Tool */}
                <div style={{ marginTop: '28px', background: '#faf8f5', border: '1px dashed #c5a059', borderRadius: '8px', padding: '18px 20px' }}>
                  <h4 style={{ fontSize: '14px', color: '#800020', marginBottom: '6px' }}>
                    <i className="fa-solid fa-calculator" style={{ color: '#c5a059' }}></i> Test Any Coupon Code Instantly
                  </h4>
                  <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>
                    Verify how a coupon behaves on a sample cart amount
                  </p>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <input
                      type="text"
                      id="testCouponCode"
                      placeholder="e.g. PANCH10"
                      value={testCouponCode}
                      onChange={(e) => setTestCouponCode(e.target.value.toUpperCase())}
                      style={{ padding: '9px 12px', border: '1px solid #e0e0e0', borderRadius: '6px', textTransform: 'uppercase', width: '140px' }}
                    />
                    <input
                      type="number"
                      id="testCartSubtotal"
                      placeholder="Order Amount ₹"
                      value={testCartAmount}
                      onChange={(e) => setTestCartAmount(e.target.value)}
                      style={{ padding: '9px 12px', border: '1px solid #e0e0e0', borderRadius: '6px', width: '150px' }}
                    />
                    <button type="button" className="btn-gold" id="btnTestCoupon" onClick={handleTestCoupon}>
                      <i className="fa-solid fa-check"></i> Calculate
                    </button>
                    {testResult && (
                      <span id="testCouponResult" style={{ fontSize: '13px', fontWeight: '600', color: testResult.valid ? '#15803d' : '#b91c1c' }}>
                        {testResult.message}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==============================================
               TAB 4: ORDERS RECEIVED (FULL DETAILS & PAYMENT)
          =============================================== */}
          {activeTab === 'orders' && (
            <div className="tab-pane active" id="tab-orders">
              <div className="card-panel">
                <div className="panel-header">
                  <div>
                    <h2>Customer Orders & Payment Records</h2>
                    <p style={{ fontSize: '12.5px', color: '#6b7280' }}>
                      Inspect complete orders, UPI reference numbers (UTR), address, and ordered items.
                    </p>
                  </div>
                  <div className="panel-actions">
                    <span style={{ fontSize: '12.5px', color: '#6b7280' }}>
                      Store Helpline: <strong>+91 {storeConfig.storeMobile}</strong>
                    </span>
                  </div>
                </div>

                {/* Search and Filter Bar */}
                <div className="filter-bar">
                  <div className="search-input-box">
                    <i className="fa-solid fa-magnifying-glass"></i>
                    <input
                      type="text"
                      id="orderSearchInput"
                      placeholder="Search orders by Order ID, Customer Name, Phone, or UTR..."
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                    />
                  </div>

                  <div className="filter-selects">
                    <select
                      id="orderStatusFilter"
                      value={orderStatus}
                      onChange={(e) => setOrderStatus(e.target.value)}
                    >
                      <option value="all">All Order Statuses</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Pending Verification">Pending Verification</option>
                    </select>
                  </div>
                </div>

                {/* Orders Table */}
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Order ID & Date</th>
                        <th>Customer</th>
                        <th>Items Summary</th>
                        <th>Total Paid</th>
                        <th>Payment Mode & UTR</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody id="ordersTableBody">
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#666' }}>
                            No customer orders match your query.
                          </td>
                        </tr>
                      ) : (
                      filteredOrders.map(o => {
                        const hasHamper = (o.items || []).some(i => i.isHamper || i.hamperData);
                        const custName = o.shippingAddress?.fullName || o.shippingAddress?.name || o.customer?.name || o.user?.name || 'Customer';
                        const custPhone = o.shippingAddress?.phone || o.shippingAddress?.mobile || o.customer?.mobile || o.user?.phone || '-';
                        const orderDisplayDate = o.date || (o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN') : '');
                        const grandTotal = Number(o.totalAmount || o.total || 0);

                        return (
                          <tr key={o.orderId || o._id} style={{ background: hasHamper ? 'rgba(197,160,89,0.04)' : 'transparent' }}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {hasHamper && <span style={{ fontSize: '15px' }} title="Custom Luxury Hamper Order">🎁</span>}
                                <div>
                                  <strong>{o.orderId}</strong>
                                  <span style={{ display: 'block', fontSize: '11px', color: '#666' }}>{orderDisplayDate}</span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <strong>{custName}</strong>
                              <span style={{ display: 'block', fontSize: '12px', color: '#666' }}>+91 {custPhone}</span>
                              {o.shippingAddress?.city && (
                                <small style={{ color: '#888', display: 'block' }}>📍 {o.shippingAddress.city}</small>
                              )}
                            </td>
                            <td>
                              <div style={{ fontSize: '12px' }}>
                                {(o.items || []).map((i, idx) => {
                                  const isHamp = Boolean(i.isHamper || i.hamperData);
                                  return (
                                    <div key={idx} style={{ marginBottom: '4px' }}>
                                      {isHamp ? (
                                        <div style={{
                                          display: 'inline-block',
                                          background: '#fffdf5',
                                          border: '1px solid #ebd7be',
                                          borderLeft: '3px solid #800020',
                                          padding: '4px 8px',
                                          borderRadius: '6px'
                                        }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <span style={{ fontSize: '13px' }}>🎁</span>
                                            <strong style={{ color: '#800020', fontSize: '11.5px' }}>{i.name}</strong>
                                            <span style={{ background: '#800020', color: '#fff', fontSize: '9px', padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>
                                              HAMPER
                                            </span>
                                          </div>
                                          {i.hamperData?.personalization?.recipientName && (
                                            <div style={{ fontSize: '11px', color: '#555', marginTop: '1px' }}>
                                              To: <strong>{i.hamperData.personalization.recipientName}</strong>
                                              {i.hamperData.personalization.occasion && ` • ${i.hamperData.personalization.occasion}`}
                                            </div>
                                          )}
                                          {i.hamperData?.personalization?.ribbonColor && (
                                            <div style={{ fontSize: '10.5px', color: '#854d0e' }}>
                                              🎀 {i.hamperData.personalization.ribbonColor} Ribbon
                                            </div>
                                          )}
                                          <div style={{ fontSize: '10.5px', color: '#16a34a', fontWeight: '600', marginTop: '1px' }}>
                                            📦 {(i.hamperData?.products || []).length} items inside
                                          </div>
                                        </div>
                                      ) : (
                                        <span>• {i.name} <small style={{ color: '#666' }}>(x{i.quantity || 1})</small></span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </td>
                            <td>
                              <strong style={{ color: '#800020' }}>
                                ₹{grandTotal.toLocaleString('en-IN')}
                              </strong>
                            </td>
                            <td>
                              <span style={{ fontSize: '12px', color: '#1d4ed8', display: 'block' }}>
                                {o.paymentMode || 'Online Razorpay'}
                              </span>
                              {o.utr && <small style={{ fontFamily: 'monospace' }}>UTR: {o.utr}</small>}
                            </td>
                            <td>
                              <select
                                value={o.status || o.orderStatus || 'Order Received (Verification in 24h)'}
                                onChange={(e) => handleUpdateOrderStatus(o.orderId, e.target.value)}
                                style={{
                                  padding: '4px 8px',
                                  fontSize: '12px',
                                  borderRadius: '6px',
                                  border: '1px solid #ccc',
                                  fontWeight: '600'
                                }}
                              >
                                <option value="Order Received (Verification in 24h)">Order Received (Verification in 24h)</option>
                                <option value="Confirmed">Confirmed</option>
                                <option value="Processing">Processing</option>
                                <option value="Shipped">Shipped</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                className={hasHamper ? "btn-gold" : "btn-outline"}
                                style={{ padding: '5px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                                onClick={() => handleOpenOrderDetail(o)}
                              >
                                {hasHamper ? (
                                  <>🎁 View Hamper</>
                                ) : (
                                  <>View Invoice</>
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==============================================
               TAB 5: REGISTERED CUSTOMERS (COUNT & SEARCH)
          =============================================== */}
          {activeTab === 'customers' && (
            <div className="tab-pane active" id="tab-customers">
              <div className="card-panel">
                <div className="panel-header">
                  <div>
                    <h2>Registered Customers Directory</h2>
                    <p style={{ fontSize: '12.5px', color: '#6b7280' }}>
                      Browse and search all customer accounts registered on the PANCH SATTVA platform.
                    </p>
                  </div>
                  <div className="panel-actions">
                    <button
                      className="btn-gold"
                      id="btnOpenAddCustomerModal"
                      onClick={() => setModalState(prev => ({ ...prev, customer: true }))}
                    >
                      <i className="fa-solid fa-user-plus"></i> Add Customer
                    </button>
                  </div>
                </div>

                {/* Live Customer Search Bar */}
                <div className="filter-bar">
                  <div className="search-input-box" style={{ flex: 2 }}>
                    <i className="fa-solid fa-magnifying-glass"></i>
                    <input
                      type="text"
                      id="customerSearchInput"
                      placeholder="Live search by Name, Email, or Mobile number..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                    />
                  </div>

                  <div className="filter-selects">
                    <select
                      id="customerGenderFilter"
                      value={customerGender}
                      onChange={(e) => setCustomerGender(e.target.value)}
                    >
                      <option value="all">All Genders</option>
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Customer Table */}
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Customer</th>
                        <th>Email Address</th>
                        <th>Mobile Number</th>
                        <th>Gender</th>
                        <th>Location / Address</th>
                        <th>Registration Date</th>
                        <th style={{ textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody id="customersTableBody">
                      {filteredCustomers.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#666' }}>
                            No registered customers found.
                          </td>
                        </tr>
                      ) : (
                        filteredCustomers.map((c, i) => {
                          const custId = c._id || c.id || c.email;
                          return (
                            <tr key={custId}>
                              <td>
                                <strong>{c.name}</strong>
                                <span style={{ display: 'block', fontSize: '11px', color: '#16a34a' }}>● Verified Member</span>
                              </td>
                              <td>{c.email}</td>
                              <td>+91 {c.phone || c.mobile || '-'}</td>
                              <td>{c.gender || 'Not specified'}</td>
                              <td>{c.address ? `${c.address}, ${c.city || ''}` : '-'}</td>
                              <td>{c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN') : '2026'}</td>
                              <td style={{ textAlign: 'right' }}>
                                <button
                                  className="btn-outline"
                                  style={{ padding: '4px 10px', fontSize: '11px', color: '#dc2626', borderColor: '#fca5a5' }}
                                  onClick={() => handleDeleteCustomer(custId, c.name)}
                                  title="Permanently delete user from database"
                                >
                                  <i className="fa-solid fa-trash" style={{ marginRight: '4px' }}></i> Delete
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==============================================
               TAB 6: SETTINGS & BACKUP
          =============================================== */}
          {activeTab === 'settings' && (
            <div className="tab-pane active" id="tab-settings">
              <div className="card-panel">
                <div className="panel-header">
                  <div>
                    <h2>Store & Admin Configuration</h2>
                    <p style={{ fontSize: '12.5px', color: '#6b7280' }}>Update store payment receiver details and admin security</p>
                  </div>
                </div>

                <form id="storeSettingsForm" style={{ maxWidth: '650px' }} onSubmit={handleSaveSettings}>
                  <div className="form-row" style={{ display: 'flex', gap: '16px', marginBottom: '14px' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Store Name</label>
                      <input
                        type="text"
                        id="settingStoreName"
                        value={storeConfig.storeName}
                        onChange={(e) => setStoreConfig({ ...storeConfig, storeName: e.target.value })}
                      />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Razorpay Key ID (API Key)</label>
                      <input
                        type="text"
                        id="settingRazorpayKey"
                        value={storeConfig.razorpayKey}
                        onChange={(e) => setStoreConfig({ ...storeConfig, razorpayKey: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-row" style={{ display: 'flex', gap: '16px', marginBottom: '14px' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Store Mobile / Helpline</label>
                      <input
                        type="text"
                        id="settingStoreMobile"
                        value={storeConfig.storeMobile}
                        onChange={(e) => setStoreConfig({ ...storeConfig, storeMobile: e.target.value })}
                      />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Support Email</label>
                      <input
                        type="email"
                        id="settingStoreEmail"
                        value={storeConfig.storeEmail}
                        onChange={(e) => setStoreConfig({ ...storeConfig, storeEmail: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid #e8e2d8', paddingTop: '18px', marginTop: '10px' }}>
                    <h3 style={{ fontSize: '16px', color: '#800020', marginBottom: '12px' }}>Admin Credentials</h3>
                    <div className="form-row" style={{ display: 'flex', gap: '16px', marginBottom: '14px' }}>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label>Admin Login Email</label>
                        <input
                          type="email"
                          id="settingAdminEmail"
                          value={storeConfig.adminEmail}
                          onChange={(e) => setStoreConfig({ ...storeConfig, adminEmail: e.target.value })}
                        />
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label>Admin Password</label>
                        <input
                          type="password"
                          id="settingAdminPassword"
                          value={storeConfig.adminPassword}
                          onChange={(e) => setStoreConfig({ ...storeConfig, adminPassword: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <button type="submit" className="btn-primary" style={{ marginTop: '12px' }}>
                    <i className="fa-solid fa-floppy-disk"></i> Save Configuration
                  </button>
                </form>

                <div style={{ borderTop: '1px solid #e8e2d8', paddingTop: '24px', marginTop: '30px' }}>
                  <h3 style={{ fontSize: '16px', color: '#800020', marginBottom: '8px' }}>Store Data Management</h3>
                  <p style={{ fontSize: '12.5px', color: '#6b7280', marginBottom: '16px' }}>
                    Export store data backup or purge any demo, test, or duplicate records from the store database.
                  </p>

                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button type="button" className="btn-outline" id="btnExportData" onClick={handleExportData}>
                      <i className="fa-solid fa-download"></i> Export Store JSON
                    </button>
                    <button
                      type="button"
                      className="btn-outline"
                      id="btnResetDemoData"
                      style={{ color: '#b91c1c', borderColor: 'rgba(185, 28, 28, 0.3)' }}
                      onClick={handlePurgeDemo}
                    >
                      <i className="fa-solid fa-broom"></i> Remove Demo & Duplicate Records
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==============================================
               TAB: CUSTOM HAMPERS & CHOCOLATES
          =============================================== */}
          {activeTab === 'hampers' && (
            <div className="tab-pane active" id="tab-hampers">
              {/* Highlight Banner */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(128,0,32,0.06), rgba(197,160,89,0.14))',
                border: '1px solid rgba(197,160,89,0.3)',
                borderRadius: '12px',
                padding: '18px 22px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    background: '#800020',
                    color: '#c5a059',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    flexShrink: 0,
                    boxShadow: '0 4px 12px rgba(128,0,32,0.2)'
                  }}>
                    <i className="fa-solid fa-gift"></i>
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '16px', color: '#800020', fontWeight: '700' }}>
                      Custom Hamper Boxes & Chocolates Manager
                    </h4>
                    <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: '#6b7280' }}>
                      Add & manage keepsake packaging boxes, set custom prices, capacities, and exclusive hamper chocolates.
                      Chocolates added here are restricted exclusively to Custom Hampers and will NOT appear in the general jewellery catalog.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn-gold"
                    onClick={handleOpenAddHamperBox}
                    style={{ padding: '9px 18px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                  >
                    <i className="fa-solid fa-box-open"></i> Add Hamper Box
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleOpenAddChocolate}
                    style={{ padding: '9px 18px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                  >
                    <i className="fa-solid fa-cookie-bite"></i> Add Chocolate
                  </button>
                </div>
              </div>

              {/* SECTION 1: LUXURY HAMPER BOXES */}
              <div className="card-panel" style={{ marginBottom: '30px' }}>
                <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h2 style={{ fontSize: '17px', margin: 0, color: '#800020', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className="fa-solid fa-box-open" style={{ color: '#c5a059' }}></i>
                      Hamper Packaging Boxes ({hamperBoxes.length})
                    </h2>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6b7280' }}>
                      Customers choose 1 box as Step 1. Price, capacity (item limit), dimensions, and appearance are managed here.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn-gold"
                    onClick={handleOpenAddHamperBox}
                    style={{ padding: '7px 14px', fontSize: '12px' }}
                  >
                    <i className="fa-solid fa-plus"></i> New Box
                  </button>
                </div>

                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Box</th>
                        <th>Style & Color</th>
                        <th>Capacity</th>
                        <th>Dimensions</th>
                        <th>Price (₹)</th>
                        <th>MRP (₹)</th>
                        <th>Badge</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hamperBoxes.length === 0 ? (
                        <tr>
                          <td colSpan="9" style={{ textAlign: 'center', padding: '36px', color: '#6b7280' }}>
                            <i className="fa-solid fa-box-open" style={{ fontSize: '32px', color: '#c5a059', marginBottom: '8px', display: 'block' }}></i>
                            No hamper boxes found. Click "+ Add Hamper Box" to create packaging options.
                          </td>
                        </tr>
                      ) : (
                        hamperBoxes.map(box => {
                          const boxId = box._id || box.id;
                          return (
                            <tr key={boxId}>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <img
                                    src={box.image || '/images/psimg/gift1.png'}
                                    alt={box.name}
                                    style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #e8e2d8' }}
                                    onError={(e) => { e.target.src = '/images/psimg/gift1.png'; }}
                                  />
                                  <div>
                                    <strong style={{ fontSize: '13.5px', color: '#1e1e24' }}>{box.name}</strong>
                                    {box.description && (
                                      <p style={{ fontSize: '11px', color: '#6b7280', margin: '2px 0 0', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {box.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div style={{ fontSize: '12.5px', fontWeight: '500' }}>{box.style || 'Keepsake Box'}</div>
                                <span style={{ fontSize: '11px', color: '#800020' }}>{box.color || 'Royal Velvet'}</span>
                              </td>
                              <td>
                                <span style={{
                                  display: 'inline-block',
                                  background: 'rgba(197,160,89,0.15)',
                                  color: '#800020',
                                  padding: '3px 9px',
                                  borderRadius: '12px',
                                  fontWeight: '700',
                                  fontSize: '11.5px'
                                }}>
                                  Fits {box.capacity || 4} items
                                </span>
                              </td>
                              <td style={{ fontSize: '12px', color: '#6b7280' }}>
                                {box.dimensions || 'Standard'}
                              </td>
                              <td>
                                <strong style={{ fontSize: '14px', color: '#800020' }}>
                                  ₹{Number(box.price).toLocaleString('en-IN')}
                                </strong>
                              </td>
                              <td>
                                <span style={{ fontSize: '12px', textDecoration: 'line-through', color: '#9ca3af' }}>
                                  ₹{Number(box.mrp || box.price).toLocaleString('en-IN')}
                                </span>
                              </td>
                              <td>
                                {box.badge ? (
                                  <span className="badge-chip badge-new" style={{ fontSize: '10px' }}>{box.badge}</span>
                                ) : (
                                  <span style={{ color: '#9ca3af', fontSize: '11px' }}>—</span>
                                )}
                              </td>
                              <td>
                                <span style={{
                                  display: 'inline-block',
                                  background: box.isActive !== false ? '#dcfce7' : '#fee2e2',
                                  color: box.isActive !== false ? '#15803d' : '#b91c1c',
                                  fontSize: '11px',
                                  padding: '3px 8px',
                                  borderRadius: '10px',
                                  fontWeight: '600'
                                }}>
                                  {box.isActive !== false ? 'Active' : 'Disabled'}
                                </span>
                              </td>
                              <td>
                                <div className="action-buttons-cell" style={{ display: 'flex', gap: '6px' }}>
                                  <button
                                    type="button"
                                    className="btn-action-icon edit"
                                    title="Edit Box"
                                    onClick={() => handleOpenEditHamperBox(box)}
                                  >
                                    <i className="fa-solid fa-pen-to-square"></i>
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-action-icon delete"
                                    title="Delete Box"
                                    onClick={() => handleDeleteHamperBox(box)}
                                  >
                                    <i className="fa-solid fa-trash-can"></i>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION 2: EXCLUSIVE HAMPER CHOCOLATES */}
              <div className="card-panel">
                <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h2 style={{ fontSize: '17px', margin: 0, color: '#800020', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className="fa-solid fa-cookie-bite" style={{ color: '#c5a059' }}></i>
                      Exclusive Hamper Chocolates ({hamperChocolates.length})
                    </h2>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6b7280' }}>
                      Artisanal chocolates and sweet treats shown ONLY in the Custom Hamper builder. Users can also request custom chocolates.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleOpenAddChocolate}
                    style={{ padding: '7px 14px', fontSize: '12px' }}
                  >
                    <i className="fa-solid fa-plus"></i> New Chocolate
                  </button>
                </div>

                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Chocolate / Treat</th>
                        <th>Pieces / Pack</th>
                        <th>Price (₹)</th>
                        <th>MRP (₹)</th>
                        <th>Badge</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hamperChocolates.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: '#6b7280' }}>
                            <i className="fa-solid fa-cookie-bite" style={{ fontSize: '32px', color: '#c5a059', marginBottom: '8px', display: 'block' }}></i>
                            No chocolates found. Click "+ Add Chocolate" to create treats for hampers.
                          </td>
                        </tr>
                      ) : (
                        hamperChocolates.map(choc => {
                          const chocId = choc._id || choc.id;
                          return (
                            <tr key={chocId}>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <img
                                    src={choc.image || '/images/psimg/gift2.jpeg'}
                                    alt={choc.name}
                                    style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #e8e2d8' }}
                                    onError={(e) => { e.target.src = '/images/psimg/gift2.jpeg'; }}
                                  />
                                  <div>
                                    <strong style={{ fontSize: '13.5px', color: '#1e1e24' }}>{choc.name}</strong>
                                    {choc.description && (
                                      <p style={{ fontSize: '11px', color: '#6b7280', margin: '2px 0 0', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {choc.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td style={{ fontSize: '12.5px', color: '#555' }}>
                                {choc.pieces || 'Gourmet Pack'}
                              </td>
                              <td>
                                <strong style={{ fontSize: '14px', color: '#800020' }}>
                                  ₹{Number(choc.price).toLocaleString('en-IN')}
                                </strong>
                              </td>
                              <td>
                                <span style={{ fontSize: '12px', textDecoration: 'line-through', color: '#9ca3af' }}>
                                  ₹{Number(choc.mrp || choc.price).toLocaleString('en-IN')}
                                </span>
                              </td>
                              <td>
                                {choc.badge ? (
                                  <span className="badge-chip badge-hot" style={{ fontSize: '10px' }}>{choc.badge}</span>
                                ) : (
                                  <span style={{ color: '#9ca3af', fontSize: '11px' }}>—</span>
                                )}
                              </td>
                              <td>
                                <span style={{
                                  display: 'inline-block',
                                  background: choc.isActive !== false ? '#dcfce7' : '#fee2e2',
                                  color: choc.isActive !== false ? '#15803d' : '#b91c1c',
                                  fontSize: '11px',
                                  padding: '3px 8px',
                                  borderRadius: '10px',
                                  fontWeight: '600'
                                }}>
                                  {choc.isActive !== false ? 'Active' : 'Hidden'}
                                </span>
                              </td>
                              <td>
                                <div className="action-buttons-cell" style={{ display: 'flex', gap: '6px' }}>
                                  <button
                                    type="button"
                                    className="btn-action-icon edit"
                                    title="Edit Chocolate"
                                    onClick={() => handleOpenEditChocolate(choc)}
                                  >
                                    <i className="fa-solid fa-pen-to-square"></i>
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-action-icon delete"
                                    title="Delete Chocolate"
                                    onClick={() => handleDeleteChocolate(choc)}
                                  >
                                    <i className="fa-solid fa-trash-can"></i>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ==========================================================
           MODALS (Add/Edit Product, Price, Coupon, Offer, Order)
      ========================================================== */}

      {/* 1. PRODUCT MODAL */}
      {modalState.product && (
        <div className="admin-modal active">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>
                <i className="fa-solid fa-gem" style={{ color: '#c5a059' }}></i>
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <span className="close-modal" onClick={() => setModalState(prev => ({ ...prev, product: false }))}>&times;</span>
            </div>
            <form onSubmit={handleSaveProduct} className="modal-body-scroll">
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label>Product Title *</label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="e.g. Royal Diamond Ring"
                  required
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ margin: 0 }}>Category *</label>
                    <button
                      type="button"
                      onClick={handleOpenAddCategory}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#800020',
                        fontSize: '11px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        padding: '0',
                        textDecoration: 'underline'
                      }}
                    >
                      + Add New Category
                    </button>
                  </div>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                  >
                    {categories.length > 0 ? (
                      categories.map(cat => (
                        <option key={cat._id || cat.slug} value={cat.slug}>
                          {cat.name}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="ring">Ring</option>
                        <option value="necklace">Necklace</option>
                        <option value="earring">Earring</option>
                        <option value="bangle">Bangle</option>
                        <option value="gift">Customized Gift</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="form-group">
                  <label>Badge</label>
                  <select
                    value={productForm.badge}
                    onChange={(e) => setProductForm({ ...productForm, badge: e.target.value })}
                  >
                    <option value="">None</option>
                    <option value="NEW">NEW</option>
                    <option value="SALE">SALE</option>
                    <option value="HOT">HOT</option>
                  </select>
                </div>
              </div>

              <div className="form-row-3">
                <div className="form-group">
                  <label>Selling Price (₹) *</label>
                  <input
                    type="number"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    placeholder="999"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>MRP (₹)</label>
                  <input
                    type="number"
                    value={productForm.mrp}
                    onChange={(e) => setProductForm({ ...productForm, mrp: e.target.value })}
                    placeholder="1499"
                  />
                </div>

                <div className="form-group">
                  <label>Stock Qty</label>
                  <input
                    type="number"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                  />
                </div>
              </div>

              {/* Device Image Upload Area */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageFileUpload}
              />

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span>Product Image *</span>
                  <span style={{ fontSize: '11px', color: '#c5a059', fontWeight: '500' }}>
                    <i className="fa-solid fa-mobile-screen" style={{ marginRight: '4px' }}></i>
                    Upload from Phone / Camera / PC
                  </span>
                </label>

                {/* Upload Action Button */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <button
                    type="button"
                    className="btn-gold"
                    style={{
                      flex: 1,
                      padding: '11px 16px',
                      fontSize: '13px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: 'pointer'
                    }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <i className="fa-solid fa-camera"></i>
                    <span>Take Photo / Upload from Device</span>
                  </button>
                  {productForm.image && (
                    <button
                      type="button"
                      className="btn-outline"
                      style={{ padding: '10px 14px', fontSize: '12px', color: '#ef4444', borderColor: '#fca5a5' }}
                      onClick={() => setProductForm(prev => ({ ...prev, image: '' }))}
                      title="Clear Image"
                    >
                      <i className="fa-solid fa-trash"></i> Remove
                    </button>
                  )}
                </div>

                {/* Live Image Preview Card */}
                {productForm.image ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 14px',
                    background: '#faf8f5',
                    borderRadius: '10px',
                    border: '1px solid #ebd7be'
                  }}>
                    <img
                      src={getValidImageUrl(productForm)}
                      alt="Preview"
                      style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #c5a059', flexShrink: 0 }}
                      onError={(e) => { e.target.src = '/images/psimg/ring1.jpg'; }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '12px', fontWeight: '600', color: '#800020', margin: '0 0 2px 0' }}>
                        <i className="fa-solid fa-circle-check" style={{ color: '#16a34a', marginRight: '5px' }}></i>
                        Image Ready to Save
                      </p>
                      <span style={{ fontSize: '11px', color: '#6b7280', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {productForm.image.startsWith('data:') ? 'Custom Photo from your device' : productForm.image}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: '2px dashed #c5a059',
                      borderRadius: '10px',
                      padding: '20px 14px',
                      textAlign: 'center',
                      background: '#faf8f5',
                      cursor: 'pointer'
                    }}
                  >
                    <i className="fa-solid fa-cloud-arrow-up" style={{ fontSize: '28px', color: '#800020', marginBottom: '6px' }}></i>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: '#800020', margin: '0 0 3px 0' }}>
                      Tap to select photo from Phone or Camera
                    </p>
                    <span style={{ fontSize: '11px', color: '#6b7280' }}>
                      Optimized for any mobile phone, tablet, or desktop
                    </span>
                  </div>
                )}

                {/* Quick Presets Row */}
                <div style={{ marginTop: '10px' }}>
                  <span style={{ fontSize: '11px', color: '#888', display: 'block', marginBottom: '5px' }}>
                    Or select a store sample image:
                  </span>
                  <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                    {SAMPLE_PRESETS.map((sp, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setProductForm(prev => ({ ...prev, image: sp.url, category: prev.category || sp.cat }))}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 8px',
                          fontSize: '11px',
                          borderRadius: '16px',
                          border: productForm.image === sp.url ? '1px solid #800020' : '1px solid #e0e0e0',
                          background: productForm.image === sp.url ? '#800020' : '#fff',
                          color: productForm.image === sp.url ? '#fff' : '#444',
                          whiteSpace: 'nowrap',
                          cursor: 'pointer'
                        }}
                      >
                        <img src={'/' + sp.url} alt="" style={{ width: '16px', height: '16px', borderRadius: '50%', objectFit: 'cover' }} />
                        {sp.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Optional manual URL toggle */}
                <input
                  type="text"
                  value={productForm.image}
                  onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                  placeholder="Or paste external image URL / path..."
                  style={{ marginTop: '8px', fontSize: '12px', padding: '8px 12px' }}
                />
              </div>

              {/* SINGLE IMAGE MULTI-DESIGN OPTIONS (ABCD / 1234) */}
              <div style={{
                background: '#fcfaf7',
                border: '1.5px solid #ebd7be',
                borderRadius: '12px',
                padding: '14px 16px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="checkbox"
                      id="hasDesignVariants"
                      checked={Boolean(productForm.hasDesignVariants)}
                      onChange={(e) => setProductForm(prev => ({
                        ...prev,
                        hasDesignVariants: e.target.checked
                      }))}
                      style={{ width: '18px', height: '18px', accentColor: '#800020', cursor: 'pointer' }}
                    />
                    <label htmlFor="hasDesignVariants" style={{ cursor: 'pointer', fontWeight: '700', fontSize: '13.5px', color: '#800020', margin: 0 }}>
                      <i className="fa-solid fa-shapes" style={{ color: '#c5a059', marginRight: '6px' }}></i>
                      Single Image Multi-Design Options (ABCD / 1234)
                    </label>
                  </div>
                  <span style={{
                    fontSize: '11px',
                    padding: '3px 8px',
                    borderRadius: '12px',
                    background: productForm.hasDesignVariants ? '#dcfce7' : '#f3f4f6',
                    color: productForm.hasDesignVariants ? '#15803d' : '#6b7280',
                    fontWeight: '600'
                  }}>
                    {productForm.hasDesignVariants ? 'ACTIVE' : 'OFF'}
                  </span>
                </div>
                
                <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 12px 28px', lineHeight: '1.4' }}>
                  Enable this if your single product photo displays multiple design choices marked with A, B, C, D or 1, 2, 3, 4 so customers can pick their exact choice.
                </p>

                {productForm.hasDesignVariants && (
                  <div style={{ paddingLeft: '28px' }}>
                    {/* Variant Type Selection */}
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>
                        Design Labeling Type:
                      </label>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setProductForm(prev => ({
                              ...prev,
                              variantType: 'abcd',
                              customVariantsText: 'Design A, Design B, Design C, Design D'
                            }));
                          }}
                          style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            border: productForm.variantType === 'abcd' ? '2px solid #800020' : '1px solid #d1d5db',
                            background: productForm.variantType === 'abcd' ? '#800020' : '#fff',
                            color: productForm.variantType === 'abcd' ? '#fff' : '#374151',
                            fontWeight: productForm.variantType === 'abcd' ? '600' : '400'
                          }}
                        >
                          🔤 Alphabetical (A, B, C, D...)
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setProductForm(prev => ({
                              ...prev,
                              variantType: '1234',
                              customVariantsText: 'Option 1, Option 2, Option 3, Option 4'
                            }));
                          }}
                          style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            border: productForm.variantType === '1234' ? '2px solid #800020' : '1px solid #d1d5db',
                            background: productForm.variantType === '1234' ? '#800020' : '#fff',
                            color: productForm.variantType === '1234' ? '#fff' : '#374151',
                            fontWeight: productForm.variantType === '1234' ? '600' : '400'
                          }}
                        >
                          🔢 Numerical (1, 2, 3, 4...)
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setProductForm(prev => ({
                              ...prev,
                              variantType: 'custom'
                            }));
                          }}
                          style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            border: productForm.variantType === 'custom' ? '2px solid #800020' : '1px solid #d1d5db',
                            background: productForm.variantType === 'custom' ? '#800020' : '#fff',
                            color: productForm.variantType === 'custom' ? '#fff' : '#374151',
                            fontWeight: productForm.variantType === 'custom' ? '600' : '400'
                          }}
                        >
                          ✏️ Custom Options
                        </button>
                      </div>
                    </div>

                    {/* Quick Option count presets */}
                    <div style={{ marginBottom: '10px' }}>
                      <span style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '5px' }}>
                        Quick count presets:
                      </span>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {[
                          { label: '2 Choices (A, B)', val: 'Design A, Design B' },
                          { label: '3 Choices (A, B, C)', val: 'Design A, Design B, Design C' },
                          { label: '4 Choices (A, B, C, D)', val: 'Design A, Design B, Design C, Design D' },
                          { label: '6 Choices (A to F)', val: 'Design A, Design B, Design C, Design D, Design E, Design F' },
                          { label: '1, 2, 3, 4', val: 'Option 1, Option 2, Option 3, Option 4' }
                        ].map((preset, pIdx) => (
                          <button
                            key={pIdx}
                            type="button"
                            onClick={() => {
                              setProductForm(prev => ({
                                ...prev,
                                customVariantsText: preset.val,
                                variantType: preset.val.includes('Option') ? '1234' : 'abcd'
                              }));
                            }}
                            style={{
                              fontSize: '11px',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              background: '#f3f4f6',
                              border: '1px solid #e5e7eb',
                              cursor: 'pointer',
                              color: '#4b5563'
                            }}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Editable Options Input */}
                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>
                        Variant Labels (comma-separated):
                      </label>
                      <input
                        type="text"
                        value={productForm.customVariantsText}
                        onChange={(e) => setProductForm({ ...productForm, customVariantsText: e.target.value })}
                        placeholder="e.g. Design A, Design B, Design C, Design D"
                        style={{ width: '100%', padding: '8px 12px', fontSize: '13px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                      />
                      <span style={{ fontSize: '11px', color: '#6b7280', marginTop: '3px', display: 'block' }}>
                        Each comma creates one selectable option for customers.
                      </span>
                    </div>

                    {/* Live Preview */}
                    <div style={{ background: '#fff', padding: '10px 14px', borderRadius: '8px', border: '1px dashed #c5a059' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#800020', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>
                        <i className="fa-solid fa-eye" style={{ marginRight: '5px' }}></i>
                        Customer Preview on Product Page:
                      </span>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {(productForm.customVariantsText || 'Design A, Design B, Design C, Design D')
                          .split(',')
                          .map(v => v.trim())
                          .filter(Boolean)
                          .map((opt, i) => (
                            <span
                              key={i}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '4px 10px',
                                borderRadius: '16px',
                                border: i === 0 ? '2px solid #800020' : '1px solid #d1d5db',
                                background: i === 0 ? '#800020' : '#f9fafb',
                                color: i === 0 ? '#fff' : '#374151',
                                fontSize: '11.5px',
                                fontWeight: '600'
                              }}
                            >
                              {i === 0 && <i className="fa-solid fa-check" style={{ fontSize: '9px' }}></i>}
                              {opt}
                            </span>
                          ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label>Description</label>
                <textarea
                  rows="3"
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Handcrafted luxury design..."
                ></textarea>
              </div>

              <div className="modal-footer-btns">
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setModalState(prev => ({ ...prev, product: false }))}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-gold">
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD NEW CATEGORY MODAL */}
      {modalState.category && (
        <div className="admin-modal active">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>
                <i className="fa-solid fa-folder-plus" style={{ color: '#c5a059' }}></i>
                Add New Store Category
              </h3>
              <span className="close-modal" onClick={() => setModalState(prev => ({ ...prev, category: false }))}>&times;</span>
            </div>
            <form onSubmit={handleSaveCategory} className="modal-body-scroll">
              <p style={{ fontSize: '12.5px', color: '#6b7280', marginBottom: '14px' }}>
                Create a new jewellery category with full options. It will immediately appear in your store filters, products, and admin panel.
              </p>

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label>Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Anklets, Mangalsutra, Pendants..."
                  value={categoryForm.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
                    setCategoryForm(prev => ({ ...prev, name, slug }));
                  }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label>Category Slug (URL Identifier)</label>
                <input
                  type="text"
                  placeholder="e.g. anklets"
                  value={categoryForm.slug}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') }))}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label>Icon Class (FontAwesome)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="e.g. fa-solid fa-gem"
                    value={categoryForm.icon}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, icon: e.target.value }))}
                    style={{ flex: 1 }}
                  />
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#f9fafb',
                    color: '#800020',
                    fontSize: '18px'
                  }}>
                    <i className={categoryForm.icon || 'fa-solid fa-gem'}></i>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                  {[
                    { icon: 'fa-solid fa-gem', label: 'Gem' },
                    { icon: 'fa-solid fa-ring', label: 'Ring' },
                    { icon: 'fa-solid fa-gift', label: 'Gift' },
                    { icon: 'fa-solid fa-crown', label: 'Crown' },
                    { icon: 'fa-solid fa-star', label: 'Star' },
                    { icon: 'fa-solid fa-heart', label: 'Heart' },
                    { icon: 'fa-solid fa-sparkles', label: 'Sparkles' }
                  ].map(ic => (
                    <button
                      key={ic.icon}
                      type="button"
                      onClick={() => setCategoryForm(prev => ({ ...prev, icon: ic.icon }))}
                      style={{
                        padding: '3px 8px',
                        fontSize: '11px',
                        borderRadius: '6px',
                        border: categoryForm.icon === ic.icon ? '1px solid #800020' : '1px solid #e5e7eb',
                        background: categoryForm.icon === ic.icon ? '#800020' : '#fff',
                        color: categoryForm.icon === ic.icon ? '#fff' : '#4b5563',
                        cursor: 'pointer'
                      }}
                    >
                      <i className={ic.icon} style={{ marginRight: '4px' }}></i>{ic.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label>Description</label>
                <textarea
                  rows="2"
                  placeholder="Brief luxury description for this category..."
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label>Banner / Category Image URL (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. /images/psimg/ring1.jpg or https://..."
                  value={categoryForm.image}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, image: e.target.value }))}
                />
              </div>

              <div className="modal-footer-btns">
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setModalState(prev => ({ ...prev, category: false }))}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-gold">
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. QUICK PRICE UPDATE MODAL */}
      {modalState.price && editingPriceProd && (
        <div className="admin-modal active">
          <div className="modal-content" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3>
                <i className="fa-solid fa-tag" style={{ color: '#c5a059' }}></i>
                Quick Price Update
              </h3>
              <span className="close-modal" onClick={() => setModalState(prev => ({ ...prev, price: false }))}>&times;</span>
            </div>
            <form onSubmit={handleSaveQuickPrice} className="modal-body-scroll">
              <p style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>
                Updating selling price for: <strong>{editingPriceProd.name}</strong>
              </p>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label>New Price (₹)</label>
                <input
                  type="number"
                  value={newPriceVal}
                  onChange={(e) => setNewPriceVal(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div className="modal-footer-btns">
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setModalState(prev => ({ ...prev, price: false }))}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-gold">
                  Update Price
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK STOCK QUANTITY UPDATE MODAL */}
      {modalState.stock && editingStockProd && (
        <div className="admin-modal active">
          <div className="modal-content" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3>
                <i className="fa-solid fa-boxes-stacked" style={{ color: '#c5a059' }}></i>
                Quick Stock Quantity Update
              </h3>
              <span className="close-modal" onClick={() => setModalState(prev => ({ ...prev, stock: false }))}>&times;</span>
            </div>
            <form onSubmit={handleSaveQuickStock} className="modal-body-scroll">
              <p style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>
                Updating available inventory for: <strong>{editingStockProd.name}</strong>
              </p>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label>Available Stock Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={newStockVal}
                  onChange={(e) => setNewStockVal(e.target.value)}
                  autoFocus
                  required
                />
                <span style={{ fontSize: '11.5px', color: '#888', marginTop: '6px', display: 'block' }}>
                  Customers will only be allowed to purchase up to this available quantity.
                </span>
              </div>
              <div className="modal-footer-btns">
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setModalState(prev => ({ ...prev, stock: false }))}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-gold">
                  Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. COUPON MODAL */}
      {modalState.coupon && (
        <div className="admin-modal active">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>
                <i className="fa-solid fa-ticket" style={{ color: '#c5a059' }}></i>
                Create Discount Coupon
              </h3>
              <span className="close-modal" onClick={() => setModalState(prev => ({ ...prev, coupon: false }))}>&times;</span>
            </div>
            <form onSubmit={handleSaveCoupon} className="modal-body-scroll">
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label>Coupon Code (e.g. LUXURY20, FESTIVE25) *</label>
                <input
                  type="text"
                  value={couponForm.code}
                  onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                  style={{ textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: '700', letterSpacing: '1px' }}
                  placeholder="e.g. FESTIVE20"
                  required
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Discount Type</label>
                  <select
                    value={couponForm.discountType}
                    onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value })}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Flat (₹)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Discount Value *</label>
                  <input
                    type="number"
                    value={couponForm.discountValue}
                    onChange={(e) => setCouponForm({ ...couponForm, discountValue: e.target.value })}
                    placeholder={couponForm.discountType === 'percentage' ? '15 (for 15%)' : '500 (for ₹500)'}
                    required
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Min Purchase (₹)</label>
                  <input
                    type="number"
                    value={couponForm.minSpend}
                    onChange={(e) => setCouponForm({ ...couponForm, minSpend: e.target.value })}
                    placeholder="499"
                  />
                </div>
                <div className="form-group">
                  <label>Expiry Date</label>
                  <input
                    type="date"
                    value={couponForm.expiryDate}
                    onChange={(e) => setCouponForm({ ...couponForm, expiryDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label>Offer Description</label>
                <input
                  type="text"
                  value={couponForm.description || ''}
                  onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
                  placeholder="e.g. 15% OFF on orders above ₹999"
                />
              </div>

              {/* Coupon Active Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', background: '#faf8f5', padding: '10px 14px', borderRadius: '10px', border: '1px solid #ebd7be' }}>
                <input
                  type="checkbox"
                  id="couponActiveCheckbox"
                  checked={couponForm.active !== false}
                  onChange={(e) => setCouponForm({ ...couponForm, active: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#800020', cursor: 'pointer' }}
                />
                <label htmlFor="couponActiveCheckbox" style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#166534', cursor: 'pointer' }}>
                  Enable & Activate coupon immediately (ON)
                </label>
              </div>

              <div className="modal-footer-btns">
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setModalState(prev => ({ ...prev, coupon: false }))}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-gold">
                  Create Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. DEAL / OFFER MODAL */}
      {modalState.offer && (
        <div className="admin-modal active">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>
                <i className="fa-solid fa-bullhorn" style={{ color: '#c5a059' }}></i>
                Add Promotional Deal
              </h3>
              <span className="close-modal" onClick={() => setModalState(prev => ({ ...prev, offer: false }))}>&times;</span>
            </div>
            <form onSubmit={handleSaveOffer} className="modal-body-scroll">
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label>Badge</label>
                <input
                  type="text"
                  value={offerForm.badge}
                  onChange={(e) => setOfferForm({ ...offerForm, badge: e.target.value })}
                  placeholder="e.g. FLASH SALE, SPECIAL PERK"
                />
              </div>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label>Headline *</label>
                <input
                  type="text"
                  value={offerForm.title}
                  onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })}
                  placeholder="e.g. Festive Sparkle Sale"
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label>Details</label>
                <textarea
                  rows="2"
                  value={offerForm.description}
                  onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })}
                  placeholder="Flat 15% discount across bridal jewelry..."
                ></textarea>
              </div>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label>Linked Coupon Code</label>
                <input
                  type="text"
                  value={offerForm.couponCode}
                  onChange={(e) => setOfferForm({ ...offerForm, couponCode: e.target.value.toUpperCase() })}
                  placeholder="e.g. FESTIVE20"
                />
              </div>
              <div className="modal-footer-btns">
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setModalState(prev => ({ ...prev, offer: false }))}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-gold">
                  Save Deal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. ORDER DETAIL & INVOICE MODAL */}
      {/* 5. ORDER DETAIL & INVOICE MODAL */}
      {modalState.order && viewingOrder && (() => {
        const custName = viewingOrder.shippingAddress?.fullName || viewingOrder.shippingAddress?.name || viewingOrder.customer?.name || viewingOrder.user?.name || 'Customer';
        const custPhone = viewingOrder.shippingAddress?.phone || viewingOrder.shippingAddress?.mobile || viewingOrder.customer?.mobile || viewingOrder.user?.phone || viewingOrder.user?.mobile || '-';
        const custEmail = viewingOrder.shippingAddress?.email || viewingOrder.customer?.email || viewingOrder.user?.email || '-';
        const custAddress = viewingOrder.shippingAddress
          ? `${viewingOrder.shippingAddress.address || ''}, ${viewingOrder.shippingAddress.city || ''}, ${viewingOrder.shippingAddress.state || ''} - ${viewingOrder.shippingAddress.pincode || ''}`
          : (viewingOrder.customer?.address || 'Standard Delivery');
        const orderDate = viewingOrder.date || (viewingOrder.createdAt ? new Date(viewingOrder.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-');

        const hamperItems = (viewingOrder.items || []).filter(it => it.isHamper || it.hamperData);
        const regularItems = (viewingOrder.items || []).filter(it => !it.isHamper && !it.hamperData);

        const getRibbonColorHex = (rName) => {
          const r = String(rName || '').toLowerCase();
          if (r.includes('gold')) return '#c5a059';
          if (r.includes('maroon') || r.includes('red')) return '#800020';
          if (r.includes('champagne') || r.includes('ivory')) return '#e8d8be';
          if (r.includes('emerald') || r.includes('green')) return '#0f5132';
          if (r.includes('rose') || r.includes('pink')) return '#f472b6';
          return '#c5a059';
        };

        return (
          <div className="admin-modal active">
            <div className="modal-content" style={{ maxWidth: '820px', width: '95%', maxHeight: '90vh' }}>
              <div className="modal-header" style={{ borderBottom: '2px solid #c5a059' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#800020', fontFamily: 'Cinzel, serif', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {hamperItems.length > 0 && <span>🎁</span>}
                    Order #{viewingOrder.orderId} Details
                  </h3>
                  <small style={{ color: '#666', fontSize: '12px' }}>Placed on: {orderDate}</small>
                </div>
                <span className="close-modal" onClick={() => setModalState(prev => ({ ...prev, order: false }))}>&times;</span>
              </div>

              <div className="modal-body-scroll" style={{ padding: '20px' }}>
                {/* Customer and Delivery Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', background: '#faf8f5', border: '1px solid #ebd7be', padding: '14px 16px', borderRadius: '10px', flexWrap: 'wrap', gap: '14px' }}>
                  <div style={{ minWidth: '220px' }}>
                    <strong style={{ color: '#800020', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                      <i className="fa-solid fa-user" style={{ marginRight: '6px', color: '#c5a059' }}></i> Customer Details:
                    </strong>
                    <p style={{ margin: '3px 0', fontSize: '13.5px', fontWeight: '600' }}>{custName}</p>
                    <p style={{ margin: '3px 0', fontSize: '12.5px', color: '#555' }}>📞 +91 {custPhone}</p>
                    <p style={{ margin: '3px 0', fontSize: '12.5px', color: '#555' }}>✉ {custEmail}</p>
                  </div>
                  <div style={{ textAlign: 'right', maxWidth: '340px', flex: 1 }}>
                    <strong style={{ color: '#800020', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                      <i className="fa-solid fa-location-dot" style={{ marginRight: '6px', color: '#c5a059' }}></i> Delivery Address:
                    </strong>
                    <p style={{ margin: '3px 0', fontSize: '12.5px', color: '#444', lineHeight: '1.4' }}>
                      {custAddress}
                    </p>
                    <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Status:</label>
                      <select
                        value={viewingOrder.status || viewingOrder.orderStatus || 'Order Received (Verification in 24h)'}
                        onChange={(e) => {
                          const newSt = e.target.value;
                          handleUpdateOrderStatus(viewingOrder.orderId, newSt);
                          setViewingOrder(prev => ({ ...prev, status: newSt, orderStatus: newSt }));
                        }}
                        style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', borderColor: '#c5a059' }}
                      >
                        <option value="Order Received (Verification in 24h)">Order Received (Verification in 24h)</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* SECTION: CUSTOM HAMPER DETAILS (Rendered if this order has hampers) */}
                {hamperItems.length > 0 && (
                  <div style={{ marginBottom: '22px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <span style={{ fontSize: '20px' }}>🎁</span>
                      <h4 style={{ margin: 0, color: '#800020', fontFamily: 'Cinzel, serif', fontSize: '16px' }}>
                        Custom Luxury Hamper Specifications ({hamperItems.length})
                      </h4>
                    </div>

                    {hamperItems.map((hItem, hIdx) => {
                      const hData = hItem.hamperData || {};
                      const box = hData.box || {};
                      const pers = hData.personalization || {};
                      const allProducts = Array.isArray(hData.products) ? hData.products : [];

                      // Separate jewellery and chocolates
                      const chocs = allProducts.filter(p => {
                        const itemObj = p.product || p;
                        return itemObj.category === 'chocolates' || itemObj.isChocolate || itemObj.isCustomChocolate;
                      });

                      const jewels = allProducts.filter(p => {
                        const itemObj = p.product || p;
                        return itemObj.category !== 'chocolates' && !itemObj.isChocolate && !itemObj.isCustomChocolate;
                      });

                      return (
                        <div
                          key={hIdx}
                          style={{
                            background: '#fffdfa',
                            border: '1.5px solid #c5a059',
                            borderRadius: '12px',
                            padding: '18px 20px',
                            marginBottom: '16px',
                            boxShadow: '0 3px 12px rgba(128,0,32,0.06)'
                          }}
                        >
                          {/* Hamper Title & Price Banner */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #ebd7be', paddingBottom: '12px', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ background: '#800020', color: '#fff', fontSize: '10px', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                  CUSTOM HAMPER #{hIdx + 1}
                                </span>
                                <h4 style={{ margin: 0, color: '#800020', fontFamily: 'Cinzel, serif', fontSize: '16px' }}>
                                  {hItem.name}
                                </h4>
                              </div>
                              <span style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginTop: '3px' }}>
                                Quantity: <strong>{hItem.quantity || 1}</strong> • Total Items Inside: <strong>{allProducts.length}</strong>
                              </span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', display: 'block' }}>Hamper Subtotal</span>
                              <strong style={{ color: '#800020', fontSize: '18px', fontWeight: '700' }}>
                                ₹{(Number(hItem.price) * (Number(hItem.quantity) || 1)).toLocaleString('en-IN')}
                              </strong>
                            </div>
                          </div>

                          {/* 1. Hamper Box Specs */}
                          {box.name ? (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '14px',
                              background: '#faf6f0',
                              border: '1px solid #ebd7be',
                              borderRadius: '8px',
                              padding: '10px 14px',
                              marginBottom: '14px'
                            }}>
                              <img
                                src={box.image || '/images/psimg/gift1.png'}
                                alt={box.name}
                                style={{ width: '52px', height: '52px', borderRadius: '6px', objectFit: 'cover', border: '1px solid #c5a059', flexShrink: 0 }}
                                onError={(e) => { e.target.src = '/images/psimg/gift1.png'; }}
                              />
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <strong style={{ color: '#2b0008', fontSize: '13.5px' }}>
                                    📦 Box: {box.name}
                                  </strong>
                                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#800020' }}>
                                    ₹{Number(box.price || 0).toLocaleString('en-IN')}
                                  </span>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '11.5px', color: '#555', marginTop: '3px' }}>
                                  {box.color && <span>Color: <strong>{box.color}</strong></span>}
                                  {box.style && <span>Style: <strong>{box.style}</strong></span>}
                                  {box.dimensions && <span>Size: <strong>{box.dimensions}</strong></span>}
                                  {box.capacity && <span>Capacity: <strong>Fits {box.capacity} items</strong></span>}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div style={{ background: '#faf6f0', padding: '8px 12px', borderRadius: '6px', marginBottom: '14px', fontSize: '12px', color: '#666' }}>
                              📦 Standard Keepsake Box
                            </div>
                          )}

                          {/* 2. Personalization & Gift Customization Card */}
                          <div style={{
                            background: '#fff',
                            border: '1px solid #ebd7be',
                            borderRadius: '8px',
                            padding: '14px',
                            marginBottom: '14px'
                          }}>
                            <h5 style={{ margin: '0 0 10px', fontSize: '12px', color: '#800020', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <i className="fa-solid fa-ribbon" style={{ color: '#c5a059' }}></i>
                              Gift Personalization & Card Specifications
                            </h5>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                              <div>
                                <span style={{ fontSize: '11px', color: '#888', display: 'block', textTransform: 'uppercase' }}>Recipient (To):</span>
                                <strong style={{ color: '#800020', fontSize: '14px' }}>
                                  {pers.recipientName || 'Not specified'}
                                </strong>
                              </div>
                              <div>
                                <span style={{ fontSize: '11px', color: '#888', display: 'block', textTransform: 'uppercase' }}>Sender (From):</span>
                                <strong style={{ color: '#1e1e24', fontSize: '13.5px' }}>
                                  {pers.senderName || 'Anonymous / Self'}
                                </strong>
                              </div>
                              <div>
                                <span style={{ fontSize: '11px', color: '#888', display: 'block', textTransform: 'uppercase' }}>Occasion:</span>
                                <strong style={{ color: '#1e1e24', fontSize: '13px' }}>
                                  🎉 {pers.occasion || 'Celebration'}
                                </strong>
                              </div>
                              <div>
                                <span style={{ fontSize: '11px', color: '#888', display: 'block', textTransform: 'uppercase' }}>Ribbon Selected:</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                  <span style={{
                                    width: '14px',
                                    height: '14px',
                                    borderRadius: '50%',
                                    display: 'inline-block',
                                    backgroundColor: getRibbonColorHex(pers.ribbonColor),
                                    border: '1px solid #999',
                                    flexShrink: 0
                                  }}></span>
                                  <strong style={{ color: '#1e1e24', fontSize: '13px' }}>
                                    {pers.ribbonColor || 'Royal Gold'}
                                  </strong>
                                </div>
                              </div>
                              <div style={{ gridColumn: 'span 2' }}>
                                <span style={{ fontSize: '11px', color: '#888', display: 'block', textTransform: 'uppercase' }}>Greeting Card:</span>
                                <strong style={{ color: '#1e1e24', fontSize: '13px' }}>
                                  📜 {pers.cardDesign || pers.cardTitle || 'Panch Sattva Royal Gold Foil Card'}
                                </strong>
                              </div>
                            </div>

                            {/* Handwritten Message Box */}
                            <div style={{
                              background: '#fffdf5',
                              borderLeft: '4px solid #c5a059',
                              borderTop: '1px solid #faeed4',
                              borderRight: '1px solid #faeed4',
                              borderBottom: '1px solid #faeed4',
                              borderRadius: '6px',
                              padding: '10px 14px'
                            }}>
                              <span style={{ fontSize: '11.5px', fontWeight: 'bold', color: '#800020', display: 'block', marginBottom: '3px' }}>
                                ✍️ Handwritten Note Content (to write in card):
                              </span>
                              <p style={{ margin: 0, fontStyle: 'italic', fontSize: '13px', color: '#3f3014', lineHeight: '1.5' }}>
                                "{pers.giftMessage || pers.message || 'No personal message requested'}"
                              </p>
                            </div>
                          </div>

                          {/* 3. Included Treasures: Jewellery */}
                          <div style={{ marginBottom: '14px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#800020', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
                              💎 Handcrafted Jewellery Pieces ({jewels.length}):
                            </span>
                            {jewels.length === 0 ? (
                              <div style={{ fontSize: '12px', color: '#888', fontStyle: 'italic' }}>
                                No jewellery items in this hamper.
                              </div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {jewels.map((jItem, jIdx) => {
                                  const jObj = jItem.product || jItem;
                                  return (
                                    <div
                                      key={jIdx}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        background: '#fff',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        padding: '8px 12px'
                                      }}
                                    >
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <img
                                          src={getValidImageUrl(jObj)}
                                          alt={jObj.name}
                                          style={{ width: '42px', height: '42px', borderRadius: '6px', objectFit: 'cover', border: '1px solid #ddd' }}
                                          onError={(e) => { e.target.src = '/images/psimg/ring1.jpg'; }}
                                        />
                                        <div>
                                          <strong style={{ fontSize: '13px', color: '#1e1e24' }}>
                                            {jObj.name}
                                          </strong>
                                          <div style={{ display: 'flex', gap: '10px', fontSize: '11px', color: '#666', marginTop: '2px' }}>
                                            <span>Category: <strong>{jObj.category || 'Jewellery'}</strong></span>
                                            {jObj.selectedVariant && (
                                              <span style={{ color: '#800020', fontWeight: 'bold' }}>
                                                Design: {jObj.selectedVariant}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <div style={{ textAlign: 'right' }}>
                                        <span style={{ fontSize: '12px', color: '#666' }}>Qty: {jItem.quantity || 1}</span>
                                        <div style={{ fontWeight: '700', color: '#800020', fontSize: '13px' }}>
                                          ₹{Number(jItem.unitPrice || jObj.price || 0).toLocaleString('en-IN')}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* 4. Included Chocolates (or Note if None) */}
                          <div>
                            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#800020', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
                              🍫 Chocolates & Sweet Treats ({chocs.length}):
                            </span>
                            {chocs.length === 0 ? (
                              <div style={{
                                background: '#f9f9f9',
                                border: '1px dashed #d1d5db',
                                borderRadius: '8px',
                                padding: '10px 14px',
                                fontSize: '12.5px',
                                color: '#6b7280'
                              }}>
                                🍫 <strong>Chocolates: None added</strong> (Optional feature — customer built hamper with jewellery only).
                              </div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {chocs.map((cItem, cIdx) => {
                                  const cObj = cItem.product || cItem;
                                  const isCustom = Boolean(cObj.isCustomChocolate);

                                  return (
                                    <div
                                      key={cIdx}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        background: isCustom ? '#fefce8' : '#faf6f0',
                                        border: isCustom ? '1.5px dashed #ca8a04' : '1px solid #ebd7be',
                                        borderRadius: '8px',
                                        padding: '10px 12px'
                                      }}
                                    >
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        {isCustom ? (
                                          <div style={{ width: '42px', height: '42px', borderRadius: '6px', background: '#fef08a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                                            🍫
                                          </div>
                                        ) : (
                                          <img
                                            src={cObj.image || '/images/psimg/gift2.jpeg'}
                                            alt={cObj.name}
                                            style={{ width: '42px', height: '42px', borderRadius: '6px', objectFit: 'cover', border: '1px solid #c5a059' }}
                                            onError={(e) => { e.target.src = '/images/psimg/gift2.jpeg'; }}
                                          />
                                        )}
                                        <div>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <strong style={{ fontSize: '13px', color: isCustom ? '#854d0e' : '#2b0008' }}>
                                              {cObj.name}
                                            </strong>
                                            {isCustom && (
                                              <span style={{ background: '#ca8a04', color: '#fff', fontSize: '9.5px', padding: '1px 6px', borderRadius: '6px', fontWeight: 'bold' }}>
                                                USER CUSTOM REQUEST
                                              </span>
                                            )}
                                          </div>
                                          {isCustom && (cObj.customNotes || cObj.notes) && (
                                            <div style={{ fontSize: '12px', color: '#713f12', fontStyle: 'italic', marginTop: '3px', background: '#fffbeb', padding: '3px 8px', borderRadius: '4px', border: '1px solid #fde68a' }}>
                                              📝 <strong>Customer Notes / Brand:</strong> "{cObj.customNotes || cObj.notes}"
                                            </div>
                                          )}
                                          {!isCustom && cObj.pieces && (
                                            <small style={{ color: '#888', fontSize: '11px', display: 'block' }}>
                                              {cObj.pieces}
                                            </small>
                                          )}
                                        </div>
                                      </div>
                                      <div style={{ textAlign: 'right' }}>
                                        <span style={{ fontSize: '12px', color: '#666' }}>Qty: {cItem.quantity || 1}</span>
                                        <div style={{ fontWeight: '700', color: isCustom ? '#854d0e' : '#800020', fontSize: '13px' }}>
                                          ₹{Number(cItem.unitPrice || cObj.price || 0).toLocaleString('en-IN')}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* SECTION: REGULAR (NON-HAMPER) ITEMS */}
                {regularItems.length > 0 && (
                  <div style={{ marginBottom: '18px' }}>
                    <h4 style={{ margin: '0 0 10px', color: '#800020', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Standard Store Items ({regularItems.length})
                    </h4>
                    <table className="admin-table" style={{ marginBottom: '12px' }}>
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th>Size</th>
                          <th>Qty</th>
                          <th>Price</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {regularItems.map((it, idx) => (
                          <tr key={idx}>
                            <td>{it.name}</td>
                            <td>{it.size || '-'}</td>
                            <td>{it.quantity || 1}</td>
                            <td>₹{Number(it.price).toLocaleString('en-IN')}</td>
                            <td><strong>₹{(Number(it.price) * (Number(it.quantity) || 1)).toLocaleString('en-IN')}</strong></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Total and Payment Breakdown */}
                <div style={{ textAlign: 'right', borderTop: '2px solid #ebd7be', paddingTop: '14px', fontSize: '14px' }}>
                  <p style={{ margin: '3px 0' }}>Subtotal: ₹{Number(viewingOrder.subtotal || viewingOrder.totalAmount || viewingOrder.total).toLocaleString('en-IN')}</p>
                  <p style={{ margin: '3px 0' }}>GST (3%): ₹{Number(viewingOrder.gst || 0).toLocaleString('en-IN')}</p>
                  {viewingOrder.discount > 0 && <p style={{ color: '#16a34a', margin: '3px 0' }}>Discount: -₹{viewingOrder.discount}</p>}
                  <h3 style={{ color: '#800020', marginTop: '6px', fontSize: '18px' }}>
                    Grand Total: ₹{Number(viewingOrder.totalAmount || viewingOrder.total).toLocaleString('en-IN')}
                  </h3>
                  {viewingOrder.paymentMode && (
                    <p style={{ color: '#166534', fontWeight: '600', margin: '4px 0' }}>
                      Mode: {viewingOrder.paymentMode}
                    </p>
                  )}
                  {viewingOrder.advancePaid && (
                    <p style={{ color: '#1d4ed8', fontSize: '13px', margin: '2px 0' }}>
                      Advance Online Paid: ₹{viewingOrder.advancePaid}
                    </p>
                  )}
                  {viewingOrder.codBalance !== undefined && (
                    <p style={{ color: '#800020', fontWeight: '700', fontSize: '13.5px', margin: '2px 0' }}>
                      Cash to Collect on Delivery: ₹{Number(viewingOrder.codBalance).toLocaleString('en-IN')}
                    </p>
                  )}
                  {viewingOrder.utr && <small style={{ fontFamily: 'monospace', display: 'block', color: '#666' }}>UTR: {viewingOrder.utr}</small>}
                  {viewingOrder.paymentScreenshot && (
                    <div style={{ marginTop: '10px', textAlign: 'left', background: '#f0fdf4', padding: '10px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                      <strong style={{ color: '#166534', fontSize: '12.5px', display: 'block', marginBottom: '6px' }}>
                        <i className="fa-solid fa-image"></i> Customer ₹99 Payment Screenshot:
                      </strong>
                      <a href={viewingOrder.paymentScreenshot} target="_blank" rel="noreferrer">
                        <img src={viewingOrder.paymentScreenshot} alt="Payment SS" style={{ maxHeight: '120px', borderRadius: '6px', border: '1px solid #ddd' }} />
                      </a>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', flexWrap: 'wrap', gap: '10px' }}>
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={() => handleWhatsAppCustomer(viewingOrder)}
                    style={{ color: '#166534', borderColor: '#22c55e' }}
                  >
                    <i className="fa-brands fa-whatsapp"></i> WhatsApp Customer
                  </button>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn-outline"
                      onClick={() => window.print()}
                    >
                      <i className="fa-solid fa-print"></i> Print Invoice
                    </button>
                    <button
                      type="button"
                      className="btn-gold"
                      onClick={() => setModalState(prev => ({ ...prev, order: false }))}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 6. CUSTOMER MODAL */}
      {modalState.customer && (
        <div className="admin-modal active">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>
                <i className="fa-solid fa-user-plus" style={{ color: '#c5a059' }}></i>
                Add New Customer Record
              </h3>
              <span className="close-modal" onClick={() => setModalState(prev => ({ ...prev, customer: false }))}>&times;</span>
            </div>
            <form onSubmit={handleSaveCustomer} className="modal-body-scroll">
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label>Customer Name *</label>
                <input
                  type="text"
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                  placeholder="Full Name"
                  required
                />
              </div>
              <div className="form-row-2">
                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    value={customerForm.email}
                    onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                    placeholder="email@domain.com"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Mobile Number (10 digits) *</label>
                  <input
                    type="tel"
                    maxLength="10"
                    value={customerForm.mobile}
                    onChange={(e) => setCustomerForm({ ...customerForm, mobile: e.target.value })}
                    placeholder="9876543210"
                    required
                  />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label>Gender</label>
                <select
                  value={customerForm.gender}
                  onChange={(e) => setCustomerForm({ ...customerForm, gender: e.target.value })}
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label>Address / Location</label>
                <textarea
                  rows="2"
                  value={customerForm.address}
                  onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                  placeholder="City, State, complete address..."
                ></textarea>
              </div>
              <div className="modal-footer-btns">
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setModalState(prev => ({ ...prev, customer: false }))}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-gold">
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. HAMPER BOX MODAL (Add/Edit) */}
      {modalState.hamperBox && (
        <div className="admin-modal active">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>
                <i className="fa-solid fa-box-open" style={{ color: '#c5a059', marginRight: '8px' }}></i>
                {editingHamperBox ? 'Edit Hamper Box' : 'Add New Hamper Box'}
              </h3>
              <span className="close-modal" onClick={() => setModalState(prev => ({ ...prev, hamperBox: false }))}>&times;</span>
            </div>
            <form onSubmit={handleSaveHamperBox} className="modal-body-scroll">
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label>Box Title / Name *</label>
                <input
                  type="text"
                  value={hamperBoxForm.name}
                  onChange={(e) => setHamperBoxForm({ ...hamperBoxForm, name: e.target.value })}
                  placeholder="e.g. Royal Velvet Keepsake Trunk"
                  required
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Selling Price (₹) *</label>
                  <input
                    type="number"
                    value={hamperBoxForm.price}
                    onChange={(e) => setHamperBoxForm({ ...hamperBoxForm, price: e.target.value })}
                    placeholder="699"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>MRP (₹)</label>
                  <input
                    type="number"
                    value={hamperBoxForm.mrp}
                    onChange={(e) => setHamperBoxForm({ ...hamperBoxForm, mrp: e.target.value })}
                    placeholder="999"
                  />
                </div>
              </div>

              <div className="form-row-3">
                <div className="form-group">
                  <label>Capacity (Max Items) *</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={hamperBoxForm.capacity}
                    onChange={(e) => setHamperBoxForm({ ...hamperBoxForm, capacity: Number(e.target.value) || 4 })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Color / Shade</label>
                  <input
                    type="text"
                    value={hamperBoxForm.color}
                    onChange={(e) => setHamperBoxForm({ ...hamperBoxForm, color: e.target.value })}
                    placeholder="Deep Royal Maroon"
                  />
                </div>
                <div className="form-group">
                  <label>Badge</label>
                  <select
                    value={hamperBoxForm.badge}
                    onChange={(e) => setHamperBoxForm({ ...hamperBoxForm, badge: e.target.value })}
                  >
                    <option value="">None</option>
                    <option value="BESTSELLER">BESTSELLER</option>
                    <option value="SIGNATURE">SIGNATURE</option>
                    <option value="HANDCRAFTED">HANDCRAFTED</option>
                    <option value="POPULAR">POPULAR</option>
                    <option value="EMPEROR">EMPEROR</option>
                  </select>
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Box Style / Construction</label>
                  <input
                    type="text"
                    value={hamperBoxForm.style}
                    onChange={(e) => setHamperBoxForm({ ...hamperBoxForm, style: e.target.value })}
                    placeholder="e.g. Trunk Box with Brass Clasp"
                  />
                </div>
                <div className="form-group">
                  <label>Dimensions</label>
                  <input
                    type="text"
                    value={hamperBoxForm.dimensions}
                    onChange={(e) => setHamperBoxForm({ ...hamperBoxForm, dimensions: e.target.value })}
                    placeholder='10" × 8" × 4.5"'
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label>Box Image URL / Path</label>
                <input
                  type="text"
                  value={hamperBoxForm.image}
                  onChange={(e) => setHamperBoxForm({ ...hamperBoxForm, image: e.target.value })}
                  placeholder="/images/psimg/gift1.png"
                />
                <div style={{ marginTop: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#666', display: 'block', marginBottom: '6px' }}>
                    Quick Presets:
                  </span>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {[
                      { label: 'Royal Trunk', path: '/images/psimg/gift1.png' },
                      { label: 'Gold Foil Rigid', path: '/images/psimg/gift1 (1).jpeg' },
                      { label: 'Teakwood', path: '/images/psimg/gift3.jpeg' },
                      { label: 'Glass Showcase', path: '/images/psimg/gift 4.jpeg' },
                      { label: 'Banarasi Potli', path: '/images/psimg/gift 5.jpeg' },
                      { label: '2-Tier Grand', path: '/images/psimg/gift 6.jpeg' }
                    ].map(preset => (
                      <button
                        key={preset.path}
                        type="button"
                        onClick={() => setHamperBoxForm({ ...hamperBoxForm, image: preset.path })}
                        style={{
                          fontSize: '11px',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          border: hamperBoxForm.image === preset.path ? '1px solid #800020' : '1px solid #e8e2d8',
                          background: hamperBoxForm.image === preset.path ? '#faf2f4' : '#fff',
                          cursor: 'pointer'
                        }}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label>Description & Royal Lining Details</label>
                <textarea
                  rows="3"
                  value={hamperBoxForm.description}
                  onChange={(e) => setHamperBoxForm({ ...hamperBoxForm, description: e.target.value })}
                  placeholder="e.g. Plush velvet-lined wooden keepsake trunk designed to be treasured forever..."
                ></textarea>
              </div>

              <div className="modal-footer-btns">
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setModalState(prev => ({ ...prev, hamperBox: false }))}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-gold">
                  {editingHamperBox ? 'Update Hamper Box' : 'Save Hamper Box'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. HAMPER CHOCOLATE MODAL (Add/Edit) */}
      {modalState.hamperChocolate && (
        <div className="admin-modal active">
          <div className="modal-content" style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <h3>
                <i className="fa-solid fa-cookie-bite" style={{ color: '#c5a059', marginRight: '8px' }}></i>
                {editingHamperChocolate ? 'Edit Hamper Chocolate' : 'Add Hamper Chocolate'}
              </h3>
              <span className="close-modal" onClick={() => setModalState(prev => ({ ...prev, hamperChocolate: false }))}>&times;</span>
            </div>
            <form onSubmit={handleSaveChocolate} className="modal-body-scroll">
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label>Chocolate / Sweet Name *</label>
                <input
                  type="text"
                  value={hamperChocolateForm.name}
                  onChange={(e) => setHamperChocolateForm({ ...hamperChocolateForm, name: e.target.value })}
                  placeholder="e.g. Artisanal 24K Gold Leaf Dark Truffles"
                  required
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Price (₹) *</label>
                  <input
                    type="number"
                    value={hamperChocolateForm.price}
                    onChange={(e) => setHamperChocolateForm({ ...hamperChocolateForm, price: e.target.value })}
                    placeholder="349"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>MRP (₹)</label>
                  <input
                    type="number"
                    value={hamperChocolateForm.mrp}
                    onChange={(e) => setHamperChocolateForm({ ...hamperChocolateForm, mrp: e.target.value })}
                    placeholder="499"
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Pieces / Pack Description</label>
                  <input
                    type="text"
                    value={hamperChocolateForm.pieces}
                    onChange={(e) => setHamperChocolateForm({ ...hamperChocolateForm, pieces: e.target.value })}
                    placeholder="Box of 6 Handcrafted Truffles"
                  />
                </div>
                <div className="form-group">
                  <label>Badge</label>
                  <select
                    value={hamperChocolateForm.badge}
                    onChange={(e) => setHamperChocolateForm({ ...hamperChocolateForm, badge: e.target.value })}
                  >
                    <option value="">None</option>
                    <option value="GOURMET">GOURMET</option>
                    <option value="HANDCRAFTED">HANDCRAFTED</option>
                    <option value="PREMIUM">PREMIUM</option>
                    <option value="GOLD LEAF">GOLD LEAF</option>
                    <option value="BESTSELLER">BESTSELLER</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label>Chocolate Image URL / Path</label>
                <input
                  type="text"
                  value={hamperChocolateForm.image}
                  onChange={(e) => setHamperChocolateForm({ ...hamperChocolateForm, image: e.target.value })}
                  placeholder="/images/psimg/gift2.jpeg"
                />
                <div style={{ marginTop: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#666', display: 'block', marginBottom: '6px' }}>
                    Quick Presets:
                  </span>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {[
                      { label: 'Gold Leaf Truffles', path: '/images/psimg/gift2.jpeg' },
                      { label: 'Oud Candle', path: '/images/psimg/gift 4.jpeg' },
                      { label: 'Silver Coin', path: '/images/psimg/gift1edit.jpeg' },
                      { label: 'Kundan Moli', path: '/images/psimg/gift 5.jpeg' }
                    ].map(preset => (
                      <button
                        key={preset.path}
                        type="button"
                        onClick={() => setHamperChocolateForm({ ...hamperChocolateForm, image: preset.path })}
                        style={{
                          fontSize: '11px',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          border: hamperChocolateForm.image === preset.path ? '1px solid #800020' : '1px solid #e8e2d8',
                          background: hamperChocolateForm.image === preset.path ? '#faf2f4' : '#fff',
                          cursor: 'pointer'
                        }}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label>Flavor / Notes / Ingredients</label>
                <textarea
                  rows="3"
                  value={hamperChocolateForm.description}
                  onChange={(e) => setHamperChocolateForm({ ...hamperChocolateForm, description: e.target.value })}
                  placeholder="Rich Belgian dark chocolate infused with roasted hazelnuts and crowned with edible gold..."
                ></textarea>
              </div>

              <div className="modal-footer-btns">
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setModalState(prev => ({ ...prev, hamperChocolate: false }))}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-gold">
                  {editingHamperChocolate ? 'Update Chocolate' : 'Save Chocolate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MOBILE FLOATING ACTION BUTTON (Add Product, Coupon, Customer, or Hamper Box) */}
      {(activeTab === 'products' || activeTab === 'coupons' || activeTab === 'customers' || activeTab === 'hampers') && (
        <button
          className="admin-fab-add"
          onClick={() => {
            if (activeTab === 'products') handleOpenAddProduct();
            else if (activeTab === 'coupons') setModalState(prev => ({ ...prev, coupon: true }));
            else if (activeTab === 'customers') setModalState(prev => ({ ...prev, customer: true }));
            else if (activeTab === 'hampers') handleOpenAddHamperBox();
          }}
          title={
            activeTab === 'products' ? 'Add New Product' :
            activeTab === 'coupons' ? 'Create New Coupon' :
            activeTab === 'hampers' ? 'Add Hamper Box' : 'Add Customer'
          }
          aria-label="Add Item"
        >
          <i className={
            activeTab === 'products' ? 'fa-solid fa-plus' :
            activeTab === 'coupons' ? 'fa-solid fa-tag' :
            activeTab === 'hampers' ? 'fa-solid fa-box-open' : 'fa-solid fa-user-plus'
          }></i>
        </button>
      )}

      {/* MOBILE APP-LIKE BOTTOM NAVIGATION BAR */}
      <nav className="admin-mobile-bottom-nav">
        <button
          type="button"
          className={`bottom-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => handleNavClick('dashboard')}
        >
          <i className="fa-solid fa-chart-pie"></i>
          <span>Dashboard</span>
        </button>
        <button
          type="button"
          className={`bottom-nav-item ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => handleNavClick('products')}
        >
          <i className="fa-solid fa-gem"></i>
          <span>Products</span>
        </button>
        <button
          type="button"
          className={`bottom-nav-item ${activeTab === 'coupons' ? 'active' : ''}`}
          onClick={() => handleNavClick('coupons')}
        >
          <i className="fa-solid fa-ticket"></i>
          <span>Coupons</span>
        </button>
        <button
          type="button"
          className={`bottom-nav-item ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => handleNavClick('orders')}
        >
          <i className="fa-solid fa-box-archive"></i>
          <span>Orders</span>
        </button>
        <button
          type="button"
          className={`bottom-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => handleNavClick('settings')}
        >
          <i className="fa-solid fa-sliders"></i>
          <span>Settings</span>
        </button>
      </nav>
    </div>
  );
}
