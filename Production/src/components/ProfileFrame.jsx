import React from 'react';

/**
 * ProfileFrame Component
 * Wraps an image (avatar) with a decorative frame based on rank
 */
const ProfileFrame = ({ children, rank, size = '100px' }) => {
  const rankStyles = {
    Bronze: { color: '#cd7f32', glow: '0 0 15px #cd7f3266' },
    Silver: { color: '#bdc3c7', glow: '0 0 15px #bdc3c766' },
    Gold: { color: '#f1c40f', glow: '0 0 20px #f1c40f88' },
    Platinum: { color: '#3498db', glow: '0 0 25px #3498db88' },
    Diamond: { color: '#00d2ff', glow: '0 0 35px #00d2ff88', animate: 'borderRotate 4s linear infinite' },
    Conqueror: { color: '#e74c3c', glow: '0 0 45px #e74c3caa', animate: 'borderRotate 2s linear infinite, pulsate 2s ease-in-out infinite' }
  };

  const current = rankStyles[rank] || { color: 'transparent', glow: 'none' };

  const containerStyle = {
    position: 'relative',
    width: size,
    height: size,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '5px',
    borderRadius: '50%',
    background: current.color !== 'transparent' ? `conic-gradient(from 0deg, ${current.color}, #fff, ${current.color}, #fff, ${current.color})` : 'transparent',
    boxShadow: current.glow,
    animation: current.animate || 'none'
  };

  const innerStyle = {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    overflow: 'hidden',
    border: '3px solid #000',
    background: '#111',
    position: 'relative',
    zIndex: 1
  };

  return (
    <div className={`profile-frame frame-${rank?.toLowerCase()}`} style={containerStyle}>
      <div style={innerStyle}>
        {children}
      </div>
      
      {/* Visual flair for high ranks */}
      {(rank === 'Diamond' || rank === 'Conqueror') && (
        <div style={{
          position: 'absolute',
          top: '-2px',
          right: '-2px',
          background: `radial-gradient(circle, #fff 0%, ${current.color} 70%)`,
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          border: '2px solid white',
          boxShadow: `0 0 15px ${current.color}`,
          zIndex: 10
        }} />
      )}

      <style>
        {`
          @keyframes borderRotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes pulsate {
            0%, 100% { transform: scale(1); filter: brightness(1); }
            50% { transform: scale(1.03); filter: brightness(1.3); }
          }
        `}
      </style>
    </div>
  );
};

export default ProfileFrame;
