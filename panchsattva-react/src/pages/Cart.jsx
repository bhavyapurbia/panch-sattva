import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore, useAuthStore } from '../store';
import { couponsAPI } from '../api';
import toast from 'react-hot-toast';

export default function Cart() {
  const cart = useCartStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [couponCode, setCouponCode] = useState('');
  const [couponMsg, setCouponMsg] = useState(null);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [showCouponsList, setShowCouponsList] = useState(true);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const subtotal = cart.items.reduce((sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 1), 0);
  const gst = Math.round(subtotal * 0.03);

  // Calculate discount if coupon applied
  let discount = 0;
  if (cart.appliedCoupon) {
    const isPercent = (cart.appliedCoupon.discountType === 'percentage' || cart.appliedCoupon.type === 'percentage');
    const val = Number(cart.appliedCoupon.discountValue !== undefined ? cart.appliedCoupon.discountValue : cart.appliedCoupon.value) || 0;
    if (isPercent) {
      discount = Math.round((subtotal * val) / 100);
      if (cart.appliedCoupon.maxDiscountAmount) {
        discount = Math.min(discount, cart.appliedCoupon.maxDiscountAmount);
      }
    } else {
      discount = Math.min(subtotal, val);
    }
  }

  const grandTotal = Math.max(0, subtotal + gst - discount);

  // Fetch available coupons from backend
  useEffect(() => {
    couponsAPI.getActive().then(res => {
      if (res.data && Array.isArray(res.data)) {
        setAvailableCoupons(res.data);
      }
    }).catch(() => {
      // Backend unavailable – silently ignore
    });
  }, []);

  const handleApplyCoupon = async (e, explicitCode) => {
    if (e && e.preventDefault) e.preventDefault();
    const code = (explicitCode || couponCode).trim().toUpperCase();
    if (!code) {
      toast.error('Please enter a coupon code.');
      return;
    }

    if (!user) {
      toast.error('Please login to apply a coupon code.');
      navigate('/login');
      return;
    }

    setApplyingCoupon(true);
    try {
      const res = await couponsAPI.validate(code, subtotal);
      if (res.data && res.data.valid) {
        const couponData = {
          ...res.data.coupon,
          discountAmount: res.data.discountAmount
        };
        cart.applyCoupon(couponData);
        setCouponMsg({ type: 'success', text: `Coupon applied! You save ₹${res.data.discountAmount.toLocaleString('en-IN')}` });
        setCouponCode(code);
        toast.success(`Coupon "${code}" applied! Saving ₹${res.data.discountAmount.toLocaleString('en-IN')}`);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid coupon code.';
      setCouponMsg({ type: 'error', text: msg });
      toast.error(msg);
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    cart.removeCoupon();
    setCouponMsg(null);
    setCouponCode('');
    toast.success('Coupon removed.');
  };

  return (
    <div style={{ paddingTop: '80px', minHeight: '80vh' }}>
      <section className="cart-page">
        <h1>Shopping Cart</h1>

        <div className="cart-container">
          {/* Cart Items List */}
          <div className="cart-items" id="cartItems">
            {cart.items.length === 0 ? (
              <div className="empty-cart" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <h2>Your Cart is Empty 🛒</h2>
                <br />
                <Link to="/products">
                  <button className="checkout-btn" style={{ maxWidth: '280px', margin: '0 auto' }}>
                    Continue Shopping
                  </button>
                </Link>
              </div>
            ) : (
              cart.items.map((item, index) => {
                const itemTotal = (Number(item.price) || 0) * (Number(item.quantity) || 1);
                const currentStock = item.stock !== undefined ? Number(item.stock) : 10;
                const isOutOfStock = currentStock <= 0;
                const isAtMaxStock = item.quantity >= currentStock;

                return (
                  <div
                    key={`${item.id}-${item.size || index}`}
                    className="cart-item"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '20px',
                      padding: '16px 0',
                      borderBottom: '1px solid #e0e0e0',
                      flexWrap: 'wrap'
                    }}
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      style={{
                        width: '90px',
                        height: '90px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        border: '1px solid #ddd'
                      }}
                      onError={(e) => { e.target.src = '/images/psimg/ring1.jpg'; }}
                    />

                    <div className="cart-item-info" style={{ flex: 1 }}>
                      <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: '17px', color: '#800020' }}>
                        {item.isHamper && <span style={{ color: '#c5a059', marginRight: '6px' }}>🎁</span>}
                        {item.name}
                      </h3>

                      {item.isHamper && (
                        <div style={{ margin: '8px 0 12px 0', background: '#fdfbf7', padding: '10px 14px', borderRadius: '10px', border: '1px solid #ebd7be' }}>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: '#c5a059', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '4px' }}>
                            🎁 Custom Royal Gift Hamper
                          </span>
                          {item.hamperData?.box && (
                            <p style={{ fontSize: '12px', color: '#374151', margin: '2px 0' }}>
                              • Keepsake Box: <strong>{item.hamperData.box.name}</strong> ({item.hamperData.box.color})
                            </p>
                          )}
                          {item.hamperData?.personalization?.recipientName && (
                            <p style={{ fontSize: '12px', color: '#800020', margin: '2px 0' }}>
                              • Recipient: <strong>{item.hamperData.personalization.recipientName}</strong> ({item.hamperData.personalization.occasion})
                            </p>
                          )}
                          {item.hamperData?.personalization?.ribbonColor && (
                            <p style={{ fontSize: '12px', color: '#4b5563', margin: '2px 0' }}>
                              • Packaging Accent: <strong>{item.hamperData.personalization.ribbonColor} Satin Ribbon</strong>
                            </p>
                          )}
                          {item.hamperData?.products && item.hamperData.products.length > 0 && (
                            <div style={{ marginTop: '6px' }}>
                              <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600' }}>
                                Treasures Inside ({item.hamperData.totalItemsCount || item.hamperData.products.length} items):
                              </span>
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                                {item.hamperData.products.map((hp, pIdx) => (
                                  <span key={pIdx} style={{ fontSize: '11px', background: '#ffffff', border: '1px solid #ebd7be', padding: '2px 8px', borderRadius: '12px', color: '#374151' }}>
                                    {hp.quantity}x {hp.product?.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          <div style={{ marginTop: '8px' }}>
                            <Link
                              to={`/custom-hamper?edit=${item.id}`}
                              style={{ color: '#800020', fontSize: '12px', fontWeight: '700', textDecoration: 'underline' }}
                            >
                              <i className="fa-solid fa-pen-to-square" style={{ marginRight: '4px' }}></i>
                              Edit Hamper Box & Treasures
                            </Link>
                          </div>
                        </div>
                      )}

                      {item.variant && !item.isHamper && (
                        <p style={{ fontSize: '13px', color: '#800020', margin: '4px 0', fontWeight: '600' }}>
                          <i className="fa-solid fa-shapes" style={{ marginRight: '4px' }}></i> Option: <strong>{item.variant}</strong>
                        </p>
                      )}
                      {item.size && item.size !== '-' && !item.isHamper && (
                        <p style={{ fontSize: '13px', color: '#666', margin: '4px 0' }}>
                          Size: <strong>{item.size}</strong>
                        </p>
                      )}
                      <h4 style={{ color: '#800020', margin: '6px 0', fontSize: '16px' }}>
                        ₹{Number(item.price).toLocaleString('en-IN')}
                      </h4>

                      {/* Stock Status Notice - only show unit count if <= 5 */}
                      <div style={{ margin: '4px 0 6px 0', fontSize: '12px' }}>
                        {isOutOfStock ? (
                          <span style={{ color: '#dc2626', fontWeight: 'bold' }}>
                            ⚠️ Out of stock — Please remove from cart
                          </span>
                        ) : currentStock <= 5 ? (
                          <span style={{ color: '#b45309', fontWeight: '600' }}>
                            ⚠️ Only {currentStock} left in stock — order soon!
                          </span>
                        ) : (
                          <span style={{ color: '#059669', fontSize: '11.5px' }}>
                            ✓ In Stock
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ccc', borderRadius: '4px' }}>
                          <button
                            onClick={() => cart.updateQty(item.id, item.quantity - 1, item.size)}
                            style={{
                              border: 'none',
                              background: 'none',
                              padding: '4px 12px',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              fontSize: '15px'
                            }}
                          >
                            -
                          </button>
                          <span style={{ padding: '0 8px', fontWeight: '600', fontSize: '14px' }}>
                            {item.quantity}
                          </span>
                          <button
                            disabled={isAtMaxStock || isOutOfStock}
                            onClick={() => {
                              if (isAtMaxStock) {
                                toast.error(`Only ${currentStock} units available for ${item.name}!`);
                              } else {
                                cart.updateQty(item.id, item.quantity + 1, item.size);
                              }
                            }}
                            style={{
                              border: 'none',
                              background: 'none',
                              padding: '4px 12px',
                              cursor: isAtMaxStock || isOutOfStock ? 'not-allowed' : 'pointer',
                              opacity: isAtMaxStock || isOutOfStock ? 0.35 : 1,
                              fontWeight: 'bold',
                              fontSize: '15px'
                            }}
                          >
                            +
                          </button>
                        </div>

                        <span style={{ fontSize: '13px', color: '#666', marginLeft: '10px' }}>
                          Subtotal: <strong>₹{itemTotal.toLocaleString('en-IN')}</strong>
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => cart.removeItem(item.id, item.size)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#b91c1c',
                        cursor: 'pointer',
                        fontSize: '18px',
                        padding: '8px'
                      }}
                      title="Remove Item"
                    >
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Cart Summary */}
          {cart.items.length > 0 && (
            <div className="cart-summary">
              <h2>Order Summary</h2>

              <div className="summary-row">
                <span>Subtotal</span>
                <span id="subtotal">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>

              <div className="summary-row">
                <span>Shipping</span>
                <span style={{ color: '#16a34a', fontWeight: '700' }}>FREE</span>
              </div>

              <div className="summary-row">
                <span>GST (3%)</span>
                <span id="gst">₹{gst.toLocaleString('en-IN')}</span>
              </div>

              {discount > 0 && (
                <div className="summary-row" style={{ color: '#16a34a', fontWeight: '600' }}>
                  <span>Discount ({cart.appliedCoupon?.code})</span>
                  <span>-₹{discount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <hr />

              <div className="summary-row total">
                <span>Total</span>
                <span id="total">₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>

              {/* Coupon Form & Available Offers */}
              <div style={{ marginTop: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#800020', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fa-solid fa-tags" style={{ color: '#c5a059' }}></i>
                    Have a Promo Code?
                  </span>
                  {availableCoupons.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowCouponsList(!showCouponsList)}
                      style={{ background: 'none', border: 'none', color: '#c5a059', fontSize: '12px', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      {showCouponsList ? 'Hide Offers' : `View Offers (${availableCoupons.length})`}
                    </button>
                  )}
                </div>

                {cart.appliedCoupon ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '10px', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a', flexShrink: 0 }}>
                        <i className="fa-solid fa-check"></i>
                      </div>
                      <div>
                        <strong style={{ color: '#166534', fontSize: '13.5px', letterSpacing: '0.5px' }}>{cart.appliedCoupon.code} Applied!</strong>
                        <span style={{ display: 'block', fontSize: '12px', color: '#15803d' }}>
                          Saving ₹{discount.toLocaleString('en-IN')} on this order
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={(e) => handleApplyCoupon(e)} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder="Enter code (e.g. PANCH10)"
                        id="coupon"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        style={{ textTransform: 'uppercase', flex: 1, padding: '10px 12px', border: '1.5px solid #ebd7be', borderRadius: '8px', fontSize: '13px' }}
                      />
                      <button
                        id="applyCoupon"
                        type="submit"
                        disabled={applyingCoupon}
                        style={{
                          background: 'linear-gradient(135deg, #800020 0%, #4a0013 100%)',
                          color: '#fff',
                          border: 'none',
                          padding: '0 18px',
                          borderRadius: '8px',
                          fontWeight: '600',
                          cursor: applyingCoupon ? 'wait' : 'pointer',
                          fontSize: '13px',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {applyingCoupon ? '...' : 'Apply'}
                      </button>
                    </div>
                    {couponMsg && (
                      <span style={{ fontSize: '12px', color: couponMsg.type === 'success' ? '#16a34a' : '#dc2626', fontWeight: '500' }}>
                        {couponMsg.text}
                      </span>
                    )}
                  </form>
                )}

                {/* Available Active Coupons List */}
                {showCouponsList && availableCoupons.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#faf8f5', padding: '12px', borderRadius: '10px', border: '1px solid #ebd7be' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#800020', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      <i className="fa-solid fa-gift" style={{ color: '#c5a059', marginRight: '5px' }}></i>
                      Available Offers For You:
                    </span>
                    {availableCoupons.map((c) => {
                      const isApplied = cart.appliedCoupon?.code === c.code;
                      const minSpend = Number(c.minOrderAmount || 0);
                      const isEligible = subtotal >= minSpend;
                      const discountText = c.discountType === 'flat'
                        ? `₹${c.discountValue} FLAT OFF`
                        : `${c.discountValue}% OFF`;

                      return (
                        <div
                          key={c.code}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 12px',
                            background: isApplied ? '#f0fdf4' : '#ffffff',
                            border: isApplied ? '1.5px solid #86efac' : '1px solid #ebd7be',
                            borderRadius: '8px',
                            gap: '10px'
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{ fontFamily: 'monospace', fontWeight: '800', color: '#800020', background: 'rgba(197, 160, 89, 0.18)', padding: '2px 8px', borderRadius: '4px', fontSize: '13px', letterSpacing: '1px', border: '1px dashed #c5a059' }}>
                                {c.code}
                              </span>
                              <span style={{ fontSize: '12px', fontWeight: '700', color: '#16a34a' }}>
                                {discountText}
                              </span>
                            </div>
                            <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#6b7280' }}>
                              {c.description || (minSpend > 0 ? `On orders above ₹${minSpend.toLocaleString('en-IN')}` : 'No minimum cart amount')}
                            </p>
                            {!isEligible && minSpend > 0 && !isApplied && (
                              <span style={{ fontSize: '10.5px', color: '#d97706', display: 'block', marginTop: '2px', fontWeight: '500' }}>
                                Add ₹{(minSpend - subtotal).toLocaleString('en-IN')} more to unlock
                              </span>
                            )}
                          </div>

                          <div>
                            {isApplied ? (
                              <span style={{ fontSize: '11px', fontWeight: '700', color: '#16a34a', background: '#dcfce7', padding: '4px 8px', borderRadius: '12px', whiteSpace: 'nowrap' }}>
                                APPLIED ✓
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleApplyCoupon(null, c.code)}
                                disabled={!isEligible}
                                style={{
                                  background: isEligible ? 'linear-gradient(135deg, #c5a059 0%, #9f7d3a 100%)' : '#e5e7eb',
                                  color: isEligible ? '#140207' : '#9ca3af',
                                  border: 'none',
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  fontSize: '11.5px',
                                  fontWeight: '700',
                                  cursor: isEligible ? 'pointer' : 'not-allowed',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                APPLY
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <button
                className="checkout-btn"
                style={{ width: '100%', marginTop: '16px' }}
                onClick={() => {
                  // Validate stock from cart item data
                  for (const item of cart.items) {
                    const currentStock = item.stock !== undefined ? Number(item.stock) : 10;
                    if (currentStock <= 0) {
                      toast.error(`"${item.name}" is out of stock. Please remove it from your cart before proceeding.`);
                      return;
                    }
                    if (item.quantity > currentStock) {
                      toast.error(`Only ${currentStock} units available for "${item.name}". Please reduce quantity.`);
                      return;
                    }
                  }
                  navigate('/checkout');
                }}
              >
                Proceed To Checkout
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
