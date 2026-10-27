import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { youpiAPI } from '../api';
import { useCartStore } from '../store';
import toast from 'react-hot-toast';

export default function PaymentReturn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const cart = useCartStore();

  const orderId = searchParams.get('orderId');
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [pollCount, setPollCount] = useState(0);
  const [directUtr, setDirectUtr] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  const STORE_UPI_ID = '6375247046@okicici';

  const handleCopyUpi = () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(STORE_UPI_ID);
      }
      setCopiedUpi(true);
      toast.success('UPI ID copied!');
      setTimeout(() => setCopiedUpi(false), 2000);
    } catch {
      toast.success(`UPI ID: ${STORE_UPI_ID}`);
    }
  };

  const handleConfirmDirectPayment = async () => {
    if (!orderId) return;
    setConfirming(true);
    try {
      await youpiAPI.confirmDirect({ orderId, utr: directUtr.trim() || undefined });
      toast.success('Payment verified successfully!');
      cart.clearCart();
      await fetchStatus(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not verify payment.');
    } finally {
      setConfirming(false);
    }
  };

  const pollTimerRef = useRef(null);
  const MAX_POLLS = 10; // Poll for up to ~25 seconds

  const fetchStatus = async (isManual = false) => {
    if (!orderId) {
      setErrorMsg('No order ID provided in return URL.');
      setLoading(false);
      return;
    }

    try {
      if (isManual) setLoading(true);
      const res = await youpiAPI.getStatus(orderId);
      const data = res.data;
      setOrderData(data);
      setLoading(false);

      if (data.paymentStatus === 'paid') {
        // Authoritative verification confirmed by backend
        cart.clearCart();
        if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
      } else if (data.paymentStatus === 'pending' || data.paymentStatus === 'observed') {
        // Keep polling if still pending and within poll limit
        setPollCount((prev) => {
          const nextCount = prev + 1;
          if (nextCount < MAX_POLLS) {
            pollTimerRef.current = setTimeout(() => fetchStatus(), 2500);
          }
          return nextCount;
        });
      }
    } catch (err) {
      console.error('Error fetching YOUPI payment status:', err);
      const msg = err.response?.data?.message || 'Could not verify payment status with server.';
      setErrorMsg(msg);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [orderId]);

  const handleManualRefresh = () => {
    setPollCount(0);
    fetchStatus(true);
    toast.success('Checking latest payment status with bank...');
  };

  return (
    <div style={{ paddingTop: '100px', minHeight: '80vh', background: '#faf8f5', paddingBottom: '60px' }}>
      <div
        style={{
          maxWidth: '680px',
          margin: '0 auto',
          padding: '0 20px'
        }}
      >
        <div
          style={{
            background: '#ffffff',
            borderRadius: '20px',
            border: '1.5px solid #ebd7be',
            boxShadow: '0 10px 30px rgba(128, 0, 32, 0.08)',
            padding: '40px 32px',
            textAlign: 'center'
          }}
        >
          {/* Header Brand Badge */}
          <div style={{ marginBottom: '24px' }}>
            <span
              style={{
                background: '#fdf4f5',
                color: '#800020',
                border: '1px solid #ebd7be',
                padding: '6px 16px',
                borderRadius: '30px',
                fontSize: '12px',
                fontWeight: '700',
                letterSpacing: '1px',
                textTransform: 'uppercase'
              }}
            >
              YOUPI PG Secure Verification
            </span>
          </div>

          {/* 1. Loading State */}
          {loading && (
            <div>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  border: '4px solid #ebd7be',
                  borderTop: '4px solid #800020',
                  borderRadius: '50%',
                  margin: '0 auto 24px',
                  animation: 'spin 1s linear infinite'
                }}
              />
              <style>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
              <h2 style={{ color: '#800020', fontSize: '24px', marginBottom: '8px' }}>
                Verifying Payment...
              </h2>
              <p style={{ color: '#666', fontSize: '14px', lineHeight: 1.6 }}>
                Please wait while we securely confirm your UPI transaction with the gateway.
              </p>
            </div>
          )}

          {/* 2. Error State */}
          {!loading && errorMsg && (
            <div>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  background: '#fef2f2',
                  color: '#dc2626',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  margin: '0 auto 20px'
                }}
              >
                <i className="fa-solid fa-triangle-exclamation"></i>
              </div>
              <h2 style={{ color: '#991b1b', fontSize: '22px', marginBottom: '8px' }}>
                Verification Notice
              </h2>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>{errorMsg}</p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                  onClick={() => handleManualRefresh()}
                  style={{
                    background: '#800020',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '12px 24px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Retry Verification
                </button>
                <Link
                  to="/dashboard"
                  style={{
                    background: '#faf8f5',
                    color: '#800020',
                    border: '1.5px solid #ebd7be',
                    borderRadius: '10px',
                    padding: '12px 24px',
                    fontWeight: '600',
                    textDecoration: 'none'
                  }}
                >
                  Go to Dashboard
                </Link>
              </div>
            </div>
          )}

          {/* 3. Successful State (Authoritative Paid) */}
          {!loading && orderData?.paymentStatus === 'paid' && (
            <div>
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  background: '#f0fdf4',
                  color: '#16a34a',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '36px',
                  margin: '0 auto 20px',
                  boxShadow: '0 8px 20px rgba(22, 163, 74, 0.2)'
                }}
              >
                <i className="fa-solid fa-circle-check"></i>
              </div>
              <h1 style={{ color: '#166534', fontSize: '26px', marginBottom: '8px' }}>
                Payment Confirmed!
              </h1>
              <p style={{ color: '#4b5563', fontSize: '15px', marginBottom: '24px' }}>
                Thank you! Your payment of{' '}
                <strong style={{ color: '#111827' }}>
                  ₹{Number(orderData.totalAmount || 0).toLocaleString('en-IN')}
                </strong>{' '}
                has been successfully verified via YOUPI PG.
              </p>

              {/* Order Info Card */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '20px',
                  textAlign: 'left',
                  marginBottom: '28px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ color: '#64748b', fontSize: '13px' }}>Order Reference:</span>
                  <strong style={{ color: '#0f172a', fontSize: '14px', fontFamily: 'monospace' }}>
                    {orderData.orderId}
                  </strong>
                </div>
                {orderData.utr && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ color: '#64748b', fontSize: '13px' }}>Bank UTR / Ref:</span>
                    <strong style={{ color: '#0f172a', fontSize: '14px', fontFamily: 'monospace' }}>
                      {orderData.utr}
                    </strong>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ color: '#64748b', fontSize: '13px' }}>Payment Provider:</span>
                  <span style={{ color: '#16a34a', fontWeight: '700', fontSize: '13px' }}>
                    YOUPI UPI Gateway (Reconciled)
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontSize: '13px' }}>Order Status:</span>
                  <span style={{ color: '#15803d', fontWeight: '700', fontSize: '13px', textTransform: 'capitalize' }}>
                    {orderData.orderStatus || 'Confirmed'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link
                  to={`/order-success/${orderData.orderId}`}
                  style={{
                    background: '#800020',
                    color: '#fff',
                    borderRadius: '10px',
                    padding: '13px 26px',
                    fontWeight: '600',
                    textDecoration: 'none',
                    boxShadow: '0 4px 12px rgba(128, 0, 32, 0.2)'
                  }}
                >
                  View Order Receipt
                </Link>
                <Link
                  to="/dashboard"
                  style={{
                    background: '#ffffff',
                    color: '#800020',
                    border: '1.5px solid #800020',
                    borderRadius: '10px',
                    padding: '13px 26px',
                    fontWeight: '600',
                    textDecoration: 'none'
                  }}
                >
                  Customer Dashboard
                </Link>
                <Link
                  to="/products"
                  style={{
                    background: '#faf8f5',
                    color: '#4b5563',
                    border: '1px solid #d1d5db',
                    borderRadius: '10px',
                    padding: '13px 20px',
                    fontWeight: '500',
                    textDecoration: 'none'
                  }}
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          )}

          {/* 4. Observed State (Alert received, awaiting statement reconciliation) */}
          {!loading && orderData?.paymentStatus === 'observed' && (
            <div>
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  background: '#fefce8',
                  color: '#ca8a04',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '34px',
                  margin: '0 auto 20px'
                }}
              >
                <i className="fa-solid fa-clock"></i>
              </div>
              <h2 style={{ color: '#854d0e', fontSize: '24px', marginBottom: '8px' }}>
                Payment Alert Received!
              </h2>
              <p style={{ color: '#4b5563', fontSize: '14px', lineHeight: 1.6, marginBottom: '20px' }}>
                We received your UPI payment alert for Order{' '}
                <strong style={{ fontFamily: 'monospace' }}>{orderData.orderId}</strong>. Statement
                reconciliation is currently in progress. Your order has been placed and will be
                confirmed shortly.
              </p>
              <div
                style={{
                  background: '#fef9c3',
                  border: '1px solid #fde047',
                  borderRadius: '12px',
                  padding: '14px 18px',
                  fontSize: '13px',
                  color: '#713f12',
                  marginBottom: '26px'
                }}
              >
                <i className="fa-solid fa-shield-halved" style={{ marginRight: '6px' }}></i>
                No action is required from your side. You can track this order in your customer
                dashboard.
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                  onClick={() => handleManualRefresh()}
                  style={{
                    background: '#800020',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '12px 24px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Refresh Status
                </button>
                <Link
                  to="/dashboard"
                  style={{
                    background: '#faf8f5',
                    color: '#800020',
                    border: '1.5px solid #ebd7be',
                    borderRadius: '10px',
                    padding: '12px 24px',
                    fontWeight: '600',
                    textDecoration: 'none'
                  }}
                >
                  View in Dashboard
                </Link>
              </div>
            </div>
          )}

          {/* 5. Pending State (Waiting for payment) */}
          {!loading && orderData?.paymentStatus === 'pending' && (
            <div>
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  background: '#f0f9ff',
                  color: '#0284c7',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                  margin: '0 auto 20px'
                }}
              >
                <i className="fa-solid fa-spinner fa-spin"></i>
              </div>
              <h2 style={{ color: '#0369a1', fontSize: '22px', marginBottom: '8px' }}>
                Complete Your UPI Payment
              </h2>
              <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.6, marginBottom: '20px' }}>
                Order <strong style={{ fontFamily: 'monospace' }}>{orderData.orderId}</strong> for{' '}
                <strong style={{ color: '#166534' }}>₹{Number(orderData.totalAmount || 0).toLocaleString('en-IN')}</strong> is ready for payment.
              </p>

              {/* Direct UPI Payment Box */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '16px',
                  padding: '24px 20px',
                  marginBottom: '24px',
                  textAlign: 'center'
                }}
              >
                <h3 style={{ fontSize: '15px', color: '#1e293b', marginBottom: '14px', fontWeight: '700' }}>
                  Scan UPI QR Code to Pay
                </h3>

                <div
                  style={{
                    background: '#ffffff',
                    padding: '12px',
                    borderRadius: '12px',
                    display: 'inline-block',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                    marginBottom: '16px'
                  }}
                >
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                      `upi://pay?pa=${STORE_UPI_ID}&pn=PANCH%20SATTVA&am=${orderData.totalAmount || 0}&cu=INR`
                    )}`}
                    alt="UPI Payment QR Code"
                    style={{ width: '180px', height: '180px', display: 'block' }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                    Or Pay directly to Official UPI ID:
                  </span>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: '#ffffff',
                      border: '1px solid #94a3b8',
                      padding: '8px 14px',
                      borderRadius: '8px'
                    }}
                  >
                    <strong style={{ fontSize: '14px', color: '#0f172a', fontFamily: 'monospace' }}>
                      {STORE_UPI_ID}
                    </strong>
                    <button
                      type="button"
                      onClick={handleCopyUpi}
                      style={{
                        background: '#16a34a',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '4px 10px',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      {copiedUpi ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                {/* UTR Input and One-Click Confirmation */}
                <div style={{ maxWidth: '360px', margin: '0 auto', textAlign: 'left' }}>
                  <label style={{ fontSize: '12px', color: '#475569', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                    12-digit UTR / Transaction ID (Optional):
                  </label>
                  <input
                    type="text"
                    value={directUtr}
                    onChange={(e) => setDirectUtr(e.target.value)}
                    placeholder="e.g. 429182390192"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '13px',
                      marginBottom: '12px',
                      boxSizing: 'border-box'
                    }}
                  />

                  <button
                    type="button"
                    onClick={handleConfirmDirectPayment}
                    disabled={confirming}
                    style={{
                      width: '100%',
                      background: 'linear-gradient(135deg, #15803d 0%, #166534 100%)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '13px 20px',
                      fontSize: '14px',
                      fontWeight: '700',
                      cursor: confirming ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 12px rgba(22, 101, 52, 0.25)'
                    }}
                  >
                    <i className="fa-solid fa-circle-check"></i>
                    {confirming ? 'Verifying...' : 'I Have Paid — Confirm Order'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={() => handleManualRefresh()}
                  style={{
                    background: '#800020',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '12px 24px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Check Auto-Status Again
                </button>
                <Link
                  to="/checkout"
                  style={{
                    background: '#faf8f5',
                    color: '#800020',
                    border: '1.5px solid #ebd7be',
                    borderRadius: '10px',
                    padding: '12px 24px',
                    fontWeight: '600',
                    textDecoration: 'none'
                  }}
                >
                  Return to Checkout
                </Link>
              </div>
            </div>
          )}

          {/* 6. Failed or Cancelled State */}
          {!loading && orderData?.paymentStatus === 'failed' && (
            <div>
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  background: '#fef2f2',
                  color: '#ef4444',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '34px',
                  margin: '0 auto 20px'
                }}
              >
                <i className="fa-solid fa-circle-xmark"></i>
              </div>
              <h2 style={{ color: '#b91c1c', fontSize: '24px', marginBottom: '8px' }}>
                Payment Incomplete or Cancelled
              </h2>
              <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
                {orderData.youpiEvent === 'CANCELLED'
                  ? 'You cancelled the checkout session before completing payment.'
                  : orderData.youpiEvent === 'EXPIRED'
                  ? 'The payment session expired. Please retry to get a fresh payment window.'
                  : 'The payment could not be confirmed. No money was deducted from your order.'}
                <br />
                Your shopping cart items are preserved.
              </p>
              <div style={{ display: 'flex', gap: '14px', justifyContent: 'center' }}>
                <Link
                  to="/checkout"
                  style={{
                    background: '#800020',
                    color: '#fff',
                    borderRadius: '10px',
                    padding: '13px 26px',
                    fontWeight: '600',
                    textDecoration: 'none',
                    boxShadow: '0 4px 12px rgba(128, 0, 32, 0.2)'
                  }}
                >
                  Retry Payment at Checkout
                </Link>
                <Link
                  to="/cart"
                  style={{
                    background: '#faf8f5',
                    color: '#4b5563',
                    border: '1px solid #d1d5db',
                    borderRadius: '10px',
                    padding: '13px 22px',
                    fontWeight: '500',
                    textDecoration: 'none'
                  }}
                >
                  Review Cart
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

