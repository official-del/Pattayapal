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
    { name: 'Social', href: '/feed', icon: <FiGlobe /> },
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
      {/* 📱 Mobile Top Navigation */}
      <div className="mobile-top-nav show-mobile-flex">
        <Link to="/" className="m-logo-box">
          <img src={logo} alt="P" />
          <span>PATTAYA <span>PAL</span></span>
        </Link>
        <div className="m-actions">
           {currentToken && <div className="m-coin"><CoinIcon size={16} /> <span>{(user?.coinBalance || userInfo?.coinBalance || 0).toLocaleString()}</span></div>}
           <button className="m-toggle-btn" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>

      {/* 🛸 Neo-Cyber Premium Sidebar */}
      <AnimatePresence>
        {(isOpen || window.innerWidth > 992) && (
          <>
            {isOpen && window.innerWidth <= 992 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="premium-sidebar-overlay"
                onClick={() => setIsOpen(false)}
              />
            )}
            
            <motion.aside
              initial={window.innerWidth <= 992 ? { x: '-100%' } : { x: 0 }}
              animate={{ x: 0 }}
              exit={window.innerWidth <= 992 ? { x: '-100%' } : { x: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className={`premium-sidebar-container ${isOpen ? 'm-open' : ''}`}
            >
              {/* Brand Logo Section */}
              <div className="p-sidebar-header">
                <Link to="/" onClick={() => setIsOpen(false)} className="p-brand-link">
                  <div className="p-logo-wrapper">
                    <img src={logo} alt="PattayaPal" />
                  </div>
                  <div className="p-brand-text">PATTAYA <span>PAL</span></div>
                </Link>
              </div>

              {/* User Identity Section */}
              {currentToken && (
                <div className="p-user-section">
                  <Link 
                    to={`/profile/${userId}`} 
                    className="p-identity-card"
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="p-avatar-wrapper">
                      {userInfo?.profileImage?.url || (typeof userInfo?.profileImage === 'string' && userInfo?.profileImage) ? (
                        <img
                          src={getFullUrl(userInfo.profileImage.url || userInfo.profileImage) + `?t=${profileUpdateTag}`}
                          alt=""
                        />
                      ) : <FiUser />}
                      <div className="p-status-dot"></div>
                    </div>
                    <div className="p-user-info">
                      <span className="p-name">{userInfo.name}</span>
                      <span className="p-role">{userInfo.role || 'Member'}</span>
                    </div>
                  </Link>
                </div>
              )}

              {/* Navigation Engine */}
              <div className="p-nav-engine">
                <div className="p-nav-group">
                  <span className="p-group-label">OPERATIONS</span>
                  {navLinks.map((link, idx) => (
                    <Link
                      key={idx}
                      to={link.href}
                      className={`p-nav-item ${location.pathname === link.href ? 'p-active' : ''}`}
                      onClick={() => setIsOpen(false)}
                    >
                      <div className="p-item-icon">{link.icon}</div>
                      <span className="p-item-label">{link.name}</span>
                      {link.name === 'Notifications' && unreadCount > 0 && <span className="p-notif-count">{unreadCount}</span>}
                    </Link>
                  ))}
                </div>

                <div className="p-nav-group">
                  <span className="p-group-label">DISCOVERY</span>
                  {otherLinks.map((link, idx) => (
                    <Link
                      key={idx}
                      to={link.href}
                      className={`p-nav-item ${location.pathname === link.href ? 'p-active' : ''}`}
                      onClick={() => setIsOpen(false)}
                    >
                      <div className="p-item-icon">{link.icon}</div>
                      <span className="p-item-label">{link.name}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Sidebar Footer */}
              <div className="p-sidebar-footer">
                {currentToken ? (
                  <button className="p-logout-action" onClick={handleLogout}>
                    <div className="p-item-icon"><FiLogOut /></div>
                    <span className="p-item-label">DISCONNECT</span>
                  </button>
                ) : (
                  <Link to="/login" className="p-login-action" onClick={() => setIsOpen(false)}>
                    <div className="p-item-icon"><FiZap /></div>
                    <span className="p-item-label">INITIALIZE</span>
                  </Link>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default Navbar;