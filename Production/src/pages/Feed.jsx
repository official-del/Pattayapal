import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { postsAPI } from '../utils/api';
import CreatePostBox from '../components/CreatePostBox';
import FeedPost from '../components/FeedPost';
import { motion, AnimatePresence } from 'framer-motion';
import { FiLoader, FiActivity, FiSearch, FiFilter, FiZap, FiTarget, FiHash, FiAlertTriangle } from 'react-icons/fi';

function Feed() {
  const { user, token: contextToken } = useContext(AuthContext);
  const currentToken = contextToken || localStorage.getItem('userToken') || localStorage.getItem('token');
  const userInfo = user || JSON.parse(localStorage.getItem('userInfo') || '{}');

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  const userId = userInfo?._id || userInfo?.id;

  useEffect(() => {
    if (userId) loadPosts();
  }, [userId]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const data = await postsAPI.getAll();
      setPosts(data);
      setFetchError(false);
    } catch (err) {
      console.error(err);
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  };

  const handlePostCreated = (newPost) => setPosts([newPost, ...posts]);
  const handlePostDeleted = (deletedPostId) => setPosts(posts.filter(p => p._id !== deletedPostId));

  if (!userInfo?._id && !userInfo?.id) {
    return (
      <div style={{ background: '#000', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', gap: 'clamp(20px, 5vw, 40px)', padding: 'clamp(20px, 3vw, 40px)' }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center' }}>
          <FiTarget style={{ width: '80px', height: '80px', marginBottom: 'clamp(20px, 5vw, 30px)' }} color="#111" />
          <h2 style={{ fontSize: 'clamp(1.8rem, 6vw, 3rem)', fontWeight: '700', letterSpacing: '-1.5px', margin: '0 0 clamp(10px, 2vw, 15px) 0' }}>การเข้าถึงถูกจำกัด</h2>
          <p style={{ color: '#444', fontWeight: '700', letterSpacing: '1px', fontSize: 'clamp(0.8rem, 2vw, 1rem)', marginTop: 'clamp(8px, 1vw, 10px)', maxWidth: '500px' }}>กรุณาเข้าสู่ระบบเพื่อเข้าถึงส่วนนี้</p>
          <button onClick={() => window.location.href = '/login'} className="glass" style={{ marginTop: 'clamp(30px, 8vw, 50px)', padding: 'clamp(14px, 3vw, 20px) clamp(35px, 8vw, 60px)', borderRadius: '40px', color: 'var(--accent)', border: '1px solid var(--accent)', fontWeight: '700', cursor: 'pointer', fontSize: 'clamp(0.8rem, 1.5vw, 1rem)' }}>เข้าสู่ระบบเพื่อปลดล็อค</button>
        </motion.div>
      </div>
    );
  }

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } };

  const filteredPosts = posts.filter(p => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'hiring') return p.postType === 'hiring';
    if (activeFilter === 'work') return p.postType === 'looking for work';
    return true;
  });

  return (
    <div style={{ background: '#000', minHeight: '100vh', paddingTop: 'clamp(60px, 10vw, 100px)', paddingBottom: 'clamp(80px, 15vw, 150px)', color: '#fff' }}>
      <div style={{ maxWidth: '850px', margin: '0 auto', padding: '0 clamp(12px, 3vw, 30px)' }}>

        {/* 📡 Grid Transmission Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 'clamp(40px, 8vw, 70px)', position: 'relative', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'clamp(10px, 2vw, 15px)', marginBottom: 'clamp(15px, 3vw, 20px)' }}>
            <FiZap color="var(--accent)" style={{ width: '18px', height: '18px' }} />
            <span style={{ fontSize: 'clamp(0.7rem, 1.2vw, 0.8rem)', fontWeight: '700', color: 'var(--accent)' }}></span>
          </div>
          <h1 className="feed-title" style={{ fontWeight: '500', margin: 0, letterSpacing: '2px', lineHeight: 0.85 }}>Production Feed</h1>
          <p className="feed-subtitle" style={{ color: '#444', margin: 'clamp(20px, 4vw, 30px) auto 0', fontWeight: '700', letterSpacing: 'clamp(0.5px, 0.5vw, 1px)', maxWidth: '600px' }}>
            จุดศูนย์กลางการแลกเปลี่ยนข่าวสาร ประกาศจ้างงาน และอัปเดตผลงานในโลก Production
          </p>

          {/* 🧬 Selective Node Filtering */}
          <div className="feed-filter-bar" style={{ display: 'inline-flex', gap: 'clamp(10px, 2vw, 15px)', marginTop: 'clamp(40px, 8vw, 60px)', background: 'rgba(255,255,255,0.02)', padding: 'clamp(8px, 1.5vw, 10px)', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.03)', flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              { id: 'all', label: 'ALL' },
              { id: 'hiring', label: 'COLLABS' },
              { id: 'work', label: 'FIND TEAM' }
            ].map(filter => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                style={{
                  padding: 'clamp(8px, 2vw, 12px) clamp(18px, 4vw, 30px)', borderRadius: '35px', fontSize: 'clamp(0.7rem, 1.3vw, 0.85rem)', fontWeight: '700',
                  color: activeFilter === filter.id ? '#fff' : '#444', border: 'none',
                  background: activeFilter === filter.id ? 'var(--accent)' : 'transparent', cursor: 'pointer', transition: '0.3s',
                  boxShadow: activeFilter === filter.id ? '0 10px 25px var(--accent-glow)' : 'none', whiteSpace: 'nowrap'
                }}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ✍️ Intelligence Submission (Create Post) */}
        <CreatePostBox onPostCreated={handlePostCreated} />

        {/* 🧬 Feed Infrastructure Stream */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'clamp(60px, 15vw, 120px)', gap: 'clamp(15px, 3vw, 25px)' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} style={{ width: '45px', height: '45px', border: '3px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%' }} />
            <span style={{ fontWeight: '700', color: '#111', fontSize: 'clamp(0.75rem, 1.5vw, 0.85rem)' }}>Loading Data...</span>
          </div>
        ) : fetchError ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'clamp(60px, 15vw, 120px)', gap: 'clamp(15px, 3vw, 25px)', textAlign: 'center' }}>
            <FiAlertTriangle style={{ width: '50px', height: '50px' }} color="var(--accent)" />
            <span style={{ fontWeight: '700', letterSpacing: '2px', fontSize: 'clamp(0.85rem, 2vw, 1rem)', color: '#fff' }}>CONNECTION INTERRUPTED</span>
            <p style={{ color: '#444', maxWidth: '400px', fontSize: 'clamp(0.75rem, 1.5vw, 0.9rem)' }}>The creative uplink was refused. Please check your network or reboot the service.</p>
            <button onClick={loadPosts} style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: 'clamp(8px, 2vw, 12px) clamp(20px, 4vw, 30px)', borderRadius: '15px', fontWeight: '700', cursor: 'pointer', marginTop: 'clamp(8px, 1.5vw, 10px)', fontSize: 'clamp(0.75rem, 1.3vw, 0.85rem)' }}>RETRY CONNECTION</button>
          </div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px, 2vw, 20px)' }}>
            <AnimatePresence mode="popLayout">
              {filteredPosts.map(post => (
                <motion.div
                  layout
                  key={post._id}
                  variants={itemVariants}
                  transition={{ duration: 0.4, ease: 'circOut' }}
                >
                  <FeedPost post={post} onPostDeleted={handlePostDeleted} />
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredPosts.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: 'clamp(60px, 15vw, 120px)', background: 'rgba(255,255,255,0.01)', borderRadius: '50px', border: '1px dashed rgba(255,255,255,0.03)' }}>
                <FiHash style={{ width: '50px', height: '50px', marginBottom: 'clamp(20px, 4vw, 30px)' }} color="#111" />
                <p style={{ color: '#444', fontWeight: '700', letterSpacing: '3px', fontSize: 'clamp(0.75rem, 1.5vw, 0.9rem)' }}>ไม่มีโพสต์สำหรับหมวดหมู่นี้</p>
                <button onClick={loadPosts} className="glass" style={{ marginTop: 'clamp(20px, 4vw, 35px)', padding: 'clamp(12px, 2vw, 18px) clamp(30px, 5vw, 45px)', borderRadius: '35px', color: 'var(--accent)', fontWeight: '700', cursor: 'pointer', border: '1px solid rgba(255,87,51,0.2)', fontSize: 'clamp(0.8rem, 1.3vw, 0.9rem)' }}>รีเฟรชระบบ</button>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>

      <style>{`
        .feed-title { 
          font-size: clamp(2rem, 8vw, 6rem);
        }
        
        .feed-subtitle { 
          font-size: clamp(0.9rem, 2.5vw, 1.2rem);
        }
        
        .feed-filter-bar {
          display: inline-flex;
          gap: clamp(10px, 2vw, 15px);
        }

        /* ── DESKTOP (1024px+) ── */
        @media (min-width: 1025px) {
          .feed-title {
            font-size: 6rem;
            letter-spacing: -5px;
          }
          .feed-subtitle {
            font-size: 1.2rem;
            letter-spacing: 1px;
          }
          .feed-filter-bar {
            gap: 15px;
            padding: 10px;
            border-radius: 40px;
          }
          .feed-filter-bar button {
            padding: 12px 30px;
            font-size: 0.85rem;
            border-radius: 35px;
          }
        }

        /* ── TABLET (768px - 1024px) ── */
        @media (max-width: 1024px) {
          .feed-title {
            font-size: 4rem;
            letter-spacing: -3px;
          }
          .feed-subtitle {
            font-size: 1rem;
            letter-spacing: 0.5px;
          }
          .feed-filter-bar {
            gap: clamp(10px, 2vw, 15px);
            padding: clamp(6px, 1vw, 8px);
            border-radius: 30px;
            flex-wrap: wrap;
            justify-content: center;
          }
          .feed-filter-bar button {
            padding: clamp(8px, 1.5vw, 10px) clamp(18px, 3vw, 25px);
            font-size: clamp(0.7rem, 1.2vw, 0.8rem);
            border-radius: 30px;
          }
        }

        /* ── SMALL TABLET (600px - 768px) ── */
        @media (max-width: 768px) {
          .feed-title {
            font-size: clamp(2.5rem, 6vw, 3.5rem);
            letter-spacing: -2px;
          }
          .feed-subtitle {
            font-size: clamp(0.85rem, 2vw, 1rem);
            letter-spacing: 0.5px;
          }
          .feed-filter-bar {
            display: flex !important;
            flex-wrap: wrap;
            justify-content: center;
            gap: clamp(8px, 1.5vw, 12px);
            border-radius: 20px !important;
            padding: clamp(6px, 1vw, 8px) !important;
          }
          .feed-filter-bar button {
            flex: 1 1 auto;
            min-width: 80px;
            padding: clamp(8px, 1.5vw, 10px) clamp(16px, 2.5vw, 20px) !important;
            font-size: clamp(0.65rem, 1.1vw, 0.75rem) !important;
            border-radius: 15px !important;
          }
        }

        /* ── MOBILE (480px - 600px) ── */
        @media (max-width: 600px) {
          .feed-title {
            font-size: clamp(2rem, 5.5vw, 2.8rem);
            letter-spacing: -1.5px;
          }
          .feed-subtitle {
            font-size: clamp(0.8rem, 1.8vw, 0.95rem);
            letter-spacing: 0.3px;
          }
          .feed-filter-bar {
            gap: clamp(6px, 1vw, 10px);
            padding: clamp(5px, 0.8vw, 6px) !important;
            border-radius: 15px !important;
          }
          .feed-filter-bar button {
            padding: clamp(7px, 1.2vw, 9px) clamp(12px, 2vw, 16px) !important;
            font-size: clamp(0.6rem, 1vw, 0.7rem) !important;
            border-radius: 12px !important;
          }
        }

        /* ── SMALL MOBILE (320px - 480px) ── */
        @media (max-width: 480px) {
          .feed-title {
            font-size: clamp(1.8rem, 4.5vw, 2.4rem);
            letter-spacing: -1px;
            margin: 0;
          }
          .feed-subtitle {
            font-size: clamp(0.75rem, 1.5vw, 0.85rem);
            letter-spacing: 0.2px;
            margin: clamp(12px, 2vw, 15px) auto 0 !important;
          }
          .feed-filter-bar {
            gap: 6px;
            padding: 4px !important;
            border-radius: 12px !important;
            margin-top: clamp(20px, 4vw, 30px) !important;
          }
          .feed-filter-bar button {
            padding: 6px clamp(10px, 1.5vw, 14px) !important;
            font-size: clamp(0.55rem, 0.9vw, 0.65rem) !important;
            border-radius: 10px !important;
            min-width: 60px;
          }
        }
      `}</style>
    </div>
  );
}

export default Feed;
