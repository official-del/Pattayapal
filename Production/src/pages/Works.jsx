import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { worksAPI } from '../utils/api';
import { getMediaUrl, workIsVideo, getFullUrl } from '../utils/mediaUtils';
import { FiLoader, FiAlertTriangle, FiArrowRight } from 'react-icons/fi';
import Footer from '../components/Footer';
import HoverVideoPlayer from '../components/HoverVideoPlayer';
import { useSocket } from '../context/SocketContext';

const FILTERS = [
  'All', 'Productions', 'Online Marketing', 'Graphic Design',
  'Web Application', 'Motion Graphic', 'Photography',
  'Videography', 'Content Creator', 'Editing', 'Production',
  'VFX & Animation', 'Digital Art'
];

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
        const res = await worksAPI.getAll();
        const data = res.works || res || [];
        const published = Array.isArray(data) ? data.filter(w => w.status === 'published') : [];
        setWorks(published);

        const catParam = searchParams.get('category');
        if (catParam) {
          setActive(catParam);
          setFiltered(published.filter(w => w.category?.name === catParam));
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

  const handleFilter = (cat) => {
    setActive(cat);
    setFiltered(cat === 'All' ? works : works.filter(w => w.category?.name === cat));
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] } }
  };

  return (
    <div className="works-main-container">
      <div className="works-content-wrapper">

        {/* 🏆 Showcase Header */}
        <header className="works-header">
          <div className="header-badge">
            <div className="badge-line" />
            <span className="badge-text">SHOWCASE</span>
          </div>
          <div className="header-main">
            <h1 className="header-title">
              {activeFilter === 'All' ? 'ALL PROJECTS' : activeFilter}
            </h1>
            <div className="header-action hide-mobile">
              <span className="action-text">VIEW ALL PROJECTS</span>
              <div className="action-circle">
                <FiArrowRight size={18} />
              </div>
            </div>
          </div>
        </header>

        {/* 🧬 Filter Navigation */}
        <nav className="filter-nav">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => handleFilter(f)}
              className={`filter-btn ${activeFilter === f ? 'active' : ''}`}
            >
              {f}
            </button>
          ))}
        </nav>

        {/* 🎬 Showcase Grid (Bento Style 4 Columns) */}
        {loading ? (
          <div className="works-loader">
            <FiLoader className="spin" size={50} color="var(--accent)" />
          </div>
        ) : filtered.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="works-grid"
          >
            {filtered.map((work, index) => {
              const mediaUrl = getMediaUrl(work);
              const isVideo = workIsVideo(work);
              // Layout Logic: โปรเจกต์แรกของทุกๆ 5 อันจะใหญ่ (Span 2x2)
              const isLarge = index % 5 === 0;

              return (
                <motion.div
                  key={work._id}
                  variants={itemVariants}
                  className={`showcase-card ${isLarge ? 'card-large' : ''}`}
                >
                  <Link to={`/works/${work._id}`}>
                    <div className="card-inner">
                      {isVideo ? (
                        <HoverVideoPlayer
                          src={mediaUrl}
                          poster={typeof work.mainImage === 'string' ? getFullUrl(work.mainImage) : (work.mainImage?.url ? getFullUrl(work.mainImage.url) : '')}
                          className="card-media"
                        />
                      ) : (
                        <img
                          src={mediaUrl}
                          loading="lazy"
                          className="card-media showcase-img"
                          alt={work.title}
                        />
                      )}

                      <div className="showcase-overlay">
                        <div className="overlay-content">
                          <div className="overlay-cat">
                            {work.category?.name?.toUpperCase() || 'GRAPHIC DESIGN'}
                          </div>
                          <h6 className="overlay-title">
                            {work.title}
                          </h6>
                          <div className="overlay-action">
                            <span className="action-label">
                              EXPLORE PROJECT <FiArrowRight size={14} style={{ marginLeft: '4px' }} />
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* NEW Badge */}
                      {new Date(work.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) && (
                        <div className="new-badge">NEW</div>
                      )}
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <div className="works-empty">
            <FiAlertTriangle size={50} color="#333" style={{ marginBottom: '20px' }} />
            <h2 className="empty-text">NO PROJECTS IN THIS CATEGORY</h2>
          </div>
        )}
      </div>

      {/* CSS Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;600;800;900&display=swap');

        :root {
          --accent: #ff6b35; /* Primary Orange */
          --bg-color: #050505;
        }

        .works-main-container {
          background: var(--bg-color);
          min-height: 100vh;
          color: #fff;
          padding: clamp(80px, 8vh, 100px) clamp(20px, 5vw, 60px) 40px;
          font-family: 'Inter', sans-serif;
        }

        @media (min-width: 1501px) {
          .works-main-container { padding-left: 110px !important; }
        }

        .works-content-wrapper { 
          maxWidth: 1600px; 
          margin: 0 auto; 
          padding: 0 4%; 
        }
        
        /* ── HEADER ── */
        .works-header { 
          padding: 60px 0 30px; 
          border-bottom: 1px solid rgba(255,255,255,0.1); 
          margin-bottom: 50px; 
        }
        .header-badge { 
          display: flex; 
          align-items: center; 
          gap: 12px; 
          margin-bottom: 15px; 
        }
        .badge-line { 
          width: 3px; 
          height: 16px; 
          background: var(--accent); 
        }
        .badge-text { 
          font-size: 0.85rem; 
          font-weight: 900; 
          letter-spacing: 4px; 
          color: #fff; 
        }
        .header-main { 
          display: flex; 
          justify-content: space-between; 
          align-items: flex-end; 
          gap: 30px; 
        }
        .header-title { 
          font-family: 'Inter', sans-serif;
          font-size: clamp(3rem, 8vw, 7.5rem); 
          font-weight: 900; 
          margin: 0; 
          letter-spacing: -2px; 
          text-transform: uppercase; 
          line-height: 0.9; 
          color: #fff; 
        }
        .header-action { 
          display: flex; 
          align-items: center; 
          gap: 15px; 
          padding-bottom: 15px; 
          cursor: pointer;
        }
        .action-text { 
          font-size: 0.75rem; 
          color: rgba(255,255,255,0.5); 
          font-weight: 800; 
          letter-spacing: 1px; 
        }
        .action-circle { 
          width: 40px; 
          height: 40px; 
          border-radius: 50%; 
          border: 1px solid rgba(255,255,255,0.2); 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          color: rgba(255,255,255,0.5); 
          transition: 0.3s;
        }
        .header-action:hover .action-circle {
          border-color: #fff;
          color: #fff;
        }

        /* ── FILTER NAV ── */
        .filter-nav { 
          display: flex; 
          gap: 10px; 
          margin-bottom: 60px; 
          overflow-x: auto; 
          padding-bottom: 10px; 
          scrollbar-width: none; 
        }
        .filter-nav::-webkit-scrollbar { display: none; }
        .filter-btn { 
          background: #151515; 
          color: rgba(255,255,255,0.4); 
          border: none; 
          padding: 12px 24px; 
          border-radius: 100px; 
          font-weight: 700; 
          font-size: 0.8rem; 
          cursor: pointer; 
          transition: 0.3s; 
          white-space: nowrap; 
        }
        .filter-btn:hover { background: #252525; color: #fff; }
        .filter-btn.active { background: var(--accent); color: #fff; }

        /* ── BENTO GRID LAYOUT ── */
        .works-grid { 
          display: grid; 
          grid-template-columns: repeat(4, 1fr); 
          grid-auto-rows: 350px; /* Fixed height for small cards */
          gap: 20px; 
          padding-bottom: 100px; 
        }
        .showcase-card { 
          position: relative; 
          overflow: hidden; 
          cursor: pointer; 
          background: #0a0a0a; 
          border-radius: 4px; /* Slight rounding for polish */
        }
        .card-large { 
          grid-column: span 2; 
          grid-row: span 2; 
        } 
        
        .card-inner { 
          width: 100%; 
          height: 100%; 
          position: relative; 
        }
        .card-media { 
          width: 100%; 
          height: 100%; 
          object-fit: cover; 
          transition: transform 1.2s cubic-bezier(0.2, 1, 0.2, 1); 
        }
        .showcase-card:hover .card-media { transform: scale(1.05); }

        /* ── OVERLAY & TYPOGRAPHY ── */
        .showcase-overlay { 
          position: absolute; 
          inset: 0; 
          background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.2) 50%, transparent 100%);
          display: flex; 
          flex-direction: column; 
          justify-content: flex-end;
          padding: 30px; 
          opacity: 1; /* Always visible to match screenshot */
          transition: all 0.4s ease;
        }
        
        .overlay-cat { 
          color: var(--accent); 
          font-size: 0.75rem; 
          font-weight: 900; 
          letter-spacing: 1px; 
          margin-bottom: 6px; 
        }
        .overlay-title { 
          color: #fff; 
          font-size: 1.5rem; 
          font-weight: 900; 
          margin: 0 0 10px 0; 
          line-height: 1.1; 
          text-transform: uppercase; 
        }
        .card-large .overlay-title {
          font-size: 2.8rem;
          margin-bottom: 15px;
        }
        .action-label { 
          color: #fff; 
          font-size: 0.75rem; 
          font-weight: 800; 
          display: flex; 
          align-items: center; 
          opacity: 0.8; 
          transition: 0.3s;
        }
        .showcase-card:hover .action-label { opacity: 1; color: var(--accent); }

        /* ── BADGE ── */
        .new-badge { 
          position: absolute; 
          top: 20px; 
          right: 20px; 
          background: var(--accent); 
          color: #fff; 
          padding: 4px 10px; 
          font-size: 0.7rem; 
          font-weight: 900; 
          border-radius: 2px; 
          z-index: 10; 
          letter-spacing: 1px;
        }

        /* ── UTILS ── */
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .works-loader, .works-empty { padding: 150px 0; text-align: center; }
        .empty-text { font-weight: 800; color: #555; }

        /* ── RESPONSIVE ── */
        @media (max-width: 1200px) {
          .works-grid { grid-auto-rows: 300px; gap: 15px; }
          .header-title { font-size: 5rem; }
          .card-large .overlay-title { font-size: 2.2rem; }
        }
        @media (max-width: 992px) {
          .works-grid { grid-template-columns: repeat(2, 1fr); }
          /* Large card takes up full width on tablet */
          .card-large { grid-column: span 2; grid-row: span 2; } 
          .header-title { font-size: 4rem; }
        }
        @media (max-width: 767px) {
          .works-grid { grid-template-columns: 1fr; grid-auto-rows: 350px; }
          .card-large { grid-column: span 1; grid-row: span 1; }
          .header-title { font-size: 3rem; }
          .hide-mobile { display: none; }
          .showcase-overlay { padding: 20px; }
        }
      `}</style>

      <Footer />
    </div>
  );
}

export default Works;