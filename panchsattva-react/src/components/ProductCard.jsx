import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../store';
import toast from 'react-hot-toast';

export default function ProductCard({ product }) {
  const addItem = useCartStore(s => s.addItem);
  const items = useCartStore(s => s.items);
  const navigate = useNavigate();
  const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100);
  const imgSrc = product.image?.startsWith('http') ? product.image : `/${product.image}`;
  const stock = product.stock !== undefined ? Number(product.stock) : 10;
  const isOutOfStock = stock <= 0;

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (isOutOfStock) {
      toast.error('This product is out of stock!');
      return;
    }
    const prodId = product.id || product._id || product.name;
    const existing = items.find(i => i.id === prodId || i._id === prodId || i.name === product.name);
    if (existing && existing.quantity >= stock) {
      toast.error(`Only ${stock} units available for ${product.name} (already in your cart)!`);
      return;
    }
    const res = addItem(product, 1);
    if (res && res.success) {
      toast.success(`${product.name} added to cart!`);
    }
  };

  return (
    <div className={`product-card ${isOutOfStock ? 'out-of-stock' : ''}`}>
      <Link to={`/products/${product._id || product.id}`}>
        <div className="card-img-wrap">
          <img src={imgSrc} alt={product.name} loading="lazy"
            onError={e => { e.target.src = '/images/psimg/pslogo.png'; }} />
          {isOutOfStock ? (
            <span className="card-badge badge out-of-stock" style={{ background: '#dc2626', color: '#fff' }}>
              OUT OF STOCK
            </span>
          ) : product.badge ? (
            <span className={`card-badge badge ${product.badge === 'SALE' ? 'sale' : product.badge === 'HOT' ? 'hot' : ''}`}>
              {product.badge}
            </span>
          ) : stock <= 5 ? (
            <span className="card-badge badge" style={{ background: '#d97706', color: '#fff' }}>
              ONLY {stock} LEFT
            </span>
          ) : null}
          <div className="card-actions">
            {isOutOfStock ? (
              <button
                className="btn-primary"
                disabled
                style={{ flex: 1, padding: '10px', fontSize: '12px', background: '#9ca3af', cursor: 'not-allowed', opacity: 0.7 }}
                onClick={(e) => e.preventDefault()}
              >
                Out of Stock
              </button>
            ) : (
              <button className="btn-primary" style={{ flex: 1, padding: '10px', fontSize: '12px' }} onClick={handleAddToCart}>
                Add to Cart
              </button>
            )}
          </div>
        </div>
        <div className="card-body">
          <p className="card-category">{product.category}</p>
          <h3 className="card-name">{product.name}</h3>
          <div className="card-price">
            <span className="price">₹{product.price.toLocaleString()}</span>
            <span className="mrp">₹{product.mrp.toLocaleString()}</span>
            {discount > 0 && <span className="discount">{discount}% off</span>}
          </div>
          {stock > 0 && stock <= 5 && (
            <p style={{ fontSize: '11px', color: '#b45309', margin: '4px 0 0 0', fontWeight: '600' }}>
              Only {stock} available in stock!
            </p>
          )}
        </div>
      </Link>
    </div>
  );
}
