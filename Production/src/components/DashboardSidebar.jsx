import { Link, useLocation } from 'react-router-dom';
import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiHome, FiGrid, FiPackage, FiBriefcase, FiUser, FiArrowLeft, FiMessageCircle, FiSettings, FiZap, FiDollarSign, FiActivity, FiGlobe, FiBell, FiSearch
} from 'react-icons/fi';

function DashboardSidebar({ show, onClose }) {
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const localUserInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
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
      { name: 'Global Workspace', icon: <FiGlobe />, href: '/feed' },
      { name: 'Rankings & Hall of Fame', icon: <FiZap />, href: '/rankings' },
      { name: 'Withdrawal Requests', icon: <FiArrowLeft style={{ transform: 'rotate(-45deg)' }} />, href: '/admin/withdrawals' },
      { name: 'Account Settings', icon: <FiSettings />, href: '/dashboard/account' },
    ];
  } else if (isFreelancer) {
    menuItems = [
      { name: 'Creator Overview', icon: <FiHome />, href: '/dashboard' },
      { name: 'Creator Leaderboards', icon: <FiZap />, href: '/rankings' },
      { name: 'Manage Job', icon: <FiBriefcase />, href: '/dashboard/hiring' },
      { name: 'My Coins', icon: <FiDollarSign />, href: '/dashboard/wallet' },
      { name: 'Account Settings', icon: <FiSettings />, href: '/dashboard/account' },
    ];
  } else {
    menuItems = [
      { name: 'Client Overview', icon: <FiHome />, href: '/dashboard' },
      { name: 'Manage Job', icon: <FiBriefcase />, href: '/dashboard/hiring' },
      { name: 'My Wallet', icon: <FiDollarSign />, href: '/dashboard/wallet' },
      { name: 'Support / Help', icon: <FiMessageCircle />, href: '/messenger' },
      { name: 'Account Settings', icon: <FiSettings />, href: '/dashboard/account' },
    ];
  }

  const isActive = (href) => location.pathname === href;

  return (
    <aside style={{
      width: '320px',
      background: '#050505',
      height: '100vh',
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
      transform: show ? 'translateX(0)' : 'translateX(-100%)',
      transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s, z-index 0.3s',
      backgroundColor: '#000'
    }} className="dashboard-sidebar">

      {/* Mobile Close Button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: '20px', right: '20px',
          background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem',
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

      <div className="glass" style={{
        padding: '30px',
        borderRadius: '30px',
        border: '1px solid rgba(255,255,255,0.03)',
        marginTop: 'auto'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiActivity color="#22c55e" size={14} />
            <span style={{ color: '#22c55e', fontSize: '0.65rem', fontWeight: '700' }}>CONNECTED</span>
          </div>
        </div>
        <Link to="/dashboard/wallet" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ color: '#f59e0b', fontSize: '1.4rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiDollarSign />
            {(userInfo?.coinBalance || localUserInfo?.coinBalance || 0).toLocaleString()}
          </div>
          <span style={{ fontSize: '0.6rem', color: '#444', fontWeight: '700', letterSpacing: '1px' }}>COINS</span>
        </Link>
      </div>
      <style>{`
        @media (max-width: 1024px) {
          .sidebar-mobile-close { display: block !important; }
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
