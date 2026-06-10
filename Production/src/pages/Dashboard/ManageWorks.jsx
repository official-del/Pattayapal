import { customConfirm } from '../../utils/customConfirm';
import { toast } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { worksAPI } from '../../utils/api';
import { getMediaUrl, getWorkPosterUrl, getWorkVideoUrl, isVideoUrl, workIsVideo } from '../../utils/mediaUtils';
import { motion } from 'framer-motion';
import {
  FiArrowRight,
  FiEdit2,
  FiEye,
  FiGrid,
  FiImage,
  FiLayers,
  FiPlus,
  FiTrash2,
  FiVideo,
} from 'react-icons/fi';
import HoverVideoPlayer from '../../components/HoverVideoPlayer';
import PremiumLoader from '../../components/PremiumLoader';
import '../../css/ManageWorks.css';

function MediaItem({ work, navigate }) {
  const [isActuallyVideo, setIsActuallyVideo] = useState(workIsVideo(work));
  const mediaUrl = getMediaUrl(work);
  const videoUrl = getWorkVideoUrl(work);
  const posterUrl = getWorkPosterUrl(work);
  const mediaType = isActuallyVideo ? 'Video' : (work.type || 'Image');

  return (
    <div className="mw-media-box">
      {isActuallyVideo ? (
        <HoverVideoPlayer src={videoUrl} poster={posterUrl} style={{ width: '100%', height: '100%' }} />
      ) : (
        <img
          src={mediaUrl}
          alt={work.title || 'Portfolio preview'}
          onError={() => {
            if (isVideoUrl(mediaUrl)) setIsActuallyVideo(true);
          }}
        />
      )}

      <div className="mw-type-tag">
        {isActuallyVideo ? <FiVideo size={13} /> : <FiImage size={13} />}
        {mediaType}
      </div>

      <button type="button" onClick={() => navigate(`/works/${work._id}`)} className="mw-preview-btn" aria-label={`Preview ${work.title || 'work'}`}>
        <FiEye size={17} />
      </button>
    </div>
  );
}

function ManageWorks() {
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchMyWorks = async () => {
    try {
      const userInfo = JSON.parse(window.safeStorage.getItem('userInfo'));
      const id = userInfo._id || userInfo.id;
      const res = await worksAPI.getByUser(id);
      setWorks(res.works || []);
    } catch (err) {
      console.error('Fetch my works failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyWorks();
  }, []);

  const handleDelete = async (id) => {
    if (!await customConfirm('Delete this portfolio item? This action cannot be undone.')) return;
    try {
      const token = window.safeStorage.getItem('userToken') || window.safeStorage.getItem('token');
      await worksAPI.delete(id, token);
      setWorks(works.filter((work) => work._id !== id));
      toast.success('Portfolio item deleted.');
    } catch (err) {
      toast.error(`Delete failed: ${err.message}`);
    }
  };

  if (loading) {
    return <PremiumLoader text="Syncing Portfolio..." subtext="Preparing your creator gallery." />;
  }

  const publishedCount = works.filter((work) => work.status === 'published').length;
  const draftCount = works.length - publishedCount;
  const videoCount = works.filter((work) => workIsVideo(work)).length;
  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.045 } } };
  const itemVariants = { hidden: { y: 14, opacity: 0 }, show: { y: 0, opacity: 1 } };

  return (
    <motion.main variants={containerVariants} initial="hidden" animate="show" className="manage-works-container">
      <header className="mw-header">
        <div className="mw-title-group">
          <div className="mw-kicker"><FiLayers size={16} /><span>Portfolio Console</span></div>
          <h1>Manage Portfolio</h1>
          <p>Organize your published works, drafts, and media previews from one compact creator workspace.</p>
        </div>
        <Link to="/upload-work" className="mw-add-btn">
          <FiPlus size={17} /> Add Work
        </Link>
      </header>

      <section className="mw-stats-grid" aria-label="Portfolio summary">
        <div className="mw-stat-card"><span>Total works</span><strong>{works.length}</strong></div>
        <div className="mw-stat-card is-green"><span>Published</span><strong>{publishedCount}</strong></div>
        <div className="mw-stat-card is-blue"><span>Video items</span><strong>{videoCount}</strong></div>
        <div className="mw-stat-card is-orange"><span>Drafts</span><strong>{draftCount}</strong></div>
      </section>

      <section className="mw-toolbar">
        <div>
          <div className="mw-kicker"><FiGrid size={15} /><span>Gallery Grid</span></div>
          <h2>Your creator works</h2>
        </div>
        <span>{works.length} items</span>
      </section>

      <motion.section variants={containerVariants} className="mw-grid">
        {works.length === 0 ? (
          <motion.div variants={itemVariants} className="mw-empty-state">
            <div className="mw-empty-icon"><FiVideo size={30} /></div>
            <h2>No portfolio items yet</h2>
            <p>Add your first work so clients can inspect your style, media quality, and creator profile.</p>
            <Link to="/upload-work" className="mw-empty-action">
              Add first work <FiArrowRight size={16} />
            </Link>
          </motion.div>
        ) : (
          works.map((work) => (
            <motion.article key={work._id} variants={itemVariants} className="work-card">
              <MediaItem work={work} navigate={navigate} />

              <div className="mw-card-content">
                <div className="mw-card-heading">
                  <h3 className="work-title">{work.title || 'Untitled work'}</h3>
                  <span className={`status-tag ${work.status === 'published' ? 'status-published' : 'status-draft'}`}>
                    {work.status === 'published' ? 'Published' : 'Draft'}
                  </span>
                </div>

                <div className="tag-row">
                  <span className="category-tag">{work.category?.name || 'General'}</span>
                  {work.type && <span className="category-tag">{work.type}</span>}
                </div>

                <div className="action-row">
                  <button type="button" onClick={() => navigate(`/edit-work/${work._id}`)} className="edit-btn">
                    <FiEdit2 size={15} /> Edit Work
                  </button>
                  <button type="button" onClick={() => handleDelete(work._id)} className="delete-btn" aria-label={`Delete ${work.title || 'work'}`}>
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>
            </motion.article>
          ))
        )}
      </motion.section>
    </motion.main>
  );
}

export default ManageWorks;
