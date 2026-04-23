import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { worksAPI } from '../utils/api';
import { getMediaUrl, workIsVideo } from '../utils/mediaUtils';
import { FiEye, FiActivity } from 'react-icons/fi';

function TopRanking({ label }) {
  const [trendingItems, setTrendingItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await worksAPI.getAll();
        const allWorks = (res.works || res || []).filter((w) => w.status === "published");
        const sorted = [...allWorks]
          .sort((a, b) => (b.views || 0) - (a.views || 0))
          .slice(0, 8);
        setTrendingItems(sorted);
      } catch (err) {
        console.error("Failed to fetch trending works:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrending();
  }, []);

  const handleNext = () => setCurrentIndex((prev) => (prev + 1) % trendingItems.length);
  const handlePrev = () => setCurrentIndex((prev) => (prev - 1 + trendingItems.length) % trendingItems.length);

  const handleDragEnd = (event, info) => {
    if (info.offset.x < -100) handleNext();
    else if (info.offset.x > 100) handlePrev();
  };

  if (loading) return null;
  if (trendingItems.length === 0) return null;

  return (
    <section style={{ padding: '100px 0', overflow: 'hidden' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '80px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
          <FiActivity color="var(--accent)" size={18} />
          <span style={{ color: 'var(--accent)', fontWeight: '700', letterSpacing: '4px', fontSize: '1.5rem' }}>Trending Now</span>
        </div>
        <h2 style={{ fontSize: '4rem', fontWeight: '700', margin: 0, letterSpacing: '-3px' }}>{label || "ยอดฮิตสัปดาห์นี้"}</h2>
      </div>

      <div style={{ position: 'relative', height: '600px', width: '100%', perspective: '2000px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', transformStyle: 'preserve-3d' }}>
          <AnimatePresence mode="popLayout">
            {trendingItems.map((work, index) => {
              const isVideo = workIsVideo(work);
              const mediaUrl = getMediaUrl(work);

              let offset = index - currentIndex;
              if (offset > 4) offset -= trendingItems.length;
              if (offset < -4) offset += trendingItems.length;

              const isVisible = Math.abs(offset) <= 2;
              if (!isVisible) return null;

              const x = offset * 320;
              const rotateY = offset * -35;
              const z = Math.abs(offset) * -400;
              const scale = 1 - Math.abs(offset) * 0.1;
              const opacity = 1 - Math.abs(offset) * 0.4;
              const zIndex = 10 - Math.abs(offset);

              return (
                <motion.div
                  key={work._id}
                  initial={false}
                  animate={{ x, rotateY, z, scale, opacity, zIndex }}
                  transition={{ type: "spring", stiffness: 150, damping: 25 }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  onDragEnd={handleDragEnd}
                  style={{
                    position: 'absolute', width: 'clamp(280px, 85vw, 380px)', height: 'clamp(400px, 60vh, 520px)', cursor: "grab",
                    transformStyle: 'preserve-3d', pointerEvents: index === currentIndex ? 'auto' : 'none'
                  }}
                >
                  <Link to={`/works/${work._id}`} style={{ textDecoration: 'none', display: 'block', height: '100%' }} draggable={false}>
                    <div style={{
                      position: 'relative', height: '100%', borderRadius: '40px', overflow: 'hidden',
                      background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.05)',
                      boxShadow: index === currentIndex ? '0 30px 60px rgba(255,87,51,0.2)' : '0 20px 40px rgba(0,0,0,0.5)'
                    }}>
                      {isVideo ? (
                        <video src={mediaUrl} muted loop playsInline autoPlay style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <img src={mediaUrl} alt={work.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )}

                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 60%)' }} />

                      <div style={{ position: 'absolute', bottom: '30px', left: '30px', right: '30px' }}>
                        <span style={{ color: 'var(--accent)', fontWeight: '700', fontSize: '0.65rem', letterSpacing: '2px' }}>{work.category?.name?.toUpperCase() || 'STUDIO'}</span>
                        <h3 style={{ color: '#fff', fontSize: '1.8rem', fontWeight: '700', margin: '8px 0 15px', lineHeight: 1.1, letterSpacing: '-1px' }}>{work.title}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#666', fontSize: '0.8rem', fontWeight: '700' }}>
                          <FiEye size={14} color="var(--accent)" />
                          <span style={{ letterSpacing: '1px' }}>{(work.views || 0).toLocaleString()} VIEWS</span>
                        </div>
                      </div>

                      {/* Ranking Number */}
                      <div style={{ position: 'absolute', top: '25px', right: '30px', fontSize: '5rem', fontWeight: '700', color: 'rgba(255,255,255,0.05)', lineHeight: 0.8 }}>
                        {index + 1}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '20px' }}>
        {trendingItems.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            style={{
              width: i === currentIndex ? '30px' : '8px', height: '8px', borderRadius: '8px',
              background: i === currentIndex ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
              border: 'none', cursor: 'pointer', transition: '0.3s'
            }}
          />
        ))}
      </div>
    </section>
  );
}

export default TopRanking;