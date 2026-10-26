import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

export default function OrderSuccess() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);

  const STORE_MOBILE = '6375247046';

  useEffect(() => {
    try {
      const raw = localStorage.getItem('lastOrder');
      if (raw) {
        setOrder(JSON.parse(raw));
      }
    } catch (e) {
      console.error(e);
    }
  }, [orderId]);

  const displayOrderId =
    order?.orderId || orderId || 'PS-' + Math.floor(100000 + Math.random() * 900000);
  const customerMobile = order?.customer?.mobile || STORE_MOBILE;

  const isPrepaid =
    order?.isPrepaid ||
    order?.codBalance === 0 ||
    order?.paymentMode?.includes('Online') ||
    order?.paymentMode?.includes('Prepaid');

  const advancePaid = Number(order?.advancePaid || (isPrepaid ? order?.total || 0 : 99));
  const codBalance = isPrepaid
    ? 0
    : order?.codBalance !== undefined
    ? Number(order.codBalance)
    : Math.max(0, Number(order?.total || 0) - advancePaid);

  // Build WhatsApp message
  const itemsText = (order?.items || [])
    .map(
      (item, i) =>
        `${i + 1}. ${item.name}${item.size && item.size !== '-' ? ` (Size: ${item.size})` : ''} × ${
          item.quantity || 1
        } - ₹${(Number(item.price) * (Number(item.quantity) || 1)).toLocaleString('en-IN')}`
    )
    .join('\n');

  const waMsg =
    `✨ *PANCH SATTVA - LUXURY JEWELLERY* ✨\n` +
    (isPrepaid
      ? `📦 *PREPAID FULL ONLINE ORDER (5% DISCOUNT APPLIED)*\n\n`
      : `📦 *CASH ON DELIVERY (COD) ORDER - ₹99 ADVANCE CONFIRMATION*\n\n`) +
    `Dear ${order?.customer?.name || 'Customer'},\n` +
    `Your order has been received and is being verified.\n\n` +
    `📦 *Order ID:* ${displayOrderId}\n` +
    `📅 *Date:* ${order?.date || new Date().toLocaleDateString('en-IN')}\n` +
    `💰 *Total Order Value:* ₹${Number(order?.total || 0).toLocaleString('en-IN')}\n` +
    (isPrepaid
      ? `✅ *Total Online Paid:* ₹${advancePaid} (5% Instant Discount Applied)\n💵 *Balance Due on Delivery:* ₹0 (Prepaid)\n`
      : `✅ *Advance Online Paid:* ₹${advancePaid}\n💵 *Balance Due on Delivery (Cash):* ₹${codBalance.toLocaleString('en-IN')}\n(*COD ₹99 advance is non-refundable on cancellation)\n`) +
    (order?.utr ? `🧾 *UTR / Ref:* ${order.utr}\n` : '') +
    `📍 *Delivery Address:* ${order?.customer?.address || ''}, ${order?.customer?.city || ''}, ${
      order?.customer?.state || ''
    } - ${order?.customer?.pincode || ''}\n` +
    `📞 *Registered Mobile:* +91 ${customerMobile}\n\n` +
    `🛍️ *Items Ordered:*\n${itemsText}\n\n` +
    `📢 *NOTE:* You will receive final order confirmation within 24 hours on your registered mobile number via WhatsApp, SMS, or Email.\n` +
    `📞 Store Helpline: +91 ${STORE_MOBILE}`;

  const storeWaUrl = `https://api.whatsapp.com/send?phone=91${STORE_MOBILE}&text=${encodeURIComponent(
    waMsg
  )}`;

  return (
    <div style={{ paddingTop: '80px', minHeight: '80vh' }}>
      <section className="success-page">
        <div className="success-box">
          <div className="success-icon">
            <i className="fa-solid fa-circle-check"></i>
          </div>

          <h1>Order Received!</h1>

          <p className="success-subtitle">
            Thank you for shopping with PANCH SATTVA. Your{' '}
            {isPrepaid ? 'prepaid order with 5% discount' : 'Cash on Delivery order with ₹99 advance'}{' '}
            is successfully registered.
          </p>

          <div className="order-id-badge" id="orderIdDisplay">
            Order ID: {displayOrderId}
          </div>

          {/* 24-HOUR NOTIFICATION BANNER */}
          <div
            style={{
              background: '#eff6ff',
              border: '2px solid #93c5fd',
              borderRadius: '14px',
              padding: '16px 20px',
              margin: '20px 0',
              textAlign: 'left',
              display: 'flex',
              gap: '14px',
              alignItems: 'center'
            }}
          >
            <i
              className="fa-solid fa-bell"
              style={{ color: '#2563eb', fontSize: '28px', flexShrink: 0 }}
            ></i>
            <div>
              <strong style={{ color: '#1e40af', fontSize: '15px', display: 'block' }}>
                Confirmation Notice (Within 24 Hours)
              </strong>
              <p style={{ margin: '4px 0 0 0', color: '#1e3a8a', fontSize: '13px', lineHeight: 1.5 }}>
                Your order is received! You will get final order confirmation within{' '}
                <strong>24 hours</strong> on your registered mobile number{' '}
                <strong>(+91 {customerMobile})</strong> by <strong>WhatsApp, SMS, or Email</strong>.
              </p>
            </div>
          </div>

          {/* Notification Alerts */}
          <div className="notification-status-card">
            <div className="notif-item">
              <i className="fa-brands fa-whatsapp"></i>
              <div>
                <strong>WhatsApp Verification Active</strong>
                <p>
                  Details sent to Official Store Helpline: <strong>+91 {STORE_MOBILE}</strong>
                </p>
                <small style={{ color: '#666' }}>Customer Mobile: +91 {customerMobile}</small>
              </div>
            </div>

            <div className="notif-item">
              {isPrepaid ? (
                <>
                  <i className="fa-solid fa-bolt" style={{ color: '#16a34a' }}></i>
                  <div>
                    <strong>Full Online Payment (5% Discount Applied)</strong>
                    <p>100% Prepaid • Insured Express Dispatch • Zero balance on delivery</p>
                  </div>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-truck" style={{ color: '#800020' }}></i>
                  <div>
                    <strong>Cash on Delivery (COD) Registered</strong>
                    <p>₹99 Advance Paid Online • Balance payable in cash upon doorstep delivery</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Dynamic Order Summary Card */}
          {order && (
            <div
              className="order-summary-card"
              id="orderSummaryCard"
              style={{ display: 'block', textAlign: 'left' }}
            >
              <h3>Order Receipt & Payment Details</h3>

              <div className="receipt-row">
                <span>Customer Name:</span>
                <strong id="receiptName">{order.customer?.name || '-'}</strong>
              </div>

              <div className="receipt-row">
                <span>Contact Number (WhatsApp):</span>
                <strong id="receiptMobile">+91 {order.customer?.mobile || '-'}</strong>
              </div>

              <div className="receipt-row">
                <span>Delivery Address:</span>
                <span id="receiptAddress" style={{ textAlign: 'right', maxWidth: '60%' }}>
                  {order.customer?.address}, {order.customer?.city}, {order.customer?.state} -{' '}
                  {order.customer?.pincode}
                </span>
              </div>

              <div className="receipt-row">
                <span>Payment Mode:</span>
                <span
                  id="receiptPaymentMode"
                  style={{ color: isPrepaid ? '#16a34a' : '#800020', fontWeight: '700' }}
                >
                  {order.paymentMode || (isPrepaid ? 'Full Online Payment' : 'Cash on Delivery (COD)')}
                </span>
              </div>

              <div className="receipt-row">
                <span>Amount Paid Online:</span>
                <strong style={{ color: '#1d4ed8' }}>
                  ₹{advancePaid.toLocaleString('en-IN')} (Online via UPI/Bank)
                </strong>
              </div>

              <div className="receipt-row">
                <span>Balance Due on Delivery:</span>
                <strong style={{ color: codBalance > 0 ? '#800020' : '#16a34a', fontSize: '15px' }}>
                  {isPrepaid ? '₹0 (Fully Paid)' : `₹${codBalance.toLocaleString('en-IN')} (Cash at Doorstep)`}
                </strong>
              </div>

              {/* NON-REFUNDABLE NOTICE IN VERY SMALL AND LIGHT FONT FOR COD */}
              {!isPrepaid && (
                <div
                  style={{
                    padding: '8px 10px',
                    background: '#fafaf9',
                    borderRadius: '6px',
                    border: '1px solid #f5f5f4',
                    margin: '8px 0',
                    fontSize: '11px',
                    color: '#9ca3af',
                    fontStyle: 'italic',
                    opacity: 0.9,
                    lineHeight: 1.35
                  }}
                >
                  * Please note: On Cash on Delivery (COD), the advance confirmation fee of ₹99 is strictly non-refundable in the event of order cancellation.
                </div>
              )}

              <div className="receipt-row">
                <span>Order Status:</span>
                <span
                  style={{
                    color: '#92400e',
                    background: '#fef3c7',
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontWeight: '600',
                    fontSize: '12px'
                  }}
                >
                  <i className="fa-solid fa-clock"></i> Verification in Progress (24h)
                </span>
              </div>

              {order.utr && (
                <div className="receipt-row" id="receiptPaymentIdRow">
                  <span>Payment UTR / Ref:</span>
                  <strong
                    id="receiptPaymentId"
                    style={{ fontFamily: 'monospace', color: '#800020' }}
                  >
                    {order.utr}
                  </strong>
                </div>
              )}

              {/* Uploaded Screenshot Preview */}
              {order.paymentScreenshot && (
                <div
                  style={{
                    margin: '14px 0',
                    padding: '10px 14px',
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  <img
                    src={order.paymentScreenshot}
                    alt="Payment Screenshot"
                    style={{
                      width: '54px',
                      height: '54px',
                      objectFit: 'cover',
                      borderRadius: '6px',
                      border: '1px solid #86efac'
                    }}
                  />
                  <div>
                    <strong style={{ color: '#166534', fontSize: '13px', display: 'block' }}>
                      Payment Screenshot Attached
                    </strong>
                    <span style={{ color: '#666', fontSize: '11px' }}>
                      {order.screenshotName || 'payment_screenshot.jpg'}
                    </span>
                  </div>
                </div>
              )}

              <div className="receipt-row total-row">
                <span>Total Order Value:</span>
                <strong id="receiptTotal" style={{ color: '#800020', fontSize: '20px' }}>
                  ₹{Number(order.total || 0).toLocaleString('en-IN')}
                </strong>
              </div>

              {order.items && order.items.length > 0 && (
                <div
                  className="receipt-items-list"
                  id="receiptItemsList"
                  style={{ marginTop: '16px', borderTop: '1px solid #e0e0e0', paddingTop: '12px' }}
                >
                  <h4 style={{ color: '#800020', marginBottom: '8px' }}>Items Ordered:</h4>
                  {order.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="receipt-item-line"
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '6px 0',
                        fontSize: '13px'
                      }}
                    >
                      <span>
                        {item.name} {item.size && item.size !== '-' ? `(${item.size})` : ''} ×{' '}
                        {item.quantity || 1}
                      </span>
                      <strong>
                        ₹{(Number(item.price) * (Number(item.quantity) || 1)).toLocaleString('en-IN')}
                      </strong>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="success-actions">
            <a
              id="openStoreWhatsAppBtn"
              href={storeWaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="whatsapp-btn"
            >
              <i className="fa-brands fa-whatsapp"></i> Chat / Send Screenshot on Store WhatsApp (+91{' '}
              {STORE_MOBILE})
            </a>

            <Link
              to="/dashboard"
              className="sms-btn"
              style={{
                borderColor: '#800020',
                color: '#800020',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                textDecoration: 'none'
              }}
            >
              <i className="fa-solid fa-gem"></i> View in My Dashboard
            </Link>

            <Link to="/products" className="continue-shopping-btn">
              🛍️ Continue Shopping
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
