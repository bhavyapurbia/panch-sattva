import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCartStore, useAuthStore } from '../store';
import { INDIA_LOCATIONS } from '../data/locations';
import { ordersAPI, couponsAPI } from '../api';
import toast from 'react-hot-toast';

export default function Checkout() {
  const cart = useCartStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const STORE_MOBILE = '6375247046';
  const STORE_UPI_ID = '6375247046@okicici';
  const ADVANCE_FEE = 99;

  const [formData, setFormData] = useState({
    fullname: user?.name || '',
    email: user?.email || '',
    mobile: user?.mobile || '',
    address: user?.address || '',
    state: user?.state || '',
    city: user?.city || '',
    pincode: user?.pincode || ''
  });

  const [processing, setProcessing] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponMsg, setCouponMsg] = useState(null);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [showCouponsList, setShowCouponsList] = useState(false);

  // Payment Selection: 'online' (Full Online with 5% Discount) or 'cod' (Cash on Delivery with ₹99 advance)
  const [paymentMethodMode, setPaymentMethodMode] = useState('online');

  // Payment transfer tabs: 'qr' | 'upi' | 'bank'
  const [activePaymentTab, setActivePaymentTab] = useState('qr');
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [screenshotFileName, setScreenshotFileName] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [copiedField, setCopiedField] = useState(null);

  // Load active coupons from backend
  useEffect(() => {
    couponsAPI.getActive()
      .then(res => {
        if (res.data && Array.isArray(res.data)) {
          setAvailableCoupons(res.data);
        }
      })
      .catch(() => {});
  }, []);

  // Available cities based on selected state
  const availableCities = useMemo(() => {
    if (!formData.state || !INDIA_LOCATIONS[formData.state]) return [];
    return INDIA_LOCATIONS[formData.state];
  }, [formData.state]);

  const subtotal = cart.items.reduce(
    (sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 1),
    0
  );
  const gst = Math.round(subtotal * 0.03);

  let discount = 0;
  if (cart.appliedCoupon) {
    const isPercent =
      cart.appliedCoupon.type === 'percentage' ||
      cart.appliedCoupon.discountType === 'percentage' ||
      cart.appliedCoupon.discountType === 'percent';
    const val =
      Number(
        cart.appliedCoupon.value !== undefined
          ? cart.appliedCoupon.value
          : cart.appliedCoupon.discountValue
      ) || 0;
    if (isPercent) {
      discount = Math.round((subtotal * val) / 100);
    } else {
      discount = Math.min(subtotal, val);
    }
  }

  // Base grand total before extra payment mode discount
  const baseGrandTotal = Math.max(0, subtotal + gst - discount);

  // 5% Online Payment Discount
  const onlineDiscount =
    paymentMethodMode === 'online' ? Math.round(baseGrandTotal * 0.05) : 0;

  // Final total amount
  const finalTotalAmount = Math.max(0, baseGrandTotal - onlineDiscount);

  // Advance paid online now
  const amountToPayNow =
    paymentMethodMode === 'online' ? finalTotalAmount : ADVANCE_FEE;

  // Balance due upon delivery
  const codBalance =
    paymentMethodMode === 'online'
      ? 0
      : Math.max(0, finalTotalAmount - ADVANCE_FEE);

  // UPI QR String
  const upiPayString =
    paymentMethodMode === 'online'
      ? `upi://pay?pa=${STORE_UPI_ID}&pn=PANCH%20SATTVA&am=${amountToPayNow}&cu=INR&tn=Prepaid%20Jewellery%20Order`
      : `upi://pay?pa=${STORE_UPI_ID}&pn=PANCH%20SATTVA&am=${ADVANCE_FEE}&cu=INR&tn=COD%20Advance%20Booking`;

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    upiPayString
  )}`;

  const handleApplyCoupon = async (e, explicitCode) => {
    if (e && e.preventDefault) e.preventDefault();
    const code = (explicitCode || couponCode).trim().toUpperCase();
    if (!code) {
      toast.error('Please enter a coupon code.');
      return;
    }

    try {
      const res = await couponsAPI.validate(code, subtotal);
      if (res.data && res.data.valid) {
        cart.applyCoupon({
          code: res.data.coupon.code,
          type: res.data.coupon.discountType,
          discountType: res.data.coupon.discountType,
          value: res.data.coupon.discountValue,
          discountValue: res.data.coupon.discountValue,
          description: res.data.coupon.description,
          maxDiscountAmount: res.data.coupon.maxDiscountAmount,
          discountAmount: res.data.discountAmount
        });
        const msg = `Coupon "${code}" applied! You save ₹${res.data.discountAmount.toLocaleString('en-IN')}`;
        setCouponMsg({ type: 'success', text: msg });
        setCouponCode(code);
        toast.success(msg);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid coupon code.';
      setCouponMsg({ type: 'error', text: msg });
      toast.error(msg);
    }
  };

  const handleRemoveCoupon = () => {
    cart.removeCoupon();
    setCouponMsg(null);
    setCouponCode('');
    toast.success('Coupon removed.');
  };

  const handleStateChange = (e) => {
    const newState = e.target.value;
    setFormData((prev) => ({
      ...prev,
      state: newState,
      city: ''
    }));
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value
    }));
  };

  const handleCopyText = (text, fieldName) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
      } else {
        const input = document.createElement('input');
        input.value = text;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopiedField(fieldName);
      toast.success(`${fieldName} copied!`);
      setTimeout(() => setCopiedField(null), 2500);
    } catch (err) {
      toast.success(`Copied: ${text}`);
    }
  };

  const handleScreenshotChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      toast.error('Screenshot file size should be less than 8MB.');
      return;
    }

    setScreenshotFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setPaymentScreenshot(reader.result);
      toast.success('Payment screenshot uploaded successfully!');
    };
    reader.readAsDataURL(file);
  };

  const validateForm = () => {
    if (!formData.fullname.trim()) {
      toast.error('Please enter your full name');
      return false;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      toast.error('Please enter a valid email address');
      return false;
    }
    if (!formData.mobile.trim() || formData.mobile.replace(/\D/g, '').length !== 10) {
      toast.error('Please enter a valid 10-digit WhatsApp mobile number');
      return false;
    }
    if (!formData.address.trim()) {
      toast.error('Please enter your complete delivery address');
      return false;
    }
    if (!formData.state) {
      toast.error('Please select your state');
      return false;
    }
    if (!formData.city) {
      toast.error('Please select your city');
      return false;
    }
    if (!formData.pincode || formData.pincode.replace(/\D/g, '').length !== 6) {
      toast.error('Please enter a valid 6-digit PIN code');
      return false;
    }
    return true;
  };

  // Submit and Confirm Order
  const handleConfirmOrder = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (cart.items.length === 0) {
      toast.error('Your cart is empty');
      navigate('/products');
      return;
    }

    if (!validateForm()) return;

    if (!paymentScreenshot) {
      const requiredMsg =
        paymentMethodMode === 'online'
          ? `Please upload your full online payment screenshot (₹${amountToPayNow.toLocaleString('en-IN')}) to confirm your order!`
          : `Please upload your ₹99 advance payment screenshot to confirm the Cash on Delivery order!`;
      toast.error(requiredMsg);
      const el = document.getElementById('screenshotUploadBox');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    // Stock check
    for (const item of cart.items) {
      const stock = item.stock !== undefined ? Number(item.stock) : 10;
      if (stock <= 0) {
        toast.error(`"${item.name}" is currently out of stock! Please remove it from your cart.`);
        return;
      }
      if (item.quantity > stock) {
        toast.error(
          `Only ${stock} units available for "${item.name}". Please update your cart.`
        );
        return;
      }
    }

    setProcessing(true);

    const orderId = 'PS-' + Math.floor(100000 + Math.random() * 900000);
    const dateStr = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    const finalUtr =
      utrNumber.trim() ||
      'UTR' + Math.floor(100000000000 + Math.random() * 900000000000);

    const isFullOnline = paymentMethodMode === 'online';

    const orderData = {
      orderId: orderId,
      date: dateStr,
      customer: {
        name: formData.fullname.trim(),
        email: formData.email.trim(),
        mobile: formData.mobile.replace(/\D/g, ''),
        address: formData.address.trim(),
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode.trim()
      },
      items: cart.items.map((i) => ({
        id: i.id || i._id,
        name: i.name,
        price: Number(i.price),
        image: i.image,
        quantity: Number(i.quantity) || 1,
        size: i.size || '-',
        variant: i.variant || '',
        isHamper: Boolean(i.isHamper),
        hamperData: i.hamperData || null
      })),
      subtotal: subtotal,
      shipping: 0,
      gst: gst,
      discount: discount,
      onlineDiscount: onlineDiscount,
      coupon: cart.appliedCoupon ? cart.appliedCoupon.code : null,
      couponDiscount: discount,
      total: finalTotalAmount,
      paymentMode: isFullOnline
        ? 'Full Online Payment (5% Instant Discount)'
        : 'Cash on Delivery (Advance ₹99 Paid)',
      advancePaid: amountToPayNow,
      codBalance: codBalance,
      isPrepaid: isFullOnline,
      paymentScreenshot: paymentScreenshot,
      screenshotName: screenshotFileName,
      utr: finalUtr,
      status: 'Order Received (Verification in 24h)',
      verificationNotice:
        'You will get confirmation within 24 hr on your registered mobile number by WhatsApp, SMS, or Email.',
      nonRefundableNotice: !isFullOnline
        ? 'On Cash on Delivery (COD), the ₹99 advance confirmation fee is strictly non-refundable in the event of order cancellation.'
        : null,
      createdAt: new Date().toISOString()
    };

    // 1. Store last order in localStorage for confirmation page
    try {
      localStorage.setItem('lastOrder', JSON.stringify(orderData));
    } catch (err) {}

    // 2. Sync with Node backend MongoDB API
    try {
      await ordersAPI.create({
        orderId: orderData.orderId,
        items: orderData.items,
        shippingAddress: {
          fullName: orderData.customer.name,
          name: orderData.customer.name,
          phone: orderData.customer.mobile,
          mobile: orderData.customer.mobile,
          email: orderData.customer.email,
          address: orderData.customer.address,
          city: orderData.customer.city,
          state: orderData.customer.state,
          pincode: orderData.customer.pincode
        },
        subtotal: subtotal,
        gst: gst,
        totalAmount: finalTotalAmount,
        total: finalTotalAmount,
        paymentMode: isFullOnline ? 'online_full' : 'cod_advance',
        advancePaid: amountToPayNow,
        codBalance: codBalance,
        utr: finalUtr,
        paymentScreenshot: paymentScreenshot || '',
        screenshotName: screenshotFileName || '',
        paymentStatus: isFullOnline ? 'paid' : 'pending',
        notes: isFullOnline
          ? `Prepaid Order with 5% Discount (-₹${onlineDiscount}). Full ₹${finalTotalAmount} paid online. UTR: ${finalUtr}`
          : `COD Order with ₹99 Advance. Balance ₹${codBalance} due on delivery. UTR: ${finalUtr}. Advance is non-refundable.`
      });
    } catch (err) {
      console.warn('Backend order sync:', err.response?.data?.message || err.message);
    }

    // 3. Clear shopping cart
    cart.clearCart();

    // 4. Construct WhatsApp Message with all customer details and order summary
    const itemsText = orderData.items
      .map(
        (item, i) =>
          item.isHamper
            ? `${i + 1}. 🎁 ${item.name} (${item.hamperData?.totalItemsCount || 1} items inside${item.hamperData?.personalization?.recipientName ? ` for ${item.hamperData.personalization.recipientName}` : ''}) × ${item.quantity || 1} - ₹${(Number(item.price) * (Number(item.quantity) || 1)).toLocaleString('en-IN')}`
            : `${i + 1}. ${item.name}${item.size && item.size !== '-' ? ` (Size: ${item.size})` : ''}${item.variant ? ` (Option: ${item.variant})` : ''} × ${
            item.quantity || 1
          } - ₹${(Number(item.price) * (Number(item.quantity) || 1)).toLocaleString('en-IN')}`
      )
      .join('\n');

    const paymentSectionText = isFullOnline
      ? `💰 *PAYMENT SUMMARY:*\n` +
        `• Subtotal & GST: ₹${baseGrandTotal.toLocaleString('en-IN')}\n` +
        `• 🎁 *5% Online Payment Discount:* -₹${onlineDiscount.toLocaleString('en-IN')}\n` +
        `• ✅ *Total Online Paid:* ₹${finalTotalAmount.toLocaleString('en-IN')}\n` +
        `• 💵 *Balance Due on Delivery:* ₹0 (Fully Prepaid)\n`
      : `💰 *PAYMENT SUMMARY:*\n` +
        `• Total Order Amount: ₹${finalTotalAmount.toLocaleString('en-IN')}\n` +
        `• ✅ *Advance Online Paid for COD:* ₹${ADVANCE_FEE}\n` +
        `• 💵 *Balance to Pay on Delivery (Cash):* ₹${codBalance.toLocaleString('en-IN')}\n` +
        `• (COD ₹99 advance is non-refundable on cancellation)\n`;

    const waMsg =
      `✨ *PANCH SATTVA - LUXURY JEWELLERY* ✨\n` +
      (isFullOnline
        ? `📦 *PREPAID FULL ONLINE ORDER (5% DISCOUNT APPLIED)*\n\n`
        : `📦 *CASH ON DELIVERY (COD) ORDER WITH ₹99 ADVANCE*\n\n`) +
      `Hello Panch Sattva Team,\n` +
      `I have placed an order on your website with *${
        isFullOnline ? 'Full Online Payment' : 'Cash on Delivery (₹99 Advance)'
      }*.\n\n` +
      `📦 *Order ID:* ${orderId}\n` +
      `📅 *Date:* ${dateStr}\n\n` +
      `👤 *CUSTOMER DETAILS:*\n` +
      `• *Name:* ${orderData.customer.name}\n` +
      `• *Mobile:* +91 ${orderData.customer.mobile}\n` +
      `• *Email:* ${orderData.customer.email}\n` +
      `• *Address:* ${orderData.customer.address}, ${orderData.customer.city}, ${orderData.customer.state} - ${orderData.customer.pincode}\n\n` +
      `🛍️ *ITEMS ORDERED:*\n${itemsText}\n\n` +
      paymentSectionText +
      (finalUtr ? `• UTR / UPI Ref: ${finalUtr}\n` : '') +
      `\n📸 *PAYMENT SCREENSHOT:* (Attached with this chat)\n\n` +
      `Please verify my payment screenshot and confirm my order within 24 hours. Thank you!`;

    const waUrl = `https://api.whatsapp.com/send?phone=91${STORE_MOBILE}&text=${encodeURIComponent(
      waMsg
    )}`;

    // 5. Open WhatsApp in new tab
    window.open(waUrl, '_blank');

    setProcessing(false);

    // 6. User notification
    toast.success(
      'Your order is received! You will get confirmation within 24 hr on your registered mobile number by WhatsApp, SMS, or Email.',
      { duration: 7000 }
    );

    // 7. Navigate to Order Success page
    navigate(`/order-success/${orderId}`);
  };

  return (
    <div style={{ paddingTop: '80px', minHeight: '80vh' }}>
      <section className="checkout-page">
        <h1>Checkout</h1>

        <div className="checkout-container">
          {/* Customer Form */}
          <div className="checkout-form">
            <h2>1. Billing & Delivery Details</h2>

            <form id="checkoutForm" onSubmit={handleConfirmOrder}>
              <div className="form-group">
                <label htmlFor="fullname">Full Name *</label>
                <input
                  type="text"
                  id="fullname"
                  placeholder="Enter your full name"
                  value={formData.fullname}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    placeholder="example@domain.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="mobile">WhatsApp Mobile Number *</label>
                  <input
                    type="tel"
                    id="mobile"
                    placeholder="10-digit mobile number"
                    maxLength="10"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="address">Complete Delivery Address *</label>
                <textarea
                  id="address"
                  rows="3"
                  placeholder="House/Flat No., Building, Street, Area, Landmark"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                ></textarea>
              </div>

              <div className="form-row three-col">
                <div className="form-group">
                  <label htmlFor="state">State / Union Territory *</label>
                  <select id="state" value={formData.state} onChange={handleStateChange} required>
                    <option value="">-- Select State / UT --</option>
                    {Object.keys(INDIA_LOCATIONS).map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="city">City / District *</label>
                  <select
                    id="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    disabled={!formData.state}
                    required
                  >
                    <option value="">
                      {!formData.state ? '-- Select State First --' : '-- Select City --'}
                    </option>
                    {availableCities.map((ct) => (
                      <option key={ct} value={ct}>
                        {ct}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="pincode">PIN Code *</label>
                  <input
                    type="text"
                    id="pincode"
                    placeholder="6-digit PIN"
                    maxLength="6"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              {/* ==============================================
                   PAYMENT MODE SELECTION: ONLINE (5% OFF) OR COD
              =============================================== */}
              <div style={{ marginTop: '28px', marginBottom: '14px' }}>
                <h2 style={{ fontSize: '18px', color: '#800020', marginBottom: '10px' }}>
                  2. Choose Payment Mode
                </h2>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '12px'
                  }}
                >
                  {/* OPTION 1: FULL ONLINE PAYMENT (5% DISCOUNT) */}
                  <div
                    onClick={() => setPaymentMethodMode('online')}
                    style={{
                      border:
                        paymentMethodMode === 'online'
                          ? '2px solid #16a34a'
                          : '1.5px solid #ebd7be',
                      background: paymentMethodMode === 'online' ? '#f0fdf4' : '#faf8f5',
                      borderRadius: '12px',
                      padding: '14px 16px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow:
                        paymentMethodMode === 'online'
                          ? '0 4px 14px rgba(22, 163, 74, 0.12)'
                          : 'none'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="radio"
                          name="paymentModeRadio"
                          checked={paymentMethodMode === 'online'}
                          onChange={() => setPaymentMethodMode('online')}
                          style={{
                            accentColor: '#16a34a',
                            width: '16px',
                            height: '16px',
                            cursor: 'pointer'
                          }}
                        />
                        <strong style={{ fontSize: '14px', color: '#166534' }}>
                          Full Online Payment
                        </strong>
                      </div>
                      <span
                        style={{
                          background: '#16a34a',
                          color: '#fff',
                          fontSize: '10.5px',
                          fontWeight: '800',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          letterSpacing: '0.4px'
                        }}
                      >
                        EXTRA 5% OFF 🔥
                      </span>
                    </div>
                    <p
                      style={{
                        margin: '4px 0 0 24px',
                        fontSize: '12px',
                        color: '#15803d',
                        lineHeight: 1.45
                      }}
                    >
                      Pay online in full & get an instant{' '}
                      <strong>
                        5% discount (-₹{Math.round(baseGrandTotal * 0.05).toLocaleString('en-IN')})
                      </strong>
                      . Zero balance to pay upon delivery!
                    </p>
                  </div>

                  {/* OPTION 2: CASH ON DELIVERY (COD) */}
                  <div
                    onClick={() => setPaymentMethodMode('cod')}
                    style={{
                      border:
                        paymentMethodMode === 'cod'
                          ? '2px solid #800020'
                          : '1.5px solid #ebd7be',
                      background: paymentMethodMode === 'cod' ? '#fff9fa' : '#faf8f5',
                      borderRadius: '12px',
                      padding: '14px 16px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow:
                        paymentMethodMode === 'cod'
                          ? '0 4px 14px rgba(128, 0, 32, 0.1)'
                          : 'none'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="radio"
                          name="paymentModeRadio"
                          checked={paymentMethodMode === 'cod'}
                          onChange={() => setPaymentMethodMode('cod')}
                          style={{
                            accentColor: '#800020',
                            width: '16px',
                            height: '16px',
                            cursor: 'pointer'
                          }}
                        />
                        <strong style={{ fontSize: '14px', color: '#800020' }}>
                          Cash on Delivery (COD)
                        </strong>
                      </div>
                      <span
                        style={{
                          background: '#800020',
                          color: '#fff',
                          fontSize: '10.5px',
                          fontWeight: '700',
                          padding: '3px 8px',
                          borderRadius: '12px'
                        }}
                      >
                        ₹99 Advance
                      </span>
                    </div>
                    <p
                      style={{
                        margin: '4px 0 0 24px',
                        fontSize: '12px',
                        color: '#666',
                        lineHeight: 1.45
                      }}
                    >
                      Pay <strong>₹99 booking fee</strong> online now. Balance ₹
                      {Math.max(0, baseGrandTotal - ADVANCE_FEE).toLocaleString('en-IN')} payable in
                      cash upon delivery.
                    </p>
                    {/* NON-REFUNDABLE NOTICE IN VERY SMALL AND LIGHT FONT */}
                    <div
                      style={{
                        margin: '6px 0 0 24px',
                        fontSize: '11px',
                        color: '#9ca3af',
                        fontStyle: 'italic',
                        opacity: 0.9,
                        lineHeight: 1.3
                      }}
                    >
                      * Note: On Cash on Delivery, the ₹99 advance confirmation fee is strictly non-refundable in the event of order cancellation.
                    </div>
                  </div>
                </div>
              </div>

              {/* ==============================================
                   PAYMENT TRANSFER CARD (QR, UPI, BANK)
              =============================================== */}
              <div className="cod-gateway-section" style={{ marginTop: '10px' }}>
                <div className="cod-gateway-card">
                  <div className="cod-header-row">
                    <div className="cod-title-wrap">
                      <span className="cod-tag">
                        {paymentMethodMode === 'online' ? (
                          <>
                            <i className="fa-solid fa-bolt" style={{ color: '#16a34a' }}></i> PREPAID ONLINE (5% DISCOUNT)
                          </>
                        ) : (
                          <>
                            <i className="fa-solid fa-truck" style={{ color: '#800020' }}></i> CASH ON DELIVERY (COD)
                          </>
                        )}
                      </span>
                      <h3>
                        {paymentMethodMode === 'online'
                          ? `Pay ₹${amountToPayNow.toLocaleString('en-IN')} Online (5% Saved)`
                          : `Pay ₹${ADVANCE_FEE} COD Advance Confirmation`}
                      </h3>
                    </div>
                    <div className="cod-split-badge">
                      <div className="cod-split-item advance">
                        <span className="cod-split-label">Pay Now Online</span>
                        <strong>₹{amountToPayNow.toLocaleString('en-IN')}</strong>
                      </div>
                      <div className="cod-split-item">
                        <span className="cod-split-label">Pay on Delivery</span>
                        <strong>
                          {paymentMethodMode === 'online'
                            ? '₹0 (Prepaid)'
                            : `₹${codBalance.toLocaleString('en-IN')}`}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <p style={{ fontSize: '13px', color: '#555', marginBottom: '14px' }}>
                    {paymentMethodMode === 'online'
                      ? `Scan or transfer ₹${amountToPayNow.toLocaleString('en-IN')} via any method below, then attach the screenshot:`
                      : `Pay the ₹${ADVANCE_FEE} confirmation token via any method below, then attach the screenshot:`}
                  </p>

                  {/* Mode Selection Tabs */}
                  <div className="cod-tabs-nav">
                    <button
                      type="button"
                      className={`cod-tab-button ${activePaymentTab === 'qr' ? 'active' : ''}`}
                      onClick={() => setActivePaymentTab('qr')}
                    >
                      <i className="fa-solid fa-qrcode"></i> Scan & Pay QR Code
                    </button>
                    <button
                      type="button"
                      className={`cod-tab-button ${activePaymentTab === 'upi' ? 'active' : ''}`}
                      onClick={() => setActivePaymentTab('upi')}
                    >
                      <i className="fa-solid fa-mobile-screen"></i> UPI ID
                    </button>
                    <button
                      type="button"
                      className={`cod-tab-button ${activePaymentTab === 'bank' ? 'active' : ''}`}
                      onClick={() => setActivePaymentTab('bank')}
                    >
                      <i className="fa-solid fa-building-columns"></i> Bank Account
                    </button>
                  </div>

                  {/* TAB 1: QR CODE */}
                  {activePaymentTab === 'qr' && (
                    <div className="cod-tab-pane">
                      <div className="cod-qr-flex">
                        <div className="cod-qr-frame">
                          <img src={qrCodeUrl} alt="Scan & Pay QR Code" />
                          <span
                            style={{
                              display: 'block',
                              fontSize: '11px',
                              color: '#666',
                              marginTop: '6px',
                              fontWeight: '600'
                            }}
                          >
                            Panch Sattva Store QR
                          </span>
                        </div>
                        <div className="cod-qr-info">
                          <span className="cod-amount-pill">
                            Pay ₹{amountToPayNow.toLocaleString('en-IN')}.00
                          </span>
                          <h4>Scan with any UPI App</h4>
                          <p>Google Pay • PhonePe • Paytm • BHIM • CRED UPI</p>
                          <div style={{ fontSize: '12px', color: '#555' }}>
                            <strong>UPI ID:</strong> {STORE_UPI_ID}
                          </div>
                          <div className="cod-copy-row">
                            <code>{STORE_UPI_ID}</code>
                            <button
                              type="button"
                              className="cod-copy-btn"
                              onClick={() => handleCopyText(STORE_UPI_ID, 'UPI ID')}
                            >
                              {copiedField === 'UPI ID' ? '✓ Copied' : 'Copy'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: UPI ID */}
                  {activePaymentTab === 'upi' && (
                    <div className="cod-tab-pane">
                      <span className="cod-amount-pill">
                        Pay ₹{amountToPayNow.toLocaleString('en-IN')}.00
                      </span>
                      <h4 style={{ color: '#800020', margin: '6px 0' }}>Transfer via UPI ID</h4>
                      <p style={{ fontSize: '13px', color: '#555', margin: '4px 0 10px 0' }}>
                        Send payment to our verified merchant UPI ID:
                      </p>
                      <div className="cod-copy-row">
                        <code>{STORE_UPI_ID}</code>
                        <button
                          type="button"
                          className="cod-copy-btn"
                          onClick={() => handleCopyText(STORE_UPI_ID, 'UPI ID')}
                        >
                          {copiedField === 'UPI ID' ? '✓ Copied' : 'Copy UPI ID'}
                        </button>
                      </div>
                      <div
                        style={{
                          marginTop: '10px',
                          fontSize: '12px',
                          color: '#666',
                          display: 'flex',
                          gap: '15px'
                        }}
                      >
                        <span>
                          <strong>Beneficiary:</strong> PANCH SATTVA
                        </span>
                        <span>
                          <strong>Helpline:</strong> +91 {STORE_MOBILE}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: BANK ACCOUNT */}
                  {activePaymentTab === 'bank' && (
                    <div className="cod-tab-pane">
                      <span className="cod-amount-pill">
                        Transfer ₹{amountToPayNow.toLocaleString('en-IN')}.00
                      </span>
                      <h4 style={{ color: '#800020', margin: '6px 0 12px 0' }}>
                        Direct Bank Account Transfer (IMPS / NEFT)
                      </h4>
                      <table className="bank-details-table">
                        <tbody>
                          <tr>
                            <td>Bank Name:</td>
                            <td>HDFC Bank</td>
                          </tr>
                          <tr>
                            <td>Account Holder:</td>
                            <td>PANCH SATTVA JEWELLERY</td>
                          </tr>
                          <tr>
                            <td>Account Number:</td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <code>50200084729103</code>
                                <button
                                  type="button"
                                  className="cod-copy-btn"
                                  onClick={() => handleCopyText('50200084729103', 'Account Number')}
                                >
                                  {copiedField === 'Account Number' ? '✓ Copied' : 'Copy'}
                                </button>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td>IFSC Code:</td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <code>HDFC0001234</code>
                                <button
                                  type="button"
                                  className="cod-copy-btn"
                                  onClick={() => handleCopyText('HDFC0001234', 'IFSC Code')}
                                >
                                  {copiedField === 'IFSC Code' ? '✓ Copied' : 'Copy'}
                                </button>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td>Branch & Type:</td>
                            <td>Udaipur, Rajasthan • Current Account</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* MANDATORY PAYMENT SCREENSHOT UPLOAD */}
                  <div
                    id="screenshotUploadBox"
                    className={`cod-upload-section ${paymentScreenshot ? 'has-file' : ''}`}
                  >
                    <label htmlFor="screenshotInput" className="cod-upload-dropzone">
                      <div className="cod-upload-icon">
                        {paymentScreenshot ? (
                          <i
                            className="fa-solid fa-circle-check"
                            style={{ color: '#16a34a' }}
                          ></i>
                        ) : (
                          <i className="fa-solid fa-cloud-arrow-up"></i>
                        )}
                      </div>
                      <strong style={{ display: 'block', fontSize: '14px', color: '#800020' }}>
                        {paymentScreenshot
                          ? 'Payment Screenshot Attached'
                          : `Upload Payment Screenshot (₹${amountToPayNow.toLocaleString('en-IN')}) *`}
                      </strong>
                      <span style={{ fontSize: '12px', color: '#666', display: 'block', marginTop: '4px' }}>
                        {paymentScreenshot
                          ? 'Click to change or select another screenshot'
                          : 'Take a screenshot of your successful payment and upload here for verification'}
                      </span>
                      <input
                        type="file"
                        id="screenshotInput"
                        accept="image/*"
                        onChange={handleScreenshotChange}
                        style={{ display: 'none' }}
                      />
                    </label>

                    {paymentScreenshot && (
                      <div className="cod-preview-wrap">
                        <img
                          src={paymentScreenshot}
                          alt="Payment Screenshot Preview"
                          className="cod-preview-img"
                        />
                        <div style={{ flex: 1 }}>
                          <strong style={{ fontSize: '13px', color: '#166534', display: 'block' }}>
                            ✓ Screenshot Attached
                          </strong>
                          <small style={{ color: '#666', fontSize: '11.5px', wordBreak: 'break-all' }}>
                            {screenshotFileName || 'screenshot.jpg'}
                          </small>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentScreenshot(null);
                            setScreenshotFileName('');
                          }}
                          style={{
                            background: '#fee2e2',
                            color: '#dc2626',
                            border: 'none',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            cursor: 'pointer',
                            fontWeight: '600'
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                  {/* OPTIONAL UTR / REF INPUT */}
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label htmlFor="utrNumber" style={{ fontSize: '12.5px', fontWeight: '600' }}>
                      UPI Reference / UTR Number (Optional)
                    </label>
                    <input
                      type="text"
                      id="utrNumber"
                      placeholder="e.g. 428901847291 or transaction reference ID"
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value)}
                    />
                  </div>

                  {/* PRIMARY ONE-CLICK BUTTON TO SEND ON WHATSAPP & CONFIRM ORDER */}
                  <button
                    type="submit"
                    id="confirmCodWhatsappBtn"
                    className="cod-confirm-whatsapp-btn"
                    disabled={processing}
                  >
                    <i className="fa-brands fa-whatsapp" style={{ fontSize: '22px' }}></i>
                    {processing
                      ? 'Confirming Order...'
                      : paymentMethodMode === 'online'
                      ? 'Confirm Full Online Order & Send Screenshot on WhatsApp'
                      : 'Send Screenshot & Details on WhatsApp to Confirm COD Order'}
                  </button>

                  {/* VERY SMALL AND LIGHT FONT NOTICE IF COD IS SELECTED */}
                  {paymentMethodMode === 'cod' && (
                    <div
                      style={{
                        textAlign: 'center',
                        fontSize: '11px',
                        color: '#9ca3af',
                        fontStyle: 'italic',
                        opacity: 0.85,
                        marginTop: '8px',
                        lineHeight: 1.3
                      }}
                    >
                      * Please note: On Cash on Delivery, the ₹99 advance booking fee is non-refundable if you cancel the order.
                    </div>
                  )}

                  {/* 24-HOUR NOTIFICATION PROMISE */}
                  <div className="cod-notification-promise" style={{ marginTop: '12px' }}>
                    <i className="fa-solid fa-bell"></i>
                    <div>
                      <strong>Order Confirmation Guarantee:</strong>
                      <p style={{ margin: '2px 0 0 0' }}>
                        Your order will be received immediately, and you will receive final confirmation
                        within <strong>24 hours</strong> on your registered mobile number via WhatsApp,
                        SMS, or Email.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Order Summary */}
          <div className="checkout-summary">
            <h2>Order Summary</h2>

            <div id="checkoutItems" className="checkout-items-list">
              {cart.items.length === 0 ? (
                <p style={{ color: '#666', fontSize: '13px' }}>Your cart is empty.</p>
              ) : (
                cart.items.map((item, idx) => (
                  <div
                    key={`${item.id}-${idx}`}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 0',
                      borderBottom: '1px solid #f0e6e6',
                      fontSize: '13.5px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img
                        src={item.image}
                        alt={item.name}
                        style={{
                          width: '44px',
                          height: '44px',
                          objectFit: 'cover',
                          borderRadius: '6px'
                        }}
                        onError={(e) => {
                          e.target.src = '/images/psimg/ring1.jpg';
                        }}
                      />
                      <div>
                        <strong>{item.isHamper ? `🎁 ${item.name}` : item.name}</strong>
                        {item.isHamper && item.hamperData ? (
                          <span style={{ display: 'block', fontSize: '11.5px', color: '#800020' }}>
                            {item.hamperData.totalItemsCount || item.hamperData.products?.length || 0} items inside
                            {item.hamperData.personalization?.recipientName ? ` • For: ${item.hamperData.personalization.recipientName}` : ''}
                          </span>
                        ) : (
                          <span style={{ display: 'block', fontSize: '12px', color: '#666' }}>
                            Qty: {item.quantity}{' '}
                            {item.variant ? `• Option: ${item.variant} ` : ''}
                            {item.size && item.size !== '-' ? `• Size: ${item.size}` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <strong>₹{(Number(item.price) * item.quantity).toLocaleString('en-IN')}</strong>
                  </div>
                ))
              )}
            </div>

            <hr />

            <div className="summary-row">
              <span>Subtotal</span>
              <span id="checkoutSubtotal">₹{subtotal.toLocaleString('en-IN')}</span>
            </div>

            <div className="summary-row">
              <span>Shipping</span>
              <span className="free-badge" style={{ color: '#16a34a', fontWeight: 'bold' }}>
                FREE
              </span>
            </div>

            <div className="summary-row">
              <span>GST (3%)</span>
              <span id="checkoutGST">₹{gst.toLocaleString('en-IN')}</span>
            </div>

            {discount > 0 && (
              <div className="summary-row discount" id="discountRow">
                <span>Discount ({cart.appliedCoupon?.code})</span>
                <span id="checkoutDiscount" style={{ color: '#16a34a', fontWeight: 'bold' }}>
                  -₹{discount.toLocaleString('en-IN')}
                </span>
              </div>
            )}

            {/* Online 5% Extra Discount Row */}
            {paymentMethodMode === 'online' && (
              <div
                className="summary-row discount"
                style={{
                  background: '#f0fdf4',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  border: '1px solid #bbf7d0',
                  margin: '4px 0'
                }}
              >
                <span style={{ color: '#166534', fontWeight: '600' }}>
                  <i className="fa-solid fa-gift"></i> 5% Online Payment Discount
                </span>
                <span style={{ color: '#16a34a', fontWeight: 'bold' }}>
                  -₹{onlineDiscount.toLocaleString('en-IN')}
                </span>
              </div>
            )}

            {/* Coupon Code Section on Checkout */}
            <div style={{ margin: '14px 0', borderTop: '1px solid #f0e6e6', paddingTop: '12px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px'
                }}
              >
                <span
                  style={{
                    fontSize: '12.5px',
                    fontWeight: '600',
                    color: '#800020',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <i className="fa-solid fa-tags" style={{ color: '#c5a059' }}></i>
                  Apply Coupon
                </span>
                {availableCoupons.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowCouponsList(!showCouponsList)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#c5a059',
                      fontSize: '11.5px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    {showCouponsList ? 'Hide Offers' : `View Offers (${availableCoupons.length})`}
                  </button>
                )}
              </div>

              {cart.appliedCoupon ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    background: '#f0fdf4',
                    border: '1.5px solid #86efac',
                    borderRadius: '8px',
                    marginBottom: '10px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i
                      className="fa-solid fa-circle-check"
                      style={{ color: '#16a34a', fontSize: '14px' }}
                    ></i>
                    <div>
                      <strong style={{ color: '#166534', fontSize: '13px' }}>
                        {cart.appliedCoupon.code} Applied
                      </strong>
                      <span style={{ display: 'block', fontSize: '11px', color: '#15803d' }}>
                        -₹{discount.toLocaleString('en-IN')} off
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    style={{
                      background: '#fee2e2',
                      border: 'none',
                      color: '#dc2626',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: '600'
                    }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    marginBottom: '10px'
                  }}
                >
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="text"
                      placeholder="Enter code (e.g. PANCH10)"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      style={{
                        textTransform: 'uppercase',
                        flex: 1,
                        padding: '8px 10px',
                        border: '1px solid #ebd7be',
                        borderRadius: '6px',
                        fontSize: '12.5px'
                      }}
                    />
                    <button
                      type="button"
                      onClick={(e) => handleApplyCoupon(e)}
                      style={{
                        background: 'linear-gradient(135deg, #800020 0%, #4a0013 100%)',
                        color: '#fff',
                        border: 'none',
                        padding: '0 14px',
                        borderRadius: '6px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        fontSize: '12px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Apply
                    </button>
                  </div>
                  {couponMsg && (
                    <span
                      style={{
                        fontSize: '11.5px',
                        color: couponMsg.type === 'success' ? '#16a34a' : '#dc2626'
                      }}
                    >
                      {couponMsg.text}
                    </span>
                  )}
                </div>
              )}

              {/* Collapsible Available Coupons on Checkout */}
              {showCouponsList && availableCoupons.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    background: '#faf8f5',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #ebd7be',
                    maxHeight: '180px',
                    overflowY: 'auto'
                  }}
                >
                  {availableCoupons.map((c) => {
                    const isApplied = cart.appliedCoupon?.code === c.code;
                    const minSpend = Number(c.minOrder || c.minSpend || 0);
                    const isEligible = subtotal >= minSpend;
                    const discountText =
                      c.discountType === 'flat' || c.discountType === 'fixed'
                        ? `₹${c.discountValue} OFF`
                        : `${c.discountValue}% OFF`;

                    return (
                      <div
                        key={c.code}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 8px',
                          background: isApplied ? '#f0fdf4' : '#fff',
                          border: isApplied ? '1px solid #86efac' : '1px solid #ebd7be',
                          borderRadius: '6px',
                          fontSize: '12px'
                        }}
                      >
                        <div>
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontWeight: '700',
                              color: '#800020',
                              marginRight: '6px'
                            }}
                          >
                            {c.code}
                          </span>
                          <span style={{ color: '#16a34a', fontWeight: '600', fontSize: '11px' }}>
                            {discountText}
                          </span>
                          {minSpend > 0 && (
                            <small style={{ display: 'block', color: '#888', fontSize: '10px' }}>
                              Min ₹{minSpend}
                            </small>
                          )}
                        </div>
                        {isApplied ? (
                          <span style={{ color: '#16a34a', fontSize: '11px', fontWeight: 'bold' }}>
                            ✓ Applied
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleApplyCoupon(null, c.code)}
                            disabled={!isEligible}
                            style={{
                              background: isEligible ? '#c5a059' : '#e5e7eb',
                              color: isEligible ? '#140207' : '#9ca3af',
                              border: 'none',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '600',
                              cursor: isEligible ? 'pointer' : 'not-allowed'
                            }}
                          >
                            Apply
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <hr />

            <div className="summary-row total">
              <span>Payable Total</span>
              <span id="checkoutTotal">₹{finalTotalAmount.toLocaleString('en-IN')}</span>
            </div>

            {/* Split Breakdown */}
            <div
              style={{
                background: '#faf8f5',
                border: '1px solid #ebd7be',
                borderRadius: '8px',
                padding: '10px 12px',
                margin: '12px 0'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '12.5px',
                  marginBottom: '6px'
                }}
              >
                <span>Amount to Pay Now (Online):</span>
                <strong style={{ color: '#1d4ed8' }}>
                  ₹{amountToPayNow.toLocaleString('en-IN')}
                </strong>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '13px'
                }}
              >
                <span>Balance Due on Delivery:</span>
                <strong style={{ color: codBalance > 0 ? '#800020' : '#16a34a' }}>
                  {paymentMethodMode === 'online'
                    ? '₹0 (Prepaid)'
                    : `₹${codBalance.toLocaleString('en-IN')}`}
                </strong>
              </div>

              {/* NON-REFUNDABLE NOTICE IN VERY SMALL AND LIGHT FONT */}
              {paymentMethodMode === 'cod' && (
                <div
                  style={{
                    fontSize: '10.5px',
                    color: '#9ca3af',
                    fontStyle: 'italic',
                    opacity: 0.85,
                    marginTop: '6px',
                    borderTop: '1px dashed #ebd7be',
                    paddingTop: '6px',
                    lineHeight: 1.3
                  }}
                >
                  * Note: On Cash on Delivery (COD), the ₹99 advance fee is strictly non-refundable if you cancel the order.
                </div>
              )}
            </div>

            <div className="summary-security-note">
              <i className="fa-solid fa-shield-halved"></i> 100% Insured Delivery & Official Receipt
            </div>

            <div
              className="summary-cod-status"
              style={{
                background: paymentMethodMode === 'online' ? '#f0fdf4' : '#faf8f5',
                color: paymentMethodMode === 'online' ? '#166534' : '#800020',
                border:
                  paymentMethodMode === 'online'
                    ? '1px solid #bbf7d0'
                    : '1px solid #ebd7be',
                padding: '8px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '10px'
              }}
            >
              {paymentMethodMode === 'online' ? (
                <>
                  <i className="fa-solid fa-bolt" style={{ color: '#16a34a' }}></i> Online Prepaid (5% Discount Applied)
                </>
              ) : (
                <>
                  <i className="fa-solid fa-truck" style={{ color: '#800020' }}></i> Cash on Delivery (₹99 Advance)
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
