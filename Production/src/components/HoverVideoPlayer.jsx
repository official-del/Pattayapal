import { useRef, useState, useEffect } from 'react';

/**
 * HoverVideoPlayer component
 * Shows a poster image by default, plays video on hover.
 * Helps reduce page lag by not autoplaying multiple videos.
 */
const HoverVideoPlayer = ({ src, poster, className, style, onClick }) => {
  const videoRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!videoRef.current) return;

    if (isHovered) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(err => console.log("Play error:", err));
    } else {
      videoRef.current.pause();
      videoRef.current.currentTime = 0.1;
    }
  }, [isHovered]);

  const handleTimeUpdate = (e) => {
    if (isHovered && e.target.currentTime >= 5) {
      e.target.currentTime = 0;
      e.target.play().catch(err => {});
    }
  };

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        cursor: 'pointer',
        background: '#000',
        ...style
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        muted
        playsInline
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          position: 'absolute',
          inset: 0,
          transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      />

      {/* Play Icon Indicator */}
      {!isHovered && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.1)',
          pointerEvents: 'none',
          zIndex: 3
        }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

export default HoverVideoPlayer;
