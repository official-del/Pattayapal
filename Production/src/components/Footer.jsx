import { Link } from 'react-router-dom';
import logo from '../assets/LOGO1.png';
import { motion } from 'framer-motion';
import { FiFacebook, FiInstagram, FiYoutube, FiTwitter, FiMail, FiPhone, FiChevronRight, FiMapPin, FiArrowUp, FiSend } from 'react-icons/fi';

function Footer() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <footer style={{ background: '#050505', borderTop: '1px solid rgba(255,255,255,0.03)', position: 'relative', overflow: 'hidden' }}>

      {/* 🚀 Back to Top Terminal */}
      <motion.button
        whileHover={{ scale: 1.1, background: 'var(--accent)', boxShadow: '0 0 20px var(--accent-glow)' }}
        onClick={scrollToTop}
        style={{
          position: 'absolute', top: '20px', right: '40px',
          width: '50px', height: '50px', borderRadius: '15px', background: '#111', border: '1px solid rgba(255,255,255,0.1)',
          color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}
      >
        <FiArrowUp size={20} />
      </motion.button>

      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 40px' }}>

        {/* 📧 ROW 1: SUBSCRIBE TERMINAL */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '60px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', gap: '40px', flexWrap: 'wrap'
        }}>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: '700', color: '#fff', margin: 0, letterSpacing: '-1px' }}>Subscribe</h2>
            <p style={{ color: '#444', fontSize: '0.9rem', marginTop: '8px', fontWeight: '600' }}>ติดตามข่าวสารล่าสุดและข้อเสนอพิเศษจากอาณาจักรโปรดักชั่นระดับพรีเมียมของเรา</p>
          </div>
          <div style={{ flex: 1, minWidth: '300px', position: 'relative' }}>
            <input
              type="email" placeholder="กรอกอีเมลของคุณ..."
              style={{ width: '100%', padding: '22px 35px', borderRadius: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', outline: 'none', fontSize: '1rem', fontWeight: '600' }}
            />
            <motion.button
              whileHover={{ scale: 1.05, background: 'var(--accent)' }}
              whileTap={{ scale: 0.95 }}
              style={{ position: 'absolute', right: '10px', top: '10px', bottom: '10px', width: '50px', borderRadius: '14px', background: '#1a1a1a', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <FiChevronRight size={24} />
            </motion.button>
          </div>
        </div>

        {/* 🌐 ROW 2: MAIN INFO MATRIX */}
        <div className="footer-main-grid">

          {/* Brand Identity */}
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '700', color: '#fff', marginBottom: '10px', letterSpacing: '1px' }}>
              PATTAYA<span style={{ color: 'var(--accent)' }}>PAL</span>
            </h1>
            <p style={{ color: 'var(--accent)', fontSize: '0.75rem', fontWeight: '700', letterSpacing: '3px', marginBottom: '25px' }}>CREATIVE FREELANCE HUB</p>
            <div style={{ height: '2px', width: '50px', background: '#333', marginBottom: '25px' }} />
            <p style={{ color: '#444', fontSize: '0.85rem', lineHeight: 1.8, marginBottom: '35px' }}>
              ผู้นำด้านสื่อโปรดักชั่นและศูนย์รวมฟรีแลนซ์ครบวงจร เราสร้างสรรค์ผลงานด้วยเทคโนโลยีที่ล้ำสมัยเพื่อโลกแห่งอนาคต
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              {[FiFacebook, FiInstagram, FiTwitter, FiYoutube].map((Icon, i) => (
                <motion.a
                  key={i} href="#" whileHover={{ y: -5, color: 'var(--accent)', borderColor: 'var(--accent)' }}
                  style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444', transition: '0.3s' }}
                >
                  <Icon size={18} />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Links Column 1: About */}
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff', marginBottom: '35px' }}>About</h3>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {[
                { n: 'My Profile', p: '/profile/me' },
                { n: 'Our Works', p: '/works' },
                { n: 'Rankings Hub', p: '/rankings' },
                { n: 'Privacy Policy', p: '/privacy' }
              ].map(item => (
                <li key={item.n}>
                  <Link to={item.p} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#444', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '600', transition: '0.2s' }} onMouseOver={e => e.target.style.color = '#fff'} onMouseOut={e => e.target.style.color = '#444'}>
                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#333' }} /> {item.n}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links Column 2: Menu */}
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff', marginBottom: '35px' }}>Menu</h3>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {[
                { n: 'Home', p: '/' },
                { n: 'Messenger', p: '/messenger' },
                { n: 'Discovery', p: '/freelancers' },
                { n: 'Feed Community', p: '/feed' }
              ].map(item => (
                <li key={item.n}>
                  <Link to={item.p} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#444', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '600', transition: '0.2s' }} onMouseOver={e => e.target.style.color = '#fff'} onMouseOut={e => e.target.style.color = '#444'}>
                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#333' }} /> {item.n}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links Column 3: Services */}
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff', marginBottom: '35px' }}>Services</h3>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {[
                { n: 'All Services', p: '/services' },
                { n: 'Manage Jobs', p: '/jobs' },
                { n: 'Wallet System', p: '/dashboard/wallet' },
                { n: 'Terms of Use', p: '/terms' }
              ].map(item => (
                <li key={item.n}>
                  <Link to={item.p} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#444', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '600', transition: '0.2s' }} onMouseOver={e => e.target.style.color = '#fff'} onMouseOut={e => e.target.style.color = '#444'}>
                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#333' }} /> {item.n}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Map */}
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff', marginBottom: '35px' }}>Contact</h3>
            <div style={{ marginBottom: '25px' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#fff', marginBottom: '5px' }}>Call :</div>
              <div style={{ fontSize: '0.85rem', color: '#444', fontWeight: '600' }}>085-552-5695</div>
            </div>
            <div style={{ marginBottom: '25px' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#fff', marginBottom: '5px' }}>Email :</div>
              <div style={{ fontSize: '0.85rem', color: '#444', fontWeight: '600' }}>info@pattayapal.com</div>
            </div>

            {/* 🗺️ LIVE GOOGLE MAP */}
            <div style={{ width: '100%', height: '140px', borderRadius: '20px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3888.751657688086!2d100.8752253!3d12.923675!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x310296688f000001%3A0x6734fb4864f9f4dd!2z4Lie4Lix4Lia4Lii4Liy4Lie4Liy4LilIOC4quC4suC4ouC4reC4seC4meC4geC4suC4o-C4meC4seC4oeC5guC4m-C4reC4o-C5jA!5e0!3m2!1sth!2sth!4v1713605634567!5m2!1sth!2sth"
                width="100%" height="100%" style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) brightness(0.8)' }} allowFullScreen="" loading="lazy" referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        </div>

        {/* 💬 THANK YOU BOX (FLOATING) */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '-40px', position: 'relative', zIndex: 10 }}>
          <div className="glass" style={{
            padding: '20px 40px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)',
            color: '#fff', fontWeight: '700', fontSize: '0.9rem', letterSpacing: '0.5px',
            boxShadow: '0 15px 35px rgba(0,0,0,0.5)'
          }}>
            THANK YOU FOR VISITING OUR LUXURY ARENA
          </div>
        </div>

        {/* ⚖️ ROW 3: BASE BAR */}
        <div className="footer-base-bar" style={{ padding: '60px 0 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div className="footer-base-links" style={{ display: 'flex', gap: '30px' }}>
            <Link to="/privacy" style={{ color: '#444', textDecoration: 'none', fontSize: '0.8rem', fontWeight: '700', letterSpacing: '1px' }}>PRIVACY POLICY</Link>
            <Link to="/terms" style={{ color: '#444', textDecoration: 'none', fontSize: '0.8rem', fontWeight: '700', letterSpacing: '1px' }}>TERMS OF SERVICE</Link>
            <Link to="/contact" style={{ color: '#444', textDecoration: 'none', fontSize: '0.8rem', fontWeight: '700', letterSpacing: '1px' }}>ABOUT US</Link>
          </div>
          <p style={{ color: '#333', fontSize: '0.75rem', fontWeight: '700' }}>
            © {new Date().getFullYear()} PATTAYA PAL ENTERTAINMENT. ALL RIGHTS RESERVED.
          </p>
        </div>

      </div>

      <style>{`
        .footer-main-grid {
          display: grid;
          grid-template-columns: 1.5fr 0.8fr 0.8fr 0.8fr 1.5fr;
          gap: 50px;
          padding: 80px 0 100px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        @media (max-width: 1200px) {
          .footer-main-grid {
            grid-template-columns: 1fr 1fr 1fr;
          }
        }

        @media (max-width: 992px) {
          .footer-main-grid {
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            padding: 50px 0 80px;
          }
        }

        @media (max-width: 768px) {
          .footer-main-grid {
            grid-template-columns: 1fr;
            text-align: center;
          }
          .footer-main-grid > div {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .footer-main-grid ul {
            align-items: center;
          }
          .footer-base-bar {
            flex-direction: column;
            text-align: center;
            gap: 15px !important;
          }
          .footer-base-links {
            flex-wrap: wrap;
            justify-content: center;
            gap: 15px !important;
          }
        }
      `}</style>
    </footer>
  );
}

export default Footer;