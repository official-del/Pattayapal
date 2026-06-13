import { Outlet, Navigate, useLocation, Link } from 'react-router-dom';
import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import DashboardSidebar from './DashboardSidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMenu, FiChevronRight } from 'react-icons/fi';
import { CONFIG } from '../utils/config';

function DashboardLayout() {
  const { user, token } = useContext(AuthContext);
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const currentToken = token || window.safeStorage.getItem('userToken');
  const userInfo = user || JSON.parse(window.safeStorage.getItem('userInfo') || '{}');

  // 🛡️ Access Control
  if (!currentToken || !userInfo?.role) return <Navigate to="/login" />;

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/admin/dashboard')) return 'System Overview';
    if (path.includes('/admin/overview')) return 'Platform Analytics';
    if (path.includes('/dashboard/wallet')) return 'Financial Hub';
    if (path.includes('/dashboard/hiring')) return 'Job Management';
    if (path === '/rankings') return 'Rankings Hub';
    if (path.includes('/rankings/roles')) return 'Role Leaderboards';
    if (path === '/dashboard') return 'User Workspace';
    return 'Dashboard';
  };

  return (
    <div className="dashboard-layout-shell" style={{ background: '#000', minHeight: '100dvh', display: 'flex' }}>

      {/* 📱 Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
              backdropFilter: 'blur(5px)', zIndex: 999
            }}
          />
        )}
      </AnimatePresence>

      <DashboardSidebar show={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main style={{
        flex: 1,
        minHeight: '100dvh',
        overflowY: 'auto',
        overflowX: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column'
      }} className="dashboard-main-area">

        {/* 🏛️ Dashboard Content Stage */}

        {/* ⚡ Content Stage */}
        <div className="dashboard-content-stage" style={{ flex: 1 }}>
          <div className="dashboard-content-inner" style={{ maxWidth: '1440px', margin: '0 auto' }}>
            <button
              type="button"
              className="dashboard-mobile-menu-btn"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open workspace menu"
            >
              <FiMenu />
              <span>Workspace menu</span>
            </button>

            {/* 💎 Minimalist Section Indicator */}
            <div className="dashboard-crumb" style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '12px' }}>
               <div style={{ width: '4px', height: '20px', background: 'var(--accent)', borderRadius: '2px', boxShadow: '0 0 10px var(--accent-glow)' }} />
               <span style={{ color: '#333', fontSize: '0.75rem', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase' }}>
                 Workspace <FiChevronRight size={10} style={{ margin: '0 5px' }} /> 
                 <span style={{ color: 'var(--accent)' }}>{getPageTitle()}</span>
               </span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                className="dashboard-route-motion"
                key={location.pathname}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      <style>{`
        .dashboard-layout-shell {
          width: 100%;
          min-width: 0;
          overflow: visible;
        }

        .dashboard-main-area {
          margin-left: 320px;
          min-width: 0;
          width: 100%;
        }

        .dashboard-content-stage {
          width: 100%;
          min-width: 0;
          padding: 84px 40px 40px;
        }

        .dashboard-content-inner,
        .dashboard-route-motion {
          width: 100%;
          min-width: 0;
        }

        .dashboard-mobile-menu-btn {
          display: none;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 44px;
          margin: 0 0 18px;
          padding: 0 14px;
          border: 1px solid rgba(255, 87, 51, 0.42);
          border-radius: var(--pixel-radius, 8px);
          background: rgba(255, 87, 51, 0.12);
          color: #fff;
          box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.72);
          font-family: var(--font-main);
          font-size: var(--text-sm, 0.875rem);
          font-weight: 900;
          cursor: pointer;
        }

        .dashboard-mobile-menu-btn svg {
          width: 18px;
          height: 18px;
          color: var(--accent);
        }
        
        @keyframes headerGlow {
          from { background: rgba(0,0,0,0.7); }
          to { background: rgba(0,0,0,0.85); shadow: 0 10px 30px rgba(0,0,0,0.5); }
        }

        @media (max-width: 1200px) {
          .dashboard-main-area { margin-left: 280px; }
        }

        @media (max-width: 1024px) {
          .dashboard-main-area { margin-left: 0 !important; }
          .dashboard-content-stage {
            padding: 18px 20px calc(34px + env(safe-area-inset-bottom, 0px)) !important;
          }
          .dashboard-mobile-menu-btn { display: inline-flex; }
          header { padding: 15px 20px !important; }
        }

        @media (max-width: 640px) {
          .dashboard-crumb {
            margin-bottom: 22px !important;
            align-items: flex-start !important;
          }

          .dashboard-crumb span {
            max-width: 100%;
            letter-spacing: 1.4px !important;
            line-height: 1.45;
            overflow-wrap: anywhere;
          }
        }

        @media (max-width: 420px) {
          .dashboard-content-stage { padding: 14px 10px 28px !important; }
          .dashboard-mobile-menu-btn {
            width: 100%;
            margin-bottom: 14px;
          }
        }

        @media (max-width: 420px) and (max-height: 700px) {
          .dashboard-content-stage {
            padding-top: 10px !important;
          }
        }
      `}</style>
    </div>
  );
}

export default DashboardLayout;
