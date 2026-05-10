import { customConfirm } from '../../utils/customConfirm';
import { toast } from 'react-hot-toast';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { worksAPI, categoriesAPI, usersAPI, walletAPI } from '../../utils/api';
import axios from 'axios';
import { CONFIG } from '../../utils/config';
import { 
  FiFolder, FiSettings, FiGrid, FiBarChart2, FiPlus, FiArrowRight, FiArrowLeft, 
  FiTrash2, FiEdit3, FiEye, FiVideo, FiImage, FiMoreHorizontal, FiLogOut, FiHome, FiCheckCircle,
  FiUsers, FiActivity, FiDollarSign, FiAward, FiInfo, FiUploadCloud, FiSearch, FiChevronDown
} from 'react-icons/fi';
import { HiOutlineSparkles, HiOutlineCube } from 'react-icons/hi';
import { RiDashboardLine, RiUserStarLine } from 'react-icons/ri';
import { motion, AnimatePresence } from 'framer-motion';
import '../../css/AdminDashboard.css';
import AdminOverview from './AdminOverview';

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [showChoice, setShowChoice] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userSort, setUserSort] = useState('views');

  // ── Works state ──
  const [works, setWorks] = useState([]);
  const [worksLoading, setWorksLoading] = useState(false);

  // ── Categories state ──
  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [catForm, setCatForm] = useState({ name: '', icon: '', description: '' });
  const [catSaving, setCatSaving] = useState(false);
  
   // ── Broadcast state ──
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastLink, setBroadcastLink] = useState('');
  const [broadcastLoading, setBroadcastLoading] = useState(false);

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastText.trim()) return toast.error('Please enter message text');
    setBroadcastLoading(true);
    try {
      const res = await axios.post(`${CONFIG.API_BASE_URL}/api/users/admin/broadcast`, { text: broadcastText, link: broadcastLink }, { headers: { Authorization: `Bearer ${activeToken}` } });
      toast.success(res.data.message || 'Broadcast sent successfully');
      setBroadcastText('');
      setBroadcastLink('');
    } catch (e) { console.error(e); toast.error('Broadcast failed'); }
    finally { setBroadcastLoading(false); }
  };
   // ── Top-up state ──
  const [topups, setTopups] = useState([]);
  const [topupsLoading, setTopupsLoading] = useState(false);
  const [topupFilter, setTopupFilter] = useState('pending'); // 'pending', 'all'

  // ── Coin & Gas Adjustment state ──
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustingUser, setAdjustingUser] = useState(null);
  const [adjustType, setAdjustType] = useState('coins'); // 'coins' | 'gas'
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustLoading, setAdjustLoading] = useState(false);

  // Get token from localStorage (no need for Context)
  const activeToken = window.safeStorage.getItem('token') || window.safeStorage.getItem('userToken');
  useEffect(() => {
    // Initial Auth Check
    const rawUserInfo = window.safeStorage.getItem('userInfo');
    if (!activeToken || !rawUserInfo) {
      navigate('/login');
      return;
    }

    try {
      const userInfo = JSON.parse(rawUserInfo);
      if (userInfo?.role?.toLowerCase() !== 'admin') {
        toast.error("This page is for admins only");
        navigate('/login');
        return;
      }
      
      // Lazy Load data based on tab
      if (activeTab === 'overview') {
        // Stats are in AdminOverview
      } else if (activeTab === 'works') {
        fetchWorks();
      } else if (activeTab === 'users') {
        fetchAllUsers();
      } else if (activeTab === 'topups') {
        fetchTopups();
      } else if (activeTab === 'categories') {
        fetchCategories();
      }

    } catch (error) {
      navigate('/login');
    }
  }, [activeTab]); 

  const fetchAllUsers = async () => {
    setUsersLoading(true);
    try {
      const data = await usersAPI.getAllUsersAdmin(activeToken);
      setAllUsers(data || []);
    } catch (e) { console.error(e); }
    finally { setUsersLoading(false); }
  };

  const fetchWorks = async () => {
    setWorksLoading(true);
    try {
      const res = await worksAPI.getAll();
      setWorks(res.works || []);
    } catch (e) { console.error(e); }
    finally { setWorksLoading(false); }
  };

  const handleDeleteWork = async (work) => {
    if (!await customConfirm(`Delete project "${work.title}" permanently?`)) return;
    try {
      await worksAPI.delete(work._id, activeToken);
      setWorks(prev => prev.filter(w => w._id !== work._id));
    } catch (error) {
      console.error(error);
    }
  };

  const handleToggleSlider = async (work) => {
    try {
      const updatedStatus = !work.showOnSlider;
      const formData = new FormData();
      formData.append('showOnSlider', updatedStatus);
      await worksAPI.update(work._id, formData, activeToken);
      setWorks(prev => prev.map(w => w._id === work._id ? { ...w, showOnSlider: updatedStatus } : w));
    } catch (e) { console.error(e); }
  };

  const fetchCategories = async () => {
    setCatLoading(true);
    try {
      const res = await categoriesAPI.getAll();
      setCategories(res || []);
    } catch (e) { console.error(e); }
    finally { setCatLoading(false); }
  };

  const openCatModal = (cat = null) => {
    setEditingCat(cat);
    setCatForm(cat ? { name: cat.name, icon: cat.icon, description: cat.description } : { name: '', icon: '', description: '' });
    setShowCatModal(true);
  };

  const closeCatModal = () => { setShowCatModal(false); setEditingCat(null); };

  const handleSaveCat = async (e) => {
    e.preventDefault();
    setCatSaving(true);
    try {
      if (editingCat) {
        await categoriesAPI.update(editingCat._id, catForm, activeToken);
      } else {
        await categoriesAPI.create(catForm, activeToken);
      }
      fetchCategories();
      closeCatModal();
    } catch (e) { console.error(e); }
    finally { setCatSaving(false); }
  };

  const handleDeleteCat = async (id) => {
    if (!await customConfirm('Delete category?')) return;
    await categoriesAPI.delete(id, activeToken);
    fetchCategories();
  };

  const handleAdjustBalance = async (e) => {
    e.preventDefault();
    setAdjustLoading(true);
    try {
      if (adjustType === 'coins') {
        await walletAPI.adminAdjustBalance({
          userId: adjustingUser._id,
          amount: parseFloat(adjustAmount),
          reason: adjustReason
        });
      } else {
        await walletAPI.adminAdjustGas({
          userId: adjustingUser._id,
          amount: parseFloat(adjustAmount),
          reason: adjustReason
        });
      }
      toast.success('Success!');
      setShowAdjustModal(false);
      fetchAllUsers();
    } catch (e) { console.error(e); }
    finally { setAdjustLoading(false); }
  };

  const fetchTopups = async () => {
    setTopupsLoading(true);
    try {
      const data = await walletAPI.getAdminTopups(activeToken);
      setTopups(data || []);
    } catch (e) { console.error(e); }
    finally { setTopupsLoading(false); }
  };

  const handleUpdateTopupStatus = async (id, status) => {
    try {
      await walletAPI.updateTopupStatus(id, status, activeToken);
      fetchTopups();
    } catch (e) { console.error(e); }
  };

  // ── MEMOIZED DATA ──
  const memoWorks = useMemo(() => {
    return Object.values(works.reduce((groups, work) => {
      const userId = work.createdBy?._id || 'unknown';
      if (!groups[userId]) groups[userId] = { user: work.createdBy || { name: 'Unknown' }, items: [] };
      groups[userId].items.push(work);
      return groups;
    }, {}));
  }, [works]);

  const memoUsers = useMemo(() => {
    let res = [...allUsers];
    if (userSearch) {
      const q = userSearch.toLowerCase();
      res = res.filter(u => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
    }
    return res.sort((a, b) => {
      if (userSort === 'views') return (b.totalViews || 0) - (a.totalViews || 0);
      if (userSort === 'coins') return (b.coinBalance || 0) - (a.coinBalance || 0);
      return 0;
    });
  }, [allUsers, userSearch, userSort]);

  const memoTopups = useMemo(() => {
    return topups.filter(t => topupFilter === 'all' ? true : t.status === 'pending');
  }, [topups, topupFilter]);

  return (
    <div className="admin-page-root" style={{ fontFamily: "'Inter', 'Prompt', sans-serif", background: '#050505', minHeight: '100vh', color: '#fff' }}>
      <main className="admin-main-viewport" style={{ width: '100%', maxWidth: '1440px', margin: '0 auto', padding: '30px 5%' }}>
        
        {/* TOP NAV */}
        <header style={{ 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          background: '#0a0a0a', 
          padding: '12px 25px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)',
          marginBottom: '50px', position: 'sticky', top: '20px', zIndex: 100
        }}>
          <div className="admin-tabs" style={{ display: 'flex', gap: '5px', overflowX: 'auto', paddingBottom: '2px' }}>
            {['overview', 'works', 'categories', 'users', 'topups', 'broadcast'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{ 
                  background: activeTab === tab ? '#ff5733' : 'transparent',
                  color: activeTab === tab ? '#fff' : 'rgba(255,255,255,0.4)',
                  border: 'none', padding: '10px 22px', borderRadius: '12px', 
                  fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.3s ease',
                  textTransform: 'uppercase', letterSpacing: '1px', whiteSpace: 'nowrap'
                }}
              >
                {tab}
              </button>
            ))}
            <button onClick={() => navigate('/admin/withdrawals')} style={{ background: 'transparent', color: '#ff5733', border: 'none', padding: '10px 22px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px' }}>PAYOUTS</button>
          </div>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
             <Link to="/" style={{ color: '#fff', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '1px' }}>PREVIEW</Link>
             <button onClick={() => { window.safeStorage.clear(); window.location.href='/'; }} style={{ background: 'none', border: 'none', color: '#ff4444', fontWeight: 800, cursor: 'pointer', fontSize: '0.75rem', letterSpacing: '1px' }}>LOGOUT</button>
          </div>
        </header>

        {/* CONTENT SECTION */}
        <section style={{ willChange: 'transform' }}>
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && <motion.div key="ov" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}><AdminOverview /></motion.div>}

            {activeTab === 'users' && (
              <motion.div key="us" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {/* Stat Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '50px' }}>
                  <div style={{ background: '#0a0a0a', padding: '30px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '1px', marginBottom: '25px', textTransform: 'uppercase' }}>TOTAL USERS</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>{allUsers.length}</div>
                  </div>
                  <div style={{ background: '#0a0a0a', padding: '30px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '1px', marginBottom: '25px', textTransform: 'uppercase' }}>ONLINE NOW</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#22c55e', lineHeight: 1 }}>{allUsers.filter(u => u.isOnline).length}</div>
                  </div>
                  <div style={{ background: '#0a0a0a', padding: '30px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '1px', marginBottom: '25px', textTransform: 'uppercase' }}>TOTAL COINS</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#f59e0b', lineHeight: 1 }}>{allUsers.reduce((acc, u) => acc + (u.coinBalance || 0), 0).toLocaleString()}</div>
                  </div>
                  <div style={{ background: '#0a0a0a', padding: '30px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '1px', marginBottom: '25px', textTransform: 'uppercase' }}>AVG VIEWS</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#6ee7f7', lineHeight: 1 }}>{allUsers.length ? Math.round(allUsers.reduce((acc, u) => acc + (u.totalViews || 0), 0) / allUsers.length) : 0}</div>
                  </div>
                </div>

                {/* Header & Controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' }}>
                  <h2 style={{ fontSize: '2rem', fontWeight: 900, margin: 0, letterSpacing: '-1px' }}>User Intelligence</h2>
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type="text" placeholder="Search users..." 
                        value={userSearch} onChange={e => setUserSearch(e.target.value)}
                        style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.05)', padding: '12px 20px', borderRadius: '12px', color: '#fff', outline: 'none', fontSize: '0.85rem', width: '250px' }}
                      />
                    </div>
                    <select value={userSort} onChange={e => setUserSort(e.target.value)} style={{ background: '#0a0a0a', color: '#fff', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '0 20px', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}>
                      <option value="views">Sort by Views</option>
                      <option value="coins">Sort by Coins</option>
                    </select>
                  </div>
                </div>

                {/* Data Table */}
                <div className="admin-table-container" style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowX: 'auto' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 1fr 100px', padding: '0 25px 10px', color: '#555', fontSize: '0.65rem', fontWeight: 900, letterSpacing: '1px', minWidth: '900px' }}>
                    <span>USER</span>
                    <span>RANK</span>
                    <span>VIEWS</span>
                    <span>WORKS</span>
                    <span>COINS</span>
                    <span>EARNINGS</span>
                    <span style={{ textAlign: 'center' }}>ACTION</span>
                  </div>
                  {memoUsers.map(u => (
                    <div key={u._id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 1fr 100px', padding: '20px 25px', alignItems: 'center', background: '#0a0a0a', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.02)', minWidth: '900px', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#111'} onMouseOut={e => e.currentTarget.style.background = '#0a0a0a'}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <img src={u.profileImage?.url ? (u.profileImage.url.startsWith('http') ? u.profileImage.url : `${CONFIG.API_BASE_URL}/${u.profileImage.url}`) : `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'User')}&background=111&color=fff`} style={{ width: 40, height: 40, borderRadius: '10px', objectFit: 'cover' }} />
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#fff' }}>{u.name}</div>
                          <div style={{ fontSize: '0.65rem', color: '#666', marginTop: '2px' }}>{u.email}</div>
                        </div>
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '0.9rem', color: u.rank === 'Gold' ? '#f59e0b' : '#fff' }}>{u.rank || 'Bronze'}</div>
                      <div style={{ fontWeight: 900, fontSize: '0.9rem', color: '#fff' }}>{u.totalViews || 0}</div>
                      <div style={{ fontWeight: 900, fontSize: '0.9rem', color: '#fff' }}>{u.worksCount || 0}</div>
                      <div style={{ fontWeight: 900, fontSize: '0.9rem', color: '#f59e0b' }}>{u.coinBalance || 0}</div>
                      <div style={{ fontWeight: 900, fontSize: '0.9rem', color: '#22c55e' }}>฿{(u.totalEarnings || 0) * 10}</div>
                      <div style={{ textAlign: 'center' }}>
                        <button onClick={() => { setAdjustingUser(u); setShowAdjustModal(true); }} style={{ background: '#fff', color: '#000', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 900, cursor: 'pointer', letterSpacing: '0.5px' }}>ADJUST</button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'works' && (
              <motion.div key="wk" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }}>
                  <div style={{ background: '#0a0a0a', padding: '30px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', fontWeight: 800, marginBottom: '25px', letterSpacing: '1px' }}>TOTAL PROJECTS</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 900, lineHeight: 1 }}>{works.length}</div>
                  </div>
                  <div style={{ background: '#0a0a0a', padding: '30px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', fontWeight: 800, marginBottom: '25px', letterSpacing: '1px' }}>VIDEO CONTENT</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#ff5733', lineHeight: 1 }}>{works.filter(w => w.type === 'video').length}</div>
                  </div>
                  <div style={{ background: '#0a0a0a', padding: '30px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', fontWeight: 800, marginBottom: '25px', letterSpacing: '1px' }}>TOTAL ENGAGEMENT</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#6ee7f7', lineHeight: 1 }}>{works.reduce((acc, w) => acc + (w.views || 0), 0).toLocaleString()}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                  <h2 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-1px' }}>Workspace Pro</h2>
                  <button onClick={() => navigate('/admin/works/new')} style={{ background: '#ff5733', border: 'none', padding: '12px 25px', borderRadius: '12px', color: '#fff', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.8rem', letterSpacing: '1px' }}>
                    <FiPlus /> NEW PROJECT
                  </button>
                </div>

                {memoWorks.map((group, idx) => (
                  <div key={idx} style={{ marginBottom: '40px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                      <img src={group.user?.profileImage?.url ? (group.user.profileImage.url.startsWith('http') ? group.user.profileImage.url : `${CONFIG.API_BASE_URL}/${group.user.profileImage.url}`) : `https://ui-avatars.com/api/?name=${encodeURIComponent(group.user?.name || 'User')}&background=111&color=fff`} style={{ width: 35, height: 35, borderRadius: 10, objectFit: 'cover' }} />
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>{group.user?.name} <span style={{ color: '#666', fontSize: '0.8rem', fontWeight: 600 }}>({group.items.length} Works)</span></h3>
                    </div>
                    <div className="admin-table-container" style={{ background: '#0a0a0a', borderRadius: '16px', overflowX: 'auto', border: '1px solid rgba(255,255,255,0.03)' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                        <thead style={{ color: '#555', fontSize: '0.65rem', fontWeight: 900, letterSpacing: '1px' }}>
                          <tr>
                            <th style={{ textAlign: 'left', padding: '20px 25px' }}>TITLE</th>
                            <th style={{ padding: '20px' }}>CATEGORY</th>
                            <th style={{ padding: '20px' }}>TYPE</th>
                            <th style={{ padding: '20px' }}>VIEWS</th>
                            <th style={{ textAlign: 'right', padding: '20px 25px' }}>ACTIONS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.items.map(work => (
                            <tr key={work._id} style={{ borderTop: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#111'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                              <td style={{ padding: '20px 25px', fontWeight: 800, fontSize: '0.9rem' }}>{work.title}</td>
                              <td style={{ textAlign: 'center', color: '#888', fontSize: '0.85rem', fontWeight: 700 }}>{work.category?.name || '—'}</td>
                              <td style={{ textAlign: 'center', color: '#888', fontSize: '0.85rem', fontWeight: 700 }}>{work.type.toUpperCase()}</td>
                              <td style={{ textAlign: 'center', fontWeight: 800 }}>{work.views || 0}</td>
                              <td style={{ textAlign: 'right', padding: '20px 25px' }}>
                                <button onClick={() => navigate(`/admin/works/${work._id}`)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', marginRight: '15px' }}><FiEdit3 size={18} /></button>
                                <button onClick={() => handleDeleteWork(work)} style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer' }}><FiTrash2 size={18} /></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'categories' && (
              <motion.div key="cat" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                  <h2 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-1px' }}>Categories</h2>
                  <button onClick={() => openCatModal()} style={{ background: '#ff5733', border: 'none', padding: '12px 25px', borderRadius: '12px', color: '#fff', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.8rem', letterSpacing: '1px' }}>
                    <FiPlus /> ADD CATEGORY
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '25px' }}>
                  {categories.map(cat => (
                    <div key={cat._id} style={{ background: '#0a0a0a', padding: '30px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.03)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                        <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                          {cat.icon || '📁'}
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button onClick={() => openCatModal(cat)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><FiEdit3 size={18} /></button>
                          <button onClick={() => handleDeleteCat(cat._id)} style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer' }}><FiTrash2 size={18} /></button>
                        </div>
                      </div>
                      <h3 style={{ margin: '0 0 8px 0', fontSize: '1.3rem', fontWeight: 800 }}>{cat.name}</h3>
                      <p style={{ margin: 0, color: '#666', fontSize: '0.85rem', lineHeight: '1.5', fontWeight: 500 }}>{cat.description || 'No description provided.'}</p>
                      <div style={{ marginTop: '25px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <span style={{ fontSize: '0.7rem', color: '#ff5733', fontWeight: 800, letterSpacing: '1px' }}>{works.filter(w => (w.category?._id === cat._id || w.category === cat._id)).length} PROJECTS</span>
                         <span style={{ fontSize: '0.7rem', color: '#444', fontWeight: 600 }}>ID: {cat._id.slice(-6)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
            {activeTab === 'broadcast' && (
              <motion.div key="bc" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                  <h2 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-1px' }}>System Broadcast</h2>
                </div>
                <div style={{ background: '#0a0a0a', padding: '40px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', maxWidth: '600px' }}>
                  <form onSubmit={handleBroadcast}>
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#666', marginBottom: '10px', letterSpacing: '1px' }}>MESSAGE TEXT *</label>
                      <textarea 
                        value={broadcastText} 
                        onChange={e => setBroadcastText(e.target.value)} 
                        placeholder="Enter system message here..." 
                        rows="4" 
                        style={{ width: '100%', padding: '15px 20px', borderRadius: '12px', background: '#111', color: '#fff', border: '1px solid #222', resize: 'none', fontSize: '0.9rem', outline: 'none' }} 
                        required 
                      />
                    </div>
                    <div style={{ marginBottom: '30px' }}>
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#666', marginBottom: '10px', letterSpacing: '1px' }}>ACTION LINK (OPTIONAL)</label>
                      <input 
                        type="text" 
                        value={broadcastLink} 
                        onChange={e => setBroadcastLink(e.target.value)} 
                        placeholder="e.g. /profile/123 or https://..." 
                        style={{ width: '100%', padding: '15px 20px', borderRadius: '12px', background: '#111', color: '#fff', border: '1px solid #222', fontSize: '0.9rem', outline: 'none' }} 
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={broadcastLoading} 
                      style={{ 
                        width: '100%', padding: '15px', borderRadius: '12px', 
                        background: '#ff5733', color: '#fff', border: 'none', 
                        fontWeight: 800, cursor: broadcastLoading ? 'not-allowed' : 'pointer', 
                        fontSize: '1rem', boxShadow: '0 10px 20px rgba(255, 87, 51, 0.2)' 
                      }}
                    >
                      {broadcastLoading ? 'Sending...' : 'SEND TO ALL USERS'}
                    </button>
                  </form>
                </div>
              </motion.div>
            )}

            {activeTab === 'topups' && (
              <motion.div key="tp" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                  <h2 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-1px' }}>Topup Verification</h2>
                  <div style={{ display: 'flex', gap: '10px', background: '#0a0a0a', padding: '5px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <button onClick={() => setTopupFilter('pending')} style={{ background: topupFilter === 'pending' ? '#ff5733' : 'transparent', border: 'none', padding: '10px 20px', borderRadius: '8px', color: '#fff', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', transition: '0.3s' }}>PENDING</button>
                    <button onClick={() => setTopupFilter('all')} style={{ background: topupFilter === 'all' ? '#ff5733' : 'transparent', border: 'none', padding: '10px 20px', borderRadius: '8px', color: '#fff', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', transition: '0.3s' }}>ALL</button>
                  </div>
                </div>
                <div className="admin-table-container" style={{ display: 'flex', flexDirection: 'column', gap: '15px', overflowX: 'auto' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '80px 100px 1.5fr 1fr 1fr 150px 100px', padding: '0 25px 10px', color: '#555', fontSize: '0.65rem', fontWeight: 900, letterSpacing: '1px', minWidth: '900px' }}>
                    <span>STATUS</span>
                    <span>TYPE</span>
                    <span>USER</span>
                    <span>AMOUNT</span>
                    <span>REWARD</span>
                    <span>SLIP</span>
                    <span style={{ textAlign: 'right' }}>ACTIONS</span>
                  </div>
                  {memoTopups.map(t => (
                    <div key={t._id} style={{ display: 'grid', gridTemplateColumns: '80px 100px 1.5fr 1fr 1fr 150px 100px', gap: '15px', padding: '20px 25px', alignItems: 'center', background: '#0a0a0a', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)', minWidth: '900px' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: 900, color: t.status === 'pending' ? '#f59e0b' : t.status === 'failed' ? '#ff4444' : '#22c55e', letterSpacing: '1px' }}>{t.status.toUpperCase()}</span>
                      <div>
                        <span style={{ 
                          fontSize: '0.65rem', padding: '4px 10px', borderRadius: '6px', fontWeight: 900, 
                          background: t.targetType === 'gas' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                          color: t.targetType === 'gas' ? '#10b981' : '#f59e0b',
                          border: `1px solid ${t.targetType === 'gas' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}`
                        }}>
                          {t.targetType?.toUpperCase() || 'COINS'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img src={t.user?.profileImage?.url ? (t.user.profileImage.url.startsWith('http') ? t.user.profileImage.url : `${CONFIG.API_BASE_URL}/${t.user.profileImage.url}`) : `https://ui-avatars.com/api/?name=${encodeURIComponent(t.user?.name || 'User')}&background=111&color=fff`} style={{ width: 35, height: 35, borderRadius: '8px', objectFit: 'cover' }} />
                        <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{t.user?.name}</span>
                      </div>
                      <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>฿{t.amount.toLocaleString()}</span>
                      <span style={{ fontWeight: 800, color: t.targetType === 'gas' ? '#10b981' : '#f59e0b', fontSize: '0.9rem' }}>{t.amount * 10} {t.targetType === 'gas' ? '%' : 'Coins'}</span>
                      <button onClick={() => window.open(t.slipUrl, '_blank')} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}><FiImage /> VIEW SLIP</button>
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        {t.status === 'pending' && (
                          <>
                            <button onClick={() => handleUpdateTopupStatus(t._id, 'completed')} style={{ background: '#22c55e', border: 'none', width: 35, height: 35, borderRadius: '8px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Approve"><FiCheckCircle size={16} /></button>
                            <button onClick={() => handleUpdateTopupStatus(t._id, 'failed')} style={{ background: '#ff4444', border: 'none', width: 35, height: 35, borderRadius: '8px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Reject"><FiTrash2 size={16} /></button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      {/* MODALS */}
      {/* CATEGORY MODAL */}
      {showCatModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#0a0a0a', padding: '40px', borderRadius: '24px', width: '100%', maxWidth: '450px', border: '1px solid rgba(255,255,255,0.05)' }}>
             <h3 style={{ marginBottom: '30px', fontSize: '1.5rem', fontWeight: 900 }}>{editingCat ? 'Edit Category' : 'New Category'}</h3>
             <div style={{ marginBottom: '20px' }}>
               <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#666', marginBottom: '10px', letterSpacing: '1px' }}>CATEGORY NAME</label>
               <input type="text" value={catForm.name} onChange={e => setCatForm({...catForm, name: e.target.value})} placeholder="e.g. Motion Graphic" style={{ width: '100%', padding: '15px 20px', borderRadius: '12px', background: '#111', color: '#fff', border: '1px solid #222', fontSize: '0.9rem', outline: 'none' }} />
             </div>
             <div style={{ marginBottom: '20px' }}>
               <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#666', marginBottom: '10px', letterSpacing: '1px' }}>ICON (EMOJI)</label>
               <input type="text" value={catForm.icon} onChange={e => setCatForm({...catForm, icon: e.target.value})} placeholder="e.g. 🎬" style={{ width: '100%', padding: '15px 20px', borderRadius: '12px', background: '#111', color: '#fff', border: '1px solid #222', fontSize: '0.9rem', outline: 'none' }} />
             </div>
             <div style={{ marginBottom: '30px' }}>
               <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#666', marginBottom: '10px', letterSpacing: '1px' }}>DESCRIPTION</label>
               <textarea value={catForm.description} onChange={e => setCatForm({...catForm, description: e.target.value})} placeholder="Brief description..." rows="3" style={{ width: '100%', padding: '15px 20px', borderRadius: '12px', background: '#111', color: '#fff', border: '1px solid #222', resize: 'none', fontSize: '0.9rem', outline: 'none' }} />
             </div>
             <div style={{ display: 'flex', gap: '15px' }}>
               <button onClick={closeCatModal} style={{ flex: 1, padding: '15px', borderRadius: '12px', background: '#111', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
               <button onClick={handleSaveCat} style={{ flex: 1, padding: '15px', borderRadius: '12px', background: '#ff5733', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer' }}>{catSaving ? 'Saving...' : 'Save Category'}</button>
             </div>
          </div>
        </div>
      )}
      {/* ADJUST MODAL (COINS & GAS) */}
      {showAdjustModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#0a0a0a', padding: '40px', borderRadius: '24px', width: '100%', maxWidth: '400px', border: '1px solid rgba(255,255,255,0.05)' }}>
             <h3 style={{ marginBottom: '20px', fontSize: '1.5rem', fontWeight: 900 }}>Adjust Balance</h3>
             
             <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', background: '#111', padding: '5px', borderRadius: '12px' }}>
               <button onClick={() => setAdjustType('coins')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', background: adjustType === 'coins' ? '#f59e0b' : 'transparent', color: adjustType === 'coins' ? '#000' : '#888', transition: '0.2s' }}>COINS</button>
               <button onClick={() => setAdjustType('gas')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', background: adjustType === 'gas' ? '#10b981' : 'transparent', color: adjustType === 'gas' ? '#000' : '#888', transition: '0.2s' }}>GAS</button>
             </div>

             <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#666', marginBottom: '10px', letterSpacing: '1px' }}>
               {adjustType === 'coins' ? 'AMOUNT (+ OR -)' : 'PERCENTAGE (+ OR - %)'}
             </label>
             <div style={{ position: 'relative' }}>
               <input 
                 type="number" 
                 value={adjustAmount} 
                 onChange={e => setAdjustAmount(e.target.value)} 
                 placeholder={adjustType === 'coins' ? "e.g. 100 or -50" : "e.g. 10 or -20"} 
                 style={{ width: '100%', padding: '15px 45px 15px 20px', borderRadius: '12px', background: '#111', color: '#fff', border: '1px solid #222', marginBottom: '20px', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }} 
               />
               {adjustType === 'gas' && (
                 <span style={{ position: 'absolute', right: '20px', top: '15px', color: '#10b981', fontWeight: 900, fontSize: '1.1rem' }}>%</span>
               )}
             </div>
             
             <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#666', marginBottom: '10px', letterSpacing: '1px' }}>REASON (OPTIONAL)</label>
             <input type="text" value={adjustReason} onChange={e => setAdjustReason(e.target.value)} placeholder="Reason for adjustment..." style={{ width: '100%', padding: '15px 20px', borderRadius: '12px', background: '#111', color: '#fff', border: '1px solid #222', marginBottom: '30px', fontSize: '0.9rem', outline: 'none' }} />
             
             <div style={{ display: 'flex', gap: '15px' }}>
               <button onClick={() => setShowAdjustModal(false)} style={{ flex: 1, padding: '15px', borderRadius: '12px', background: '#111', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
               <button onClick={handleAdjustBalance} disabled={adjustLoading} style={{ flex: 1, padding: '15px', borderRadius: '12px', background: adjustType === 'coins' ? '#f59e0b' : '#10b981', color: '#000', border: 'none', fontWeight: 900, cursor: 'pointer', opacity: adjustLoading ? 0.6 : 1 }}>
                 {adjustLoading ? '...' : 'Confirm'}
               </button>
             </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Add these styles directly to the file or to AdminDashboard.css if preferred
const styleBlock = `
  /* Minimal Scrollbar for Table containers */
  .admin-table-container::-webkit-scrollbar {
    height: 8px;
  }
  .admin-table-container::-webkit-scrollbar-track {
    background: #050505;
  }
  .admin-table-container::-webkit-scrollbar-thumb {
    background: #222;
    border-radius: 4px;
  }
  .admin-table-container::-webkit-scrollbar-thumb:hover {
    background: #333;
  }
  
  .admin-tabs::-webkit-scrollbar {
    display: none;
  }
  .admin-tabs {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;
// Injecting styles directly
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = styleBlock;
  document.head.appendChild(styleSheet);
}
