import { Link, useLocation } from 'react-router-dom';
import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiHome, FiGrid, FiPackage, FiBriefcase, FiUser, FiArrowLeft, FiMessageCircle, FiSettings, FiZap, FiDollarSign, FiActivity, FiBell, FiSearch, FiGift
} from 'react-icons/fi';
import { CoinIcon } from './CoinIcon';

function DashboardSidebar({ show, onClose }) {
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const localUserInfo = JSON.parse(window.safeStorage.getItem('userInfo') || '{}');
  const userInfo = user || localUserInfo;
  const [isNavbarOpen, setIsNavbarOpen] = useState(false);

  useEffect(() => {
    const handleNavbar = (e) => setIsNavbarOpen(e.detail);
    window.addEventListener('navbarToggle', handleNavbar);
    return () => window.removeEventListener('navbarToggle', handleNavbar);
  }, []);

  const isFreelancer = userInfo?.role === 'freelancer' || (userInfo?.profession && userInfo.profession !== 'General');
  const isAdmin = userInfo?.role === 'admin';

  let menuItems = [];

  if (isAdmin) {
    menuItems = [
      { name: 'Admin Dashboard', icon: <FiHome />, href: '/admin/dashboard' },
      { name: 'Platform Analytics', icon: <FiActivity />, href: '/admin/overview' },
      { name: 'Rankings & Hall of Fame', icon: <FiZap />, href: '/rankings' },
      { name: 'Withdrawal Requests', icon: <FiArrowLeft style={{ transform: 'rotate(-45deg)' }} />, href: '/admin/withdrawals' }
    ];
  } else if (isFreelancer) {
    menuItems = [
      { name: 'Creator Overview', icon: <FiHome />, href: '/dashboard' },
      { name: 'Creator Leaderboards', icon: <FiZap />, href: '/rankings' },
      { name: 'Manage Job', icon: <FiBriefcase />, href: '/dashboard/hiring' },
      { name: 'My Coins', icon: <FiDollarSign />, href: '/dashboard/wallet' },
      { name: 'Daily Quests', icon: <FiGift />, href: '/dashboard/quests' }
    ];
  } else {
    menuItems = [
      { name: 'Client Overview', icon: <FiHome />, href: '/dashboard' },
      { name: 'Manage Job', icon: <FiBriefcase />, href: '/dashboard/hiring' },
      { name: 'My Wallet', icon: <FiDollarSign />, href: '/dashboard/wallet' },
      { name: 'Support / Help', icon: <FiMessageCircle />, href: '/messenger' },
      { name: 'Daily Quests', icon: <FiGift />, href: '/dashboard/quests' }
    ];
  }

  const isActive = (href) => location.pathname === href;

  return (
    <aside style={{
      width: '320px',
      maxWidth: 'calc(100vw - 24px)',
      background: '#050505',
      height: '100dvh',
      maxHeight: '100dvh',
      position: 'fixed',
      left: 0,
      top: 0,
      borderRight: '1px solid rgba(255,255,255,0.03)',
      padding: '50px 30px',
      zIndex: isNavbarOpen ? 1 : 1000,
      opacity: isNavbarOpen ? 0 : 1,
      pointerEvents: isNavbarOpen ? 'none' : 'auto',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
      overflow: 'hidden',
      transform: show ? 'translateX(0)' : 'translateX(-100%)',
      transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s, z-index 0.3s',
      backgroundColor: '#000'
    }} className="dashboard-sidebar">

      {/* Mobile Close Button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: '20px', right: '20px',
          width: '44px', height: '44px', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '12px', color: '#fff', fontSize: '1.5rem',
          cursor: 'pointer', display: 'none'
        }}
        className="sidebar-mobile-close"
      >
        ✕
      </button>
      <div style={{ marginBottom: '60px' }}>
        <Link to="/" style={{
          color: '#333',
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.75rem',
          fontWeight: '700',
          letterSpacing: '2px',
          marginBottom: '30px'
        }}>
          <FiArrowLeft /> Return to Home
        </Link>
        <h1 style={{
          fontSize: '1.8rem',
          fontWeight: '700',
          color: '#fff',
          letterSpacing: '-1px',
          lineHeight: 1
        }}>
          {isAdmin ? 'ADMIN' : (isFreelancer ? 'WORKSPACE' : 'MY')} <br />
          <span style={{ color: 'var(--accent)', filter: 'drop-shadow(0 0 10px var(--accent-glow))' }}>
            {isAdmin ? 'CONTROL' : (isFreelancer ? 'CENTER' : 'DASHBOARD')}
          </span>
        </h1>
      </div>

      {/* 👤 User Identity (Clickable) */}
      <div style={{ marginBottom: '40px' }}>
        <Link 
          to={`/profile/${userInfo?._id || userInfo?.id}`} 
          style={{ 
            display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', 
            background: 'rgba(255,255,255,0.02)', borderRadius: '20px', textDecoration: 'none',
            border: '1px solid rgba(255,255,255,0.03)'
          }}
          onClick={() => { if (window.innerWidth < 1024) onClose(); }}
        >
          <div style={{ 
            width: '45px', height: '45px', borderRadius: '12px', overflow: 'hidden', 
            border: '2px solid var(--accent)', flexShrink: 0 
          }}>
            <img 
              src={userInfo?.profileImage?.url ? (userInfo.profileImage.url.startsWith('http') ? userInfo.profileImage.url : `https://storage.googleapis.com/pattayapal-storage/${userInfo.profileImage.url}`) : 'https://via.placeholder.com/100'} 
              alt="" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ color: '#fff', fontWeight: '700', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userInfo?.name}</div>
            <div style={{ color: 'var(--accent)', fontSize: '0.6rem', fontWeight: '800', textTransform: 'uppercase' }}>{userInfo?.role}</div>
          </div>
        </Link>
      </div>

      <nav style={{ flex: 1, overflowY: 'auto', overscrollBehavior: 'contain', paddingRight: '15px' }} className="sidebar-nav-scroll">
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {menuItems.map((item) => (
            <li key={item.name} style={{ marginBottom: '10px' }}>
              <Link
                to={item.href}
                onClick={() => { if (window.innerWidth < 1024) onClose(); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                  padding: '16px 20px',
                  minHeight: '48px',
                  borderRadius: '20px',
                  color: isActive(item.href) ? '#fff' : '#444',
                  textDecoration: 'none',
                  fontSize: '0.95rem',
                  fontWeight: '700',
                  background: isActive(item.href) ? 'rgba(255, 87, 51, 0.05)' : 'transparent',
                  border: `1px solid ${isActive(item.href) ? 'rgba(255, 87, 51, 0.1)' : 'transparent'}`,
                  transition: '0.3s'
                }}
              >
                <span style={{ fontSize: '1.2rem', color: isActive(item.href) ? 'var(--accent)' : 'inherit' }}>{item.icon}</span>
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>


      <style>{`
        @media (max-width: 1024px) {
          .dashboard-sidebar {
            width: min(320px, calc(100vw - 24px)) !important;
            padding: calc(42px + env(safe-area-inset-top, 0px)) 18px calc(22px + env(safe-area-inset-bottom, 0px)) !important;
            z-index: 1002 !important;
          }
          .sidebar-mobile-close { display: inline-flex !important; }
        }

        @media (max-width: 380px) {
          .dashboard-sidebar {
            width: min(300px, calc(100vw - 16px)) !important;
            padding-left: 14px !important;
            padding-right: 14px !important;
          }
        }

        @media (max-height: 620px) and (max-width: 1024px) {
          .dashboard-sidebar {
            padding-top: calc(22px + env(safe-area-inset-top, 0px)) !important;
          }

          .dashboard-sidebar > div:first-of-type {
            margin-bottom: 24px !important;
          }
        }
        @media (min-width: 1025px) {
          .dashboard-sidebar { transform: none !important; }
        }
        .sidebar-nav-scroll::-webkit-scrollbar { width: 4px; }
        .sidebar-nav-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </aside>
  );
}

export default DashboardSidebar;
