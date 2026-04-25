import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { worksAPI } from '../../utils/api';
import { getFullUrl, isVideoUrl } from '../../utils/mediaUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiVideo, FiPlay, FiLayers, FiActivity, FiArrowRight } from 'react-icons/fi';
import '../../css/ManageWorks.css';

// 🎥 Sub-component for individual media items
const MediaItem = ({ work, navigate }) => {
  const [isActuallyVideo, setIsActuallyVideo] = useState(work.type === 'video');
  const mediaUrl = getFullUrl(work.mainImage?.url || work.mediaUrl);

  return (
    <div className="mw-media-box">
      {isActuallyVideo ? (
        <>
          <video
            src={mediaUrl}
            muted preload="metadata" autoPlay loop playsInline
          />
          <div className="mw-play-overlay">
            <div className="play-icon-glow">
              <FiPlay size={18} color="#fff" />
            </div>
          </div>
        </>
      ) : (
        <img
          src={mediaUrl}
          alt=""
          onError={() => {
            if (isVideoUrl(mediaUrl)) setIsActuallyVideo(true);
          }}
        />
      )}

      {/* Type Indicator */}
      <div className="mw-type-tag">
        {(isActuallyVideo ? 'video' : (work.type || 'image')).toUpperCase()}
      </div>

      <div className="hover-overlay-btn">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(`/works/${work._id}`)}
          className="preview-btn-main"
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
    <div className="mw-loading-container">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="mw-loader" />
      <p>กำลังรวบรวมคลังผลงาน...</p>
    </div>
  );

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="manage-works-container">
      
      {/* 🚀 Workspace Header */}
      <header className="mw-header">
        <div className="mw-title-group">
          <div className="mw-badge">
             <FiLayers color="var(--mw-accent)" size={18} />
             <span className="mw-badge-text">คลังผลงาน / WORKSPACE</span>
          </div>
          <h2 className="mw-main-title">จัดการผลงาน</h2>
          <p className="mw-subtitle">
            คุณมีผลงานทั้งหมด <span>{works.length}</span> รายการในคลังข้อมูล
          </p>
        </div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Link to="/upload-work" className="mw-add-btn">
            <FiPlus /> เพิ่มผลงานใหม่
          </Link>
        </motion.div>
      </header>

      {/* 🧬 Works Grid */}
      <motion.div variants={containerVariants} className="mw-grid">
        {works.length === 0 ? (
          <motion.div variants={itemVariants} className="mw-empty-state">
            <div className="empty-icon"><FiVideo /></div>
            <h3>ยังไม่มีข้อมูลผลงาน</h3>
            <p>เริ่มต้นสร้างความตื่นตาตื่นใจด้วยการเพิ่มผลงานชิ้นแรกของคุณลงในระบบ</p>
            <Link to="/upload-work" className="empty-action">
              คลิกเพื่อเพิ่มงาน <FiArrowRight />
            </Link>
          </motion.div>
        ) : (
          works.map((work) => (
            <motion.div key={work._id} variants={itemVariants} className="work-card">
              
              <MediaItem work={work} navigate={navigate} />
              
              <div className="mw-card-content">
                <h4 className="work-title">{work.title}</h4>
                
                <div className="tag-row">
                  <span className="category-tag">{work.category?.name || 'ทั่วไป'}</span>
                  <span className={`status-tag ${work.status === 'published' ? 'status-published' : 'status-draft'}`}>
                    {work.status === 'published' ? 'เผยแพร่แล้ว' : 'ฉบับร่าง'}
                  </span>
                </div>
                
                <div className="action-row">
                  <motion.button 
                    whileHover={{ y: -2 }}
                    onClick={() => navigate(`/edit-work/${work._id}`)}
                    className="edit-btn"
                  >
                    <FiEdit2 /> แก้ไขข้อมูล
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    onClick={() => handleDelete(work._id)}
                    className="delete-btn"
                  >
                    <FiTrash2 />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>

    </motion.div>
  );
}

export default ManageWorks;
