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

  const currentToken = token || localStorage.getItem('userToken');
  const userInfo = user || JSON.parse(localStorage.getItem('userInfo') || '{}');

  // 🛡️ Access Control
  if (!currentToken || !userInfo?.role) return <Navigate to="/login" />;

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/admin/dashboard')) return 'System Overview';
    if (path.includes('/admin/overview')) return 'Platform Analytics';
    if (path.includes('/dashboard/wallet')) return 'Financial Hub';
    if (path.includes('/dashboard/hiring')) return 'Job Management';
    if (path === '/dashboard') return 'User Workspace';
    return 'Dashboard';
  };

  return (
    <div style={{ background: '#000', minHeight: '100vh', display: 'flex', overflow: 'hidden' }}>

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
        height: '100vh',
        overflowY: 'auto',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column'
      }} className="dashboard-main-area">

        {/* 🏛️ Dashboard Content Stage */}

        {/* ⚡ Content Stage */}
        <div className="dashboard-content-stage" style={{ padding: '50px 40px', flex: 1 }}>
          <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
            <AnimatePresence mode="wait">
              <motion.div
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
        .dashboard-main-area { margin-left: 320px; }
        
        @keyframes headerGlow {
          from { background: rgba(0,0,0,0.7); }
          to { background: rgba(0,0,0,0.85); shadow: 0 10px 30px rgba(0,0,0,0.5); }
        }

        @media (max-width: 1200px) {
          .dashboard-main-area { margin-left: 280px; }
        }

        @media (max-width: 1024px) {
          .dashboard-main-area { margin-left: 0 !important; }
          .dashboard-content-stage { padding: 30px 20px !important; }
          header { padding: 15px 20px !important; }
        }
      `}</style>
    </div>
  );
}

export default DashboardLayout;
