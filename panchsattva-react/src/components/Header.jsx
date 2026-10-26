import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCartStore, useAuthStore } from '../store';
import toast from 'react-hot-toast';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const cart = useCartStore();

  const cartCount = cart.items ? cart.items.reduce((sum, i) => sum + (Number(i.quantity) || 1), 0) : 0;
  const cartSubtotal = cart.items ? cart.items.reduce((sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 1), 0) : 0;
  const gst = Math.round(cartSubtotal * 0.03);
  let discount = 0;
  if (cart.appliedCoupon) {
    const isPercent = (cart.appliedCoupon.type === 'percentage' || cart.appliedCoupon.discountType === 'percentage' || cart.appliedCoupon.discountType === 'percent');
    const val = Number(cart.appliedCoupon.value !== undefined ? cart.appliedCoupon.value : cart.appliedCoupon.discountValue) || 0;
    if (isPercent) {
      discount = Math.round((cartSubtotal * val) / 100);
    } else {
      discount = Math.min(cartSubtotal, val);
    }
  }
  const cartTotal = Math.max(0, cartSubtotal + gst - discount);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  // Sync Admin Marquee settings
  const [marqueeConfig, setMarqueeConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('panch_marquee');
      return saved ? JSON.parse(saved) : { enabled: false, text: '' };
    } catch (e) {
      return { enabled: false, text: '' };
    }
  });

  useEffect(() => {
    const handleMarqueeUpdate = (e) => {
      if (e && e.detail) {
        setMarqueeConfig(e.detail);
      } else {
        try {
          const saved = localStorage.getItem('panch_marquee');
          if (saved) setMarqueeConfig(JSON.parse(saved));
        } catch (_) {}
      }
    };
    window.addEventListener('panch_marquee_updated', handleMarqueeUpdate);
    window.addEventListener('storage', handleMarqueeUpdate);
    return () => {
      window.removeEventListener('panch_marquee_updated', handleMarqueeUpdate);
      window.removeEventListener('storage', handleMarqueeUpdate);
    };
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    toast.success('Logged out successfully.');
    navigate('/');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
    }
  };

  const scrollToSection = (sectionId) => {
    setMobileMenuOpen(false);
    if (location.pathname !== '/') {
      navigate(`/#${sectionId}`);
    } else {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Initials for avatar
  const getInitials = (name) => {
    if (!name || typeof name !== 'string') return 'PS';
    const parts = name.trim().split(' ').filter(Boolean);
    return parts.length > 1
      ? ((parts[0][0] || '') + (parts[parts.length - 1][0] || '')).toUpperCase() || 'PS'
      : name.slice(0, 2).toUpperCase() || 'PS';
  };

  const userName = (user && (user.name || user.fullName || user.username || (user.email ? user.email.split('@')[0] : 'User'))) || 'User';
  const userFirstName = typeof userName === 'string' ? userName.split(' ')[0] : 'User';

  return (
    <>
      {/* Dynamic Admin-Controlled Marquee Announcement Ticker */}
      {marqueeConfig && marqueeConfig.enabled && marqueeConfig.text && (
        <div
          className="admin-marquee-container"
          style={{
            background: marqueeConfig.bgColor || 'linear-gradient(90deg, #2b0008 0%, #4a0011 50%, #2b0008 100%)',
            color: marqueeConfig.textColor || '#f8f4ed',
            padding: '7px 0',
            fontSize: '12px',
            fontWeight: '500',
            letterSpacing: '0.4px',
            borderBottom: '1px solid rgba(197, 160, 89, 0.35)',
            position: 'relative',
            zIndex: 1001,
            overflow: 'hidden'
          }}
        >
          <marquee
            behavior="scroll"
            direction="left"
            scrollamount={Number(marqueeConfig.speed) || 7}
            onMouseEnter={(e) => marqueeConfig.pauseOnHover !== false && e.target.stop()}
            onMouseLeave={(e) => marqueeConfig.pauseOnHover !== false && e.target.start()}
            style={{
              display: 'block',
              width: '100%',
              margin: 0,
              padding: 0
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', paddingRight: '40px' }}>
              {marqueeConfig.text}
            </span>
          </marquee>
        </div>
      )}

      {/* ================== HEADER ================== */}
      <header>
        <div className="logo">
          <Link to="/">
            <img src="/images/psimg/pslogo.png" alt="PanchSattva Logo" className="logo-img" />
            <span className="logo-text">
              PANCH<span>&nbsp;SATTVA</span>
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="desktop-nav">
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><a href="#about" onClick={(e) => { e.preventDefault(); scrollToSection('about'); }}>About</a></li>
            <li><a href="#collections" onClick={(e) => { e.preventDefault(); scrollToSection('collections'); }}>Collections</a></li>
            <li>
              <Link to="/custom-hamper" style={{ color: '#c5a059', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <i className="fa-solid fa-gift"></i> Build a Hamper
              </Link>
            </li>
            <li><Link to="/products">All Products</Link></li>
            <li><a href="#contact" onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }}>Contact</a></li>
          </ul>
        </nav>

        {/* Header Icons */}
        <div className="header-icons">
          {/* Search Trigger */}
          <div style={{ position: 'relative' }}>
            <i
              className="fa-solid fa-magnifying-glass"
              title="Search Jewellery"
              onClick={() => setSearchOpen(!searchOpen)}
            ></i>
            {searchOpen && (
              <form
                onSubmit={handleSearchSubmit}
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 12px)',
                  right: 0,
                  background: '#ffffff',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  borderRadius: '30px',
                  padding: '6px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  zIndex: 1002,
                  minWidth: '220px',
                  border: '1px solid #e0e0e0'
                }}
              >
                <input
                  type="text"
                  placeholder="Search jewellery..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  style={{
                    border: 'none',
                    outline: 'none',
                    fontSize: '13px',
                    fontFamily: 'Poppins, sans-serif',
                    width: '100%',
                    color: '#800020'
                  }}
                />
                <button type="submit" style={{ background: 'none', border: 'none', color: '#800020', cursor: 'pointer' }}>
                  <i className="fa-solid fa-arrow-right"></i>
                </button>
              </form>
            )}
          </div>

          {/* Wishlist Heart */}
          <Link to="/products" title="Wishlist">
            <i className="fa-regular fa-heart"></i>
          </Link>

          {/* User Auth or Dropdown */}
          {user ? (
            <div className="user-header-wrap">
              <div
                className="user-header-btn"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                title={`Account (${userName})`}
              >
                <span className="user-avatar-badge">{getInitials(userName)}</span>
                <span className="user-header-name">{userFirstName}</span>
                <i className="fa-solid fa-angle-down" style={{ fontSize: '11px' }}></i>
              </div>

              {userDropdownOpen && (
                <div className="user-header-dropdown">
                  <div className="user-dropdown-info">
                    <div className="user-avatar-circle-lg">{getInitials(userName)}</div>
                    <div>
                      <strong className="user-dropdown-fullname">{userName}</strong>
                      <small className="user-dropdown-email">{user.email || user.mobile || 'Member'}</small>
                    </div>
                  </div>
                  <Link to="/dashboard" className="user-dropdown-link" onClick={() => setUserDropdownOpen(false)}>
                    <i className="fa-solid fa-gauge-high"></i> Dashboard
                  </Link>
                  <Link to="/dashboard#profile" className="user-dropdown-link" onClick={() => setUserDropdownOpen(false)}>
                    <i className="fa-solid fa-user"></i> My Profile
                  </Link>
                  <Link to="/cart" className="user-dropdown-link" onClick={() => setUserDropdownOpen(false)}>
                    <i className="fa-solid fa-bag-shopping"></i> My Bag ({cartCount})
                  </Link>
                  {(user.isAdmin || user.role === 'admin') && (
                    <Link to="/admin" className="user-dropdown-link" onClick={() => setUserDropdownOpen(false)}>
                      <i className="fa-solid fa-shield-halved"></i> Store Admin
                    </Link>
                  )}
                  <div className="user-dropdown-divider"></div>
                  <a href="#logout" className="user-dropdown-link logout-link" onClick={(e) => { e.preventDefault(); handleLogout(); }}>
                    <i className="fa-solid fa-arrow-right-from-bracket"></i> Logout
                  </a>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="login-btn">Login</Link>
              <Link to="/signup" className="signup-nav-btn">Sign Up</Link>
            </>
          )}

          {/* Cart Icon in Header with Badge */}
          <div
            className="cart-icon"
            id="openCart"
            onClick={() => cart.openCart()}
            style={{ cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center' }}
            title="Shopping Cart"
          >
            <i className="fa-solid fa-cart-shopping" style={{ color: 'rgb(106, 4, 4)', fontSize: '20px' }}></i>
            {cartCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-7px',
                  right: '-10px',
                  background: '#800020',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: '700',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                }}
              >
                {cartCount}
              </span>
            )}
          </div>
        </div>

        {/* Mobile Menu Button */}
        <div className="mobile-menu" onClick={() => setMobileMenuOpen(true)}>
          <i className="fa-solid fa-bars" id="menuOpen"></i>
        </div>
      </header>

      {/* ================== MOBILE SIDEBAR ================== */}
      <div className={`mobile-nav ${mobileMenuOpen ? 'active' : ''}`} id="mobileNav">
        <div className="mobile-top">
          <div className="logo">
            <img src="/images/psimg/pslogo.png" alt="PanchSattva Logo" className="logo-img" />
          </div>
          <h2>PANCH SATTVA</h2>
          <div
            className="cart-icon"
            onClick={() => { setMobileMenuOpen(false); cart.openCart(); }}
            style={{ cursor: 'pointer', position: 'relative' }}
          >
            <i className="fa-solid fa-cart-shopping"></i>
            {cartCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-10px',
                  background: '#c5a059',
                  color: '#1a0208',
                  fontSize: '10px',
                  fontWeight: '700',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {cartCount}
              </span>
            )}
          </div>
          <i className="fa-solid fa-xmark" id="menuClose" onClick={() => setMobileMenuOpen(false)}></i>
        </div>

        <Link to="/" onClick={() => setMobileMenuOpen(false)}>🏠 Home</Link>
        <Link to="/custom-hamper" onClick={() => setMobileMenuOpen(false)} style={{ color: '#c5a059', fontWeight: '700' }}>
          🎁 Build Custom Hamper
        </Link>
        <a href="#about" onClick={(e) => { e.preventDefault(); scrollToSection('about'); }}>💎 About</a>
        <Link to="/products" onClick={() => setMobileMenuOpen(false)}>🛍 All Products</Link>
        <a href="#collections" onClick={(e) => { e.preventDefault(); scrollToSection('collections'); }}>✨ Collections</a>
        <a href="#contact" onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }}>📞 Contact</a>

        <hr />

        {user ? (
          <>
            <div style={{ padding: '10px 16px', background: 'rgba(255,255,255,0.08)', borderRadius: '8px', margin: '4px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="user-avatar-badge">{getInitials(userName)}</div>
              <div>
                <strong style={{ color: '#fff', fontSize: '13px', display: 'block' }}>{userName}</strong>
                <small style={{ color: '#c5a059', fontSize: '11px' }}>{user.mobile || user.email}</small>
              </div>
            </div>
            <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>👤 My Dashboard</Link>
            {(user.isAdmin || user.role === 'admin') && (
              <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>🔒 Admin Portal</Link>
            )}
            <a href="#logout" onClick={(e) => { e.preventDefault(); handleLogout(); }} style={{ color: '#ef4444' }}>
              🚪 Logout
            </a>
          </>
        ) : (
          <>
            <Link to="/login" onClick={() => setMobileMenuOpen(false)}>👤 Login</Link>
            <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>📝 Sign Up</Link>
          </>
        )}
      </div>

      {/* Mobile Backdrop */}
      <div
        className={`mobile-backdrop ${mobileMenuOpen ? 'active' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      ></div>

      {/* ================== SLIDING SHOPPING CART DRAWER ================== */}
      <div
        className={`cart-overlay ${cart.isCartOpen ? 'active' : ''}`}
        id="cartOverlay"
        onClick={() => cart.closeCart()}
      ></div>

      <div className={`cart-sidebar ${cart.isCartOpen ? 'active' : ''}`} id="cartSidebar">
        <div className="cart-header">
          <h2>Shopping Cart ({cartCount})</h2>
          <span id="closeCart" onClick={() => cart.closeCart()} style={{ cursor: 'pointer' }}>&times;</span>
        </div>

        <div className="cart-items" id="cartItems">
          {cart.items.length === 0 ? (
            <p className="empty-cart">Your cart is empty.</p>
          ) : (
            cart.items.map((item, index) => {
              const currentStock = item.stock !== undefined ? Number(item.stock) : 10;
              const isOutOfStock = currentStock <= 0;
              const isAtMaxStock = item.quantity >= currentStock;

              return (
                <div
                  key={`${item.id}-${item.size || index}`}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: '1px solid #f0e6e6'
                  }}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    style={{
                      width: '60px',
                      height: '60px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      border: '1px solid #e0e0e0'
                    }}
                    onError={(e) => { e.target.src = '/images/psimg/ring1.jpg'; }}
                  />
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '13px', fontWeight: '600', color: '#800020', marginBottom: '4px' }}>
                      {item.isHamper && <span style={{ color: '#c5a059', marginRight: '4px' }}>🎁</span>}
                      {item.name}
                    </h4>
                    {item.isHamper && item.hamperData && (
                      <div style={{ fontSize: '11px', color: '#4b5563', marginBottom: '4px' }}>
                        <span>Includes {item.hamperData.totalItemsCount || item.hamperData.products?.length || 0} items</span>
                        {item.hamperData.personalization?.recipientName && (
                          <span style={{ display: 'block', color: '#800020', fontWeight: '600' }}>
                            For: {item.hamperData.personalization.recipientName}
                          </span>
                        )}
                        <Link
                          to={`/custom-hamper?edit=${item.id}`}
                          onClick={() => cart.closeCart()}
                          style={{ color: '#800020', textDecoration: 'underline', fontWeight: '600', fontSize: '11px', marginTop: '2px', display: 'inline-block' }}
                        >
                          ✎ Edit Hamper
                        </Link>
                      </div>
                    )}
                    {item.variant && !item.isHamper && (
                      <span style={{ fontSize: '11px', color: '#800020', fontWeight: '600', display: 'block' }}>Option: {item.variant}</span>
                    )}
                    {item.size && item.size !== '-' && !item.isHamper && (
                      <span style={{ fontSize: '11px', color: '#666', display: 'block' }}>Size: {item.size}</span>
                    )}
                    {isOutOfStock ? (
                      <span style={{ fontSize: '11px', color: '#dc2626', fontWeight: 'bold', display: 'block' }}>Out of Stock</span>
                    ) : isAtMaxStock ? (
                      <span style={{ fontSize: '10.5px', color: '#b45309', fontWeight: '600', display: 'block' }}>Max ({currentStock}) reached</span>
                    ) : null}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ccc', borderRadius: '4px' }}>
                        <button
                          onClick={() => cart.updateQty(item.id, item.quantity - 1, item.size)}
                          style={{ border: 'none', background: 'none', padding: '2px 8px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                          -
                        </button>
                        <span style={{ fontSize: '12px', padding: '0 6px', fontWeight: '600' }}>{item.quantity}</span>
                        <button
                          disabled={item.quantity >= currentStock || isOutOfStock}
                          onClick={() => {
                            if (item.quantity >= currentStock) {
                              toast.error(`Only ${currentStock} units available for ${item.name}!`);
                            } else {
                              cart.updateQty(item.id, item.quantity + 1, item.size);
                            }
                          }}
                          style={{
                            border: 'none',
                            background: 'none',
                            padding: '2px 8px',
                            cursor: item.quantity >= currentStock || isOutOfStock ? 'not-allowed' : 'pointer',
                            opacity: item.quantity >= currentStock || isOutOfStock ? 0.35 : 1,
                            fontWeight: 'bold'
                          }}
                        >
                          +
                        </button>
                      </div>
                      <strong style={{ fontSize: '13.5px', color: '#800020' }}>
                        ₹{(Number(item.price) * item.quantity).toLocaleString('en-IN')}
                      </strong>
                    </div>
                  </div>
                  <button
                    onClick={() => cart.removeItem(item.id, item.size)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#999',
                      cursor: 'pointer',
                      fontSize: '15px'
                    }}
                    title="Remove item"
                  >
                    <i className="fa-solid fa-trash-can"></i>
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="cart-footer">
          <h3>Total : ₹ <span id="cartTotal">{cartTotal.toLocaleString('en-IN')}</span></h3>
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <Link
              to="/cart"
              className="checkout-btn"
              onClick={() => cart.closeCart()}
              style={{
                flex: 1,
                textAlign: 'center',
                background: 'transparent',
                color: '#800020',
                border: '1px solid #800020',
                padding: '10px 0'
              }}
            >
              View Cart Page
            </Link>
            <button
              className="checkout-btn"
              onClick={() => {
                for (const item of cart.items) {
                  const currentStock = item.stock !== undefined ? Number(item.stock) : 10;
                  if (currentStock <= 0) {
                    toast.error(`"${item.name}" is out of stock. Please remove it from cart.`);
                    return;
                  }
                  if (item.quantity > currentStock) {
                    toast.error(`Only ${currentStock} units available for "${item.name}".`);
                    return;
                  }
                }
                cart.closeCart();
                navigate('/checkout');
              }}
              style={{
                flex: 1,
                textAlign: 'center',
                background: '#800020',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                padding: '10px 0'
              }}
            >
              Proceed To Checkout
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
