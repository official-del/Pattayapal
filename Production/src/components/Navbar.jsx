import { useState, useContext, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { getFullUrl } from '../utils/mediaUtils';
import { notificationsAPI } from '../utils/api';
import {
  FiMenu, FiX, FiBell, FiUser, FiMessageCircle, FiTrendingUp, FiLogOut, FiHome,
  FiBriefcase, FiZap, FiBox, FiUsers, FiLayers, FiMail, FiBookOpen, FiSettings, FiCamera, FiDollarSign, FiGlobe,
  FiActivity, FiGrid, FiSearch
} from 'react-icons/fi';
import { CoinIcon, CoinBadge } from './CoinIcon';
import '../css/Navbar.css';
import logo from '../assets/LOGO1.png';
import { CONFIG } from '../utils/config';
import { play8BitSuccess } from '../utils/soundEffects';

const API_BASE_URL = CONFIG.API_BASE_URL;

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, token, logout } = useContext(AuthContext);
  const localUserInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const userInfo = user || localUserInfo;
  const { socket } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const audioRef = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"));

  const currentToken = token || localStorage.getItem('userToken') || localStorage.getItem('token');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!currentToken || !userInfo) return;
    const fetchNotifs = async () => {
      try {
        const data = await notificationsAPI.getMine(currentToken);
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.isRead).length);
      } catch (err) { console.error("Notif error", err); }
    };
    fetchNotifs();
    if (!socket) return;
    socket.on('new_notification', (newNote) => {
      setNotifications(prev => [newNote, ...prev].slice(0, 50));
      setUnreadCount(prev => prev + 1);
      play8BitSuccess();
    });
    return () => socket.off('new_notification');
  }, [currentToken, userInfo?._id, socket]);

  // Dispatch event when mobile menu opens/closes and toggle body scroll
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('navbarToggle', { detail: isOpen }));
    
    // Lock body scroll when mobile menu is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      if (logout) logout();
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
    }
  };

  const userId = userInfo ? (userInfo._id || userInfo.id) : '';
  const isAdmin = userInfo?.role?.toLowerCase() === 'admin';
  const isClient = userInfo?.role === 'client';
  const isFreelancer = userInfo?.role === 'freelancer' || (userInfo?.profession && userInfo.profession !== 'General');

  const navLinks = isAdmin ? [
    { name: 'Admin Panel', href: '/admin/dashboard', icon: <FiSettings /> },
    { name: 'Insights', href: '/admin/overview', icon: <FiActivity /> },
    { name: 'Withdrawals', href: '/admin/withdrawals', icon: <FiDollarSign /> },
    { name: 'System Notifications', href: '/notifications', icon: <FiBell /> },
    { name: 'Global Feed', href: '/feed', icon: <FiGlobe /> },
  ] : isFreelancer ? [
    { name: 'Creator Hub', href: '/dashboard', icon: <FiHome /> },
    { name: 'Manage Portfolio', href: '/manage-portfolio', icon: <FiGrid /> },
    { name: 'Manage Job', href: '/jobs', icon: <FiBriefcase /> },
    { name: 'My Coin', href: '/dashboard/wallet', icon: <FiDollarSign /> },
    { name: 'Notifications', href: '/notifications', icon: <FiBell /> },
  ] : isClient ? [
    { name: 'Client Center', href: '/dashboard', icon: <FiHome /> },
    { name: 'Manage Job', href: '/jobs', icon: <FiBriefcase /> },
    { name: 'My Wallet', href: '/dashboard/wallet', icon: <FiDollarSign /> },
    { name: 'Social', href: '/feed', icon: <FiGlobe /> },
    { name: 'Notifications', href: '/notifications', icon: <FiBell /> },
  ] : [
    { name: 'Client Center', href: '/dashboard', icon: <FiHome /> },
    { name: 'Manage Job', href: '/jobs', icon: <FiBriefcase /> },
    { name: 'My Wallet', href: '/dashboard/wallet', icon: <FiDollarSign /> },
    { name: 'Social', href: '/feed', icon: <FiGlobe /> },
    { name: 'Notifications', href: '/notifications', icon: <FiBell /> },
  ];


  return (
    <>
      {/* 🛸 Desktop Floating Navigation Tactical Dock */}
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="hide-mobile"
        style={{
          position: 'fixed', top: '24px', right: '40px',
          zIndex: 991, width: 'max-content', display: 'flex', gap: '12px', alignItems: 'center'
        }}
      >
        <motion.button
          whileHover={{ scale: 1.05, boxShadow: '0 0 20px var(--accent-glow)' }}
          whileTap={{ scale: 0.95 }}
          className="glass"
          style={{
            padding: '12px 24px', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.05)',
            color: '#fff', fontSize: '0.8rem', fontWeight: '700', letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '10px',
            cursor: 'pointer', background: 'rgba(255,255,255,0.02)'
          }}
          onClick={() => setIsOpen(true)}
        >
          <FiMenu style={{ fontSize: '1.2rem', color: 'var(--accent)' }} />
        </motion.button>

        {currentToken && (
          <div className="glass" style={{ display: 'flex', gap: '8px', padding: '6px', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <motion.button
              whileHover={{ scale: 1.1 }}
              style={{
                position: 'relative', width: '45px', height: '45px', borderRadius: '40px', background: 'rgba(255,255,255,0.02)',
                border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
              }}
              onClick={() => navigate('/notifications')}
            >
              <FiBell size={20} />
              {unreadCount > 0 && <span className="notif-badge-new">{unreadCount}</span>}
            </motion.button>

            <Link to="/dashboard/wallet" style={{ textDecoration: 'none' }}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                style={{
                  height: '45px', padding: '0 20px', borderRadius: '40px', background: 'rgba(245, 158, 11, 0.05)',
                  border: '1px solid rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '10px',
                  fontWeight: '700', cursor: 'pointer'
                }}
              >
                <CoinIcon size={20} />
                <span>{(user?.coinBalance || localUserInfo?.coinBalance || userInfo?.coinBalance || 0).toLocaleString()}</span>
              </motion.div>
            </Link>

            <Link to={userId ? `/profile/${userId}` : '#'} style={{ textDecoration: 'none' }}>
              <motion.div
                whileHover={{ scale: 1.1 }}
                style={{
                  width: '45px', height: '45px', borderRadius: '40px', overflow: 'hidden', border: '2px solid var(--accent)',
                  background: '#0a0a0a', cursor: 'pointer'
                }}
              >
                {userInfo?.profileImage?.url ? (
                  <img src={getFullUrl(userInfo.profileImage.url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="P" />
                ) : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiUser /></div>}
              </motion.div>
            </Link>
          </div>
        )}
      </motion.div>

      {/* 📱 Mobile Header (Only visible on small screens) */}
      <div className="mobile-header show-mobile-flex glass" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <Link to="/" className="mobile-logo">
          <img src={logo} alt="P" style={{ filter: 'drop-shadow(0 0 5px var(--accent))' }} />
          <span>PATTAYA <span>PAL</span></span>
        </Link>
        <button className="mobile-toggle-btn" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <FiX /> : <FiMenu />}
        </button>
      </div>

      {/* 🛸 Holographic Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="sidebar-overlay-new"
              onClick={() => setIsOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="sidebar-container-new glass"
            >
              <div className="sidebar-brand-new" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <Link to="/" onClick={() => setIsOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '15px', textDecoration: 'none' }}>
                  <img src={logo} alt="Logo" />
                  <div className="brand-text">PATTAYA <span>PAL</span></div>
                </Link>
                <button className="close-btn-new" onClick={() => setIsOpen(false)}><FiX /></button>
              </div>

              <div className="sidebar-scrollable">
                {currentToken && (
                  <div className="user-profile-card-new glass">
                    <div className="energy-ring">
                      <div className="avatar-main">
                        {userInfo?.profileImage?.url ? (
                          <img src={getFullUrl(userInfo.profileImage.url)} alt="" />
                        ) : <FiUser />}
                      </div>
                    </div>
                    <div className="user-meta" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', letterSpacing: '-0.5px', lineHeight: '1.1' }}>
                          {userInfo?.name || 'Welcome'}
                        </h4>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.7rem', color: '#888', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>
                          {userInfo?.profession || 'PattayaPal Member'}
                        </p>
                        <div style={{ marginTop: '5px', display: 'flex' }}>
                          <span style={{
                            fontSize: '0.6rem',
                            fontWeight: '700',
                            padding: '3px 10px',
                            borderRadius: '8px',
                            background: isAdmin ? 'rgba(239, 68, 68, 0.1)' : (isFreelancer ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)'),
                            color: isAdmin ? '#ef4444' : (isFreelancer ? '#10b981' : '#3b82f6'),
                            border: `1px solid ${isAdmin ? 'rgba(239, 68, 68, 0.2)' : (isFreelancer ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)')}`,
                            letterSpacing: '1px'
                          }}>
                            {isAdmin ? 'Admin' : (isFreelancer ? 'Freelancer' : 'Client')}
                          </span>
                        </div>
                      </div>
                      <Link to="/dashboard/wallet" style={{ textDecoration: 'none', alignSelf: 'flex-start' }} onClick={() => setIsOpen(false)}>
                        <div style={{ padding: '5px 12px', borderRadius: '20px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b', fontWeight: '700', fontSize: '0.75rem', border: '1px solid rgba(245, 158, 11, 0.2)', transition: 'background 0.3s' }}>
                          <CoinIcon size={14} />
                          {(user?.coinBalance || localUserInfo?.coinBalance || userInfo?.coinBalance || 0).toLocaleString()} Coins
                        </div>
                      </Link>
                    </div>
                  </div>
                )}

                <nav className="mega-nav-new">
                  <p className="section-label">MAIN MENU</p>
                  <ul>
                    {navLinks.map((link) => (
                      <li key={link.href}>
                        <Link to={link.href} className={location.pathname === link.href ? 'active' : ''} onClick={() => setIsOpen(false)}>
                          <span style={{ fontWeight: '500' }}>{link.name}</span> <span>{link.icon}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>

                  <p className="section-label" style={{ marginTop: '30px' }}>Other</p>
                  <ul>
                    <li><Link to="/freelancers" onClick={() => setIsOpen(false)}><span style={{ fontWeight: '500' }}>Find Freelancers</span> <FiSearch /></Link></li>
                    <li><Link to="/works" onClick={() => setIsOpen(false)}><span style={{ fontWeight: '500' }}>User Creations</span> <FiLayers /></Link></li>
                    <li><Link to="/messenger" onClick={() => setIsOpen(false)}><span style={{ fontWeight: '500' }}>Messenger</span> <FiMessageCircle /></Link></li>
                    <li><Link to="/friends" onClick={() => setIsOpen(false)}><span style={{ fontWeight: '500' }}>Friends</span> <FiUsers /></Link></li>
                  </ul>
                </nav>
              </div>

              <div className="sidebar-bottom-new">
                {currentToken ? (
                  <button className="logout-btn-new glass" onClick={handleLogout}>
                    Logout <FiLogOut />
                  </button>
                ) : (
                  <Link to="/login" className="login-btn-new glass" onClick={() => setIsOpen(false)}>Login / Register</Link>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <style>{`
        .notif-badge-new { position: absolute; top: -5px; right: -5px; background: var(--accent); color: #fff; font-size: 0.6rem; font-weight: 700; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid var(--bg-deep); }
        .sidebar-overlay-new { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(5px); z-index: 998; }
        .sidebar-container-new { position: fixed; top: 0; left: 0; width: 340px; height: 100vh; z-index: 999; border-right: 1px solid rgba(255,255,255,0.05); display: flex; flex-direction: column; overflow: hidden; padding: 40px; }
        .sidebar-brand-new { display: flex; align-items: center; gap: 15px; margin-bottom: 50px; }
        .sidebar-brand-new img { width: 40px; filter: drop-shadow(0 0 8px var(--accent)); }
        .brand-text { font-size: 1.2rem; font-weight: 700; letter-spacing: 2px; }
        .brand-text span { color: var(--accent); }
        .close-btn-new { margin-left: auto; border: none; background: none; color: #fff; font-size: 1.5rem; cursor: pointer; }
        
        .user-profile-card-new { padding: 25px; border-radius: 30px; display: flex; align-items: center; gap: 18px; margin-bottom: 45px; border: 1px solid rgba(255,255,255,0.03); }
        .energy-ring { position: relative; width: 55px; height: 55px; min-width: 55px; flex-shrink: 0; border-radius: 50%; padding: 2px; overflow: hidden; display: flex; align-items: center; justify-content: center; background: #222; }
        .energy-ring::before { content: ''; position: absolute; width: 150%; height: 150%; background: conic-gradient(from 0deg, transparent 0%, var(--accent) 40%, var(--indigo) 60%, transparent 100%); animation: spin 3s linear infinite; z-index: 0; }
        .avatar-main { position: relative; width: 100%; height: 100%; border-radius: 50%; background: var(--bg-deep, #050505); overflow: hidden; display: flex; align-items: center; justify-content: center; z-index: 1; border: 2px solid #000; }
        .avatar-main img { width: 100%; height: 100%; object-fit: cover; }
        .user-meta h4 { margin: 0; font-size: 1.1rem; font-weight: 700; letter-spacing: -0.5px; }
        .user-meta p { margin: 4px 0 0; font-size: 0.7rem; color: #444; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }

        .sidebar-scrollable { flex: 1; overflow-y: auto; overscroll-behavior: contain; padding-right: 10px; }
        .sidebar-scrollable::-webkit-scrollbar { width: 4px; }
        .sidebar-scrollable::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }

        .section-label { font-size: 0.65rem; color: #333; font-weight: 700; letter-spacing: 4px; margin-bottom: 20px; text-transform: uppercase; }
        .mega-nav-new ul { list-style: none; padding: 0; margin: 0; }
        .mega-nav-new li { margin-bottom: 12px; }
        .mega-nav-new a { display: flex; justify-content: space-between; align-items: center; padding: 16px 22px; border-radius: 20px; text-decoration: none; color: #666; font-weight: 700; font-size: 0.95rem; transition: 0.3s; }
        .mega-nav-new a:hover { background: rgba(255,255,255,0.02); color: #fff; transform: translateX(10px); }
        .mega-nav-new a.active { background: rgba(255, 87, 51, 0.05); color: var(--accent); border: 1px solid rgba(255, 87, 51, 0.1); }
        .mega-nav-new a span { font-size: 1.1rem; opacity: 0.3; }

        .sidebar-bottom-new { margin-top: auto; }
        .login-btn-new, .logout-btn-new { width: 100%; padding: 18px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); color: #fff; text-decoration: none; font-weight: 700; font-size: 0.85rem; letter-spacing: 1px; text-align: center; display: flex; align-items: center; justify-content: center; gap: 12px; cursor: pointer; transition: 0.3s; }
        .login-btn-new:hover { background: var(--accent); border-color: var(--accent); box-shadow: 0 0 20px var(--accent-glow); }
        .logout-btn-new:hover { background: #cf3d3d; border-color: #cf3d3d; box-shadow: 0 0 20px rgba(207, 61, 61, 0.2); }

        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .show-mobile-flex { display: none; }

        @media (max-width: 992px) {
          .sidebar-container-new { width: 85vw; padding: 30px; }
          .show-mobile-flex { display: flex; }
          .user-profile-card-new { padding: 15px; gap: 12px; }
          .brand-text { font-size: 1rem; }
        }

        @media (max-width: 480px) {
          .sidebar-container-new { width: 100vw; border-right: none; }
          .sidebar-brand-new { margin-bottom: 30px; }
          .sidebar-scrollable { padding-bottom: 20px; }
        }
      `}</style>
    </>
  );
}

export default Navbar;