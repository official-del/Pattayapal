import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { worksAPI } from '../utils/api';
import { getMediaUrl, workIsVideo, getFullUrl } from '../utils/mediaUtils';
import { FiArrowUpRight, FiClock, FiUser, FiLoader, FiGrid, FiLayers, FiSearch, FiZap, FiLayout, FiActivity } from 'react-icons/fi';
import Footer from '../components/Footer';

const FILTERS = ['All', 'Productions', 'Online Marketing', 'Graphic Design', 'Web Application', 'Motion Graphic', 'Photography'];

function Works() {
  const [works, setWorks] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [activeFilter, setActive] = useState('All');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [visible, setVisible] = useState(8);

  useEffect(() => {
    const fetchWorks = async () => {
      try {
        setLoading(true);
        const res = await worksAPI.getAll();
        const published = (res.works || []).filter(w => w.status === 'published');
        setWorks(published);
        setFiltered(published);
        setFetchError(false);
      } catch (err) {
        console.error('Failed to fetch works:', err);
        setFetchError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchWorks();
    window.scrollTo(0, 0);
  }, []);

  const handleFilter = (cat) => {
    setActive(cat);
    setVisible(8);
    setFiltered(cat === 'All' ? works : works.filter(w => w.category?.name === cat));
  };

  const totalVisible = filtered.slice(0, visible);
  const hasMore = visible < filtered.length;

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, scale: 0.9, y: 30 }, show: { opacity: 1, scale: 1, y: 0 } };

  return (
    <div style={{ background: '#000', minHeight: '100vh', paddingTop: '100px', color: '#fff' }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 5%' }}>

        {/* 🚀 Cinematic Hero Section */}
        <motion.header
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ padding: '100px 0 60px' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '40px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <FiZap color="var(--accent)" size={16} />
                <span style={{ color: 'var(--accent)', fontWeight: '700', fontSize: '0.7rem', letterSpacing: '3px' }}>CURATED WORK</span>
              </div>
              <h1 style={{ fontSize: 'clamp(3rem, 8vw, 6rem)', fontWeight: '700', margin: 0, letterSpacing: '-3px', lineHeight: 0.9 }}>USER<br /><span style={{ color: 'transparent', WebkitTextStroke: '1px rgba(255,255,255,0.2)' }}>CREATIONS</span></h1>
            </div>
            <div style={{ maxWidth: '400px', paddingBottom: '10px' }}>
              <p style={{ color: '#555', lineHeight: 1.6, fontSize: '1rem', marginBottom: '25px', fontWeight: '500' }}>
                Exploring the intersection of digital craft and cinematic storytelling. A selection of projects that push the boundaries of modern production.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div className="glass" style={{ padding: '12px 24px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#fff', lineHeight: 1 }}>{works.length}</div>
                  <div style={{ fontSize: '0.6rem', color: '#444', fontWeight: '700', letterSpacing: '1px', lineHeight: 1.2 }}>TOTAL<br />PROJECTS</div>
                </div>
              </div>
            </div>
          </div>
        </motion.header>

        {/* 🧬 Holographic Filtering Console */}
        <motion.nav
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            display: 'flex', gap: '8px', padding: '10px 0',
            marginBottom: '60px', overflowX: 'auto', whiteSpace: 'nowrap',
            scrollbarWidth: 'none', msOverflowStyle: 'none'
          }}
        >
          {FILTERS.map(f => (
            <motion.button
              key={f}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleFilter(f)}
              style={{
                background: activeFilter === f ? 'var(--accent)' : 'rgba(255,255,255,0.02)',
                color: activeFilter === f ? '#fff' : '#666',
                padding: '12px 24px', borderRadius: '15px', cursor: 'pointer',
                border: activeFilter === f ? 'none' : '1px solid rgba(255,255,255,0.05)',
                fontSize: '0.8rem', fontWeight: '700', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', letterSpacing: '0.5px'
              }}
            >
              {f}
            </motion.button>
          ))}
        </motion.nav>

        {/* 🎬 Cinematic Project Grid */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '150px', gap: '20px' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} style={{ width: '40px', height: '40px', border: '3px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%' }} />
            <span style={{ fontWeight: '700', letterSpacing: '4px', fontSize: '0.8rem', color: '#444' }}>SYNCING ARCHIVE...</span>
          </div>
        ) : fetchError ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '150px', gap: '20px', textAlign: 'center' }}>
            <FiAlertTriangle size={50} color="var(--accent)" />
            <span style={{ fontWeight: '700', letterSpacing: '2px', fontSize: '1rem', color: '#fff' }}>CONNECTION INTERRUPTED</span>
            <p style={{ color: '#444', maxWidth: '400px' }}>The creative uplink was refused. Please check your network or reboot the service.</p>
            <button onClick={() => window.location.reload()} style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '12px 30px', borderRadius: '15px', fontWeight: '700', cursor: 'pointer', marginTop: '10px' }}>RETRY CONNECTION</button>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(300px, 100%, 400px), 1fr))',
              gap: '40px 30px', paddingBottom: '100px'
            }}
          >
            <AnimatePresence mode="popLayout">
              {totalVisible.map((work) => {
                const mediaUrl = getMediaUrl(work);
                const isVideo = workIsVideo(work);

                return (
                  <motion.div
                    layout
                    key={work._id}
                    variants={itemVariants}
                    style={{ position: 'relative' }}
                  >
                    <Link to={`/works/${work._id}`} style={{ textDecoration: 'none' }}>
                      <motion.div
                        whileHover={{ y: -10 }}
                        className="glass-card"
                        style={{
                          padding: '15px', borderRadius: '28px', overflow: 'hidden',
                          height: '100%', display: 'flex', flexDirection: 'column'
                        }}
                      >

                        {/* 🖼️ Immersive Media Display */}
                        <div style={{ position: 'relative', width: '100%', aspectRatio: '16/10', borderRadius: '20px', overflow: 'hidden', background: '#080808' }}>
                          <div style={{ position: 'absolute', top: '15px', left: '15px', zIndex: 10 }}>
                            <div style={{
                              padding: '6px 12px', borderRadius: '10px', background: 'rgba(0,0,0,0.5)',
                              backdropFilter: 'blur(10px)', color: '#fff', fontSize: '0.6rem',
                              fontWeight: '700', letterSpacing: '1.5px', border: '1px solid rgba(255,255,255,0.1)'
                            }}>
                              {work.category?.name?.toUpperCase() || 'GENERAL'}
                            </div>
                          </div>

                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                            style={{ width: '100%', height: '100%' }}
                          >
                            {isVideo ? (
                              <video src={mediaUrl} muted loop playsInline autoPlay style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <img src={mediaUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={work.title} />
                            )}
                          </motion.div>

                          <motion.div
                            initial={{ opacity: 0 }} whileHover={{ opacity: 1 }}
                            style={{
                              position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)',
                              backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
                              justifyContent: 'center', transition: '0.3s'
                            }}
                          >
                            <div className="glass" style={{ width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                              <FiArrowUpRight size={20} />
                            </div>
                          </motion.div>
                        </div>

                        {/* 📝 Tactical Intelligence Panel */}
                        <div style={{ padding: '20px 10px 10px' }}>
                          <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#fff', margin: '0 0 12px', letterSpacing: '-0.5px', lineHeight: 1.2 }}>{work.title}</h3>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#111', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                                {work.createdBy?.profileImage?.url ?
                                  <img src={getFullUrl(work.createdBy.profileImage.url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> :
                                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: '#222', fontSize: '0.7rem' }}><FiUser /></div>
                                }
                              </div>
                              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#555' }}>{work.createdBy?.name || 'Anonymous'}</span>
                            </div>
                            <div style={{ color: '#222', fontSize: '0.8rem' }}>
                              <FiActivity />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}

        {/* 📡 Grid Expansion (Load More) */}
        {hasMore && !loading && (
          <div style={{ paddingBottom: '150px', display: 'flex', justifyContent: 'center' }}>
            <motion.button
              whileHover={{ scale: 1.02, background: 'var(--accent)', borderColor: 'var(--accent)', color: '#fff' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setVisible(v => v + 3)}
              style={{
                padding: '18px 50px', borderRadius: '15px', color: '#666',
                fontWeight: '700', letterSpacing: '2px', fontSize: '0.8rem', cursor: 'pointer',
                border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)', transition: '0.3s'
              }}
            >
              LOAD MORE ARCHIVES
            </motion.button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default Works;