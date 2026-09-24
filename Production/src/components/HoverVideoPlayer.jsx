import { useRef, useState, useEffect } from 'react';

/**
 * HoverVideoPlayer — แสดงวิดีโอใน Feed
 * - แสดงภาพนิ่งจาก poster หรือ video frame แรก
 * - กดปุ่ม Play เพื่อเล่นพร้อม native controls
 * - Pause อัตโนมัติเมื่อ scroll ออกจากหน้า
 */
const HoverVideoPlayer = ({ src, poster, className, style, onClick }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isInView, setIsInView] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);

  // Lazy load — เริ่ม render video element ต่อเมื่อมองเห็นใน viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => setIsInView(e.isIntersecting)),
      { threshold: 0.1 }
    );
    const el = containerRef.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, []);

  // Pause เมื่อ scroll ออกจากหน้า
  useEffect(() => {
    if (!isInView && videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause();
      setIsPlaying(false);
      setShowControls(false);
    }
  }, [isInView]);

  const handlePlayToggle = (e) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
      setShowControls(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: '#0a0a0a',
        ...style,
      }}
      onClick={onClick}
    >
      {/* Video element — render ทันทีที่ in-view */}
      {isInView && (
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          muted
          playsInline
          loop
          preload="metadata"
          controls={showControls}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => { setIsPlaying(false); setShowControls(false); }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: showControls ? 'contain' : 'cover',
            display: 'block',
          }}
        />
      )}

      {/* Play Overlay — แสดงเมื่อยังไม่ได้กด play */}
      {!isPlaying && (
        <div
          onClick={handlePlayToggle}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.30)',
            cursor: 'pointer',
            zIndex: 4,
          }}
        >
          {/* VIDEO badge มุมบนซ้าย */}
          <div style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            background: 'rgba(0,0,0,0.70)',
            color: '#a855f7',
            border: '1px solid rgba(168,85,247,0.55)',
            borderRadius: '6px',
            padding: '3px 9px',
            fontSize: '10px',
            fontWeight: '800',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            backdropFilter: 'blur(6px)',
          }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="#a855f7"><path d="M8 5v14l11-7z"/></svg>
            Video
          </div>

          {/* ปุ่ม Play ตรงกลาง */}
          <div
            style={{
              width: '58px',
              height: '58px',
              borderRadius: '50%',
              background: 'rgba(168,85,247,0.18)',
              border: '2px solid rgba(168,85,247,0.72)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.18s, background 0.18s',
              boxShadow: '0 0 24px rgba(168,85,247,0.3)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(168,85,247,0.4)';
              e.currentTarget.style.transform = 'scale(1.12)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(168,85,247,0.18)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white" style={{ marginLeft: '3px' }}>
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

export default HoverVideoPlayer;
