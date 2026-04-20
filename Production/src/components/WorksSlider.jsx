import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { worksAPI } from '../utils/api';
import '../css/WorkSlider.css';
import { FiArrowRight } from 'react-icons/fi';

import { CONFIG } from '../utils/config';

const API_URL = CONFIG.API_BASE_URL;

function WorksSlider({ category }) {
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);

  const normalizeUrl = (path) => {
    if (!path || typeof path !== 'string' || path.trim() === "" || path === "null") return null;
    if (path.startsWith('http')) return path;
    const safePath = path.replace(/\\/g, '/');
    const fileName = safePath.replace(/^\/+/, '').replace(/^uploads\//, '');
    return `${API_URL}/uploads/${fileName}`;
  };

  useEffect(() => {
    const fetchWorks = async () => {
      try {
        setLoading(true);
        const res = await worksAPI.getAll();
        const allWorks = res.works || res || [];

        const targetLabel = category?.label?.trim().toLowerCase();

        const filtered = allWorks.filter(w => {
          const isPublished = w.status === "published";
          const dbCatName = (typeof w.category === 'object' ? w.category?.name : w.category) || "";
          const normalizedDbCatName = dbCatName.toString().trim().toLowerCase();

          const isMatchCategory = normalizedDbCatName === targetLabel ||
            normalizedDbCatName.includes(targetLabel) ||
            (targetLabel && targetLabel.includes(normalizedDbCatName));

          return isPublished && isMatchCategory;
        })
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 4);

        setWorks(filtered);
      } catch (err) {
        console.error("Error fetching works:", err);
      } finally {
        setLoading(false);
      }
    };

    if (category?.label) fetchWorks();
  }, [category?.label]);

  const isNew = (dateStr) => new Date(dateStr) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // ✅ ไม้ตายแก้ภาพ/วิดีโอไม่เต็มจอ
  const renderMedia = (work) => {
    const rawUrl = work.mediaUrl || work.mainImage?.url || work.mainImage || "";
    const safeUrl = normalizeUrl(rawUrl);
    const isVideo = work.type === 'video' || /\.(mp4|webm|ogg|mov)$/i.test(rawUrl);

    if (!safeUrl) {
      return <div style={{ position: "absolute", inset: 0, width: "100%", height: "100%", background: "#111", display: "flex", alignItems: "center", justifyContent: "center", color: "#666" }}>No Media</div>;
    }

    if (isVideo) {
      return (
        <video
          src={safeUrl}
          muted
          loop
          playsInline
          autoPlay
          // 🚀 บังคับ absolute เต็มกรอบ 100% 
          style={{ position: 'absolute', top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", backgroundColor: '#111', zIndex: 0 }}
        />
      );
    }

    return (
      <img
        src={safeUrl}
        alt={work.title}
        loading="lazy"
        // 🚀 บังคับ absolute เต็มกรอบ 100%
        style={{ position: 'absolute', top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", backgroundColor: '#111', zIndex: 0 }}
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />
    );
  };

  if (loading) return <div style={{ color: '#fff', padding: '20px', textAlign: 'center' }}>Lading {category?.label}...</div>;
  if (works.length === 0) return null;

  const [featured, ...rest] = works;

  return (
    <section className="ws-root">
      <div className="ws-header">
        <div className="ws-header-left">
          <div className="ws-eyebrow">
            <div className="ws-eyebrow-bar" />
            <span className="ws-eyebrow-text">Showcase</span>
          </div>
          <h2 className="ws-title">{category.label}</h2>
        </div>
        <Link to={category.href || '/works'} className="ws-view-all">
          View all projects <div className="ws-view-all-circle"><FiArrowRight size={24} /></div>
        </Link>
      </div>

      <div className="ws-grid">
        <Link to={`/works/${featured._id}`} className="ws-card ws-card-featured">
          {/* 🚀 บังคับ Wrapper ให้ขึงตึงเต็มการ์ด */}
          <div className="ws-media-wrapper" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'hidden' }}>
            {renderMedia(featured)}
          </div>
          <div className="ws-overlay" />
          {isNew(featured.createdAt) && <span className="ws-badge">New</span>}
          <span className="ws-num">01</span>
          <div className="ws-body">
            <div className="ws-cat">{featured.category?.name || category.label}</div>
            <div className="ws-name">{featured.title}</div>
            {featured.description && <p className="ws-desc">{featured.description.substring(0, 100)}...</p>}
            <div className="ws-explore">Click To See <div className="ws-arrow" />{FiArrowRight}</div>
          </div>
        </Link>

        {rest.map((work, i) => (
          <Link key={work._id} to={`/works/${work._id}`} className="ws-card">
            {/* 🚀 บังคับ Wrapper ให้ขึงตึงเต็มการ์ด */}
            <div className="ws-media-wrapper" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'hidden' }}>
              {renderMedia(work)}
            </div>
            <div className="ws-overlay" />
            {isNew(work.createdAt) && <span className="ws-badge">New</span>}
            <span className="ws-num">0{i + 2}</span>
            <div className="ws-body">
              <div className="ws-cat">{work.category?.name || category.label}</div>
              <div className="ws-name">{work.title}</div>
              <div className="ws-explore">Explore project <div className="ws-arrow" /></div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default WorksSlider;