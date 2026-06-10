import { useRef, useState, useEffect } from 'react';
import PremiumLoader from './PremiumLoader';

/**
 * HoverVideoPlayer component
 * Shows a poster image by default, plays video on hover.
 * Optimized with Intersection Observer for lazy loading.
 */
const HoverVideoPlayer = ({ src, poster, className, style, onClick }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [posterReady, setPosterReady] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const shouldLoadVideo = isHovered && isInView;
  const shouldShowVideoFrame = shouldLoadVideo || (!poster && isInView);
  const showPoster = poster && (!shouldLoadVideo || !videoReady);
  const showLoader = (poster && !posterReady) || (shouldShowVideoFrame && !videoReady);

  // Lazy loading using Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          setIsInView(entry.isIntersecting);
        });
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!videoRef.current) return;

    if (shouldLoadVideo) {
      videoRef.current.currentTime = 0;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {});
      }
    } else {
      videoRef.current.pause();
      if (videoRef.current.readyState >= 1) {
        videoRef.current.currentTime = 0.1;
      }
    }
  }, [shouldLoadVideo, shouldShowVideoFrame]);

  const handleLoadedMetadata = (e) => {
    if (!poster && !isHovered && e.currentTarget.readyState >= 1) {
      e.currentTarget.currentTime = 0.1;
    }
  };

  const handleTimeUpdate = (e) => {
    if (isHovered && e.target.currentTime >= 5) {
      e.target.currentTime = 0;
      e.target.play().catch(err => {});
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
        cursor: 'pointer',
        background: '#000',
        ...style
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {showLoader && (
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 2,
          display: 'grid',
          placeItems: 'center',
          background: 'linear-gradient(135deg, rgba(0,0,0,0.82), rgba(20,8,4,0.76))',
          pointerEvents: 'none'
        }}>
          <PremiumLoader bare size="tiny" text="Loading cover" />
        </div>
      )}

      {showPoster && (
        <img
          src={poster}
          alt=""
          loading="lazy"
          onLoad={() => setPosterReady(true)}
          onError={() => setPosterReady(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            opacity: posterReady ? 1 : 0,
            transition: 'opacity 0.18s ease-out',
          }}
        />
      )}

      {shouldShowVideoFrame && (
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          muted
          playsInline
          preload={poster && !shouldLoadVideo ? "none" : "metadata"}
          onLoadedMetadata={handleLoadedMetadata}
          onLoadedData={() => setVideoReady(true)}
          onCanPlay={() => setVideoReady(true)}
          onTimeUpdate={handleTimeUpdate}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            position: 'absolute',
            inset: 0,
            opacity: videoReady ? 1 : 0,
            transition: 'opacity 0.18s ease-out, transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        />
      )}

      {/* Play Icon Indicator */}
      {!isHovered && !showLoader && (
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
