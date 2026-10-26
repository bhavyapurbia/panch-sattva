import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const [showTopBtn, setShowTopBtn] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowTopBtn(true);
      } else {
        setShowTopBtn(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <>
      {/* ==========================================
                      FOOTER
      ========================================== */}
      <footer>
        <div className="footer-logo">
          PANCH<span> SATTVA</span>
        </div>

        <p>
          Crafting Timeless Luxury Jewellery
          Inspired By The Five Elements.
        </p>

        <div className="social-links">
          <a
            href="https://www.instagram.com/panchsattvacollection?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
            target="_blank"
            rel="noopener noreferrer"
          >
            <i className="fa-brands fa-instagram"></i>
          </a>
        </div>

        <hr />

        <p>
          © 2026 PANCH SATTVA.
          All Rights Reserved. <br /><br />
          design and developed by <a href="tel:6375247046" style={{ color: 'inherit' }}>bhavya purbia</a>
          <br /><br />
          <Link to="/admin" style={{ color: '#c5a059', textDecoration: 'none', fontSize: '13px', fontWeight: '500' }}>
            <i className="fa-solid fa-lock"></i> Store Admin Portal
          </Link>
        </p>
      </footer>

      {/* Back To Top Button */}
      {showTopBtn && (
        <button id="topBtn" onClick={scrollToTop} style={{ display: 'block' }}>
          <i className="fa-solid fa-arrow-up"></i>
        </button>
      )}
    </>
  );
}
