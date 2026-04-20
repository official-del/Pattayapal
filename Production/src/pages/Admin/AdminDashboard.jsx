import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { worksAPI, categoriesAPI, usersAPI } from '../../utils/api';
import axios from 'axios';
import { CONFIG } from '../../utils/config';
import { 
  FiFolder, FiSettings, FiGrid, FiBarChart2, FiPlus, FiArrowRight, FiArrowLeft, 
  FiTrash2, FiEdit3, FiEye, FiVideo, FiImage, FiMoreHorizontal, FiLogOut, FiHome, FiCheckCircle,
  FiUsers, FiActivity, FiDollarSign, FiAward
} from 'react-icons/fi';
import { HiOutlineSparkles, HiOutlineCube } from 'react-icons/hi';
import { RiDashboardLine, RiUserStarLine } from 'react-icons/ri';
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

  // Get token from localStorage (no need for Context)
  const activeToken = localStorage.getItem('token') || localStorage.getItem('userToken');

  useEffect(() => {
    // Fetch user data directly from localStorage
    const rawUserInfo = localStorage.getItem('userInfo');

    if (!activeToken || !rawUserInfo) {
      console.log("❌ Token or UserInfo not found. Redirecting to login");
      navigate('/login');
      return;
    }

    try {
      const userInfo = JSON.parse(rawUserInfo);
      const isAdmin = userInfo?.role?.toLowerCase() === 'admin';

      if (!isAdmin) {
        console.log("❌ Not an admin. Redirecting to login");
        alert("This page is for admins only");
        navigate('/login');
        return;
      }

      // If all checks pass, load data
      fetchWorks();
      fetchCategories();
      fetchAllUsers();

    } catch (error) {
      console.error("🔥 Error parsing login data:", error);
      navigate('/login');
    }
  }, []); 

  /* ════════ WORKS ════════ */
  const fetchAllUsers = async () => {
    setUsersLoading(true);
    try {
      const data = await usersAPI.getAllUsersAdmin(activeToken);
      setAllUsers(data || []);
    } catch (e) { console.error(e); }
    finally { setUsersLoading(false); }
  };

  /* ════════ WORKS ════════ */
  const fetchWorks = async () => {
    setWorksLoading(true);
    try {
      const res = await worksAPI.getAll();
      setWorks(res.works || []);
    } catch (e) { console.error(e); }
    finally { setWorksLoading(false); }
  };

  const handleDeleteWork = async (work) => {
    if (!window.confirm(`Delete project "${work.title}" permanently? This will also remove files from cloud.`)) return;

    try {
      const mediaUrl = work.mainImage?.url || work.mediaUrl;
      if (mediaUrl && mediaUrl.includes('storage.googleapis.com')) {
        await axios({
          method: 'delete',
          url: `${CONFIG.API_URL}/upload/delete`,
          data: { url: mediaUrl },
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (work.album && work.album.length > 0) {
        for (const img of work.album) {
          const imgUrl = img.url || img.previewUrl;
          if (imgUrl && imgUrl.includes('storage.googleapis.com')) {
            await axios({
              method: 'delete',
              url: `${CONFIG.API_URL}/upload/delete`,
              data: { url: imgUrl },
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }
      }

      await worksAPI.delete(work._id, activeToken);
      setWorks(prev => prev.filter(w => w._id !== work._id));
      alert('Project and cloud files deleted successfully!');

    } catch (error) {
      console.error("❌ Failed to delete project:", error);
      alert('Delete failed: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleToggleSlider = async (work) => {
    try {
      const currentSliderCount = works.filter(w => w.showOnSlider).length;
      if (!work.showOnSlider && currentSliderCount >= 5) {
        alert('Slider limit: maximum 5 videos for better website speed');
        return;
      }

      const updatedStatus = !work.showOnSlider;
      const formData = new FormData();
      formData.append('showOnSlider', updatedStatus);

      await worksAPI.update(work._id, formData, activeToken);

      setWorks(prev => prev.map(w =>
        w._id === work._id ? { ...w, showOnSlider: updatedStatus } : w
      ));
    } catch (e) {
      alert('Failed to update slider status');
    }
  };

  /* ════════ CATEGORIES ════════ */
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
    setCatForm(cat
      ? { name: cat.name || '', icon: cat.icon || '', description: cat.description || '' }
      : { name: '', icon: '', description: '' }
    );
    setShowCatModal(true);
  };

  const closeCatModal = () => {
    setShowCatModal(false);
    setEditingCat(null);
    setCatForm({ name: '', icon: '', description: '' });
  };

  const handleSaveCat = async (e) => {
    e.preventDefault();
    if (!catForm.name.trim()) return alert('Please enter a category name');
    setCatSaving(true);
    try {
      if (editingCat) {
        const updated = await categoriesAPI.update(editingCat._id, catForm, activeToken);
        setCategories(prev => prev.map(c => c._id === editingCat._id ? (updated.category || updated) : c));
      } else {
        const created = await categoriesAPI.create(catForm, activeToken);
        setCategories(prev => [...prev, created.category || created]);
      }
      closeCatModal();
    } catch (e) { alert('Save failed'); }
    finally { setCatSaving(false); }
  };

  const handleDeleteCat = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    await categoriesAPI.delete(id, activeToken);
    setCategories(prev => prev.filter(c => c._id !== id));
  };

  /* ════════ RENDER ════════ */
  return (
    <div className="admin-page-root" style={{ fontFamily: "'Inter', 'Prompt', sans-serif" }}>

      {/* ── Main Content ── */}
      <main className="admin-main-viewport" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        
        {/* ✅ MODERN TOP NAV BAR */}
        <header className="admin-top-bar">
          
          <div className="tab-nav-group">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`tab-nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
            >
              <FiBarChart2 /> OVERVIEW
            </button>
            <button 
              onClick={() => setActiveTab('works')}
              className={`tab-nav-btn ${activeTab === 'works' ? 'active' : ''}`}
            >
              <FiFolder /> MANAGEMENT
            </button>
            <button 
              onClick={() => setActiveTab('categories')}
              className={`tab-nav-btn ${activeTab === 'categories' ? 'active' : ''}`}
            >
              <FiGrid /> CATEGORIES
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`tab-nav-btn ${activeTab === 'users' ? 'active' : ''}`}
            >
              <FiUsers /> USERS
            </button>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <Link to="/" className="btn-modern-back" style={{ textDecoration: 'none' }}>
              <FiHome /> PREVIEW
            </Link>
            
            <button 
              onClick={() => {
                if(window.confirm('Are you sure you want to sign out?')){
                  localStorage.removeItem('token');
                  localStorage.removeItem('userToken');
                  localStorage.removeItem('userInfo');
                  window.location.href = '/'; 
                }
              }}
              className="btn-modern-back"
              style={{ color: '#ff4444' }}
            >
              <FiLogOut /> SIGN OUT
            </button>
          </div>
        </header>

        <section className="admin-content-inner tab-fade-in" key={activeTab}>

          {/* ══════════ TAB: OVERVIEW ══════════ */}
          {activeTab === 'overview' && (
            <div style={{ marginTop: '20px' }}>
              <AdminOverview embedded={true} />
            </div>
          )}

          {/* ══════════ TAB: USERS ══════════ */}
          {activeTab === 'users' && (() => {
            const sorted = [...allUsers]
              .filter(u =>
                !userSearch ||
                u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
                u.email?.toLowerCase().includes(userSearch.toLowerCase())
              )
              .sort((a, b) => {
                if (userSort === 'views')    return (b.totalViews || 0) - (a.totalViews || 0);
                if (userSort === 'earnings') return (b.totalEarnings || 0) - (a.totalEarnings || 0);
                if (userSort === 'coins')    return (b.coinBalance || 0) - (a.coinBalance || 0);
                if (userSort === 'works')    return (b.worksCount || 0) - (a.worksCount || 0);
                if (userSort === 'points')   return (b.points || 0) - (a.points || 0);
                return 0;
              });

            const totalViews    = allUsers.reduce((s, u) => s + (u.totalViews || 0), 0);
            const totalEarnings = allUsers.reduce((s, u) => s + (u.totalEarnings || 0), 0);
            const totalCoins    = allUsers.reduce((s, u) => s + (u.coinBalance || 0), 0);

            const RANK_COLOR = {
              Bronze:   '#cd7f32', Silver:   '#a8a8b3', Gold:     '#f59e0b',
              Platinum: '#6ee7f7', Diamond:  '#6366f1', Master:   '#ef4444',
            };

            return (
              <>
                {/* ── Header ── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <FiUsers style={{ color: 'var(--primary)', fontSize: '1.1rem' }} />
                      <span style={{ color: 'var(--primary)', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '3px' }}>USER INTELLIGENCE</span>
                    </div>
                    <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 900, letterSpacing: '-1px' }}>
                      สมาชิก <span style={{ color: '#333', fontWeight: 300 }}>ทั้งหมด</span>
                    </h2>
                    <p style={{ color: '#333', fontSize: '0.75rem', marginTop: 6, fontWeight: 700, letterSpacing: '1px' }}>
                      {allUsers.length} MEMBERS · SORTED BY {userSort.toUpperCase()}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                      placeholder="🔍  ค้นหาชื่อหรืออีเมล..."
                      style={{
                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                        color: '#fff', padding: '10px 16px', borderRadius: '14px',
                        fontSize: '0.82rem', outline: 'none', width: '220px'
                      }}
                    />
                    <select
                      value={userSort}
                      onChange={e => setUserSort(e.target.value)}
                      style={{
                        background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.07)',
                        color: '#aaa', padding: '10px 14px', borderRadius: '14px',
                        fontSize: '0.8rem', cursor: 'pointer', outline: 'none'
                      }}
                    >
                      <option value="views">ยอดวิว</option>
                      <option value="earnings">รายได้สะสม</option>
                      <option value="coins">Coins</option>
                      <option value="works">ผลงาน</option>
                      <option value="points">แต้ม</option>
                    </select>
                    <button onClick={fetchAllUsers} className="btn-modern-back">↻</button>
                  </div>
                </div>

                {/* ── Summary Cards ── */}
                <div className="admin-summary-grid" style={{ gap: 16, marginBottom: 32 }}>
                  {[
                    { label: 'TOTAL VIEWS', value: totalViews.toLocaleString(), icon: <FiEye />, color: '#6ee7f7' },
                    { label: 'TOTAL COINS IN SYSTEM', value: totalCoins.toLocaleString(), icon: <FiDollarSign />, color: '#f59e0b' },
                    { label: 'LIFETIME EARNINGS', value: `฿${(totalEarnings * 10).toLocaleString()}`, icon: <FiAward />, color: '#22c55e' },
                  ].map(c => (
                    <div key={c.label} style={{
                      background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.04)',
                      borderRadius: 20, padding: '20px 24px', position: 'relative', overflow: 'hidden'
                    }}>
                      <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: `radial-gradient(circle, ${c.color}20 0%, transparent 70%)` }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: c.color, marginBottom: 10, fontSize: '0.85rem' }}>
                        {c.icon}
                        <span style={{ fontSize: '0.6rem', fontWeight: 900, letterSpacing: '2px', color: '#333' }}>{c.label}</span>
                      </div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff', letterSpacing: '-1px' }}>{c.value}</div>
                    </div>
                  ))}
                </div>

                {/* ── User Cards ── */}
                {usersLoading ? (
                  <div className="loading-state">Loading users...</div>
                ) : (
                  <div style={{ overflowX: 'auto', paddingBottom: '15px' }}>
                    <div style={{ minWidth: '950px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {/* Column Header */}
                    <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr 110px 90px 80px 80px 90px 100px 110px', gap: 12, padding: '6px 20px', alignItems: 'center' }}>
                      {['#', 'ผู้ใช้งาน', 'Rank', 'ยอดวิว', 'ผลงาน', 'แต้ม', 'Coins', 'รายได้สะสม', 'สมัครเมื่อ'].map(h => (
                        <span key={h} style={{ fontSize: '0.58rem', fontWeight: 900, letterSpacing: '1.5px', color: '#2a2a2a', textTransform: 'uppercase' }}>{h}</span>
                      ))}
                    </div>

                    {sorted.map((u, idx) => {
                      const rankColor = RANK_COLOR[u.rank] || '#cd7f32';
                      const isTop3 = idx < 3;
                      return (
                        <div
                          key={u._id}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '48px 1fr 110px 80px 80px 90px 90px 110px 110px',
                            gap: 12, padding: '16px 20px',
                            background: isTop3 ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.012)',
                            border: `1px solid ${isTop3 ? `${rankColor}18` : 'rgba(255,255,255,0.03)'}`,
                            borderRadius: 18, alignItems: 'center',
                            borderLeft: isTop3 ? `2px solid ${rankColor}60` : '2px solid transparent',
                            transition: 'background 0.2s'
                          }}
                        >
                          {/* Rank Number */}
                          <div style={{
                            fontSize: idx < 3 ? '1rem' : '0.8rem',
                            fontWeight: 900,
                            color: idx === 0 ? '#f59e0b' : idx === 1 ? '#a8a8b3' : idx === 2 ? '#cd7f32' : '#222',
                            textAlign: 'center'
                          }}>
                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                          </div>

                          {/* User Info */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                            <div style={{ position: 'relative', flexShrink: 0 }}>
                              {u.profileImage?.url ? (
                                <img
                                  src={`${CONFIG.API_BASE_URL}/${u.profileImage.url}`}
                                  alt=""
                                  style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${rankColor}40` }}
                                />
                              ) : (
                                <div style={{
                                  width: 38, height: 38, borderRadius: '50%',
                                  background: `linear-gradient(135deg, ${rankColor}30, ${rankColor}10)`,
                                  border: `2px solid ${rankColor}30`,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: '0.85rem', fontWeight: 900, color: rankColor
                                }}>
                                  {u.name?.charAt(0)?.toUpperCase()}
                                </div>
                              )}
                              {u.isOnline && (
                                <div style={{ position: 'absolute', bottom: 1, right: 1, width: 9, height: 9, borderRadius: '50%', background: '#22c55e', border: '1.5px solid #000' }} />
                              )}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 800, fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {u.name}
                                {u.role === 'admin' && (
                                  <span style={{ marginLeft: 6, fontSize: '0.55rem', background: 'rgba(255,87,51,0.15)', color: 'var(--primary)', padding: '2px 6px', borderRadius: 6, fontWeight: 900, verticalAlign: 'middle' }}>ADMIN</span>
                                )}
                              </div>
                              <div style={{ fontSize: '0.62rem', color: '#2a2a2a', marginTop: 2 }}>{u.email}</div>
                              {u.profession && u.profession !== 'General' && (
                                <div style={{ fontSize: '0.6rem', color: '#333', marginTop: 1, fontWeight: 700 }}>{u.profession}</div>
                              )}
                            </div>
                          </div>

                          {/* Rank Badge */}
                          <div>
                            <span style={{
                              fontSize: '0.68rem', fontWeight: 900,
                              color: rankColor, background: `${rankColor}12`,
                              border: `1px solid ${rankColor}30`,
                              padding: '4px 10px', borderRadius: 10
                            }}>
                              {u.rank || 'Bronze'}
                            </span>
                          </div>

                          {/* Views */}
                          <div style={{ textAlign: 'right', fontWeight: 800, fontSize: '0.88rem', color: '#6ee7f7' }}>
                            {(u.totalViews || 0).toLocaleString()}
                          </div>

                          {/* Works */}
                          <div style={{ textAlign: 'right', fontWeight: 800, fontSize: '0.88rem' }}>
                            {u.worksCount || 0}
                          </div>

                          {/* Points */}
                          <div style={{ textAlign: 'right', fontWeight: 800, fontSize: '0.88rem', color: '#a78bfa' }}>
                            {(u.points || 0).toLocaleString()}
                          </div>

                          {/* Coins */}
                          <div style={{ textAlign: 'right', fontWeight: 800, fontSize: '0.88rem', color: '#f59e0b' }}>
                            {(u.coinBalance || 0).toLocaleString()}
                          </div>

                          {/* Lifetime Earnings */}
                          <div style={{ textAlign: 'right', fontWeight: 800, fontSize: '0.85rem', color: '#22c55e' }}>
                            ฿{((u.totalEarnings || 0) * 10).toLocaleString()}
                          </div>

                          {/* Join Date */}
                          <div style={{ textAlign: 'right', color: '#222', fontSize: '0.7rem', fontWeight: 700 }}>
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString('th-TH') : '—'}
                          </div>
                        </div>
                      );
                    })}

                    {sorted.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '80px', color: '#222' }}>ไม่พบผู้ใช้งาน</div>
                    )}
                    </div>
                  </div>
                )}
              </>
            );
          })()}

          {/* ══════════ TAB: WORKS ══════════ */}
          {activeTab === 'works' && (
            <>
              <div className="tab-header-flex" style={{ alignItems: 'center' }}>
                <div>
                  <h2 className="tab-title" style={{ border: 'none', padding: 0, display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 0 }}>
                    <HiOutlineSparkles style={{ color: 'var(--primary)', fontSize: '1.8rem' }} /> WORKSPACE <span style={{ color: 'var(--text-mute)', fontWeight: 300 }}>PRO</span>
                  </h2>
                  <p style={{ color: 'var(--text-mute)', fontSize: '0.8rem', marginTop: '4px', fontWeight: 600, letterSpacing: '0.5px' }}>MANAGEMENT CONTROL CENTER</p>
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <button onClick={() => setShowChoice(true)} className="btn-primary-red">
                    <FiPlus /> ADD PROJECT
                  </button>
                </div>
              </div>

              {worksLoading ? (
                <div className="loading-state">Loading...</div>
              ) : (
                <div className="works-grouped-list">
                  {Object.values(works.reduce((groups, work) => {
                    const userId = work.createdBy?._id || 'unknown';
                    if (!groups[userId]) groups[userId] = { 
                      user: work.createdBy || { name: 'Unknown User' }, 
                      items: [] 
                    };
                    groups[userId].items.push(work);
                    return groups;
                  }, {})).map((group, gIdx) => (
                    <div key={gIdx} className="user-work-section">
                      
                      {/* PRO USER HEADER CARD */}
                      <div className="section-user-header" style={{ border: 'none' }}>
                        <div className={`user-avatar-pro ${!group.user?.profileImage?.url ? 'initials' : ''}`}>
                           {group.user?.profileImage?.url ? (
                              <img src={`${CONFIG.API_BASE_URL}/${group.user.profileImage.url}`} alt="" />
                           ) : (
                              group.user?.name?.charAt(0).toUpperCase()
                           )}
                        </div>
                        <div className="user-meta">
                          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <RiUserStarLine style={{ color: '#ff5733', fontSize: '1.1rem' }} /> {group.user?.name}
                          </h3>
                          <p>UID: {group.user?._id || 'N/A'}</p>
                        </div>
                        <div className="count-badge">
                          {group.items.length} PROJECTS
                        </div>
                      </div>

                      <div className="premium-table-wrap">
                        <table className="dark-data-table">
                          <thead>
                            <tr>
                              <th>PROJECT TITLE</th>
                              <th>CATEGORY</th>
                              <th>SLIDER</th>
                              <th>TYPE</th>
                              <th>STATUS</th>
                              <th>VIEWS</th>
                              <th style={{ textAlign: 'right' }}>ACTIONS</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.items.map(work => (
                              <tr key={work._id}>
                                <td className="td-main-title">
                                  {work.title} {work.featured && <span className="feat-star">★</span>}
                                </td>
                                <td>{work.category?.name || '—'}</td>
                                <td>
                                  {work.type === 'video' ? (
                                    <button
                                      onClick={() => handleToggleSlider(work)}
                                      className={`slider-toggle-btn ${work.showOnSlider ? 'on' : 'off'}`}
                                      title={work.showOnSlider ? 'Remove from Slider' : 'Show on Slider'}
                                    >
                                      {work.showOnSlider ? '🎬 ON' : '○ OFF'}
                                    </button>
                                  ) : (
                                    <span style={{ color: '#333', fontSize: '0.7rem' }}>N/A</span>
                                  )}
                                </td>
                                <td>
                                  <span className={`type-badge ${work.type}`}>
                                    {work.type === 'video' ? '▶ VIDEO' : '📷 IMAGE'}
                                  </span>
                                </td>
                                <td>
                                  <span className={`status-pill ${work.status}`}>{work.status}</span>
                                </td>
                                <td className="td-views">{work.views || 0}</td>
                                <td className="td-actions" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                  <button className="btn-icon" onClick={() => navigate(`/admin/works/${work._id}`)}>
                                    <FiEdit3 />
                                  </button>
                                  <button className="btn-icon delete" onClick={() => handleDeleteWork(work)}>
                                    <FiTrash2 />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                  {works.length === 0 && <div className="td-empty" style={{ textAlign: 'center', padding: '100px', color: '#444' }}>No projects yet</div>}
                </div>
              )}
            </>
          )}

          {/* ══════════ TAB: CATEGORIES ══════════ */}
          {activeTab === 'categories' && (
            <>
              <div className="tab-header-flex" style={{ alignItems: 'center', marginBottom: '32px' }}>
                <div>
                   <h2 className="tab-title" style={{ border: 'none', padding: 0, display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 0 }}>
                     <FiGrid style={{ color: 'var(--primary)' }} /> CATEGORY <span style={{ color: 'var(--text-mute)', fontWeight: 300 }}>SYSTEM</span>
                   </h2>
                   <p style={{ color: 'var(--text-mute)', fontSize: '0.8rem', marginTop: '4px', fontWeight: 600, letterSpacing: '0.5px' }}>ORGANIZE YOUR PROJECT COLLECTIONS</p>
                </div>

                <button onClick={() => openCatModal()} className="btn-primary-red">
                  <FiPlus /> ADD CATEGORY
                </button>
              </div>

              {catLoading ? (
                <div className="loading-state">Loading...</div>
              ) : (
                <div className="cat-pro-grid">
                  {categories.length === 0 ? (
                    <div className="cat-empty" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px', color: '#444' }}>No categories yet, click + ADD CATEGORY to create one</div>
                  ) : categories.map(cat => (
                    <div key={cat._id} className="cat-pro-card">
                      <div className="cat-icon-box">{cat.icon || '📁'}</div>
                      <div className="cat-main-content">
                        <div className="cat-name-pro">{cat.name}</div>
                        {cat.description && <div className="cat-desc-pro">{cat.description}</div>}
                      </div>
                      <div className="cat-footer-pro">
                        <div className="cat-stats-pro">
                          {works.filter(w => w.category?._id === cat._id || w.category === cat._id).length} PROJECTS
                        </div>
                        <div className="cat-actions-pro">
                          <button className="btn-icon-sm" onClick={() => openCatModal(cat)}>
                            <FiEdit3 />
                          </button>
                          <button className="btn-icon-sm delete" onClick={() => handleDeleteCat(cat._id)}>
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

        </section>
      </main>

      {/* ══ ADD PROJECT PRO Modal ══ */}
      {showChoice && (
        <div className="modal-overlay" onClick={() => setShowChoice(false)}>
          <div className="pro-modal-card">
            <div className="modal-pro-header" style={{ textAlign: 'center', display: 'block' }}>
               <h3 style={{ fontSize: '1.2rem', color: '#ff5733' }}>NEW PROJECT</h3>
               <p style={{ margin: '5px 0 0 0', fontSize: '0.8rem', color: '#444', fontWeight: 700 }}>CHOOSE YOUR CREATIVE FORMAT</p>
            </div>
            <div className="choice-grid">
              <button className="choice-pro-item" onClick={() => { setShowChoice(false); navigate('/admin/works/new?type=image'); }}>
                <div className="icon-box"><FiImage /></div>
                <span>IMAGE PROJECT</span>
              </button>
              <button className="choice-pro-item" onClick={() => { setShowChoice(false); navigate('/admin/works/new?type=video'); }}>
                <div className="icon-box"><FiVideo /></div>
                <span>VIDEO PROJECT</span>
              </button>
            </div>
            <div style={{ padding: '0 40px 40px' }}>
               <button className="btn-cancel-cat" style={{ width: '100%', borderRadius: '12px' }} onClick={() => setShowChoice(false)}>CANCEL</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Category Modal ══ */}
      {showCatModal && (
        <div className="modal-overlay" onClick={closeCatModal}>
          <div className="pro-modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-pro-header">
              <h3>{editingCat ? 'EDIT CATEGORY' : 'ADD CATEGORY'}</h3>
              <button className="btn-modal-close" onClick={closeCatModal} style={{ fontSize: '1.5rem' }}>✕</button>
            </div>
            <form onSubmit={handleSaveCat} className="cat-modal-form">
              <div className="cat-field">
                <label>CATEGORY NAME</label>
                <input
                  type="text"
                  value={catForm.name}
                  placeholder="e.g., Motion Graphic"
                  required
                  style={{ borderRadius: '10px' }}
                  onChange={e => setCatForm({ ...catForm, name: e.target.value })}
                />
              </div>
              <div className="cat-field">
                <label>ICON MARKER</label>
                <input
                  type="text"
                  value={catForm.icon}
                  placeholder="e.g., 🎬 🎨"
                  style={{ borderRadius: '10px' }}
                  onChange={e => setCatForm({ ...catForm, icon: e.target.value })}
                />
              </div>
              <div className="cat-field">
                <label>DESCRIPTION</label>
                <textarea
                  rows="3"
                  value={catForm.description}
                  placeholder="Short brief for this category..."
                  style={{ borderRadius: '10px' }}
                  onChange={e => setCatForm({ ...catForm, description: e.target.value })}
                />
              </div>
              <div className="cat-modal-actions">
                <button type="button" className="btn-cancel-cat" style={{ borderRadius: '12px' }} onClick={closeCatModal}>
                  DISCARD
                </button>
                <button type="submit" className="btn-save-cat" style={{ borderRadius: '12px' }} disabled={catSaving}>
                  {catSaving ? 'SAVING...' : editingCat ? 'UPDATE' : 'CREATE PRO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSS for Slider Toggle Button */}
      <style>{`
        .slider-toggle-btn {
          border: none;
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 800;
          cursor: pointer;
          transition: 0.3s;
        }
        .slider-toggle-btn.on {
          background: rgba(255, 107, 53, 0.2);
          color: #ff6b35;
          border: 1px solid #ff6b35;
          box-shadow: 0 0 10px rgba(255, 107, 53, 0.2);
        }
        .slider-toggle-btn.off {
          background: #111;
          color: #444;
          border: 1px solid #222;
        }
        .slider-toggle-btn:hover {
          transform: translateY(-2px);
        }
        .feat-star { color: #ffea00; margin-left: 5px; text-shadow: 0 0 5px rgba(255, 234, 0, 0.5); }
        .admin-summary-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
        }
        @media (max-width: 992px) {
          .admin-summary-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}