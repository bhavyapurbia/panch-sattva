import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCartStore, getValidImageUrl } from '../store';
import { productsAPI } from '../api';
import toast from 'react-hot-toast';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const cart = useCartStore();

  const [product, setProduct] = useState(null);
  const [selectedImg, setSelectedImg] = useState('/images/psimg/ring1.jpg');
  const [selectedSize, setSelectedSize] = useState('Free Size');
  const [selectedVariant, setSelectedVariant] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  // Scroll to top when opening product
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [id]);

  // Fetch product from backend API
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    productsAPI.getById(id)
      .then(res => {
        if (!isMounted) return;
        const p = res.data?.product || res.data;
        if (p) {
          const item = {
            ...p,
            id: p.id || p._id,
            image: getValidImageUrl(p)
          };
          setProduct(item);
          setSelectedImg(getValidImageUrl(p));

          // Set default size based on category
          const cat = (p.category || '').toLowerCase();
          if (cat.includes('bangle')) setSelectedSize('2.6');
          else setSelectedSize('Free Size');

          // Set default variant if single image has design options
          if (p.variantOptions && Array.isArray(p.variantOptions) && p.variantOptions.length > 0) {
            setSelectedVariant(p.variantOptions[0]);
          } else if (p.hasDesignVariants) {
            setSelectedVariant(p.variantType === '1234' ? 'Option 1' : 'Option A');
          } else {
            setSelectedVariant('');
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load product:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [id]);

  const categoryLower = (product?.category || '').toLowerCase();
  const isEarring = categoryLower.includes('earring');
  const isRing = categoryLower.includes('ring');
  const isBangle = categoryLower.includes('bangle');

  // Available sizes memoized by category
  // Earrings = No size option; Rings = All Free Size; Bangles = 2.4, 2.6, 2.8
  const availableSizes = useMemo(() => {
    if (!product) return [];
    if (isEarring || isRing) return [];
    if (isBangle) return ['2.4', '2.6', '2.8'];
    return [];
  }, [product, isEarring, isRing, isBangle]);

  // Design variants from single image (e.g. Option A, B, C, D or 1, 2, 3, 4)
  const variantsList = useMemo(() => {
    if (!product) return [];
    if (product.variantOptions && Array.isArray(product.variantOptions) && product.variantOptions.length > 0) {
      return product.variantOptions;
    }
    if (product.hasDesignVariants) {
      if (product.variantType === '1234') {
        return ['Option 1', 'Option 2', 'Option 3', 'Option 4'];
      }
      return ['Option A', 'Option B', 'Option C', 'Option D'];
    }
    return [];
  }, [product]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '140px 20px', minHeight: '60vh' }}>
        <div style={{
          display: 'inline-block',
          width: '45px',
          height: '45px',
          border: '3px solid rgba(128, 0, 32, 0.2)',
          borderTopColor: '#800020',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          marginBottom: '16px'
        }}></div>
        <h2 style={{ fontFamily: 'Cinzel, serif', color: '#800020', fontSize: '18px', letterSpacing: '1px' }}>
          Loading Handcrafted Jewellery...
        </h2>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ textAlign: 'center', padding: '140px 20px', minHeight: '60vh' }}>
        <h2 style={{ color: '#800020', marginBottom: '16px', fontFamily: 'Cinzel, serif' }}>Jewellery Item Not Found</h2>
        <p style={{ color: '#6b7280', marginBottom: '24px' }}>The requested item may have been updated or moved.</p>
        <Link to="/products" className="buy-btn" style={{ textDecoration: 'none', display: 'inline-block' }}>
          Explore Full Collection
        </Link>
      </div>
    );
  }

  const thumbnails = (product.images && Array.isArray(product.images) && product.images.length > 0)
    ? [product.image, ...product.images.map(img => getValidImageUrl({ image: img }))]
    : [product.image];

  const stock = product.stock !== undefined ? Number(product.stock) : 10;
  const isOutOfStock = stock <= 0;
  const existingInCart = cart.items.find(
    i => (i.id === product.id || i._id === product.id || i.name === product.name) &&
         (i.size === selectedSize || (!i.size && !selectedSize)) &&
         ((i.variant || '') === (selectedVariant || ''))
  );
  const qtyAlreadyInCart = existingInCart ? Number(existingInCart.quantity) : 0;
  const maxCanAdd = Math.max(0, stock - qtyAlreadyInCart);

  const handleAddToCart = () => {
    if (isOutOfStock) {
      toast.error('Sorry, this product is currently out of stock!');
      return;
    }
    if (qtyAlreadyInCart >= stock) {
      toast.error(`You already have all available units in your cart!`);
      return;
    }
    const finalSize = isRing ? 'Free Size' : (isEarring ? '-' : selectedSize);
    const res = cart.addItem(product, quantity, finalSize, selectedVariant);
    if (res && res.success) {
      const variantNotice = selectedVariant ? ` (${selectedVariant})` : '';
      const sizeNotice = (!isEarring && finalSize && finalSize !== '-') ? ` [${finalSize}]` : '';
      toast.success(`Added ${quantity} × ${product.name}${variantNotice}${sizeNotice} to Cart!`, { icon: '✨' });
    }
  };

  const handleBuyNow = () => {
    if (isOutOfStock) {
      toast.error('Sorry, this product is currently out of stock!');
      return;
    }
    if (qtyAlreadyInCart >= stock) {
      toast.error(`You already have all available units in your cart!`);
      navigate('/checkout');
      return;
    }
    const finalSize = isRing ? 'Free Size' : (isEarring ? '-' : selectedSize);
    const res = cart.addItem(product, quantity, finalSize, selectedVariant);
    if (res && res.success) {
      navigate('/checkout');
    }
  };

  return (
    <div style={{ paddingTop: '80px', minHeight: '80vh' }}>
      <section className="product-details">
        {/* Left Gallery */}
        <div className="product-left">
          <img
            id="mainImage"
            src={selectedImg}
            alt={product.name}
            onError={(e) => { e.target.src = '/images/psimg/ring1.jpg'; }}
          />

          {thumbnails.length > 1 && (
            <div className="thumbnail-images">
              {thumbnails.map((thumb, idx) => (
                <img
                  key={idx}
                  src={thumb}
                  alt="thumb"
                  className={`thumb ${selectedImg === thumb ? 'active' : ''}`}
                  onClick={() => setSelectedImg(thumb)}
                  onError={(e) => { e.target.src = '/images/psimg/ring1.jpg'; }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Details */}
        <div className="product-right">
          <h1>{product.name}</h1>

          <div className="rating">
            ★★★★★
            <span>({product.numReviews ? `${product.numReviews} Reviews` : 'Certified Authentic'})</span>
          </div>

          <h2>₹{Number(product.price).toLocaleString('en-IN')}</h2>

          {/* Available Stock Indicator - only show unit count if <= 5 */}
          <div className="stock-status-box" style={{ margin: '10px 0 16px 0' }}>
            {isOutOfStock ? (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                background: '#fee2e2',
                color: '#991b1b',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '700'
              }}>
                <i className="fa-solid fa-circle-xmark"></i> OUT OF STOCK
              </div>
            ) : stock <= 5 ? (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                background: '#fef3c7',
                color: '#92400e',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                border: '1px solid #fde68a'
              }}>
                <i className="fa-solid fa-triangle-exclamation"></i>
                <span>Hurry, only {stock} left in stock — order soon!</span>
              </div>
            ) : (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                background: '#ecfdf5',
                color: '#065f46',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                border: '1px solid #a7f3d0'
              }}>
                <i className="fa-solid fa-circle-check"></i>
                <span>In Stock • Ready to Dispatch</span>
              </div>
            )}
          </div>

          <p>
            {product.description ||
              'Crafted with premium quality materials, antique sheen, and master craftsmanship. A timeless jewellery piece designed to celebrate every special moment.'}
          </p>

          {/* Single Image ABCD / 1234 Design Variant Selector */}
          {variantsList.length > 0 && (
            <div style={{ margin: '18px 0', padding: '14px', background: '#faf8f5', borderRadius: '10px', border: '1px dashed #c5a059' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '13.5px', fontWeight: '700', color: '#800020' }}>
                  <i className="fa-solid fa-shapes" style={{ color: '#c5a059', marginRight: '6px' }}></i>
                  Select Design from Image:
                </h3>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#166534', background: '#dcfce7', padding: '2px 8px', borderRadius: '4px' }}>
                  {selectedVariant || variantsList[0]}
                </span>
              </div>
              <p style={{ fontSize: '11.5px', color: '#666', margin: '0 0 10px 0' }}>
                Pick the option matching the label on the product photo above:
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {variantsList.map((variantOpt) => (
                  <button
                    key={variantOpt}
                    type="button"
                    onClick={() => setSelectedVariant(variantOpt)}
                    style={{
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: '600',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      border: selectedVariant === variantOpt ? '2px solid #800020' : '1px solid #d1d5db',
                      background: selectedVariant === variantOpt ? '#800020' : '#ffffff',
                      color: selectedVariant === variantOpt ? '#ffffff' : '#374151',
                      boxShadow: selectedVariant === variantOpt ? '0 2px 6px rgba(128, 0, 32, 0.25)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {selectedVariant === variantOpt && <i className="fa-solid fa-check" style={{ marginRight: '6px' }}></i>}
                    {variantOpt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size Section: Earrings = No Size; Rings = Free Size (Adjustable); Bangles = Sizes */}
          {isRing && (
            <div style={{ margin: '14px 0' }}>
              <h3 style={{ fontSize: '14px', marginBottom: '6px' }}>Ring Size</h3>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                background: '#faf5f0',
                border: '1px solid #ebd7be',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#800020',
                fontWeight: '600'
              }}>
                <i className="fa-solid fa-wand-magic-sparkles" style={{ color: '#c5a059' }}></i>
                <span>Free Size (Comfortably Adjustable for all fingers)</span>
              </div>
            </div>
          )}

          {!isRing && !isEarring && availableSizes.length > 0 && (
            <div style={{ margin: '14px 0' }}>
              <h3>Select Size</h3>
              <div className="sizes">
                {availableSizes.map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    className={selectedSize === sz ? 'active' : ''}
                    style={
                      selectedSize === sz
                        ? { background: '#800020', color: '#fff', borderColor: '#800020' }
                        : {}
                    }
                    onClick={() => setSelectedSize(sz)}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>
          )}

          <h3>Quantity</h3>
          <div className="quantity">
            <button
              id="minus"
              disabled={isOutOfStock || quantity <= 1}
              style={{
                opacity: isOutOfStock || quantity <= 1 ? 0.4 : 1,
                cursor: isOutOfStock || quantity <= 1 ? 'not-allowed' : 'pointer'
              }}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            >
              -
            </button>
            <input type="text" id="qty" value={isOutOfStock ? 0 : quantity} readOnly />
            <button
              id="plus"
              disabled={isOutOfStock || quantity >= maxCanAdd || quantity >= stock}
              style={{
                opacity: isOutOfStock || quantity >= maxCanAdd || quantity >= stock ? 0.4 : 1,
                cursor: isOutOfStock || quantity >= maxCanAdd || quantity >= stock ? 'not-allowed' : 'pointer'
              }}
              onClick={() => {
                if (quantity >= maxCanAdd) {
                  if (qtyAlreadyInCart > 0) {
                    toast.error(`Cannot add more. You have ${qtyAlreadyInCart} in cart, and available stock is ${stock}.`);
                  } else {
                    toast.error(`Maximum available stock is ${stock} units.`);
                  }
                } else {
                  setQuantity((q) => q + 1);
                }
              }}
            >
              +
            </button>
          </div>

          <div className="product-buttons">
            <button
              className="add-cart"
              onClick={handleAddToCart}
              disabled={isOutOfStock || maxCanAdd <= 0}
              style={isOutOfStock || maxCanAdd <= 0 ? { opacity: 0.5, cursor: 'not-allowed', background: '#888' } : {}}
            >
              {isOutOfStock ? 'Out of Stock' : maxCanAdd <= 0 ? 'Max in Cart' : 'Add To Cart'}
            </button>
            <button
              className="buy-now"
              onClick={handleBuyNow}
              disabled={isOutOfStock || maxCanAdd <= 0}
              style={isOutOfStock || maxCanAdd <= 0 ? { opacity: 0.5, cursor: 'not-allowed', background: '#aaa' } : {}}
            >
              {isOutOfStock ? 'Sold Out' : 'Buy Now'}
            </button>
          </div>

          <div className="offers">
            <p>🎁 Flat 10% OFF on First Order</p>
            <p>🚚 Free Delivery Across India</p>
            <p>🔒 100% Secure Payment</p>
          </div>
        </div>
      </section>
    </div>
  );
}
