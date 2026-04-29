import React, { useState, useEffect } from 'react';

/**
 * OptimizedImage component
 * Automatically handles lazy loading and provides a smooth fade-in effect.
 */
const OptimizedImage = ({ src, alt, style, className, onClick, placeholder = 'rgba(255,255,255,0.05)' }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(null);

  const imgRef = React.useRef(null);

  useEffect(() => {
    setCurrentSrc(src);
    // If the image is already cached and complete before onLoad is attached
    if (imgRef.current && imgRef.current.complete) {
      setIsLoaded(true);
    }
  }, [src]);

  const [errorType, setErrorType] = useState(null); // 'gcs', 'cloudinary', or 'general'

  const handleError = () => {
    // 1. Handle GCS Fallback to Local
    if (src && src.includes('storage.googleapis.com') && !src.includes('fallback=true')) {
      const fileName = src.split('/').pop();
      setCurrentSrc(`/uploads/${fileName}`);
      setErrorType('gcs');
    } 
    // 2. Handle Cloudinary Failures (Legacy Data)
    else if (src && src.includes('cloudinary.com')) {
      setErrorType('cloudinary');
      console.warn("Legacy Cloudinary asset failed to load (401/404):", src);
    }
    else {
      setErrorType('general');
    }
    setIsLoaded(true);
  };

  return (
    <div 
      style={{ 
        position: 'relative', 
        overflow: 'hidden', 
        backgroundColor: placeholder,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style 
      }} 
      className={className}
      onClick={onClick}
    >
      {errorType === 'cloudinary' ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '20px', 
          color: '#666', 
          fontSize: '0.7rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{ opacity: 0.5 }}>Media unavailable</div>
          <div style={{ fontSize: '0.5rem', opacity: 0.3 }}>Legacy data</div>
        </div>
      ) : (
        <img
          ref={imgRef}
          src={currentSrc}
          alt={alt}
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
          onError={handleError}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: (errorType === 'general' && isLoaded) ? 'none' : 'block',
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.5s ease-in-out',
          }}
        />
      )}
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
