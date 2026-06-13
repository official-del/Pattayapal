import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { postsAPI, worksAPI, usersAPI, categoriesAPI } from '../utils/api';
import CreatePostBox from '../components/CreatePostBox';
import FeedPost from '../components/FeedPost';
import { motion, AnimatePresence } from 'framer-motion';
import { getFullUrl, getMediaUrl, getWorkPosterUrl, getWorkVideoUrl, workIsVideo } from '../utils/mediaUtils';
import {
  FiZap, FiAlertTriangle,
  FiUsers, FiCamera, FiVideo, FiSliders, FiFilm, FiLayout, FiPenTool,
  FiMaximize, FiCpu, FiBriefcase, FiStar, FiEye, FiChevronRight, FiLogIn, FiUserPlus
} from 'react-icons/fi';
import OptimizedImage from '../components/OptimizedImage';
import PremiumLoader from '../components/PremiumLoader';
import Footer from '../components/Footer';
import '../css/Home.css';

const MotionDiv = motion.div;

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
function RightSidebar() {
  const navigate = useNavigate();
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
    <aside className="home-right-rail">

      {/* Trending Section */}
      <div className="home-sidebar-panel home-support-panel">
        <div className="home-panel-label">
          HEATING UP THE FEED
        </div>
        <div className="home-panel-heading">
          Trending creations
        </div>

        {loadingTrending ? (
          <PremiumLoader fullScreen={false} size="small" text="Loading Trends..." />
        ) : trending.length > 0 ? (
          <div className="home-trending-frame">
            {trending.map((item, index) => {
              const diff = index - currentTrendingIndex;
              const isActive = index === currentTrendingIndex;

              return (
                <MotionDiv
                  key={item._id}
                  className={`home-trending-card ${isActive ? 'is-active' : ''}`}
                  animate={{
                    x: diff * 14,
                    scale: isActive ? 1 : 0.78,
                    opacity: isActive ? 1 : 0.18,
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
                  onClick={() => navigate(`/works/${item._id}`)}
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
                      src={getWorkVideoUrl(item)}
                      poster={getWorkPosterUrl(item)}
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
                </MotionDiv>
              );
            })}

            <div className="home-trending-dots">
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
      <div className="home-sidebar-panel home-support-panel">
        <div className="home-panel-label">
          <FiStar size={14} />
          <span>RANKING HUBS</span>
        </div>
        <div className="home-panel-heading">
          Community rankings
        </div>

        {loadingFreelancers ? (
          <PremiumLoader fullScreen={false} size="small" text="Loading Creators..." />
        ) : (
          <div className="home-ranking-list">
            {topFreelancers.map((freelancer, index) => {
              const rank = index + 1;
              const isRank1 = rank === 1;
              return (
                <div key={freelancer._id || index} className={`home-ranking-card ${isRank1 ? 'is-rank-one' : ''}`}>
                  <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div className="home-ranking-number" style={{
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
                      onClick={() => navigate(`/profile/${freelancer._id}`)}
                      className="home-ranking-avatar"
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
                  <div className="home-ranking-copy">
                    <div className="home-ranking-name">{freelancer.name}</div>
                    <div className="home-ranking-role">{freelancer.profession || 'CREATOR'}</div>
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
          <div className="home-sidebar-panel home-support-panel">
            <div className="home-panel-label">
              <FiZap size={14} />
              <span>CORE SERVICES</span>
            </div>
            <div className="home-panel-heading">
              Explore services
            </div>

            <div className="home-service-list">
              {PROFESSIONS.map((prof, i) => (
                <MotionDiv
                  key={i}
                  onClick={() => navigate(`/freelancers?profession=${encodeURIComponent(prof.name)}`)}
                  className="home-service-item"
                  whileTap={{ scale: 0.985 }}
                >
                  <div className="home-service-icon">
                    {prof.icon}
                  </div>
                  <div className="home-service-copy">
                    <div className="home-service-name">{prof.name}</div>
                    <div className="home-service-cta">Find freelancers</div>
                  </div>
                  <FiChevronRight className="home-service-chevron" size={14} />
                </MotionDiv>
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
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
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
  const handlePostDeleted = (id) => {
    setPosts(prev => prev.filter(p => p._id !== id));
    setActiveCommentPostId(prev => (prev === id ? null : prev));
  };

  const handleToggleComments = (postId) => {
    setActiveCommentPostId(prev => (prev === postId ? null : postId));
  };

  const filteredPosts = posts.filter(p => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'hiring') return p.postType === 'hiring';
    if (activeFilter === 'work') return p.postType === 'looking for work';
    return true;
  });

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { delayChildren: 0.04, staggerChildren: 0.035 } } };
  const itemVariants = {
    hidden: { y: 12, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } }
  };
  const toolbarVariants = {
    hidden: { y: -8, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] } }
  };

  return (
    <div className="home-feed-column">
      <MotionDiv className="home-feed-toolbar" variants={toolbarVariants} initial="hidden" animate="show">
        <div className="home-feed-toolbar-copy">
          <div className="ui-kicker">PattayaPal Feed</div>
          <div className="home-feed-toolbar-title">Live community board</div>
        </div>
        <div className="home-feed-filters" role="tablist" aria-label="Feed filters">
          {[
            ['all', 'All posts'],
            ['hiring', 'Hiring'],
            ['work', 'Looking for work']
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`home-filter-btn ${activeFilter === value ? 'is-active' : ''}`}
              onClick={() => setActiveFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </MotionDiv>
      <div>
        {userId && <CreatePostBox onPostCreated={handlePostCreated} />}
      </div>
      {loading ? (
        <PremiumLoader fullScreen={false} size="small" text="Loading Feed..." />
      ) : fetchError ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(255,0,0,0.05)', borderRadius: '20px' }}>
          <FiAlertTriangle size={40} color="var(--accent)" style={{ marginBottom: '16px' }} />
          <p style={{ color: '#fff', fontWeight: '700' }}>ไม่สามารถเชื่อมต่อข้อมูล Feed ได้ในขณะนี้</p>
          <button onClick={loadPosts} style={{ marginTop: '16px', padding: '12px 30px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '15px', fontWeight: '800', cursor: 'pointer' }}>RETRY CONNECTION</button>
        </div>
      ) : (
        <MotionDiv variants={containerVariants} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <AnimatePresence mode="popLayout">
            {filteredPosts.map(post => (
              <MotionDiv layout key={post._id} variants={itemVariants} style={{ willChange: 'transform, opacity' }}>
                <FeedPost
                  post={post}
                  onPostDeleted={handlePostDeleted}
                  isCommentsOpen={activeCommentPostId === post._id}
                  onToggleComments={handleToggleComments}
                />
              </MotionDiv>
            ))}
          </AnimatePresence>
        </MotionDiv>
      )}
    </div>
  );
}

// ─── Left Sidebar: Work Categories ──────────────────────────────────────────
function LeftSidebar({ categories }) {
  const navigate = useNavigate();

  return (
    <aside className="home-category-sidebar">
      <div className="home-category-heading">
        <div className="ui-kicker">Browse by role</div>
        <h3 className="home-sidebar-title">Work categories</h3>
      </div>
      <div className="home-category-list">
      {(Array.isArray(categories) ? categories : []).map((cat, i) => (
        <MotionDiv
          key={cat?._id || i}
          onClick={() => navigate(`/works?category=${encodeURIComponent(cat?.name || 'General')}`)}
          className="home-category-item"
          whileTap={{ scale: 0.985 }}
        >
          <div className="home-category-icon">
            {getCategoryIcon(cat?.name)}
          </div>
          <span className="home-category-name">{cat?.name || 'General'}</span>
        </MotionDiv>
      ))}
      </div>
    </aside>
  );
}

// ─── Main Home Page ───────────────────────────────────────────────────────────
function GuestAuthBar() {
  return (
    <div className="home-guest-auth-wrap">
      <div className="home-guest-auth">
        <div className="home-guest-auth-copy">
          <div className="ui-kicker">PattayaPal Guild Access</div>
          <p>เข้าสู่ระบบหรือสมัครสมาชิกเพื่อโพสต์งาน คอมเมนต์ และจัดการโปรไฟล์ creator ของคุณ</p>
        </div>
        <div className="home-guest-auth-actions" aria-label="Account actions">
          <Link to="/login" className="home-guest-login">
            <FiLogIn />
            <span>Login now</span>
          </Link>
          <Link to="/login" state={{ isRegister: true }} className="home-guest-register">
            <FiUserPlus />
            <span>Register now</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function MobileLaunchPad({ categories }) {
  const quickActions = [
    {
      to: '/freelancers',
      icon: <FiUsers />,
      label: 'Find creators',
      note: 'Browse talent fast',
    },
    {
      to: '/works',
      icon: <FiLayout />,
      label: 'Explore works',
      note: 'See portfolios first',
    },
    {
      to: '/rankings',
      icon: <FiStar />,
      label: 'Rankings',
      note: 'Open top creators',
    },
    {
      to: '/upload-work',
      icon: <FiPenTool />,
      label: 'Post a work',
      note: 'Share a project',
    },
  ];

  const visibleCategories = (Array.isArray(categories) ? categories : []).slice(0, 6);

  return (
    <section className="home-mobile-launchpad" aria-label="Mobile quick access">
      <div className="home-mobile-launchpad-hero">
        <div className="ui-kicker">Mobile quick access</div>
        <h2>One-hand browsing, less stack</h2>
        <p>Jump to creators, works, rankings, or categories without the desktop-sized layout.</p>
      </div>

      <div className="home-mobile-action-grid">
        {quickActions.map((action) => (
          <Link key={action.to} to={action.to} className="home-mobile-action-card">
            <span className="home-mobile-action-icon">{action.icon}</span>
            <strong className="home-mobile-action-label">{action.label}</strong>
            <span className="home-mobile-action-note">{action.note}</span>
          </Link>
        ))}
      </div>

      {visibleCategories.length > 0 && (
        <div className="home-mobile-chip-section">
          <div className="home-mobile-chip-label">Browse categories</div>
          <div className="home-mobile-chip-row" aria-label="Category shortcuts">
            {visibleCategories.map((cat, index) => (
              <Link
                key={cat?._id || cat?.name || index}
                to={`/works?category=${encodeURIComponent(cat?.name || 'General')}`}
                className="home-mobile-chip"
              >
                {cat?.name || 'General'}
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function Home() {
  const { user, token } = useContext(AuthContext);
  let userInfo = user;
  let activeToken = token;
  if (!userInfo) {
    try {
      activeToken = activeToken || window.safeStorage.getItem('userToken') || window.safeStorage.getItem('token');
      userInfo = JSON.parse(window.safeStorage.getItem('userInfo') || '{}');
    } catch {
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
    <>
      <div className="home-page">
        {!activeToken && <GuestAuthBar />}
        <MobileLaunchPad categories={categories} />
        <div className="home-main-container">
          <div className="home-left-sidebar"><LeftSidebar categories={categories} /></div>
          <CenterFeed user={userInfo} />
          <div className="home-right-sidebar"><RightSidebar /></div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default Home;
