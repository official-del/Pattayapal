import { customConfirm } from '../utils/customConfirm';
import { useState, useContext, useEffect, useRef, useMemo } from 'react';
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
  FiActivity, FiGrid, FiSearch, FiStar, FiGift
} from 'react-icons/fi';
import { CoinIcon, CoinBadge } from './CoinIcon';
import GasIcon from './GasIcon';
import RankBadge from './RankBadge';
import '../css/Navbar.css';
import logo from '../assets/LOGO1.png';
import { CONFIG } from '../utils/config';
import { play8BitSuccess } from '../utils/soundEffects';

const API_BASE_URL = CONFIG.API_BASE_URL;

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { user, token, logout, profileUpdateTag, fetchProfile } = useContext(AuthContext);
  const userInfo = useMemo(() => {
    if (user) return user;
    try { return JSON.parse(window.safeStorage.getItem('userInfo') || '{}'); } catch { return {}; }
  }, [user]);
  const { socket } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [balanceUpdateMessage, setBalanceUpdateMessage] = useState(null);
  const audioRef = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"));

  let currentToken = token;
  if (!currentToken) {
    try {
      currentToken = window.safeStorage.getItem('userToken') || window.safeStorage.getItem('token');
    } catch (e) {}
  }

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
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
    const handleNewNotification = (newNote) => {
      setNotifications(prev => [newNote, ...prev].slice(0, 50));
      setUnreadCount(prev => prev + 1);
      play8BitSuccess();
    };

    const handleNotificationsRead = (data) => {
      if (data.all) {
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      } else if (data.id) {
        setUnreadCount(prev => Math.max(0, prev - 1));
        setNotifications(prev => prev.map(n => n._id === data.id ? { ...n, isRead: true } : n));
      }
    };

    if (socket) {
      const handleBalanceUpdate = (data) => {
        if (data.message) {
          setBalanceUpdateMessage({
            title: data.title || 'เหรียญเข้าแล้ว!',
            message: data.message,
            newBalance: data.coinBalance,
            newGas: data.gasBalance ?? data.gas
          });
          play8BitSuccess();
          if (fetchProfile) fetchProfile(); // Update global user balance
        }
      };

      socket.on('new_notification', handleNewNotification);
      socket.on('notifications_read', handleNotificationsRead);
      socket.on('balance_update', handleBalanceUpdate);
      return () => {
        socket.off('new_notification', handleNewNotification);
        socket.off('notifications_read', handleNotificationsRead);
        socket.off('balance_update', handleBalanceUpdate);
      };
    }
  }, [currentToken, userInfo?._id, socket, fetchProfile]);

  // Reset badge when navigating to Notifications page
  useEffect(() => {
    if (location.pathname === '/notifications') {
      setUnreadCount(0);
    }
  }, [location.pathname]);

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

  const handleLogout = async () => {
    if (await customConfirm('Are you sure you want to log out?')) {
      if (logout) logout();
      window.safeStorage.clear();
      window.safeSessionStorage.clear();
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
    { name: 'Daily Quests', href: '/dashboard/quests', icon: <FiGift /> },
    { name: 'System Notifications', href: '/notifications', icon: <FiBell /> },
    { name: 'Global Feed', href: '/feed', icon: <FiGlobe /> },
  ] : isFreelancer ? [
    { name: 'Creator Hub', href: '/dashboard', icon: <FiHome /> },
    { name: 'Manage Portfolio', href: '/manage-portfolio', icon: <FiGrid /> },
    { name: 'Manage Job', href: '/jobs', icon: <FiBriefcase /> },
    { name: 'My Coin', href: '/dashboard/wallet', icon: <FiDollarSign /> },
    { name: 'Daily Quests', href: '/dashboard/quests', icon: <FiGift /> },
    { name: 'Notifications', href: '/notifications', icon: <FiBell /> },
    // { name: 'Social', href: '/feed', icon: <FiGlobe /> },
  ] : isClient ? [
    { name: 'Client Center', href: '/dashboard', icon: <FiHome /> },
    { name: 'Manage Job', href: '/jobs', icon: <FiBriefcase /> },
    { name: 'My Wallet', href: '/dashboard/wallet', icon: <FiDollarSign /> },
    { name: 'Daily Quests', href: '/dashboard/quests', icon: <FiGift /> },
    // { name: 'Social', href: '/feed', icon: <FiGlobe /> },
    { name: 'Notifications', href: '/notifications', icon: <FiBell /> },
  ] : [
    { name: 'Client Center', href: '/dashboard', icon: <FiHome /> },
    { name: 'Manage Job', href: '/jobs', icon: <FiBriefcase /> },
    { name: 'My Wallet', href: '/dashboard/wallet', icon: <FiDollarSign /> },
    { name: 'Daily Quests', href: '/dashboard/quests', icon: <FiGift /> },
    // { name: 'Social', href: '/feed', icon: <FiGlobe /> },
    { name: 'Notifications', href: '/notifications', icon: <FiBell /> },
  ];

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      try { await notificationsAPI.markAsRead(notif._id); } catch (e) { }
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    const type = notif.type?.toLowerCase() || '';
    if (type.includes('message') || type.includes('messenger')) {
      const convId = notif.relatedId || (notif.link && notif.link.includes('messenger/') ? notif.link.split('/').pop() : null);
      navigate(convId ? `/messenger/${convId}` : '/messenger');
    } else if (type.includes('job')) {
      navigate('/dashboard/hiring');
    } else if (type.includes('friend')) {
      navigate('/friends');
    } else if (type.includes('payment') || type.includes('wallet')) {
      navigate('/dashboard/wallet');
    } else if (notif.link) {
      navigate(notif.link);
    }
  };

  const otherLinks = [
    { name: 'Find Freelancers', href: '/freelancers', icon: <FiSearch /> },
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
          {currentToken && (
            <>
              <div className="m-gas" style={{ display: 'flex', alignItems: 'center', gap: '5px', marginRight: '10px' }}>
                <GasIcon gas={user?.gas ?? userInfo?.gas ?? 0} size="20px" />
                <span style={{ fontSize: '0.8rem', fontWeight: '800' }}>{user?.gas ?? userInfo?.gas ?? 0}%</span>
              </div>
              <div className="m-coin"><CoinIcon size={16} /> <span>{(user?.coinBalance || userInfo?.coinBalance || 0).toLocaleString()}</span></div>
            </>
          )}
          <button className="m-toggle-btn" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>

      {/* 💎 Desktop Top Actions (3-Buttons Hub) */}
      {currentToken && (
        <div className="desktop-top-actions hide-mobile">
          <div className="d-gas-box" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', whiteSpace: 'nowrap' }}>
            <GasIcon gas={user?.gas ?? userInfo?.gas ?? 0} size="20px" />
            <span style={{ fontSize: '0.85rem', fontWeight: '800' }}>{user?.gas ?? userInfo?.gas ?? 0}%</span>
          </div>
          <div className="d-coin-box" style={{ whiteSpace: 'nowrap', padding: '6px 12px' }}>
            <CoinIcon size={16} />
            <span>{(user?.coinBalance || userInfo?.coinBalance || 0).toLocaleString()}</span>
          </div>
          <div className="d-btn-group">
            <Link to="/notifications" className="d-action-btn" title="Notifications">
              <FiBell />
              {unreadCount > 0 && <span className="d-badge">{unreadCount}</span>}
            </Link>
            <Link to="/messenger" className="d-action-btn" title="Messages">
              <FiMessageCircle />
            </Link>
            <Link to={`/profile/${userId}`} className="d-action-btn" title="My Profile">
              <FiUser />
            </Link>
          </div>
        </div>
      )}

      {/* 🛸 Neo-Cyber Premium Sidebar */}
      <AnimatePresence>
        {(isOpen || window.innerWidth > 1700) && (
          <>
            {isOpen && window.innerWidth <= 1700 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="premium-sidebar-overlay"
                onClick={() => setIsOpen(false)}
              />
            )}

            <motion.aside
              initial={window.innerWidth <= 1700 ? { x: '-100%' } : { x: 0 }}
              animate={{ x: 0 }}
              exit={window.innerWidth <= 1700 ? { x: '-100%' } : { x: 0 }}
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
              {currentToken && userInfo && (() => {
                const points = userInfo.points || 0;
                const rankName = userInfo.rank || 'Bronze';

                const thresholds = {
                  Bronze: { min: 0, max: 1000 },
                  Silver: { min: 1001, max: 5000 },
                  Gold: { min: 5001, max: 20000 },
                  Platinum: { min: 20001, max: 100000 },
                  Diamond: { min: 100001, max: 500000 },
                  Conqueror: { min: 500001, max: 1000000 },
                };

                const rankLevels = {
                  Bronze: 1, Silver: 2, Gold: 3, Platinum: 4, Diamond: 5, Conqueror: 6
                };

                const thresh = thresholds[rankName] || thresholds.Bronze;
                const progress = Math.min(100, Math.max(0, ((points - thresh.min) / (thresh.max - thresh.min)) * 100));
                const level = rankLevels[rankName] || 1;

                return (
                  <div className="p-user-section">
                    <Link
                      to={`/profile/${userId}`}
                      onClick={() => setIsOpen(false)}
                      className="p-identity-link"
                    >
                      {/* Medium Avatar with Progress Ring */}
                      <div className="p-avatar-ring-wrapper">
                        {/* Progress Ring */}
                        <div style={{
                          position: 'absolute', inset: 0,
                          borderRadius: '50%',
                          background: `conic-gradient(var(--accent) ${progress}%, rgba(255,255,255,0.1) 0)`
                        }} />
                        <div style={{
                          position: 'absolute', inset: '3px',
                          borderRadius: '50%', background: '#000'
                        }} />
                        {/* Avatar Image */}
                        <div className="p-avatar-image-inner">
                          {userInfo?.profileImage?.url || (typeof userInfo?.profileImage === 'string' && userInfo?.profileImage) ? (
                            <img
                              src={getFullUrl(userInfo.profileImage.url || userInfo.profileImage) + `?t=${profileUpdateTag}`}
                              alt={userInfo.name}
                            />
                          ) : (
                            <div className="p-avatar-placeholder">
                              <FiUser size={20} />
                            </div>
                          )}
                        </div>

                        {/* Rank Badge (Top Right) */}
                        <div className="p-rank-badge-navbar">
                          <RankBadge rank={rankName} showName={false} size="sm" />
                        </div>
                      </div>

                      {/* Right: Text Info */}
                      <div className="p-user-info">
                        <div className="p-name">
                          {userInfo.name || 'ANOTHERWAY'}
                        </div>
                        <div className="p-role">
                          RANK: {rankName.toUpperCase()}
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })()}

              {/* Navigation Engine */}
              <div className="p-nav-engine">
                <div className="p-nav-group">
                  {/* <span className="p-group-label">OPERATIONS</span> */}
                  {navLinks.map((link, idx) => (
                    <Link
                      key={idx}
                      to={link.href}
                      className={`p-nav-item ${location.pathname === link.href ? 'p-active' : ''}`}
                      onClick={() => setIsOpen(false)}
                      style={{ padding: '12px 20px', gap: '15px' }}
                    >
                      <div className="p-item-icon" style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                        {link.icon}
                        {link.name.includes('Notifications') && unreadCount > 0 && (
                          <span className="p-nav-badge" style={{ position: 'absolute', top: '-5px', right: '-5px' }}>{unreadCount}</span>
                        )}
                      </div>
                      <span className="p-item-label" style={{ fontSize: '0.9rem', fontWeight: '500' }}>{link.name}</span>
                    </Link>
                  ))}
                </div>

                <div className="p-nav-group" style={{ marginTop: '10px' }}>
                  {/* <span className="p-group-label">DISCOVERY</span> */}
                  {otherLinks.map((link, idx) => (
                    <Link
                      key={idx}
                      to={link.href}
                      className={`p-nav-item ${location.pathname === link.href ? 'p-active' : ''}`}
                      onClick={() => setIsOpen(false)}
                      style={{ padding: '12px 20px', gap: '15px' }}
                    >
                      <div className="p-item-icon" style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>{link.icon}</div>
                      <span className="p-item-label" style={{ fontSize: '0.9rem', fontWeight: '500' }}>{link.name}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Sidebar Footer */}
              <div className="p-sidebar-footer">
                {currentToken ? (
                  <button className="p-logout-action" onClick={handleLogout}>
                    <div className="p-item-icon"><FiLogOut /></div>
                    <span className="p-item-label">Logout</span>
                  </button>
                ) : (
                  <Link to="/login" className="p-login-action" onClick={() => setIsOpen(false)}>
                    <div className="p-item-icon"><FiZap /></div>
                    <span className="p-item-label">Login / Register</span>
                  </Link>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* 💰 Global Balance Update Notification Modal */}
      <AnimatePresence>
        {balanceUpdateMessage && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '20px' }}>
            <motion.div
              initial={{ scale: 0.5, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.5, y: 50, opacity: 0 }}
              className="glass"
              style={{
                padding: '50px', borderRadius: '40px', maxWidth: '500px', width: '100%',
                border: '2px solid #f59e0b', textAlign: 'center',
                boxShadow: '0 0 60px rgba(245, 158, 11, 0.2)',
                position: 'relative', overflow: 'hidden'
              }}
            >
              {/* Confetti Glow */}
              <div style={{ position: 'absolute', top: '-50px', left: '-50px', width: '150px', height: '150px', background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)', opacity: 0.2 }} />
              
              <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', margin: '0 auto 30px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                <CoinIcon size={55} />
              </div>

              <h2 style={{ fontSize: '2rem', fontWeight: '800', color: '#fff', marginBottom: '15px', letterSpacing: '-1px' }}>
                {balanceUpdateMessage.title}
              </h2>
              <p style={{ fontSize: '1.1rem', color: '#f59e0b', fontWeight: '700', marginBottom: '30px', lineHeight: '1.5' }}>
                {balanceUpdateMessage.message}
              </p>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '25px', borderRadius: '25px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '35px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <div style={{ color: '#888', fontSize: '0.7rem', fontWeight: '700', letterSpacing: '2px', marginBottom: '5px', textTransform: 'uppercase' }}>COIN BALANCE</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                    <CoinIcon size={24} />
                    {(balanceUpdateMessage.newBalance ?? (user?.coinBalance || 0)).toLocaleString()}
                  </div>
                </div>
                {balanceUpdateMessage.newGas !== undefined && (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '15px' }}>
                    <div style={{ color: '#888', fontSize: '0.7rem', fontWeight: '700', letterSpacing: '2px', marginBottom: '5px', textTransform: 'uppercase' }}>GAS ENERGY</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                      <GasIcon gas={balanceUpdateMessage.newGas} size="30px" />
                      {balanceUpdateMessage.newGas}%
                    </div>
                  </div>
                )}
              </div>

              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 10px 20px rgba(245, 158, 11, 0.2)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setBalanceUpdateMessage(null)}
                style={{ width: '100%', padding: '20px', borderRadius: '20px', background: '#f59e0b', border: 'none', color: '#111', fontWeight: '800', fontSize: '1.1rem', cursor: 'pointer' }}
              >
                รับทราบ
              </motion.button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default Navbar;
