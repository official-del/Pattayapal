import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { worksAPI } from '../../utils/api';
import { getFullUrl, isVideoUrl } from '../../utils/mediaUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiVideo, FiPlay, FiLayers, FiActivity, FiArrowRight } from 'react-icons/fi';

// 🎥 Sub-component for individual media items to handle their own error/video state cleanly
const MediaItem = ({ work, navigate }) => {
  const [isActuallyVideo, setIsActuallyVideo] = useState(work.type === 'video');
  const mediaUrl = getFullUrl(work.mainImage?.url || work.mediaUrl);

  return (
    <div style={{ position: 'relative', aspectRatio: '16/10', background: '#0a0a0a', overflow: 'hidden' }}>
      {isActuallyVideo ? (
        <>
          <video
            src={mediaUrl}
            muted preload="metadata" autoPlay loop playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7, transition: '0.5s' }}
            onMouseOver={e => e.target.style.opacity = 1}
            onMouseOut={e => e.target.style.opacity = 0.7}
          />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,87,51,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px var(--accent-glow)' }}>
              <FiPlay size={18} color="#fff" />
            </div>
          </div>
        </>
      ) : (
        <img
          src={mediaUrl}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6, transition: '0.5s' }}
          onMouseOver={e => e.target.style.opacity = 1}
          onMouseOut={e => e.target.style.opacity = 0.6}
          onError={() => {
            // ✅ Fix: Use state instead of manual DOM manipulation
            if (isVideoUrl(mediaUrl)) {
              setIsActuallyVideo(true);
            }
          }}
        />
      )}

      {/* Type Indicator */}
      <div style={{ position: 'absolute', top: '20px', left: '20px', padding: '8px 15px', borderRadius: '15px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.65rem', fontWeight: '700', color: 'var(--accent)', letterSpacing: '2px' }}>
        {(isActuallyVideo ? 'video' : (work.type || 'image')).toUpperCase()}
      </div>

      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: '0.3s' }} className="hover-overlay">
        <motion.button
          whileHover={{ scale: 1.1 }}
          onClick={() => navigate(`/works/${work._id}`)}
          style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--accent)', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <FiEye />
        </motion.button>
      </div>
    </div>
  );
};

function ManageWorks() {
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchMyWorks = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const id = userInfo._id || userInfo.id;
      const res = await worksAPI.getByUser(id);
      setWorks(res.works || []);
    } catch (err) {
      console.error("Fetch my works failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyWorks();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("ยืนยันการลบผลงานนี้ใช่หรือไม่? ข้อมูลจะถูกลบออกจากระบบอย่างถาวร")) return;
    try {
      const token = localStorage.getItem('userToken') || localStorage.getItem('token');
      await worksAPI.delete(id, token);
      setWorks(works.filter(w => w._id !== id));
    } catch (err) {
      alert("ล้มเหลว: " + err.message);
    }
  };

  if (loading) return (
    <div style={{ padding: '100px', textAlign: 'center' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} style={{ width: '40px', height: '40px', border: '3px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 20px' }} />
      <p style={{ color: '#444', fontWeight: '700', letterSpacing: '4px', fontSize: '0.8rem' }}>กำลังรวบรวมคลังผลงาน...</p>
    </div>
  );

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="fadeIn">
      
      {/* 🚀 Workspace Header */}
      <header style={{ marginBottom: '60px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '30px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
             <FiLayers color="var(--accent)" size={16} />
             <span style={{ color: 'var(--accent)', fontSize: '0.75rem', fontWeight: '700', letterSpacing: '4px' }}>คลังผลงาน</span>
          </div>
          <h2 style={{ fontSize: '3.5rem', fontWeight: '700', margin: 0, letterSpacing: '-2px', lineHeight: 1 }}>จัดการผลงาน</h2>
          <p style={{ color: '#444', marginTop: '15px', fontWeight: '700', fontSize: '0.95rem' }}>
            คุณมีผลงานทั้งหมด <span style={{ color: '#fff' }}>{works.length}</span> รายการในคลังข้อมูล
          </p>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Link to="/upload-work" style={{
             background: 'var(--accent)', color: '#fff', textDecoration: 'none', padding: '18px 35px', borderRadius: '30px', fontWeight: '700', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 10px 30px var(--accent-glow)'
          }}>
            <FiPlus /> เพิ่มผลงานใหม่
          </Link>
        </motion.div>
      </header>

      {/* 🧬 Works Grid */}
      <motion.div variants={containerVariants} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '30px' }}>
        {works.length === 0 ? (
          <motion.div variants={itemVariants} style={{ gridColumn: '1/-1', textAlign: 'center', padding: '120px 40px', background: 'rgba(255,255,255,0.01)', borderRadius: '50px', border: '1px dashed rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: '4rem', marginBottom: '25px', color: '#111' }}><FiVideo /></div>
            <h3 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '700' }}>ยังไม่มีข้อมูลผลงาน</h3>
            <p style={{ color: '#444', marginTop: '10px', fontWeight: '700' }}>เริ่มต้นสร้างความตื่นตาตื่นใจด้วยการเพิ่มผลงานชิ้นแรกของคุณลงในระบบ</p>
            <Link to="/upload-work" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginTop: '30px', color: 'var(--accent)', fontWeight: '700', textDecoration: 'none' }}>
              คลิกเพื่อเพิ่มงาน <FiArrowRight />
            </Link>
          </motion.div>
        ) : (
          works.map((work) => (
            <motion.div key={work._id} variants={itemVariants} whileHover={{ y: -10 }} className="glass" style={{ borderRadius: '40px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.03)', position: 'relative' }}>
              
              <MediaItem work={work} navigate={navigate} />
              
              <div style={{ padding: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                   <h4 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '700', color: '#fff', letterSpacing: '-0.5px' }}>{work.title}</h4>
                </div>
                
                <div style={{ display: 'flex', gap: '8px', marginBottom: '30px' }}>
                  <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.03)', color: '#444', padding: '6px 15px', borderRadius: '20px', fontWeight: '700' }}>{work.category?.name || 'ทั่วไป'}</span>
                  <span style={{ fontSize: '0.7rem', background: work.status === 'published' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)', color: work.status === 'published' ? '#22c55e' : '#f59e0b', padding: '6px 15px', borderRadius: '20px', fontWeight: '700' }}>
                    {work.status === 'published' ? 'เผยแพร่แล้ว' : 'ฉบับร่าง'}
                  </span>
                </div>
                
                <div style={{ display: 'flex', gap: '12px' }}>
                  <motion.button 
                    whileHover={{ scale: 1.02, background: 'rgba(255,255,255,0.05)' }}
                    onClick={() => navigate(`/edit-work/${work._id}`)}
                    style={{ flex: 1, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', padding: '15px', borderRadius: '20px', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: '0.3s' }}
                  >
                    <FiEdit2 /> แก้ไขข้อมูล
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.05, background: 'rgba(239,68,68,0.2)' }}
                    onClick={() => handleDelete(work._id)}
                    style={{ width: '55px', height: '55px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', transition: '0.3s' }}
                  >
                    <FiTrash2 />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>

      <style>{`
         .glass:hover .hover-overlay { opacity: 1; }
      `}</style>

    </motion.div>
  );
}

export default ManageWorks;
