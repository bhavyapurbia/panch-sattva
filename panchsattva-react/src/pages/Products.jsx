import { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCartStore, getValidImageUrl } from '../store';
import { productsAPI, categoriesAPI } from '../api';
import toast from 'react-hot-toast';

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';
  const initialSearch = searchParams.get('search') || '';

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialSearch);

  const cart = useCartStore();

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    productsAPI.getAll({ limit: 200 })
      .then(res => {
        if (isMounted && res.data && res.data.products) {
          setProducts(res.data.products.map(p => ({
            ...p,
            id: p.id || p._id,
            image: getValidImageUrl(p)
          })));
        }
      })
      .catch((err) => {
        console.error('Failed to load products:', err.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    categoriesAPI.getAll()
      .then(res => {
        if (isMounted && res.data && Array.isArray(res.data)) {
          setCategories(res.data);
        }
      })
      .catch(() => {});

    return () => { isMounted = false; };
  }, []);

  // Update activeCategory if URL query param changes
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) {
      setActiveCategory(cat.toLowerCase());
    } else {
      setActiveCategory('all');
    }
    const q = searchParams.get('search');
    if (q !== null) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  const handleFilterClick = (category) => {
    setActiveCategory(category);
    if (category === 'all') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', category);
    }
    setSearchParams(searchParams);
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Category match
      const pCat = (p.category || '').toLowerCase();
      let matchesCat = activeCategory === 'all';
      if (!matchesCat) {
        if (activeCategory === 'gift') {
          matchesCat = pCat.includes('gift');
        } else if (activeCategory === 'necklace') {
          matchesCat = pCat.includes('necklace') || pCat.includes('pendant') || pCat.includes('pandent');
        } else {
          matchesCat = pCat === activeCategory || pCat.includes(activeCategory);
        }
      }

      // Search match
      const pName = (p.name || '').toLowerCase();
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || pName.includes(q) || pCat.includes(q);

      return matchesCat && matchesSearch;
    });
  }, [products, activeCategory, searchQuery]);

  const handleAddToCart = (product, e) => {
    if (e) e.stopPropagation();
    const stock = product.stock !== undefined ? Number(product.stock) : 10;
    if (stock <= 0) {
      toast.error(`Sorry, "${product.name}" is out of stock!`);
      return;
    }
    const prodId = product.id || product._id || product.name;
    const existing = cart.items.find(i => i.id === prodId || i._id === prodId || i.name === product.name);
    if (existing && existing.quantity >= stock) {
      toast.error(`Only ${stock} units available for ${product.name} (already in your cart)!`);
      return;
    }
    const res = cart.addItem(product, 1);
    if (res && res.success) {
      toast.success(`Added ${product.name} to cart!`, {
        icon: '✨'
      });
    }
  };

  return (
    <div className="products-page-container">
      {/* ================= HERO ================= */}
      <section className="products-hero" style={{ paddingTop: '80px' }}>
        <div className="products-overlay">
          <h1>Luxury Jewellery Collection</h1>
          <p>
            Discover handcrafted rings, necklaces,
            earrings, bangles and gift jewellery.
          </p>
        </div>
      </section>

      {/* ================= SEARCH ================= */}
      <section className="product-search-section">
        <input
          type="text"
          id="searchInput"
          placeholder="Search Jewellery..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </section>

      {/* ================= FILTER (Mobile Swipeable) ================= */}
      <section className="filter-section mobile-scroll-filters">
        <button
          type="button"
          className={`filter-btn ${activeCategory === 'all' ? 'active' : ''}`}
          onClick={() => handleFilterClick('all')}
        >
          All ({products.length})
        </button>
        {categories.length > 0 ? (
          categories.map(c => (
            <button
              key={c.slug}
              type="button"
              className={`filter-btn ${activeCategory === c.slug.toLowerCase() ? 'active' : ''}`}
              onClick={() => handleFilterClick(c.slug.toLowerCase())}
            >
              {c.name}
            </button>
          ))
        ) : (
          <>
            <button type="button" className={`filter-btn ${activeCategory === 'ring' ? 'active' : ''}`} onClick={() => handleFilterClick('ring')}>Rings</button>
            <button type="button" className={`filter-btn ${activeCategory === 'necklace' ? 'active' : ''}`} onClick={() => handleFilterClick('necklace')}>Necklaces</button>
            <button type="button" className={`filter-btn ${activeCategory === 'earring' ? 'active' : ''}`} onClick={() => handleFilterClick('earring')}>Earrings</button>
            <button type="button" className={`filter-btn ${activeCategory === 'bangle' ? 'active' : ''}`} onClick={() => handleFilterClick('bangle')}>Bangles</button>
            <button type="button" className={`filter-btn ${activeCategory === 'gift' ? 'active' : ''}`} onClick={() => handleFilterClick('gift')}>Customized Gifts</button>
          </>
        )}
      </section>

      {/* ================= PRODUCTS GRID ================= */}
      <section className="product-grid" id="productGrid">
        {loading ? (
          <div style={{ textAlign: 'center', gridColumn: '1 / -1', padding: '60px 0' }}>
            <p style={{ color: '#800020', fontSize: '18px', fontFamily: 'Cinzel, serif' }}>
              Loading Luxury Collection...
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', gridColumn: '1 / -1', padding: '60px 0' }}>
            <h3 style={{ color: '#800020', marginBottom: '10px' }}>No Jewellery Found</h3>
            <p style={{ color: '#666' }}>Try adjusting your search or category filter.</p>
            <button
              className="buy-btn"
              style={{ marginTop: '16px', display: 'inline-block' }}
              onClick={() => { setActiveCategory('all'); setSearchQuery(''); }}
            >
              Show All Products
            </button>
          </div>
        ) : (
          filteredProducts.map(p => {
            const stock = p.stock !== undefined ? Number(p.stock) : 10;
            const isOutOfStock = stock <= 0;
            const mrp = p.mrp || Math.round(Number(p.price) * 1.35);

            return (
              <div
                key={p.id || p._id}
                className={`product-card ${isOutOfStock ? 'out-of-stock' : ''}`}
              >
                <div className="product-image">
                  {isOutOfStock ? (
                    <span className="badge out-of-stock">OUT OF STOCK</span>
                  ) : p.badge ? (
                    <span className={`badge ${p.badge.toLowerCase()}`}>{p.badge}</span>
                  ) : null}

                  <img
                    src={p.image}
                    alt={p.name}
                    loading="lazy"
                    onError={(e) => { e.target.src = '/images/psimg/ring1.jpg'; }}
                  />
                </div>

                <div className="product-info">
                  <h3>{p.name}</h3>
                  <div className="stars">★★★★★</div>
                  <div className="price">
                    <span className="old-price">₹{mrp}</span>
                    ₹{p.price}
                  </div>

                  {stock > 0 && stock <= 5 ? (
                    <div style={{ fontSize: '11px', color: '#b45309', fontWeight: '600', marginBottom: '8px' }}>
                      ⚠️ Only {stock} left in stock!
                    </div>
                  ) : null}

                  <div className="product-buttons">
                    {isOutOfStock ? (
                      <button className="cart-btn" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                        Out of Stock
                      </button>
                    ) : (
                      <button
                        className="cart-btn"
                        onClick={(e) => handleAddToCart(p, e)}
                      >
                        Add To Cart
                      </button>
                    )}

                    <Link to={`/products/${p.id || p._id}`} className="details-btn">
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}
