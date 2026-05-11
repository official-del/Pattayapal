import React, { useContext, useState, useEffect, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { postsAPI, worksAPI, usersAPI, categoriesAPI } from '../utils/api';
import CreatePostBox from '../components/CreatePostBox';
import FeedPost from '../components/FeedPost';
import { motion, AnimatePresence } from 'framer-motion';
import { getMediaUrl, workIsVideo, getFullUrl } from '../utils/mediaUtils';
import {
  FiActivity, FiZap, FiHash, FiAlertTriangle,
  FiTrendingUp, FiUsers, FiCompass, FiMessageSquare, FiCamera, FiVideo, FiSliders, FiFilm, FiLayout, FiPenTool,
  FiMaximize, FiCpu, FiBriefcase, FiStar, FiEye, FiChevronRight, FiLoader
} from 'react-icons/fi';
import ProfileFrame from '../components/ProfileFrame';
import OptimizedImage from '../components/OptimizedImage';

// ─── Helpers ──────────────────────────────────────────────────────────────
const getCategoryIcon = (name) => {
  if (!name) return <FiBriefcase />;
  const lower = name.toLowerCase();
  if (lower.includes('video') || lower.includes('film') || lower.includes('production')) return <FiVideo />;
  if (lower.includes('graphic') || lower.includes('design') || lower.includes('art')) return <FiLayout />;
  if (lower.includes('photo')) return <FiCamera />;
  if (lower.includes('market') || lower.includes('zap')) return <FiZap />;
  if (lower.includes('app') || lower.includes('web') || lower.includes('dev')) return <FiCpu />;
  if (lower.includes('edit')) return <FiSliders />;
  if (lower.includes('motion') || lower.includes('vfx') || lower.includes('animation')) return <FiZap />;
  if (lower.includes('content')) return <FiPenTool />;
  return <FiBriefcase />;
};

// ─── Right Sidebar: Trending & Leaderboard ───────────────────────────────────
function RightSidebar({ user, categories }) {
  const [trending, setTrending] = useState([]);
  const [topFreelancers, setTopFreelancers] = useState([]);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [loadingFreelancers, setLoadingFreelancers] = useState(true);
  const [currentTrendingIndex, setCurrentTrendingIndex] = useState(0);

  useEffect(() => {
    // Fetch Trending
    worksAPI.getAll().then(res => {
      const works = (res.works || res || []).filter(w => w.status === 'published');
      setTrending([...works].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5));
    }).catch(() => { }).finally(() => setLoadingTrending(false));

    // Fetch Top Ranking Freelancers
    usersAPI.getLeaderboard('overall').then(res => {
      setTopFreelancers(res.slice(0, 3)); // Get top 3
    }).catch(() => {
      // Fallback
      setTopFreelancers([
        { _id: '1', name: 'Name', profession: 'Job role', profileImage: null },
        { _id: '2', name: 'Name', profession: 'Job role', profileImage: null },
        { _id: '3', name: 'Name', profession: 'Job role', profileImage: null }
      ]);
    }).finally(() => setLoadingFreelancers(false));
  }, []);

  useEffect(() => {
    if (trending.length === 0) return;
    const interval = setInterval(() => {
      setCurrentTrendingIndex(prev => (prev + 1) % trending.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [trending.length]);

  return (
    <aside style={{
      width: '320px', flexShrink: 0, position: 'sticky', top: '100px',
      paddingLeft: '10px',
      display: 'flex', flexDirection: 'column', gap: '30px'
    }}>

      {/* Trending Section */}
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <div style={{ color: 'var(--accent)', fontSize: '0.8rem', fontWeight: '800', letterSpacing: '1px', marginBottom: '5px' }}>
          HEATING UP THE FEED
        </div>
        <div style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '900', textTransform: 'uppercase', marginBottom: '20px', letterSpacing: '1px' }}>
          TRENDING CREATIONS
        </div>

        {loadingTrending ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
            <FiLoader className="spin" size={24} color="var(--accent)" />
          </div>
        ) : trending.length > 0 ? (
          <div style={{ position: 'relative', height: '240px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {trending.map((item, index) => {
              const diff = index - currentTrendingIndex;
              const isActive = index === currentTrendingIndex;

              return (
                <motion.div
                  key={item._id}
                  animate={{
                    x: diff * 20,
                    scale: isActive ? 1 : 0.85,
                    opacity: isActive ? 1 : 0.3,
                    zIndex: isActive ? 10 : 1,
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  style={{
                    position: 'absolute', width: '220px', height: '220px',
                    borderRadius: '24px', overflow: 'hidden', cursor: 'pointer',
                    boxShadow: isActive ? '0 20px 40px rgba(0,0,0,0.5)' : 'none',
                    border: isActive ? '1px solid rgba(255,255,255,0.1)' : 'none',
                    willChange: 'transform, opacity'
                  }}
                  onClick={() => window.location.href = `/works/${item._id}`}
                >
                  {/* Author Avatar at Top-Left */}
                  <div style={{ position: 'absolute', top: '15px', left: '15px', zIndex: 11 }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden',
                      border: '2px solid rgba(255,255,255,0.2)', background: '#111',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                    }}>
                      {item.createdBy?.profileImage?.url || item.author?.profileImage?.url ? (
                        <OptimizedImage
                          src={getFullUrl(item.createdBy?.profileImage?.url || item.author?.profileImage?.url)}
                          alt=""
                          style={{ width: '100%', height: '100%' }}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444', fontSize: '10px', fontWeight: '900' }}>
                          {(item.createdBy?.name || item.author?.name || 'PP').slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>

                  {workIsVideo(item) ? (
                    <video
                      src={getMediaUrl(item)}
                      poster={item.coverImage?.url ? getFullUrl(item.coverImage.url) : (typeof item.coverImage === 'string' ? getFullUrl(item.coverImage) : undefined)}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onLoadedMetadata={(e) => e.target.currentTime = 0.1}
                      muted
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    <OptimizedImage src={getMediaUrl(item)} alt="" style={{ width: '100%', height: '100%' }} />
                  )}
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 60%)' }}></div>
                  {isActive && (
                    <div style={{ position: 'absolute', bottom: '15px', left: '15px', right: '15px', textAlign: 'left' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <div style={{ color: 'var(--accent)', fontSize: '0.6rem', fontWeight: '800', letterSpacing: '1px' }}>
                          {item.category?.name?.toUpperCase() || 'GENERAL'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'rgba(255,255,255,0.5)', fontSize: '0.6rem', fontWeight: '700' }}>
                          <FiEye size={10} /> {Number(item.views || 0).toLocaleString()}
                        </div>
                      </div>
                      <div style={{ color: '#fff', fontSize: '0.9rem', fontWeight: '800', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.title}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}

            <div style={{ position: 'absolute', bottom: '-20px', display: 'flex', gap: '6px' }}>
              {trending.map((_, i) => (
                <div key={i} style={{
                  width: i === currentTrendingIndex ? '16px' : '6px',
                  height: '6px', borderRadius: '3px',
                  background: i === currentTrendingIndex ? 'var(--accent)' : '#444',
                  transition: 'all 0.3s ease'
                }} />
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {/* Rankings Section */}
      <div className="glass" style={{
        padding: '30px 20px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.03)',
        textAlign: 'center', background: 'rgba(255,255,255,0.01)'
      }}>
        <div style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '10px' }}>
          <FiStar size={14} />
          <span style={{ fontSize: '0.7rem', fontWeight: '800', letterSpacing: '2px' }}>RANKING HUBS</span>
        </div>
        <div style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '900', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '1px' }}>
          RANKINGS OF COMMUNITY
        </div>

        {loadingFreelancers ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
            <FiLoader className="spin" size={24} color="var(--accent)" />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', alignItems: 'center' }}>
            {topFreelancers.map((freelancer, index) => {
              const rank = index + 1;
              const isRank1 = rank === 1;
              return (
                <div key={freelancer._id || index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                  <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{
                      position: 'absolute', top: '-15px', zIndex: 10,
                      width: '30px', height: '30px', borderRadius: '50%',
                      background: isRank1 ? 'var(--accent)' : '#666',
                      color: '#fff', fontWeight: '900', fontSize: '1rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 5px 15px rgba(0,0,0,0.5)', border: '2px solid #000'
                    }}>
                      {rank}
                    </div>
                    <div
                      onClick={() => window.location.href = `/profile/${freelancer._id}`}
                      style={{
                        width: isRank1 ? '120px' : '90px', height: isRank1 ? '120px' : '90px',
                        borderRadius: '50%', background: '#111',
                        border: isRank1 ? '3px solid #ffd700' : '2px solid #555',
                        boxShadow: isRank1 ? '0 0 30px rgba(255, 215, 0, 0.4)' : '0 0 15px rgba(255,255,255,0.1)',
                        overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', cursor: 'pointer'
                      }}
                    >
                      <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', background: '#222' }}>
                        {freelancer.profileImage?.url ? (
                          <OptimizedImage src={freelancer.profileImage.url} alt={freelancer.name} style={{ width: '100%', height: '100%' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                            <FiUsers size={30} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: '#fff', fontWeight: '900', fontSize: '1.2rem', textTransform: 'uppercase' }}>{freelancer.name}</div>
                    <div style={{ color: '#666', fontSize: '0.65rem', fontWeight: '800', letterSpacing: '2px' }}>{freelancer.profession || 'CREATOR'}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 🛠️ GridServices Section */}
      {(() => {
        const PROFESSIONS = [
          { name: 'Photographer', icon: <FiCamera /> },
          { name: 'Editor', icon: <FiSliders /> },
          { name: 'Videographer', icon: <FiVideo /> },
          { name: 'Director', icon: <FiFilm /> },
          { name: 'Production Design', icon: <FiLayout /> },
          { name: 'Creative Content', icon: <FiPenTool /> },
          { name: 'Film Production', icon: <FiMaximize /> },
          { name: 'Digital Artist', icon: <FiCpu /> },
        ];
        return (
          <div className="glass" style={{
            padding: '30px 20px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.03)',
            background: 'rgba(255,255,255,0.01)', marginTop: '30px'
          }}>
            <div style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <FiZap size={14} />
              <span style={{ fontSize: '0.7rem', fontWeight: '800', letterSpacing: '2px' }}>CORE SERVICES</span>
            </div>
            <div style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '900', textTransform: 'uppercase', marginBottom: '20px', letterSpacing: '1px' }}>
              EXPLORE SERVICES
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
              {PROFESSIONS.map((prof, i) => (
                <motion.div
                  key={i}
                  whileHover={{ x: 6, background: 'rgba(255,255,255,0.05)' }}
                  onClick={() => window.location.href = `/freelancers?profession=${encodeURIComponent(prof.name)}`}
                  style={{
                    padding: '16px 18px',
                    borderRadius: '18px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    transition: 'background 0.2s'
                  }}
                >
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,87,51,0.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)',
                    fontSize: '1.1rem', border: '1px solid rgba(255,87,51,0.1)', flexShrink: 0
                  }}>
                    {prof.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#fff', fontSize: '0.9rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{prof.name}</div>
                    <div style={{ color: 'var(--accent)', fontSize: '0.6rem', fontWeight: '800', letterSpacing: '1px', marginTop: '3px' }}>FIND FREELANCERS</div>
                  </div>
                  <FiChevronRight size={14} color="#333" />
                </motion.div>
              ))}
            </div>
          </div>
        );
      })()}
    </aside>
  );
}

// ─── Center Feed Area ────────────────────────────────────────────────────────
function CenterFeed({ user }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const userId = user?.id || user?._id;

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const data = await postsAPI.getAll();
      setPosts(data || []);
      setFetchError(false);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  };

  const handlePostCreated = (newPost) => setPosts(prev => [newPost, ...prev]);
  const handlePostDeleted = (id) => setPosts(prev => prev.filter(p => p._id !== id));

  const filteredPosts = posts.filter(p => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'hiring') return p.postType === 'hiring';
    if (activeFilter === 'work') return p.postType === 'looking for work';
    return true;
  });

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const itemVariants = { hidden: { y: 15, opacity: 0 }, show: { y: 0, opacity: 1 } };

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ marginBottom: '25px' }}>
        {userId && <CreatePostBox onPostCreated={handlePostCreated} />}
      </div>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
          <FiLoader className="spin" size={40} color="var(--accent)" />
        </div>
      ) : fetchError ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(255,0,0,0.05)', borderRadius: '20px' }}>
          <FiAlertTriangle size={40} color="var(--accent)" style={{ marginBottom: '16px' }} />
          <p style={{ color: '#fff', fontWeight: '700' }}>ไม่สามารถเชื่อมต่อข้อมูล Feed ได้ในขณะนี้</p>
          <button onClick={loadPosts} style={{ marginTop: '16px', padding: '12px 30px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '15px', fontWeight: '800', cursor: 'pointer' }}>RETRY CONNECTION</button>
        </div>
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <AnimatePresence mode="popLayout">
            {filteredPosts.map(post => (
              <motion.div layout key={post._id} variants={itemVariants} transition={{ duration: 0.3 }} style={{ willChange: 'transform, opacity' }}>
                <FeedPost post={post} onPostDeleted={handlePostDeleted} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

// ─── Left Sidebar: Work Categories ──────────────────────────────────────────
function LeftSidebar({ categories }) {
  const navigate = useNavigate();

  return (
    <aside style={{
      width: '260px', flexShrink: 0, position: 'sticky', top: '100px',
      height: 'calc(100vh - 120px)', overflowY: 'auto', paddingRight: '10px',
      scrollbarWidth: 'none', display: 'flex', flexDirection: 'column', gap: '12px'
    }}>
      <div style={{ padding: '0 10px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '10px' }}>
        <h3 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#fff', letterSpacing: '1px' }}>WORK CATEGORIES</h3>
      </div>
      {(Array.isArray(categories) ? categories : []).map((cat, i) => (
        <motion.div
          key={cat?._id || i}
          whileHover={{ x: 8 }}
          onClick={() => navigate(`/works?category=${encodeURIComponent(cat?.name || 'General')}`)}
          style={{
            padding: '12px 18px', borderRadius: '14px', background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '12px',
            cursor: 'pointer', transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            willChange: 'transform, background-color, border-color'
          }}
          className="category-item"
        >
          <div style={{ color: 'var(--accent)', fontSize: '1.1rem', display: 'flex', transition: '0.3s' }}>
            {getCategoryIcon(cat?.name)}
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#ccc', transition: '0.3s' }}>{cat?.name || 'General'}</span>
        </motion.div>
      ))}
    </aside>
  );
}

// ─── Main Home Page ───────────────────────────────────────────────────────────
function Home() {
  const { user } = useContext(AuthContext);
  let userInfo = user;
  if (!userInfo) {
    try {
      userInfo = JSON.parse(window.safeStorage.getItem('userInfo') || '{}');
    } catch (e) {
      userInfo = {};
    }
  }
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    categoriesAPI.getAll()
      .then(res => {
        // รองรับทั้งแบบส่ง Array มาตรงๆ หรือส่งออบเจกต์ที่มีฟิลด์ categories
        const data = Array.isArray(res) ? res : (res?.categories || res?.data || []);
        setCategories(data);
      })
      .catch(err => console.error('Categories load error:', err));
  }, []);

  return (
    <div style={{ background: '#000', minHeight: '100vh', color: '#fff', overflowX: 'hidden' }}>

      {/* Optimized Background Glows */}
      <div style={{ position: 'fixed', top: '-10%', left: '20%', width: '600px', height: '600px', background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)', opacity: 0.05, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '0', right: '10%', width: '500px', height: '500px', background: 'radial-gradient(circle, var(--indigo) 0%, transparent 70%)', opacity: 0.05, pointerEvents: 'none' }} />

      <div className="home-main-container" style={{
        maxWidth: '1600px', margin: '0 auto',
        padding: 'clamp(20px, 4vh, 40px) clamp(20px, 5vw, 60px) 60px',
        display: 'flex', gap: '30px', alignItems: 'flex-start'
      }}>
        <div className="home-left-sidebar"><LeftSidebar categories={categories} /></div>
        <CenterFeed user={userInfo} />
        <div className="home-right-sidebar"><RightSidebar user={userInfo} categories={categories} /></div>
      </div>

      <style>{`
        .home-main-container {
          transition: padding-left 0.4s ease;
        }
        @media (min-width: 1101px) {
          .home-main-container {
            padding-left: 110px !important;
          }
        }
        @media (min-width: 1500px) {
          .home-main-container {
            padding-left: 140px !important;
          }
        }
        .home-left-sidebar, .home-right-sidebar { display: block; }
        @media (max-width: 1400px) { .home-left-sidebar { display: none; } }
        @media (max-width: 1100px) { .home-right-sidebar { display: none; } }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        * { scroll-behavior: smooth; }
        .category-item:hover {
          background: rgba(255, 87, 51, 0.1) !important;
          border-color: rgba(255, 87, 51, 0.3) !important;
        }
        .category-item:hover span {
          color: #fff !important;
        }
      `}</style>
    </div>
  );
}

export default Home;
