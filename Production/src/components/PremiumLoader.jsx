import React from 'react';
import { motion } from 'framer-motion';

const MotionDiv = motion.div;

export default function PremiumLoader({
  fullScreen = true,
  text = 'LOADING PATTAYAPAL',
  subtext = 'OPTIMIZING EXPERIENCE',
  size = 'medium',
  bare = false,
}) {
  const isSmall = size === 'small';
  const isTiny = size === 'tiny';

  const cube = (
    <div
      className={`pp-pixel-loader ${isSmall ? 'is-small' : ''} ${isTiny ? 'is-tiny' : ''}`}
      style={{ margin: bare ? 0 : '0 auto' }}
      role="status"
      aria-label={text || 'Loading'}
    >
      <span className="pp-pixel-square pp-pixel-square-1" />
      <span className="pp-pixel-square pp-pixel-square-2" />
      <span className="pp-pixel-square pp-pixel-square-3" />
      <span className="pp-pixel-square pp-pixel-square-4" />
      <span className="pp-pixel-square pp-pixel-square-5" />
    </div>
  );

  if (bare) return cube;

  const loaderContent = (
    <div className="premium-loader-container">
      {cube}
      {text && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h3
            className="premium-loader-text"
            style={{ fontSize: isSmall ? '0.85rem' : '0.95rem' }}
          >
            {text}
          </h3>
          {subtext && !isSmall && (
            <span className="premium-loader-subtext">{subtext}</span>
          )}
        </div>
      )}
    </div>
  );

  if (!fullScreen) {
    return (
      <MotionDiv
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isSmall ? '48px 20px' : '80px 20px',
          minHeight: isSmall ? '180px' : '280px',
          width: '100%',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: isSmall ? '200px' : '320px',
            height: isSmall ? '200px' : '320px',
            background: 'radial-gradient(circle, rgba(255, 69, 0, 0.12) 0%, transparent 70%)',
            filter: 'blur(40px)',
            pointerEvents: 'none',
          }}
        />
        {loaderContent}
      </MotionDiv>
    );
  }

  return (
    <MotionDiv
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        background: 'rgba(5, 5, 5, 0.92)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(255, 69, 0, 0.18) 0%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
          zIndex: -1,
        }}
      />
      {loaderContent}
    </MotionDiv>
  );
}
