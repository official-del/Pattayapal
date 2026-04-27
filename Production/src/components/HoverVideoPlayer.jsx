import { useRef, useState, useEffect } from 'react';

/**
 * HoverVideoPlayer component
 * Shows a poster image by default, plays video on hover.
 * Helps reduce page lag by not autoplaying multiple videos.
 */
const HoverVideoPlayer = ({ src, poster, className, style, onClick }) => {
  const videoRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!videoRef.current) return;

    if (isHovered) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          // Auto-play was prevented
          console.log("Playback prevented:", error);
        });
      }
    } else {
      videoRef.current.pause();
      // Reset to start or keep at current frame? 
      // Resetting to 0 makes it feel more like a "preview"
      videoRef.current.currentTime = 0;
    }
  }, [isHovered]);

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        cursor: 'pointer',
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
        loop
        playsInline
        preload="metadata"
        onLoadedData={() => setIsLoaded(true)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          transition: 'opacity 0.3s ease',
          opacity: isLoaded ? 1 : 0
        }}
      />

      {/* Optional: Play icon overlay when not hovered */}
      {!isHovered && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.1)',
          pointerEvents: 'none',
          transition: 'opacity 0.3s ease'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.3)'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

export default HoverVideoPlayer;
