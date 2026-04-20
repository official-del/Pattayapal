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
      <div style={{ background: '#000', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', gap: '40px' }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center' }}>
          <FiTarget size={80} color="#111" style={{ marginBottom: '30px' }} />
          <h2 style={{ fontSize: '3rem', fontWeight: '700', letterSpacing: '-1.5px' }}>การเข้าถึงถูกจำกัด</h2>
          <p style={{ color: '#444', fontWeight: '700', letterSpacing: '1px', fontSize: '1rem', marginTop: '10px' }}>กรุณาเข้าสู่ระบบเพื่อเข้าถึงส่วนนี้</p>
          <button onClick={() => window.location.href = '/login'} className="glass" style={{ marginTop: '50px', padding: '20px 60px', borderRadius: '40px', color: 'var(--accent)', border: '1px solid var(--accent)', fontWeight: '700', cursor: 'pointer' }}>เข้าสู่ระบบเพื่อปลดล็อค</button>
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
    <div style={{ background: '#000', minHeight: '100vh', paddingTop: '100px', paddingBottom: '150px', color: '#fff' }}>
      <div style={{ maxWidth: '850px', margin: '0 auto', padding: '0 30px' }}>

        {/* 📡 Grid Transmission Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '70px', position: 'relative', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', marginBottom: '20px' }}>
            <FiZap color="var(--accent)" size={18} />
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--accent)' }}></span>
          </div>
          <h1 className="feed-title" style={{ fontWeight: '700', margin: 0, letterSpacing: '-5px', lineHeight: 0.85 }}>ProductionFeed</h1>
          <p className="feed-subtitle" style={{ color: '#444', margin: '30px auto 0', fontWeight: '700', letterSpacing: '1px', maxWidth: '600px' }}>
            จุดศูนย์กลางการแลกเปลี่ยนข่าวสาร ประกาศจ้างงาน และอัปเดตผลงานในโลก Production
          </p>

          {/* 🧬 Selective Node Filtering */}
          <div className="feed-filter-bar" style={{ display: 'inline-flex', gap: '15px', marginTop: '60px', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.03)' }}>
            {[
              { id: 'all', label: 'ALL' },
              { id: 'hiring', label: 'COLLABS' },
              { id: 'work', label: 'FIND TEAM' }
            ].map(filter => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                style={{
                  padding: '12px 30px', borderRadius: '35px', fontSize: '0.85rem', fontWeight: '700',
                  color: activeFilter === filter.id ? '#fff' : '#444', border: 'none',
                  background: activeFilter === filter.id ? 'var(--accent)' : 'transparent', cursor: 'pointer', transition: '0.3s',
                  boxShadow: activeFilter === filter.id ? '0 10px 25px var(--accent-glow)' : 'none'
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
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '120px', gap: '25px' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} style={{ width: '45px', height: '45px', border: '3px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%' }} />
            <span style={{ fontWeight: '700', color: '#111', fontSize: '0.85rem' }}>Loading Data...</span>
          </div>
        ) : fetchError ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '120px', gap: '25px', textAlign: 'center' }}>
            <FiAlertTriangle size={50} color="var(--accent)" />
            <span style={{ fontWeight: '700', letterSpacing: '2px', fontSize: '1rem', color: '#fff' }}>CONNECTION INTERRUPTED</span>
            <p style={{ color: '#444', maxWidth: '400px' }}>The creative uplink was refused. Please check your network or reboot the service.</p>
            <button onClick={loadPosts} style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '12px 30px', borderRadius: '15px', fontWeight: '700', cursor: 'pointer', marginTop: '10px' }}>RETRY CONNECTION</button>
          </div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '120px', background: 'rgba(255,255,255,0.01)', borderRadius: '50px', border: '1px dashed rgba(255,255,255,0.03)' }}>
                <FiHash size={50} color="#111" style={{ marginBottom: '30px' }} />
                <p style={{ color: '#444', fontWeight: '700', letterSpacing: '3px', fontSize: '0.9rem' }}>ไม่มีโพสต์สำหรับหมวดหมู่นี้</p>
                <button onClick={loadPosts} className="glass" style={{ marginTop: '35px', padding: '18px 45px', borderRadius: '35px', color: 'var(--accent)', fontWeight: '700', cursor: 'pointer', border: '1px solid rgba(255,87,51,0.2)' }}>รีเฟรชระบบ</button>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>

      <style>{`
        .feed-title { font-size: 6rem; }
        .feed-subtitle { font-size: 1.2rem; }
        .feed-filter-bar {
          display: inline-flex;
        }

        @media (max-width: 768px) {
          .feed-title {
            font-size: 3rem;
            letter-spacing: -2px !important;
          }
          .feed-subtitle {
            font-size: 1rem;
          }
          .feed-filter-bar {
            display: flex !important;
            flex-wrap: wrap;
            justify-content: center;
            border-radius: 20px !important;
          }
          .feed-filter-bar button {
            flex: 1 1 30%;
            padding: 10px !important;
            font-size: 0.75rem !important;
            border-radius: 15px !important;
          }
        }
      `}</style>
    </div>
  );
}

export default Feed;
