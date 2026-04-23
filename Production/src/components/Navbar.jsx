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
  const [isHovered, setIsHovered] = useState(false);
  const { user, token, logout, profileUpdateTag } = useContext(AuthContext);
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

  const otherLinks = [
    { name: 'Find Freelancers', href: '/freelancers', icon: <FiSearch /> },
    { name: 'User Creations', href: '/works', icon: <FiLayers /> },
    { name: 'Messenger', href: '/messenger', icon: <FiMessageCircle /> },
    { name: 'Friends', href: '/friends', icon: <FiUsers /> },
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
                  background: '#0a0a0a', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                {userInfo?.profileImage?.url || (typeof userInfo?.profileImage === 'string' && userInfo?.profileImage) ? (
                  <img
                    src={getFullUrl(userInfo.profileImage.url || userInfo.profileImage) + `?t=${profileUpdateTag}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    alt={userInfo?.name?.[0] || 'U'}
                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                  />
                ) : null}
                <div style={{ display: (userInfo?.profileImage?.url || typeof userInfo?.profileImage === 'string') ? 'none' : 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                  <FiUser />
                </div>
              </motion.div>
            </Link>
          </div>
        )}
      </motion.div>

      {/* 📱 Mobile Header */}
      <div className="mobile-header show-mobile-flex glass">
        <Link to="/" className="mobile-logo" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src={logo} alt="P" style={{ height: '35px', filter: 'drop-shadow(0 0 5px var(--sb-accent))' }} />
          <span>PATTAYA <span>PAL</span></span>
        </Link>
        <button className="mobile-toggle-btn" onClick={() => setIsOpen(!isOpen)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.8rem' }}>
          {isOpen ? <FiX /> : <FiMenu />}
        </button>
      </div>

      {/* 🛸 Premium Vertical Sidebar Drawer */}
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
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className={`sidebar-container-new open`}
            >
              {/* Brand Section */}
              <div className="sidebar-brand-new">
                <Link to="/" onClick={() => setIsOpen(false)}>
                  <img src={logo} alt="Logo" />
                  <div className="brand-text">PATTAYA <span>PAL</span></div>
                </Link>
                <button className="close-sidebar-tactical" onClick={() => setIsOpen(false)} style={{ position: 'absolute', right: '20px', background: 'none', border: 'none', color: '#333', cursor: 'pointer' }}>
                  <FiX size={24} />
                </button>
              </div>

              {/* Navigation Group */}
              <div className="sidebar-scrollable">
                {currentToken && (
                  <div className="user-profile-card-new">
                    <div className="avatar-main">
                      {userInfo?.profileImage?.url || (typeof userInfo?.profileImage === 'string' && userInfo?.profileImage) ? (
                        <img
                          src={getFullUrl(userInfo.profileImage.url || userInfo.profileImage) + `?t=${profileUpdateTag}`}
                          alt=""
                          onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                        />
                      ) : null}
                      <div style={{ display: (userInfo?.profileImage?.url || typeof userInfo?.profileImage === 'string') ? 'none' : 'flex' }}>
                        <FiUser />
                      </div>
                    </div>
                    <div className="user-details-new">
                      <span className="u-name">{userInfo?.name || 'Welcome'}</span>
                      <span className="u-role">{userInfo?.role || 'User'}</span>
                    </div>
                  </div>
                )}

                <div className="nav-group-label">MAIN MENU</div>
                {navLinks.map((link, idx) => (
                  <Link
                    key={idx}
                    to={link.href}
                    className={`nav-item-new ${location.pathname === link.href ? 'active' : ''}`}
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="ni-icon">{link.icon}</div>
                    <div className="ni-label">{link.name}</div>
                  </Link>
                ))}

                <div className="nav-group-label" style={{ marginTop: '30px' }}>SYSTEM ACCESS</div>
                {otherLinks.map((link, idx) => (
                  <Link
                    key={idx}
                    to={link.href}
                    className={`nav-item-new ${location.pathname === link.href ? 'active' : ''}`}
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="ni-icon">{link.icon}</div>
                    <div className="ni-label">{link.name}</div>
                  </Link>
                ))}
              </div>

              {/* Footer / Logout */}
              <div className="sidebar-footer-new">
                {currentToken ? (
                  <button className="logout-btn-new" onClick={handleLogout}>
                    <FiLogOut size={22} />
                    <span className="logout-label">SYSTEM TERMINATE</span>
                  </button>
                ) : (
                  <Link to="/login" className="logout-btn-new" onClick={() => setIsOpen(false)} style={{ textDecoration: 'none' }}>
                    <FiZap size={22} />
                    <span className="logout-label">INITIALIZE LOGIN</span>
                  </Link>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
      <style>{`
        .notif-badge-new { position: absolute; top: -5px; right: -5px; background: var(--sb-accent); color: #fff; font-size: 0.6rem; font-weight: 700; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #000; }
      `}</style>
    </>
  );
}

export default Navbar;