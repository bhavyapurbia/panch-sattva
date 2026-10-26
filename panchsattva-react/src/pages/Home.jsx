import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productsAPI } from '../api';
import { getValidImageUrl } from '../store';

export default function Home() {
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [newArrivals, setNewArrivals] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Auto-cycle testimonials like original script.js
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % 3);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  // Fetch live products from database
  useEffect(() => {
    let isMounted = true;
    setLoadingProducts(true);
    productsAPI.getAll({ limit: 50 })
      .then((res) => {
        if (!isMounted || !res.data || !res.data.products) return;
        const prods = res.data.products;

        // New Arrivals: products marked NEW or newest products
        const newItems = prods.filter(p => (p.badge || '').toUpperCase() === 'NEW');
        setNewArrivals(newItems.length >= 4 ? newItems.slice(0, 4) : prods.slice(0, 4));

        // Featured Collection: 4 representative items from diverse categories
        const distinctCategories = ['necklace', 'ring', 'earring', 'bangle'];
        const selected = [];
        distinctCategories.forEach(cat => {
          const match = prods.find(p => (p.category || '').toLowerCase().includes(cat) && !selected.some(s => s._id === p._id));
          if (match) selected.push(match);
        });

        if (selected.length < 4) {
          prods.forEach(p => {
            if (selected.length < 4 && !selected.some(s => s._id === p._id)) {
              selected.push(p);
            }
          });
        }
        setFeaturedProducts(selected.slice(0, 4));
      })
      .catch((err) => {
        console.error('Failed to load home products:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingProducts(false);
      });

    return () => { isMounted = false; };
  }, []);

  return (
    <div className="home-page-wrapper">
      {/* ================== HERO ================== */}
      {/* ================== HERO ================== */}
      <section className="hero">
        <div className="hero-content">
          {/* Flagship Feature Announcement Pill */}
          <Link
            to="/custom-hamper"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'linear-gradient(135deg, rgba(128, 0, 32, 0.12), rgba(197, 160, 89, 0.25))',
              border: '1.5px solid #c5a059',
              borderRadius: '30px',
              padding: '6px 16px',
              color: '#800020',
              fontSize: '11.5px',
              fontWeight: '700',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginBottom: '14px',
              textDecoration: 'none',
              boxShadow: '0 4px 15px rgba(197, 160, 89, 0.2)'
            }}
          >
            <span>✨</span>
            <span>MAIN ATTRACTION: CUSTOM HAMPER BUILDER</span>
            <span style={{ background: '#800020', color: '#fff', fontSize: '10px', padding: '2px 8px', borderRadius: '10px' }}>
              CRAFT NOW →
            </span>
          </Link>

          <p className="sub-heading">Luxury Jewellery & Bespoke Gifting</p>
          <h1>
            Panch Sattva collection<br />
            BY SIDDHI PURBIA<br />
          </h1>
          <p className="hero-text">
            Handcrafted regal jewellery & bespoke luxury gift hampers. Curate your own personalized keepsake box with authentic jewels, gourmet sweets, and handwritten blessings.
          </p>
          <div className="hero-buttons">
            <Link
              to="/custom-hamper"
              className="shop-btn"
              style={{
                background: 'linear-gradient(135deg, #800020 0%, #a11234 50%, #c5a059 100%)',
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '14px 26px',
                fontSize: '14.5px',
                fontWeight: '700',
                letterSpacing: '0.5px',
                boxShadow: '0 8px 24px rgba(128, 0, 32, 0.35)'
              }}
            >
              <span>🎁 Build Custom Hamper</span>
              <i className="fa-solid fa-arrow-right"></i>
            </Link>
            <Link to="/products" className="about-btn">
              Explore Collection
            </Link>
          </div>
        </div>

        <div className="hero-image">
          <Link to="/custom-hamper" title="Click to customize your royal hamper!">
            <img
              src="/images/psimg/gift1.png"
              alt="Custom Luxury Gift Hamper"
              height="600px"
              width="500px"
              style={{ cursor: 'pointer', transition: 'transform 0.4s ease' }}
              onError={(e) => { e.target.src = '/images/psimg/ring1.jpg'; }}
            />
          </Link>
        </div>
      </section>

      {/* =========================================
                  LUXURY GALLERY
      ========================================== */}
      <section className="gallery" id="gallery">
        <div className="section-title">
          <p>JEWELLERY GALLERY</p>
          <h2>Our Finest Creations</h2>
          <span className="title-line"></span>
        </div>

        <div className="gallery-grid">
          <div className="gallery-item">
            <img src="/images/psimg/nackless.jpg" alt="Necklace" />
            <div className="gallery-overlay">
              <h3>Royal Necklace</h3>
              <p>Luxury Collection</p>
              <Link to="/products?category=necklace" className="gallery-btn">
                View Collection
              </Link>
            </div>
          </div>

          <div className="gallery-item">
            <img src="/images/psimg/ring1.jpg" alt="Diamond Ring" />
            <div className="gallery-overlay">
              <h3>Diamond Ring</h3>
              <p>Wedding Collection</p>
              <Link to="/products?category=ring" className="gallery-btn">
                View Collection
              </Link>
            </div>
          </div>

          <div className="gallery-item">
            <img src="/images/psimg/gift 5.jpeg" alt="gift" />
            <div className="gallery-overlay">
              <h3>customized gift</h3>
              <p>special handmade creation</p>
              <Link to="/products?category=gift" className="gallery-btn">
                View Collection
              </Link>
            </div>
          </div>

          <div className="gallery-item">
            <img src="/images/psimg/bangle1.jpg" alt="Bangles" />
            <div className="gallery-overlay">
              <h3>Traditional Bangles</h3>
              <p>Handcrafted</p>
              <Link to="/products?category=bangle" className="gallery-btn">
                View Collection
              </Link>
            </div>
          </div>

          <div className="gallery-item">
            <img src="/images/psimg/pandent/pendant (5).jpg" alt="Pendant" />
            <div className="gallery-overlay">
              <h3>Luxury Pendant</h3>
              <p>Elegant Collection</p>
              <Link to="/products?category=necklace" className="gallery-btn">
                View Collection
              </Link>
            </div>
          </div>

          <div className="gallery-item">
            <img src="/images/psimg/braclate 2.jpg" alt="Bracelet" />
            <div className="gallery-overlay">
              <h3>Bracelet</h3>
              <p>Exclusive Design</p>
              <Link to="/products?category=bangle" className="gallery-btn">
                View Collection
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================
              STATISTICS
      ========================================== */}
      <section className="stats">
        <div className="stat-box">
          <h2>100%</h2>
          <p>Trusted Brand</p>
        </div>
        <div className="stat-box">
          <h2>15K+</h2>
          <p>Happy Customers</p>
        </div>
        <div className="stat-box">
          <h2>500+</h2>
          <p>Luxury Designs</p>
        </div>
        <div className="stat-box">
          <h2>100%</h2>
          <p>Certified Jewellery</p>
        </div>
      </section>

      {/* =========================================
                  NEW ARRIVALS
      ========================================== */}
      <section className="new-arrivals" id="products">
        <div className="section-title">
          <p>NEW ARRIVALS</p>
          <h2>Our customize gift for your special one</h2>
          <span className="title-line"></span>
        </div>

        <div className="arrival-grid">
          {newArrivals.length === 0 && loadingProducts ? (
            <div style={{ textAlign: 'center', padding: '30px', gridColumn: '1 / -1', color: '#800020' }}>
              Loading latest arrivals...
            </div>
          ) : (
            newArrivals.map((prod) => {
              const prodId = prod._id || prod.id;
              return (
                <div className="arrival-card" key={prodId}>
                  <div className="arrival-image">
                    <span className={`badge ${prod.badge === 'SALE' ? 'sale' : 'new'}`}>
                      {prod.badge || 'NEW'}
                    </span>
                    <img
                      src={getValidImageUrl(prod)}
                      alt={prod.name}
                      onError={(e) => { e.target.src = '/images/psimg/ring1.jpg'; }}
                    />
                  </div>
                  <div className="arrival-content">
                    <h3>{prod.name}</h3>
                    <div className="stars">★★★★★</div>
                    <div className="price">
                      {prod.mrp && <span className="old-price">₹{prod.mrp}</span>}
                      ₹{Number(prod.price).toLocaleString('en-IN')}
                    </div>
                    <Link to={`/products/${prodId}`}>
                      <button className="buy-btn">View Product</button>
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* =========================================
              WHY CHOOSE US
      ========================================== */}
      <section className="why-us">
        <div className="section-title">
          <p>WHY CHOOSE US</p>
          <h2>Luxury You Can Trust</h2>
          <span className="title-line"></span>
        </div>

        <div className="why-grid">
          <div className="why-card">
            <div className="why-icon">
              <i className="fa-solid fa-certificate"></i>
            </div>
            <h3>Certified Jewellery</h3>
            <p>
              Every jewellery piece is certified, hallmarked and quality checked by expert craftsmen.
            </p>
          </div>

          <div className="why-card">
            <div className="why-icon">
              <i className="fa-solid fa-truck-fast"></i>
            </div>
            <h3>Free Delivery</h3>
            <p>
              Fast and secure delivery across India with premium packaging and insurance.
            </p>
          </div>

          <div className="why-card">
            <div className="why-icon">
              <i className="fa-solid fa-credit-card"></i>
            </div>
            <h3>Secure Payment</h3>
            <p>
              Multiple payment options with complete encryption and buyer protection.
            </p>
          </div>

          <div className="why-card">
            <div className="why-icon">
              <i className="fa-solid fa-headset"></i>
            </div>
            <h3>24×7 Support</h3>
            <p>
              Our jewellery experts are available anytime to help with your purchase.
            </p>
          </div>
        </div>
      </section>

      {/* ==========================================
                  FEATURED COLLECTIONS
      ========================================== */}
      <section className="collections" id="collections">
        <div className="section-title">
          <p>OUR COLLECTIONS</p>
          <h2>Discover Luxury Jewellery</h2>
        </div>

        <div className="collection-grid">
          {featuredProducts.length === 0 && loadingProducts ? (
            <div style={{ textAlign: 'center', padding: '30px', gridColumn: '1 / -1', color: '#800020' }}>
              Loading fine jewellery collections...
            </div>
          ) : (
            featuredProducts.map((prod) => {
              const prodId = prod._id || prod.id;
              return (
                <div className="product-card" key={prodId}>
                  <div className="product-image">
                    <img
                      src={getValidImageUrl(prod)}
                      alt={prod.name}
                      onError={(e) => { e.target.src = '/images/psimg/ring1.jpg'; }}
                    />
                  </div>
                  <div className="product-info">
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#c5a059', fontWeight: '700' }}>
                      {prod.category}
                    </span>
                    <h3>{prod.name}</h3>
                    <p>{prod.description ? (prod.description.length > 55 ? prod.description.substring(0, 55) + '...' : prod.description) : 'Handcrafted Luxury Creation'}</p>
                    <h4>₹{Number(prod.price).toLocaleString('en-IN')}</h4>
                    <div className="product-buttons">
                      <Link to={`/products/${prodId}`} className="details-btn">
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* ==========================================
                      ABOUT SECTION
      =========================================== */}
      <section className="about" id="about">
        <div className="about-image">
          <img src="/images/psimg/img1.jpg" alt="Panch sattva Jewellery" />
        </div>

        <div className="about-content">
          <p className="section-subtitle">ABOUT PANCH SATTVA</p>
          <h2>Jewellery Inspired By The Five Elements</h2>
          <p className="about-text">
            PANCH SATTVA is a luxury jewellery brand inspired by the harmony of
            the five natural elements—Earth, Water, Fire, Air, and Space.
            Every piece is carefully crafted to combine timeless elegance,
            skilled craftsmanship, and modern design.
          </p>
          <p className="about-text">
            Whether it's a wedding, celebration, or everyday luxury,
            our jewellery is designed to make every moment unforgettable.
          </p>

          <div className="about-features">
            <div className="feature-box">
              <i className="fa-solid fa-gem"></i>
              <h4>Premium Quality</h4>
            </div>
            <div className="feature-box">
              <i className="fa-solid fa-certificate"></i>
              <h4>Certified Jewellery</h4>
            </div>
            <div className="feature-box">
              <i className="fa-solid fa-truck-fast"></i>
              <h4>Free Delivery</h4>
            </div>
            <div className="feature-box">
              <i className="fa-solid fa-shield-heart"></i>
              <h4>Lifetime Support</h4>
            </div>
          </div>

          <a href="#contact" className="shop-btn">
            Learn More
          </a>
        </div>
      </section>

      {/* =========================================
              TESTIMONIALS
      ========================================== */}
      <section className="testimonials" id="testimonials">
        <div className="section-title">
          <p>OUR CLIENTS</p>
          <h2>What Our Customers Say</h2>
          <span className="title-line"></span>
        </div>

        <div className="testimonial-container">
          <div
            className={`testimonial-card ${activeTestimonial === 0 ? 'active' : ''}`}
            style={{ opacity: activeTestimonial === 0 ? 1 : 0.6, transition: '0.4s' }}
          >
            <img src="/images/psimg/review1.png" alt="R.S" />
            <h3>R.S</h3>
            <span>Udaipur, Rajasthan</span>
            <div className="rating">★★★★★</div>
            <p>
              ⭐⭐⭐⭐⭐<br />
              I’m absolutely in love with the jewellery collection!!! 😍 The designs are elegant, unique, and perfect for every occasion💅🏻 The quality of the pieces is exceptional, and the customer service is very friendly and helpful😍 Highly recommend this page to anyone looking for beautiful and classy jewellery✨ Definitely a 5-star experience!! 😌
            </p>
          </div>

          <div
            className={`testimonial-card ${activeTestimonial === 1 ? 'active' : ''}`}
            style={{ opacity: activeTestimonial === 1 ? 1 : 0.6, transition: '0.4s' }}
          >
            <img src="/images/psimg/review2.png" alt="Himali Bhatt" />
            <h3>Himali Bhatt</h3>
            <span>udaipur, Rajasthan</span>
            <div className="rating">★★★★★</div>
            <p>
              Superb quality worth to buy each and every article 💗🫶
            </p>
          </div>

          <div
            className={`testimonial-card ${activeTestimonial === 2 ? 'active' : ''}`}
            style={{ opacity: activeTestimonial === 2 ? 1 : 0.6, transition: '0.4s' }}
          >
            <img src="/images/psimg/review3.png" alt="Neha Patel" />
            <h3>Neha Patel</h3>
            <span>Ahmedabad, Gujarat</span>
            <div className="rating">★★★★★</div>
            <p>
              Enthusiastic & Service-Oriented<br />
              "Panch Sattva Collection is an absolute hidden gem in Udaipur! I visited recently looking for something specific and was blown away by the variety of options. It’s refreshing to find a store that doesn’t just focus on standard designs but offers truly unique, anti-tarnish silver and German jewel pieces that feel substantial and look premium. The attention to detail in the jewelry is amazing—from the intricate metalwork to the creative macrame stuff—and you can really tell there is a passion behind the brand (great job, Siddhi!). It’s the perfect place to shop if you want to treat yourself or pick up a thoughtful gift for a partner, regardless of their style. Five stars for quality, aesthetics, and a wonderful collection that I’ll definitely be returning to."
            </p>
          </div>
        </div>
      </section>

      {/* ==========================================
                      CONTACT
      ========================================== */}
      <section className="contact" id="contact">
        <div className="section-title">
          <p>CONTACT US</p>
          <h2>Visit Our Store</h2>
          <span className="title-line"></span>
        </div>

        <div className="contact-grid">
          <div className="contact-card contact-card-address">
            <i className="fa-solid fa-location-dot"></i>
            <h3>Our Store</h3>
            <p>
              10, Jagdish Chowk, near Jagdish Temple, Bhatiyani Chohatta, Rao Ji Ka Hata, Udaipur, Rajasthan 313001
            </p>
            <a
              href="https://maps.google.com/?q=Panch+Sattva+Collection+10+Jagdish+Chowk+Udaipur"
              target="_blank"
              rel="noopener noreferrer"
              className="contact-action-btn"
            >
              <i className="fa-solid fa-map-location-dot"></i> Get Directions
            </a>
          </div>

          <div className="contact-card">
            <i className="fa-solid fa-phone"></i>
            <h3>Call Us</h3>
            <p>+91 94628 78633</p>
            <a href="tel:+919462878633" className="contact-action-btn">
              <i className="fa-solid fa-phone"></i> Call Now
            </a>
          </div>

          <div className="contact-card">
            <i className="fa-solid fa-envelope"></i>
            <h3>Email Us</h3>
            <p>panchsattva@gmail.com</p>
            <a href="mailto:panchsattva@gmail.com" className="contact-action-btn">
              <i className="fa-solid fa-envelope"></i> Send Mail
            </a>
          </div>

          <div className="contact-card">
            <i className="fa-solid fa-clock"></i>
            <h3>Working Hours</h3>
            <p>
              Mon - Sat<br />
              <strong>10:00 AM - 8:00 PM</strong>
            </p>
            <span className="contact-badge">
              <i className="fa-solid fa-door-open"></i> Open Today
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
