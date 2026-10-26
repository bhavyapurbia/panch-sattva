import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { ordersAPI, authAPI } from '../api';
import '../styles/dashboard.css';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [selectedScreenshot, setSelectedScreenshot] = useState(null);

  const loadOrders = useCallback(async () => {
    if (!user) return;
    try {
      const res = await ordersAPI.getMyOrders();
      if (res.data && Array.isArray(res.data)) {
        // Map backend order format to UI format
        const mapped = res.data.map(o => ({
          ...o,
          orderId: o.orderId || o._id,
          status: o.orderStatus || o.status || 'placed',
          date: o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN') : '-',
          total: o.totalAmount || o.total || 0,
          items: o.items || [],
          customer: {
            name: user.name,
            email: user.email,
            mobile: user.phone || user.mobile
          },
          paymentMode: o.paymentStatus === 'paid' ? 'Online Prepaid' : 'Cash on Delivery',
          isPrepaid: o.paymentStatus === 'paid'
        }));
        setOrders(mapped);
      }
    } catch (e) {
      console.error('Failed to load orders:', e.message);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadOrders();
  }, [user, navigate, loadOrders]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully.');
    navigate('/');
  };

  const totalSpent = orders.reduce((sum, o) => sum + (Number(o.totalAmount || o.total) || 0), 0);
  const activeCount = orders.filter((o) => !['delivered', 'cancelled'].includes((o.orderStatus || o.status || '').toLowerCase())).length;

  // Active orders that are NOT Delivered or Cancelled
  const activeOrders = orders.filter(
    (o) => !['delivered', 'cancelled'].includes((o.orderStatus || o.status || '').toLowerCase())
  );

  // Helper to render dynamic status message for each order
  const getStatusCardConfig = (order) => {
    const rawStatus = (order.orderStatus || order.status || '').trim().toLowerCase();
    const phone = user?.mobile || user?.phone || 'your registered mobile';
    const isPrepaid = order.isPrepaid || order.paymentStatus === 'paid';
    const total = Number(order.totalAmount || order.total || 0);
    const advance = order.advancePayment || order.advanceAmount || 99;
    const balance = Math.max(0, total - advance);

    if (rawStatus === 'confirmed') {
      return {
        bg: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
        border: '#86efac',
        iconBg: '#16a34a',
        icon: 'fa-solid fa-circle-check',
        titleColor: '#166534',
        textColor: '#14532d',
        badgeBg: '#dcfce7',
        badgeColor: '#15803d',
        badgeText: isPrepaid ? 'Prepaid Confirmed (5% OFF)' : 'COD Confirmed',
        title: `Order #${order.orderId} Confirmed & Verified!`,
        message: isPrepaid
          ? `Great news! Your full online payment has been verified with 5% instant discount and your order is confirmed. Your luxury jewellery is scheduled for express dispatch with zero payment required on delivery.`
          : `Great news! Your ₹${advance} advance confirmation payment has been verified and your COD order is confirmed. Your luxury jewellery is scheduled for dispatch. Balance amount of ₹${balance.toLocaleString('en-IN')} is payable in cash upon doorstep delivery.`
      };
    }

    if (rawStatus === 'processing') {
      return {
        bg: 'linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)',
        border: '#fde047',
        iconBg: '#ca8a04',
        icon: 'fa-solid fa-gem',
        titleColor: '#854d0e',
        textColor: '#713f12',
        badgeBg: '#fef3c7',
        badgeColor: '#92400e',
        badgeText: 'Processing & Packing',
        title: `Order #${order.orderId} - Packaging & Preparation`,
        message: isPrepaid
          ? `Your handcrafted jewellery is being inspected, certified, and packed in luxury velvet box for dispatch. Zero payment due on delivery (100% Prepaid).`
          : `Your handcrafted jewellery is being inspected, certified, and packed in luxury velvet box for dispatch. Cash balance ₹${balance.toLocaleString('en-IN')} payable on delivery.`
      };
    }

    if (rawStatus === 'shipped') {
      return {
        bg: 'linear-gradient(135deg, #eff6ff 0%, #e0f2fe 100%)',
        border: '#93c5fd',
        iconBg: '#2563eb',
        icon: 'fa-solid fa-truck-fast',
        titleColor: '#1e40af',
        textColor: '#1e3a8a',
        badgeBg: '#dbeafe',
        badgeColor: '#1d4ed8',
        badgeText: 'Shipped / In-Transit',
        title: `Order #${order.orderId} - Shipped & On The Way!`,
        message: isPrepaid
          ? `Your package has been dispatched via 100% insured express courier and is on its way to your delivery address! No payment needed at doorstep (100% Prepaid).`
          : `Your insured parcel has been dispatched with our express courier partner and is on its way to your delivery address! Please keep the cash balance of ₹${balance.toLocaleString('en-IN')} ready for the delivery agent.`
      };
    }

    if (rawStatus === 'cancelled') {
      return {
        bg: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
        border: '#fca5a5',
        iconBg: '#dc2626',
        icon: 'fa-solid fa-circle-xmark',
        titleColor: '#991b1b',
        textColor: '#7f1d1d',
        badgeBg: '#fee2e2',
        badgeColor: '#b91c1c',
        badgeText: 'Cancelled',
        title: `Order #${order.orderId} - Order Cancelled`,
        message: isPrepaid
          ? `This order has been marked as cancelled. For refund assistance or queries, please contact our helpline at +91 6375247046.`
          : `This order has been marked as cancelled. (*Note: As per store policy, the ₹99 COD advance confirmation token is non-refundable on cancellation).`
      };
    }

    // Default: "Order Received (Verification in 24h)" / "Pending Verification"
    return {
      bg: 'linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%)',
      border: '#93c5fd',
      iconBg: '#0284c7',
      icon: 'fa-solid fa-bell',
      titleColor: '#0369a1',
      textColor: '#0c4a6e',
      badgeBg: '#e0f2fe',
      badgeColor: '#0369a1',
      badgeText: 'Verification in Progress (24 Hrs)',
      title: `Order #${order.orderId} Received & Under Verification`,
      message: isPrepaid
        ? `Your order with full online payment (5% discount applied) is received! Your payment screenshot is being verified. You will get official confirmation within 24 hours on your registered mobile number (+91 ${phone}) by WhatsApp, SMS, or Email.`
        : `Your order is received! Your ₹${advance} advance payment screenshot is being verified. You will get official confirmation within 24 hours on your registered mobile number (+91 ${phone}) by WhatsApp, SMS, or Email.`
    };
  };

  return (
    <div className="dashboard-outer-container">
      <div className="dashboard">
        {/* Sidebar */}
        <aside className="sidebar">
          <Link
            to="/"
            className="sidebar-logo-link"
            style={{
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              marginBottom: '30px',
              borderBottom: '2px solid #800020',
              paddingBottom: '15px'
            }}
          >
            <img
              src="/images/psimg/pslogo.png"
              alt="PanchSattva Logo"
              style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'contain' }}
            />
            <h2
              style={{
                fontFamily: 'Cinzel, serif',
                fontSize: '20px',
                letterSpacing: '2px',
                color: '#800020',
                marginBottom: 0,
                borderBottom: 'none',
                paddingBottom: 0
              }}
            >
              PANCH<span>&nbsp;SATTVA</span>
            </h2>
          </Link>

          <ul>
            <li>
              <Link to="/dashboard" className="active">
                <i className="fa-solid fa-house"></i> Dashboard
              </Link>
            </li>
            <li>
              <a href="#profile">
                <i className="fa-solid fa-user"></i> My Profile
              </a>
            </li>
            <li>
              <a href="#ordersSection">
                <i className="fa-solid fa-gem"></i> My Orders
              </a>
            </li>
            <li>
              <Link to="/cart">
                <i className="fa-solid fa-bag-shopping"></i> Shopping Bag
              </Link>
            </li>
            <li>
              <Link to="/products">
                <i className="fa-solid fa-store"></i> Browse Jewellery
              </Link>
            </li>
            <li>
              <Link to="/">
                <i className="fa-solid fa-arrow-left"></i> Return to Store
              </Link>
            </li>
            <li>
              <a href="#logout" onClick={(e) => { e.preventDefault(); handleLogout(); }}>
                <i className="fa-solid fa-right-from-bracket"></i> Logout
              </a>
            </li>
          </ul>
        </aside>

        {/* Main Content */}
        <main className="content">
          <div className="topbar">
            <div>
              <h1>
                Welcome, <span id="userName">{user?.name || 'Guest'}</span>
              </h1>
              <p style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                Exclusive PANCH SATTVA Member Portal
              </p>
            </div>
            <div className="topbar-badge">
              <i className="fa-solid fa-crown" style={{ color: '#c5a059' }}></i>
              <span id="userStatusBadge">Verified Member</span>
            </div>
          </div>

          {/* DYNAMIC NOTIFICATION MESSAGES FOR ALL ACTIVE (NON-DELIVERED) ORDERS */}
          {activeOrders.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '22px' }}>
              {activeOrders.map((ord) => {
                const cfg = getStatusCardConfig(ord);

                return (
                  <div
                    key={ord.orderId}
                    style={{
                      background: cfg.bg,
                      border: `1.5px solid ${cfg.border}`,
                      borderRadius: '14px',
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      boxShadow: '0 4px 14px rgba(0, 0, 0, 0.05)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: cfg.iconBg,
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        flexShrink: 0
                      }}
                    >
                      <i className={cfg.icon}></i>
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                        <strong style={{ color: cfg.titleColor, fontSize: '14.5px' }}>
                          {cfg.title}
                        </strong>
                        <span
                          style={{
                            background: cfg.badgeBg,
                            color: cfg.badgeColor,
                            fontSize: '11px',
                            fontWeight: '700',
                            padding: '2px 8px',
                            borderRadius: '12px'
                          }}
                        >
                          {cfg.badgeText}
                        </span>
                      </div>
                      <p style={{ margin: 0, color: cfg.textColor, fontSize: '13px', lineHeight: 1.45 }}>
                        {cfg.message}
                      </p>
                    </div>

                    <a
                      href={`https://api.whatsapp.com/send?phone=916375247046&text=${encodeURIComponent(
                        `Hello Panch Sattva Helpline, checking update for Order ID: ${ord.orderId} (Current Status: ${ord.status || 'Received'})`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: '#16a34a',
                        color: '#fff',
                        padding: '8px 14px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '600',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)'
                      }}
                    >
                      <i className="fa-brands fa-whatsapp"></i> WhatsApp Help
                    </a>
                  </div>
                );
              })}
            </div>
          )}

          {/* Metric KPI Cards */}
          <div className="cards">
            <div className="card">
              <i className="fa-solid fa-gem"></i>
              <h2 id="cardTotalOrders">{orders.length}</h2>
              <p>Total Orders Placed</p>
            </div>

            <div className="card">
              <i className="fa-solid fa-indian-rupee-sign"></i>
              <h2 id="cardTotalPurchase">₹{totalSpent.toLocaleString('en-IN')}</h2>
              <p>Total Luxury Purchase</p>
            </div>

            <div className="card">
              <i className="fa-solid fa-box-open"></i>
              <h2 id="cardActiveOrders">{activeCount}</h2>
              <p>In-Transit / Processing</p>
            </div>
          </div>

          {/* Profile Information */}
          <div className="profile-box" id="profile">
            <h2>
              <i className="fa-solid fa-address-card" style={{ color: '#c5a059' }}></i> Profile Information
            </h2>

            <div className="profile-grid">
              <div className="profile-item">
                <strong>Full Name</strong>
                <span id="profileName">{user?.name || '-'}</span>
              </div>

              <div className="profile-item">
                <strong>Email Address</strong>
                <span id="profileEmail">{user?.email || '-'}</span>
              </div>

              <div className="profile-item">
                <strong>Registered Mobile</strong>
                <span id="profileMobile">{user?.mobile ? `+91 ${user.mobile}` : '-'}</span>
              </div>

              <div className="profile-item">
                <strong>Shipping Address</strong>
                <span id="profileAddress">
                  {user?.address ? `${user.address}, ${user.city || ''}, ${user.state || ''} - ${user.pincode || ''}` : 'Not Specified'}
                </span>
              </div>

              <div className="profile-item">
                <strong>Member Since</strong>
                <span id="profileJoined">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '2026'}</span>
              </div>

              <div className="profile-item">
                <strong>Account Status</strong>
                <span style={{ color: '#16a34a', fontWeight: '600' }}>
                  <i className="fa-solid fa-circle-check"></i> Active & Verified
                </span>
              </div>
            </div>
          </div>

          {/* Orders History */}
          <div className="orders" id="ordersSection">
            <h2>
              <i className="fa-solid fa-clock-rotate-left" style={{ color: '#c5a059' }}></i> Recent Orders & Purchases
            </h2>

            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Date</th>
                    <th>Jewellery Items</th>
                    <th>Payment & Amount</th>
                    <th>Status</th>
                    <th>Payment SS</th>
                  </tr>
                </thead>
                <tbody id="ordersTableBody">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#666' }}>
                        No orders placed yet. <Link to="/products" style={{ color: '#800020', fontWeight: '600' }}>Browse Jewellery</Link>
                      </td>
                    </tr>
                  ) : (
                    orders.map((o, idx) => {
                      const isPrepaid =
                        o.isPrepaid ||
                        o.codBalance === 0 ||
                        o.paymentMode?.includes('Online') ||
                        o.paymentMode?.includes('Prepaid');
                      const advance = Number(o.advancePaid || (isPrepaid ? o.total || 0 : 99));
                      const balance = isPrepaid
                        ? 0
                        : o.codBalance !== undefined
                        ? Number(o.codBalance)
                        : Math.max(0, Number(o.total || 0) - advance);
                      const isDelivered = (o.status || '').trim().toLowerCase() === 'delivered';

                      return (
                        <tr key={idx}>
                          <td>
                            <strong>{o.orderId}</strong>
                            <small style={{ display: 'block', color: '#888', fontSize: '11px' }}>
                              {o.paymentMode || (isPrepaid ? 'Online Prepaid' : 'Cash on Delivery')}
                            </small>
                          </td>
                          <td>{o.date || '-'}</td>
                          <td>
                            {(o.items || [])
                              .map((it) => `${it.name} (${it.quantity || 1})`)
                              .join(', ')}
                          </td>
                          <td>
                            <strong style={{ color: '#800020', fontSize: '14px' }}>
                              ₹{Number(o.total || 0).toLocaleString('en-IN')}
                            </strong>
                            <div style={{ fontSize: '11.5px', color: '#555', marginTop: '2px' }}>
                              {isPrepaid ? (
                                <span style={{ color: '#16a34a', fontWeight: '600' }}>
                                  100% Prepaid (5% Discount Applied)
                                </span>
                              ) : (
                                <>
                                  <span style={{ color: '#16a34a', fontWeight: '600' }}>
                                    Advance: ₹{advance}
                                  </span>{' '}
                                  •{' '}
                                  <span style={{ color: '#800020', marginLeft: '4px' }}>
                                    COD: ₹{balance.toLocaleString('en-IN')}
                                  </span>
                                  <div
                                    style={{
                                      fontSize: '10.5px',
                                      color: '#9ca3af',
                                      fontStyle: 'italic',
                                      opacity: 0.9,
                                      marginTop: '2px'
                                    }}
                                  >
                                    * ₹99 advance fee non-refundable upon cancellation
                                  </div>
                                </>
                              )}
                            </div>
                          </td>
                          <td>
                            <span
                              style={{
                                padding: '4px 10px',
                                borderRadius: '20px',
                                fontSize: '11.5px',
                                fontWeight: '600',
                                display: 'inline-block',
                                background:
                                  isDelivered
                                    ? '#dcfce7'
                                    : (o.status || '').toLowerCase() === 'confirmed'
                                    ? '#dbeafe'
                                    : (o.status || '').toLowerCase() === 'cancelled'
                                    ? '#fee2e2'
                                    : '#fef3c7',
                                color:
                                  isDelivered
                                    ? '#166534'
                                    : (o.status || '').toLowerCase() === 'confirmed'
                                    ? '#1e40af'
                                    : (o.status || '').toLowerCase() === 'cancelled'
                                    ? '#991b1b'
                                    : '#92400e'
                              }}
                            >
                              {o.status || 'Order Received (Verification in 24h)'}
                            </span>
                          </td>
                          <td>
                            {o.paymentScreenshot ? (
                              <button
                                type="button"
                                onClick={() => setSelectedScreenshot(o.paymentScreenshot)}
                                style={{
                                  background: '#faf8f5',
                                  border: '1px solid #ebd7be',
                                  color: '#800020',
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  fontSize: '11.5px',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <i className="fa-solid fa-image"></i> View SS
                              </button>
                            ) : (
                              <span style={{ color: '#aaa', fontSize: '11px' }}>-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Screenshot Preview Lightbox Modal */}
      {selectedScreenshot && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
          onClick={() => setSelectedScreenshot(null)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '16px',
              maxWidth: '480px',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, color: '#800020', fontSize: '16px' }}>Payment Screenshot</h3>
              <button
                type="button"
                onClick={() => setSelectedScreenshot(null)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#666' }}
              >
                &times;
              </button>
            </div>
            <img
              src={selectedScreenshot}
              alt="Payment Screenshot"
              style={{ width: '100%', maxHeight: '420px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #eee' }}
            />
            <div style={{ marginTop: '12px' }}>
              <button
                type="button"
                onClick={() => setSelectedScreenshot(null)}
                style={{
                  background: '#800020',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 20px',
                  borderRadius: '6px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
