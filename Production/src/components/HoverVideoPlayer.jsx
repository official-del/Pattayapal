import { useRef, useState, useEffect } from 'react';

/**
 * HoverVideoPlayer — แสดงวิดีโอใน Feed
 * - แสดงตัววิดีโอโดยคงสัดส่วนเดิมเต็มที่ไม่โดนครอป (objectFit: contain)
 * - กำหนด maxHeight เหมาะสม ไม่ยาวย้วยเกินหน้าจอ
 * - รองรับ Fullscreen ในตัวโดยไม่หลุด/ไม่เด้ง
 */
const HoverVideoPlayer = ({ src, poster, className, style, onClick }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ตรวจจับ Fullscreen change เพื่อไม่ให้ pause ตอนขยาย/ย่อจอ
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFull = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      setIsFullscreen(isFull);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Pause เมื่อ scroll ออกจากหน้า (เฉพาะตอนที่ไม่ได้เปิดโหมด Fullscreen อยู่)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting && videoRef.current && !videoRef.current.paused) {
            // เช็คว่าไม่ได้อยู่ใน fullscreen mode
            const isFull = !!(
              document.fullscreenElement ||
              document.webkitFullscreenElement
            );
            if (!isFull) {
              videoRef.current.pause();
              setIsPlaying(false);
            }
          }
        });
      },
      { threshold: 0.15 }
    );

    const el = containerRef.current;
    if (el) observer.observe(el);
    return () => {
      if (el) observer.unobserve(el);
    };
  }, []);

  const handlePlayToggle = (e) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
        setShowControls(true);
      }).catch(() => {});
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
        maxWidth: '100%',
        maxHeight: style?.maxHeight || 'min(78vh, 650px)',
        height: 'auto',
        aspectRatio: style?.aspectRatio,
        background: '#050505',
        borderRadius: style?.borderRadius,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        ...style,
      }}
      onClick={onClick}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        muted={!showControls}
        playsInline
        webkit-playsinline="true"
        loop
        preload="metadata"
        controls={showControls}
        onPlay={() => {
          setIsPlaying(true);
          setShowControls(true);
        }}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
        }}
        style={{
          width: '100%',
          maxHeight: style?.maxHeight || 'min(78vh, 650px)',
          height: 'auto',
          objectFit: 'contain',
          display: 'block',
          margin: '0 auto',
          background: '#000',
        }}
      />

      {/* Play Overlay — แสดงตอนยังไม่ได้กด play */}
      {!isPlaying && (
        <div
          onClick={handlePlayToggle}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.32)',
            cursor: 'pointer',
            zIndex: 4,
          }}
        >
          {/* VIDEO badge มุมบนซ้าย */}
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              background: 'rgba(0,0,0,0.72)',
              color: '#a855f7',
              border: '1px solid rgba(168,85,247,0.55)',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: '800',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              backdropFilter: 'blur(6px)',
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="#a855f7">
              <path d="M8 5v14l11-7z" />
            </svg>
            Video
          </div>

          {/* ปุ่ม Play ตรงกลาง */}
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(168,85,247,0.22)',
              border: '2px solid rgba(168,85,247,0.85)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.18s, background 0.18s',
              boxShadow: '0 0 28px rgba(168,85,247,0.4)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(168,85,247,0.45)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(168,85,247,0.22)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white" style={{ marginLeft: '4px' }}>
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

export default HoverVideoPlayer;