import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { worksAPI } from '../utils/api';
import { getMediaUrl, getWorkPosterUrl, getWorkVideoUrl, workIsVideo } from '../utils/mediaUtils';
import { FiAlertTriangle, FiBriefcase } from 'react-icons/fi';
import PremiumLoader from '../components/PremiumLoader';
import Footer from '../components/Footer';
import HoverVideoPlayer from '../components/HoverVideoPlayer';
import { useSocket } from '../context/SocketContext';
import '../css/Works.css';

const FILTERS = [
  'All', 'Productions', 'Online Marketing', 'Graphic Design',
  'Web Application', 'Motion Graphic', 'Photography',
  'Videography', 'Content Creator', 'Editing', 'Production',
  'VFX & Animation', 'Digital Art'
];

function WorkCoverImage({ src, alt, priority = false }) {
  const [ready, setReady] = useState(false);

  return (
    <>
      {!ready && (
        <div className="media-loader-overlay" aria-hidden="true">
          <PremiumLoader bare size="tiny" text="Loading cover" />
        </div>
      )}
      <img
        src={src}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        className={`card-media showcase-img ${ready ? 'is-ready' : 'is-loading'}`}
        alt={alt}
        onLoad={() => setReady(true)}
        onError={() => setReady(true)}
      />
    </>
  );
}

function Works() {
  const [searchParams] = useSearchParams();
  const [works, setWorks] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [activeFilter, setActive] = useState('All');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const { socket } = useSocket();

  useEffect(() => {
    const fetchWorks = async () => {
      try {
        setLoading(true);
        const res = await worksAPI.getAll({ status: 'published', view: 'gallery' });
        const data = res.works || res || [];
        const published = Array.isArray(data) ? data : [];
        setWorks(published);

        const catParam = searchParams.get('category');
        if (catParam) {
          setActive(catParam);
          setFiltered(published.filter((work) => work.category?.name === catParam));
        } else {
          setActive('All');
          setFiltered(published);
        }

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
  }, [searchParams]);

  useEffect(() => {
    if (!socket) return undefined;

    const handleWorkUpdate = () => {
      worksAPI.getAll({ status: 'published', view: 'gallery' })
        .then((res) => {
          const data = res.works || res || [];
          const published = Array.isArray(data) ? data : [];
          setWorks(published);
          setFiltered(activeFilter === 'All' ? published : published.filter((work) => work.category?.name === activeFilter));
        })
        .catch(() => {});
    };

    socket.on('work_updated', handleWorkUpdate);
    return () => socket.off('work_updated', handleWorkUpdate);
  }, [socket, activeFilter]);

  const handleFilter = (cat) => {
    setActive(cat);
    setFiltered(cat === 'All' ? works : works.filter((work) => work.category?.name === cat));
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.34, ease: [0.23, 1, 0.32, 1] } }
  };

  return (
    <main className="works-main-container">
      <div className="works-content-wrapper">
        <header className="works-header">
          <div className="header-badge">
            <div className="badge-line" />
            <span className="badge-text">Community Works</span>
          </div>
          <div className="header-main">
            <h1 className="header-title">
              {activeFilter === 'All' ? 'All Projects' : activeFilter}
            </h1>
            <div className="header-action hide-mobile">
              <span className="action-text">{filtered.length} Projects</span>
              <div className="action-circle">
                <FiBriefcase size={18} />
              </div>
            </div>
          </div>
        </header>

        <nav className="filter-nav" aria-label="Filter creations">
          {FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => handleFilter(filter)}
              className={`filter-btn ${activeFilter === filter ? 'active' : ''}`}
            >
              {filter}
            </button>
          ))}
        </nav>

        {loading ? (
          <PremiumLoader text="Loading Creations..." subtext="กำลังโหลดผลงานทั้งหมด..." />
        ) : fetchError ? (
          <div className="works-empty">
            <FiAlertTriangle size={42} />
            <h2>Unable to load creations</h2>
            <p>Please try refreshing the page.</p>
          </div>
        ) : filtered.length > 0 ? (
          <motion.section
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="works-grid"
          >
            {filtered.map((work, index) => {
              const mediaUrl = getMediaUrl(work);
              const isVideo = workIsVideo(work);
              const videoUrl = getWorkVideoUrl(work);
              const posterUrl = getWorkPosterUrl(work);
              const isNew = new Date(work.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
              const isLarge = index % 5 === 0;

              return (
                <motion.article
                  key={work._id}
                  variants={itemVariants}
                  className={`showcase-card ${isLarge ? 'card-large' : ''}`}
                >
                  <Link to={`/works/${work._id}`} className="card-inner">
                    {isVideo ? (
                      <HoverVideoPlayer
                        src={videoUrl}
                        poster={posterUrl}
                        className="card-media"
                      />
                    ) : (
                      <WorkCoverImage
                        src={mediaUrl}
                        alt={work.title || 'Creator work'}
                        priority={index < 2}
                      />
                    )}

                    <div className="showcase-overlay">
                      <div className="overlay-content">
                        <div className="overlay-topline">
                          <span className="overlay-cat">{work.category?.name || 'General'}</span>
                        </div>
                        <h2 className="overlay-title">{work.title || 'Untitled creation'}</h2>
                        <div className="overlay-footer">
                          <span className="action-label">View work <FiBriefcase size={13} /></span>
                          <span className="overlay-views">{Number(work.views || 0).toLocaleString()} views</span>
                        </div>
                      </div>
                    </div>
                    {isNew && <span className="new-badge">New</span>}
                  </Link>
                </motion.article>
              );
            })}
          </motion.section>
        ) : (
          <div className="works-empty">
            <FiAlertTriangle size={42} />
            <h2>No projects in this category</h2>
            <p>Try another role or come back after creators publish more work.</p>
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}

export default Works;
