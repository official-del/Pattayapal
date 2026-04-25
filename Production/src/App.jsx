import { useState, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/Navbar';
import PixelSplashIntro from './components/PixelSplashIntro';
import { play8BitClick } from './utils/soundEffects';
import { AnimatePresence } from 'framer-motion';


// ── Public Pages ──
import Home from './pages/Home';
import Services from './pages/Services';
import Discovery from './pages/Discovery';

import Works from './pages/Works';
import WorkDetail from './pages/WorkDetail';
import Clients from './pages/Clients';
import Contact from './pages/Contact';

// ── Feed / Community ──
import Feed from './pages/Feed';

// ── Profile Page ──
import UserProfile from './pages/UserProfile';
import Friends from './pages/Friends';
import Messenger from './pages/Messenger';
import UserWorkForm from './pages/UserWorkForm';
import RankingsHub from './pages/RankingsHub';
import RoleRankings from './pages/RoleRankings';

// ── Dashboard / Workspace ──
import DashboardLayout from './components/DashboardLayout';
import DashboardOverview from './pages/Dashboard/DashboardOverview';
import ManageWorks from './pages/Dashboard/ManageWorks';
import ManageJobs from './pages/Dashboard/ManageJobs';
import ManageWallet from './pages/Dashboard/ManageWallet';
import Notifications from './pages/Dashboard/Notifications';


// ── Auth Pages ──
import UserAuth from './pages/UserAuth';

// ── Legal Pages ──
import Terms from './pages/Legal/Terms';
import Privacy from './pages/Legal/Privacy';

// ── Admin Pages ──
import AdminLogin from './pages/Admin/AdminLogin';
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminOverview from './pages/Admin/AdminOverview';
import AdminWorkForm from './pages/Admin/AdminWorkForm';
import AdminWithdrawals from './pages/Admin/AdminWithdrawals';

function App() {
  const location = useLocation();
  
  // 🔍 ตรวจสอบว่าตอนนี้อยู่ในหน้า Admin หรือไม่
  const isAdminPage = location.pathname.startsWith('/admin');

  const [showSplash, setShowSplash] = useState(() => {
     // ⚖️ ไม่แสดงเกมในหน้ากฎหมาย (Terms / Privacy)
     const path = window.location.pathname;
     if (path === '/terms' || path === '/privacy') return false;

     // ข้ามเกมทันทีถ้าล็อกอินแล้ว
     const hasToken = localStorage.getItem('userToken') || localStorage.getItem('token');
     if (hasToken) return false;
     
     // ข้ามเกมถ้าเคยเล่นไปแล้วใน session นี้ (เปิดเว็บหน้าแรกครั้งเดียวพอ)
     const hasSeen = sessionStorage.getItem('hasSeenSplash');
     if (hasSeen) return false;
     
     return true;
  });

  const handleSplashComplete = () => {
    sessionStorage.setItem('hasSeenSplash', 'true');
    setShowSplash(false);
  };

  useEffect(() => {
    const handleGlobalClick = (e) => {
      // Play sound if clicked element is a button, link, or explicitly pointer cursor
      const isInteractive = e.target.closest('button') || e.target.closest('a') || e.target.closest('.interactive') || (e.target && window.getComputedStyle(e.target).cursor === 'pointer');
      if (isInteractive) {
        play8BitClick();
      }
    };
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  // ⚖️ ตรวจสอบว่าเป็นหน้ากฎหมายหรือไม่ (สำหรับการซ่อน Splash ขณะเปลี่ยน Route)
  const isLegalPage = ['/terms', '/privacy'].includes(location.pathname);

  // ⚖️ ถ้าเข้าหน้ากฎหมาย ให้ถือว่าข้ามการแสดง Splash ไปเลย เพื่อไม่ให้มันเด้งขึ้นมาตอนกดย้อนกลับ
  useEffect(() => {
    if (isLegalPage) {
      sessionStorage.setItem('hasSeenSplash', 'true');
      setShowSplash(false);
    }
  }, [isLegalPage]);

  return (
    <AuthProvider> 
      <SocketProvider>
      <AnimatePresence>
        {showSplash && !isLegalPage && <PixelSplashIntro onComplete={handleSplashComplete} />}
      </AnimatePresence>



      {/* ✅ ถ้าเป็นหน้าแอดมิน จะซ่อน Sidebar อันนี้ทิ้งไปเลย */}
      {!isAdminPage && <Navbar />}

      <Routes>

        <Route path="/jobs" element={
          <div style={{ background: '#000', minHeight: '100vh', paddingTop: '100px', paddingBottom: '100px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
              <ManageJobs />
            </div>
          </div>
        } />
        <Route path="/manage-portfolio" element={
          <div style={{ background: '#000', minHeight: '100vh', paddingTop: '100px', paddingBottom: '100px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
              <ManageWorks />
            </div>
          </div>
        } />
        {/* ── Public Routes ── */}
        <Route path="/"           element={<Home />} />
        <Route path="/services"   element={<Services />} />
        <Route path="/works"      element={<Works />} />
        <Route path="/works/:id"  element={<WorkDetail />} />
        <Route path="/clients"    element={<Clients />} />
        <Route path="/contact"    element={<Contact />} />
        <Route path="/feed"       element={<Feed />} />
        <Route path="/rankings"   element={<RankingsHub />} />
        <Route path="/rankings/roles" element={<RoleRankings />} />
        <Route path="/leaderboard" element={<Navigate to="/rankings" replace />} />
        <Route path="/freelancers" element={<Discovery />} />

        {/* ── Profile ── */}
        <Route path="/profile/:userId" element={<UserProfile />} />
        <Route path="/notifications" element={
          <div style={{ background: '#000', minHeight: '100vh', paddingTop: '100px', paddingBottom: '100px' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 20px' }}>
              <Notifications />
            </div>
          </div>
        } />
        <Route path="/friends" element={<Friends />} />
        <Route path="/messenger" element={<Messenger />} />
        <Route path="/messenger/:conversationId" element={<Messenger />} />
        <Route path="/upload-work" element={<UserWorkForm />} />
        <Route path="/edit-work/:id" element={<UserWorkForm />} />

        {/* ── Dashboard / Workspace Routes ── */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardOverview />} />
          <Route path="hiring" element={<ManageJobs />} />
          <Route path="works" element={<ManageWorks />} />
          <Route path="wallet" element={<ManageWallet />} />

          <Route path="account" element={<UserProfile />} /> {/* Reuse Profile as settings for now */}
        </Route>

        {/* ── Login / Register ── */}
        <Route path="/login"      element={<UserAuth />} />

        {/* ── Admin Routes ── */}
        <Route path="/admin/login"       element={<AdminLogin />} />
        <Route path="/admin/dashboard"   element={<AdminDashboard />} />
        <Route path="/admin/overview"    element={<AdminOverview />} /> 
        <Route path="/admin/works/new"   element={<AdminWorkForm />} />
        <Route path="/admin/works/:id"   element={<AdminWorkForm />} />
        <Route path="/admin/withdrawals" element={<AdminWithdrawals />} />
        
        {/* ── Legal Routes ── */}
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
      </Routes>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;