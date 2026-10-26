import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore, useAuthStore } from '../store';
import { FaShoppingCart, FaUserCircle, FaBars, FaTimes, FaSignOutAlt, FaTachometerAlt } from 'react-icons/fa';
import './Navbar.css';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const cartCount = useCartStore(s => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate('/');
  };

  return (
    <header className="navbar">
      <div className="navbar-inner container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <img src="/images/psimg/pslogo.png" alt="Panch Sattva Logo" className="logo-img" />
          <span className="logo-text">PANCH <span>SATTVA</span></span>
        </Link>

        {/* Desktop Nav */}
        <nav className="desktop-nav">
          <Link to="/">Home</Link>
          <Link to="/#about">About</Link>
          <Link to="/products">Products</Link>
          <Link to="/#collections">Collections</Link>
          <Link to="/#contact">Contact</Link>
        </nav>

        {/* Icons */}
        <div className="navbar-icons">
          <Link to="/cart" className="cart-btn">
            <FaShoppingCart />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </Link>

          {user ? (
            <div className="user-menu-wrap">
              <button className="user-btn" onClick={() => setUserMenuOpen(!userMenuOpen)}>
                <FaUserCircle />
                <span>{((user.name || user.fullName || user.username || user.email || 'User') + '').split(' ')[0]}</span>
              </button>
              {userMenuOpen && (
                <div className="user-dropdown">
                  <Link to="/dashboard" onClick={() => setUserMenuOpen(false)}>
                    <FaTachometerAlt /> Dashboard
                  </Link>
                  {(user.isAdmin || user.role === 'admin') && (
                    <Link to="/admin" onClick={() => setUserMenuOpen(false)}>
                      Admin Panel
                    </Link>
                  )}
                  <button onClick={handleLogout}>
                    <FaSignOutAlt /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="btn-outline" style={{ padding: '8px 18px', fontSize: '13px' }}>Login</Link>
              <Link to="/signup" className="btn-primary" style={{ padding: '8px 18px', fontSize: '13px' }}>Sign Up</Link>
            </>
          )}

          <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div className={`mobile-sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="mobile-sidebar-header">
          <img src="/images/psimg/pslogo.png" alt="Logo" className="logo-img" />
          <span className="logo-text">PANCH <span>SATTVA</span></span>
          <button onClick={() => setMenuOpen(false)}><FaTimes /></button>
        </div>
        <nav className="mobile-nav">
          <Link to="/" onClick={() => setMenuOpen(false)}>🏠 Home</Link>
          <Link to="/products" onClick={() => setMenuOpen(false)}>🛍️ Products</Link>
          <Link to="/cart" onClick={() => setMenuOpen(false)}>🛒 Cart ({cartCount})</Link>
          <hr />
          {user ? (
            <>
              <Link to="/dashboard" onClick={() => setMenuOpen(false)}>📊 Dashboard</Link>
              {user.isAdmin && <Link to="/admin" onClick={() => setMenuOpen(false)}>⚙️ Admin</Link>}
              <button onClick={() => { handleLogout(); setMenuOpen(false); }}>🚪 Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)}>👤 Login</Link>
              <Link to="/signup" onClick={() => setMenuOpen(false)}>📝 Sign Up</Link>
            </>
          )}
        </nav>
      </div>
      {menuOpen && <div className="overlay" onClick={() => setMenuOpen(false)} />}
    </header>
  );
}
