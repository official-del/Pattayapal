import React from 'react';

// ── New rank images from assets/Rank/ ──
import bronzeImg   from '../assets/Rank/Bronze.png';
import silverImg   from '../assets/Rank/Silver.png';
import goldImg     from '../assets/Rank/Gold.png';
import platinumImg from '../assets/Rank/Patinum.png';   // Note: filename has typo in folder
import diamondImg  from '../assets/Rank/Diamond.png';
import commanderImg from '../assets/Rank/Commander.png';

/**
 * RankBadge Component
 * Displays a 3D spinning rank medal image + optional rank name label.
 * Used globally across the platform wherever rank is displayed.
 */
const RankBadge = ({ rank, showName = true, size = 'md' }) => {
  const rankImages = {
    Bronze:    bronzeImg,
    Silver:    silverImg,
    Gold:      goldImg,
    Platinum:  platinumImg,
    Diamond:   diamondImg,
    Conqueror: commanderImg,
    Commander: commanderImg,
    Master:    commanderImg,
  };

  const rankColors = {
    Bronze:    '#cd7f32',
    Silver:    '#a8a8b3',
    Gold:      '#f59e0b',
    Platinum:  '#6ee7f7',
    Diamond:   '#6366f1',
    Conqueror: '#ef4444',
    Commander: '#ef4444',
    Master:    '#ef4444',
  };

  const badgeSize = {
    xs: '22px',
    sm: '32px',
    md: '44px',
    lg: '64px',
    xl: '90px',
  };

  const color = rankColors[rank] || '#cd7f32';
  const imgSize = badgeSize[size] || '44px';
  const animId = `rank-spin-${size}`;

  return (
    <div
      className={`rank-badge rank-${rank?.toLowerCase()}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: size === 'xs' ? '5px' : '10px',
        background: 'transparent',
        border: 'none',
        color,
        fontWeight: 800,
        fontSize: size === 'xs' ? '11px' : size === 'sm' ? '12px' : '14px',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        flexShrink: 0,
      }}
    >
      {/* Keyframe definition injected inline per component instance */}
      <style>{`
        @keyframes rankSpin3D {
          0%   { transform: perspective(200px) rotateY(0deg);   }
          40%  { transform: perspective(200px) rotateY(180deg); }
          50%  { transform: perspective(200px) rotateY(180deg); filter: brightness(1.6) drop-shadow(0 0 18px ${color}cc); }
          90%  { transform: perspective(200px) rotateY(360deg); }
          100% { transform: perspective(200px) rotateY(360deg); }
        }

        .rank-img-spin {
          animation: rankSpin3D 4s ease-in-out infinite;
          transform-style: preserve-3d;
        }

        .rank-img-spin:hover {
          animation-duration: 0.8s;
          filter: drop-shadow(0 0 20px ${color}cc) brightness(1.4);
        }
      `}</style>

      <img
        src={rankImages[rank] || bronzeImg}
        alt={rank || 'Bronze'}
        className="rank-img-spin"
        style={{
          width: imgSize,
          height: imgSize,
          minWidth: imgSize,
          minHeight: imgSize,
          objectFit: 'contain',
          filter: `drop-shadow(0 0 10px ${color}88)`,
        }}
        onError={(e) => { e.target.style.display = 'none'; }}
      />
      {showName && <span className="rank-name">{rank}</span>}
    </div>
  );
};

export default RankBadge;
