import React, { useState, useEffect } from 'react';

/**
 * OptimizedImage component
 * Automatically handles lazy loading and provides a smooth fade-in effect.
 */
const OptimizedImage = ({ src, alt, style, className, onClick, placeholder = 'rgba(255,255,255,0.05)' }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(null);

  useEffect(() => {
    // Basic pre-fetching if needed, but primarily we rely on browser lazy loading
    setCurrentSrc(src);
  }, [src]);

  return (
    <div 
      style={{ 
        position: 'relative', 
        overflow: 'hidden', 
        backgroundColor: placeholder,
        ...style 
      }} 
      className={className}
      onClick={onClick}
    >
      <img
        src={currentSrc}
        alt={alt}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.5s ease-in-out',
        }}
      />
      {!isLoaded && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(110deg, rgba(255,255,255,0.02) 8%, rgba(255,255,255,0.05) 18%, rgba(255,255,255,0.02) 33%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite linear',
        }} />
      )}

    </div>
  );
};

export default OptimizedImage;
