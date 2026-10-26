import { create } from 'zustand';
import toast from 'react-hot-toast';

// Helper to normalize image url – prefers Cloudinary URLs (https), then relative paths
export function getValidImageUrl(item) {
  if (!item) return '/images/psimg/ring1.jpg';
  let img = item.image;
  if (!img || typeof img !== 'string') return '/images/psimg/ring1.jpg';
  img = img.trim();
  if (img.startsWith('http://') || img.startsWith('https://') || img.startsWith('data:')) {
    return img;
  }
  if (!img.startsWith('/')) {
    img = '/' + img;
  }
  return img;
}

// Initial cart from localStorage
const getInitialCart = () => {
  try {
    const raw = localStorage.getItem('ps_cart');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(item => ({
      ...item,
      id: item.id || item._id || ('ITEM-' + Math.random().toString(36).substr(2, 6)),
      image: getValidImageUrl(item),
      quantity: Number(item.quantity) || 1,
      stock: item.stock !== undefined ? Number(item.stock) : 10,
      price: Number(item.price) || 0
    }));
  } catch (e) {
    return [];
  }
};

// Initial user from localStorage
const getInitialUser = () => {
  try {
    const raw = localStorage.getItem('PANCHSATWA_User') || localStorage.getItem('ps_user');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

// Initial coupon from localStorage
const getInitialCoupon = () => {
  try {
    const raw = localStorage.getItem('panch_applied_coupon');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

export const useCartStore = create((set, get) => ({
  items: getInitialCart(),
  isCartOpen: false,
  appliedCoupon: getInitialCoupon(),

  openCart: () => set({ isCartOpen: true }),
  closeCart: () => set({ isCartOpen: false }),
  toggleCart: () => set(state => ({ isCartOpen: !state.isCartOpen })),

  addItem: (product, quantity = 1, size = '-', variant = '') => {
    const items = [...get().items];
    const prodId = product.id || product._id || product.name;
    const reqQty = Math.max(1, Number(quantity) || 1);

    // Use stock from the product object passed directly (always fresh from server)
    let availableStock = product.stock !== undefined ? Number(product.stock) : 10;
    availableStock = Math.max(0, availableStock);

    // If out of stock, reject
    if (availableStock <= 0) {
      toast.error(`Sorry, "${product.name}" is currently out of stock!`);
      return { success: false, reason: 'out_of_stock' };
    }

    const cleanVariant = (variant && variant !== '-') ? variant.trim() : '';

    const existingIndex = items.findIndex(
      i => (i.id === prodId || i._id === prodId || i.name === product.name) &&
           (i.size === size || (!i.size && !size)) &&
           ((i.variant || '') === cleanVariant)
    );

    if (existingIndex > -1) {
      const currentCartQty = Number(items[existingIndex].quantity) || 0;
      if (currentCartQty >= availableStock) {
        toast.error(`Cannot add more. Only ${availableStock} units available for "${product.name}" (already in your cart)!`);
        return { success: false, reason: 'max_stock_reached' };
      }

      if (currentCartQty + reqQty > availableStock) {
        const canAdd = availableStock - currentCartQty;
        items[existingIndex].quantity = availableStock;
        items[existingIndex].stock = availableStock;
        toast.error(`Only ${availableStock} units available in stock. Added ${canAdd} more to reach maximum limit.`);
      } else {
        items[existingIndex].quantity = currentCartQty + reqQty;
        items[existingIndex].stock = availableStock;
      }
    } else {
      const finalQty = Math.min(reqQty, availableStock);
      if (reqQty > availableStock) {
        toast.error(`Only ${availableStock} units available in stock. Added maximum available (${availableStock}) to cart.`);
      }
      items.push({
        id: prodId,
        _id: product._id || prodId,
        name: product.name,
        price: Number(product.price) || 0,
        mrp: Number(product.mrp) || Math.round(Number(product.price) * 1.3),
        image: getValidImageUrl(product),
        category: product.category || '',
        size: size || '-',
        variant: cleanVariant,
        quantity: finalQty,
        stock: availableStock
      });
    }

    localStorage.setItem('ps_cart', JSON.stringify(items));
    set({ items, isCartOpen: true });
    return { success: true };
  },

  addHamperItem: (hamper) => {
    const items = [...get().items];
    const hamperId = hamper.id || ('HAMPER-' + Date.now());
    const existingIndex = items.findIndex(i => i.id === hamperId || i._id === hamperId);

    const hamperCartItem = {
      id: hamperId,
      _id: hamperId,
      isHamper: true,
      name: hamper.title || `Custom ${hamper.box?.name || 'Luxury'} Hamper`,
      price: Number(hamper.totalPrice) || 0,
      mrp: Number(hamper.totalMrp) || Math.round((Number(hamper.totalPrice) || 0) * 1.25),
      image: hamper.box?.image || '/images/psimg/gift1.png',
      category: 'gift',
      size: hamper.box?.name ? `Box: ${hamper.box.name}` : '-',
      variant: hamper.personalization?.recipientName ? `For: ${hamper.personalization.recipientName}` : '',
      quantity: 1,
      stock: 10,
      hamperData: {
        box: hamper.box,
        products: hamper.products || [],
        personalization: hamper.personalization || {},
        packagingFee: Number(hamper.packagingFee) || 0,
        totalItemsCount: (hamper.products || []).reduce((s, p) => s + (Number(p.quantity) || 1), 0)
      }
    };

    if (existingIndex > -1) {
      items[existingIndex] = hamperCartItem;
      toast.success('Custom Hamper updated in your cart!');
    } else {
      items.push(hamperCartItem);
      toast.success('Custom Luxury Hamper added to your cart!');
    }

    localStorage.setItem('ps_cart', JSON.stringify(items));
    set({ items, isCartOpen: true });
    return { success: true, hamperId };
  },

  removeItem: (id, size) => {
    const items = get().items.filter(i => {
      const matchId = i.id === id || i._id === id;
      if (size !== undefined && i.size) {
        return !(matchId && i.size === size);
      }
      return !matchId;
    });

    localStorage.setItem('ps_cart', JSON.stringify(items));
    set({ items });
  },

  updateQty: (id, quantity, size) => {
    if (quantity < 1) {
      return get().removeItem(id, size);
    }

    // Use stock from the existing cart item
    let maxStock = 10;
    const existing = get().items.find(i => i.id === id || i._id === id);
    if (existing && existing.stock !== undefined) maxStock = Number(existing.stock);
    maxStock = Math.max(0, maxStock);

    if (maxStock > 0 && quantity > maxStock) {
      toast.error(`Only ${maxStock} units available in stock for this product!`);
      quantity = maxStock;
    }

    const items = get().items.map(i => {
      const matchId = i.id === id || i._id === id;
      if (size !== undefined && i.size) {
        return (matchId && i.size === size) ? { ...i, quantity, stock: maxStock } : i;
      }
      return matchId ? { ...i, quantity, stock: maxStock } : i;
    });

    localStorage.setItem('ps_cart', JSON.stringify(items));
    set({ items });
  },

  clearCart: () => {
    localStorage.removeItem('ps_cart');
    localStorage.removeItem('panch_applied_coupon');
    set({ items: [], appliedCoupon: null });
  },

  applyCoupon: (coupon) => {
    try {
      localStorage.setItem('panch_applied_coupon', JSON.stringify(coupon));
    } catch (e) {}
    set({ appliedCoupon: coupon });
  },

  removeCoupon: () => {
    try {
      localStorage.removeItem('panch_applied_coupon');
    } catch (e) {}
    set({ appliedCoupon: null });
  },

  get subtotal() {
    return get().items.reduce((sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 1), 0);
  },

  get gst() {
    return Math.round(get().subtotal * 0.03);
  },

  get discount() {
    const coupon = get().appliedCoupon;
    if (!coupon) return 0;
    const sub = get().subtotal;
    const isPercent = (coupon.type === 'percentage' || coupon.discountType === 'percentage' || coupon.discountType === 'percent');
    const val = Number(coupon.value !== undefined ? coupon.value : coupon.discountValue) || 0;
    if (isPercent) {
      return Math.round((sub * val) / 100);
    }
    return Math.min(sub, val);
  },

  get total() {
    return Math.max(0, get().subtotal + get().gst - get().discount);
  },

  get count() {
    return get().items.reduce((sum, i) => sum + (Number(i.quantity) || 1), 0);
  }
}));

export const useAuthStore = create((set, get) => {
  // Listen for forced logout from API interceptor
  if (typeof window !== 'undefined') {
    window.addEventListener('auth:forced-logout', () => {
      get().logout();
    });
  }

  return {
    user: getInitialUser(),
    token: localStorage.getItem('ps_token') || null,
    refreshToken: localStorage.getItem('ps_refresh_token') || null,

    login: (user, token, refreshToken) => {
      localStorage.setItem('PANCHSATWA_User', JSON.stringify(user));
      localStorage.setItem('PANCHSATWA_LoggedIn', 'true');
      localStorage.setItem('ps_user', JSON.stringify(user));
      if (token) {
        localStorage.setItem('ps_token', token);
        localStorage.setItem('token', token);
      }
      if (refreshToken) {
        localStorage.setItem('ps_refresh_token', refreshToken);
      }
      set({ user, token: token || null, refreshToken: refreshToken || null });
    },

    logout: () => {
      localStorage.removeItem('PANCHSATWA_User');
      localStorage.removeItem('PANCHSATWA_LoggedIn');
      localStorage.removeItem('ps_user');
      localStorage.removeItem('ps_token');
      localStorage.removeItem('ps_refresh_token');
      localStorage.removeItem('token');
      set({ user: null, token: null, refreshToken: null });
    },

    updateUser: (user) => {
      localStorage.setItem('PANCHSATWA_User', JSON.stringify(user));
      localStorage.setItem('ps_user', JSON.stringify(user));
      set({ user });
    },

    isLoggedIn: () => !!get().user && !!get().token,
    isAdmin: () => !!(get().user?.isAdmin || get().user?.role === 'admin')
  };
});
