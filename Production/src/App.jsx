import { lazy, Suspense, useState, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/Navbar';
import PremiumLoader from './components/PremiumLoader';
import { play8BitClick } from './utils/soundEffects';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import {
  requiresAuth,
  getLoginPath,
  shouldShowNavbar,
} from './routes/paths';

const PixelSplashIntro = lazy(() => import('./components/PixelSplashIntro'));


// ── Public Pages ──
import Home from './pages/Home';
import Services from './pages/Services';
import Discovery from './pages/Discovery';

import Works from './pages/Works';
import WorkDetail from './pages/WorkDetail';

// ── Community Posts ──
import PostDetail from './pages/PostDetail';

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
import Quests from './pages/Dashboard/Quests';


// ── Auth Pages ──
import UserAuth from './pages/UserAuth';
import VerifyEmail from './pages/VerifyEmail';

// ── Legal Pages ──
import Terms from './pages/Legal/Terms';
import Privacy from './pages/Legal/Privacy';

// ── Admin Pages ──
import AdminLogin from './pages/Admin/AdminLogin';
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminOverview from './pages/Admin/AdminOverview';
import AdminWithdrawals from './pages/Admin/AdminWithdrawals';

function App() {
  const location = useLocation();
  const navigate = useNavigate();

  // ── Global Premium Resource Loading ──
  const [globalLoading, setGlobalLoading] = useState(true);
  const [loadingText, setLoadingText] = useState('INITIALIZING SYSTEMS');
  const [loadingSubtext, setLoadingSubtext] = useState('Syncing assets and interfaces...');

  // Track initial resource load
  useEffect(() => {
    let active = true;
    const startTime = Date.now();
    
    const checkResources = () => {
      if (!active) return;
      
      const images = Array.from(document.images);
      const allImagesLoaded = images.every(img => img.complete || img.naturalWidth > 0);
      const timeElapsed = Date.now() - startTime;
      const minDuration = 800;
      
      if (document.readyState === 'complete' && allImagesLoaded && timeElapsed >= minDuration) {
        setGlobalLoading(false);
      } else {
        if (timeElapsed > 900) {
          setLoadingText('OPTIMIZING DISPLAY');
          setLoadingSubtext('Rendering creator modules...');
        } else if (timeElapsed > 400) {
          setLoadingText('PREPARING MULTIMEDIA');
          setLoadingSubtext('Loading covers and interface assets...');
        }
        
        if (timeElapsed >= 2500) {
          setGlobalLoading(false);
        } else {
          requestAnimationFrame(checkResources);
        }
      }
    };

    if (document.readyState === 'complete') {
      checkResources();
    } else {
      window.addEventListener('load', checkResources);
    }

    return () => {
      active = false;
      window.removeEventListener('load', checkResources);
    };
  }, []);

  const isAdminPage = location.pathname.startsWith('/admin');

  let hasToken = false;
  try {
    hasToken = window.safeStorage.getItem('userToken') || window.safeStorage.getItem('token');
  } catch (e) {
    console.warn('Storage access denied');
  }

  // เฉพาะหน้าที่ต้องล็อกอินเท่านั้น — หน้าอื่นเปิดได้เลย
  useEffect(() => {
    if (hasToken || !requiresAuth(location.pathname)) return;
    navigate(getLoginPath(location.pathname), { replace: true });
  }, [hasToken, location.pathname, navigate]);

  const [showSplash, setShowSplash] = useState(() => {
     // ⚖️ ไม่แสดงเกมในหน้ากฎหมาย (Terms / Privacy)
     const path = window.location.pathname;
     if (path === '/terms' || path === '/privacy') return false;

     // ข้ามเกมทันทีถ้าล็อกอินแล้ว
     let tokenExists = false;
     try {
       tokenExists = window.safeStorage.getItem('userToken') || window.safeStorage.getItem('token');
     } catch (e) {}
     if (tokenExists) return false;
     
     // ข้ามเกมถ้าเคยเล่นไปแล้วใน session นี้ (เปิดเว็บหน้าแรกครั้งเดียวพอ)
     let hasSeen = false;
     try {
       hasSeen = window.safeSessionStorage.getItem('hasSeenSplash');
     } catch (e) {}
     if (hasSeen) return false;
     
     return true;
  });

  const handleSplashComplete = () => {
    try {
      window.safeSessionStorage.setItem('hasSeenSplash', 'true');
    } catch (e) {}
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
      try {
        window.safeSessionStorage.setItem('hasSeenSplash', 'true');
      } catch (e) {}
      const frame = requestAnimationFrame(() => setShowSplash(false));
      return () => cancelAnimationFrame(frame);
    }
  }, [isLegalPage]);

  return (
    <SocketProvider>
        <Toaster 
          position="top-center"
          toastOptions={{
            style: {
              background: '#111',
              color: '#fff',
              border: '1px solid #333',
              padding: '16px',
              borderRadius: '12px',
              fontWeight: '600',
              boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
            },
            success: {
              style: {
                background: '#0a0a0a',
                border: '1px solid rgba(245,158,11,0.3)',
                color: '#f59e0b',
              },
              iconTheme: { primary: '#f59e0b', secondary: '#0a0a0a' },
            },
            error: {
              style: {
                background: '#0a0a0a',
                border: '1px solid rgba(239,68,68,0.3)',
                color: '#ef4444',
              },
              iconTheme: { primary: '#ef4444', secondary: '#0a0a0a' },
            },
          }}
        />
        <AnimatePresence>
          {showSplash && !isLegalPage && (
            <Suspense fallback={null}>
              <PixelSplashIntro onComplete={handleSplashComplete} />
            </Suspense>
          )}
        </AnimatePresence>
  
        <AnimatePresence>
          {globalLoading && !showSplash && (
            <PremiumLoader text={loadingText} subtext={loadingSubtext} />
          )}
        </AnimatePresence>
  
  
  
        {!isAdminPage && shouldShowNavbar(location.pathname, hasToken) && <Navbar />}
  
        <Routes>
  
          <Route path="/jobs" element={
            <div className="route-page-shell" style={{ background: '#000', minHeight: '100vh', paddingTop: '20px', paddingBottom: '100px' }}>
              <div className="route-page-frame route-page-frame-compact" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
                <ManageJobs />
              </div>
            </div>
          } />
          <Route path="/manage-portfolio" element={
            <div className="route-page-shell" style={{ background: '#000', minHeight: '100vh', paddingTop: '20px', paddingBottom: '100px' }}>
              <div className="route-page-frame route-page-frame-compact" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
                <ManageWorks />
              </div>
            </div>
          } />
          {/* ── Public Routes ── */}
          <Route path="/"           element={<Home />} />
          <Route path="/services"   element={<Services />} />
          <Route path="/works"      element={<Works />} />
          <Route path="/works/:id"  element={<WorkDetail />} />
          <Route path="/posts/:id"  element={<PostDetail />} />
          <Route path="/leaderboard" element={<Navigate to="/rankings" replace />} />
          <Route path="/rankings/roles" element={<RoleRankings />} />
          <Route path="/discovery" element={<Navigate to="/freelancers" replace />} />
          <Route path="/freelancers" element={<Discovery />} />
  
          {/* ── Profile ── */}
          <Route path="/profile/:userId" element={<UserProfile />} />
          <Route path="/notifications" element={
            <div className="route-page-shell" style={{ background: '#000', minHeight: '100vh', paddingTop: '20px', paddingBottom: '100px' }}>
              <div className="route-page-frame" style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 20px' }}>
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
            <Route path="quests" element={<Quests />} />
          </Route>
          <Route element={<DashboardLayout />}>
            <Route path="/rankings" element={<RankingsHub />} />
          </Route>
  
          {/* ── Login / Register ── */}
          <Route path="/login"      element={<UserAuth />} />
          <Route path="/auth"       element={<Navigate to="/login" replace />} />
          <Route path="/verify-email/:token" element={<VerifyEmail />} />
  
          {/* ── Admin Routes ── */}
          <Route path="/admin/login"       element={<AdminLogin />} />
          <Route path="/admin/dashboard"   element={<AdminDashboard />} />
          <Route path="/admin/overview"    element={<AdminOverview />} /> 
          <Route path="/admin/works/new"   element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/works/:id"   element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/withdrawals" element={<AdminWithdrawals />} />
          
          {/* ── Legal Routes ── */}
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          
          {/* ── Vanity URL Catch-All ── */}
          <Route path="/:username" element={<UserProfile />} />
        </Routes>
    </SocketProvider>
  );
}

export default App;
