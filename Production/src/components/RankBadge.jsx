import React from 'react';

import bronzeImg from '../assets/Rank/Bronze.png';
import silverImg from '../assets/Rank/Silver.png';
import goldImg from '../assets/Rank/Gold.png';
import platinumImg from '../assets/Rank/Patinum.png';
import diamondImg from '../assets/Rank/Diamond.png';
import commanderImg from '../assets/Rank/Commander.png';

const RankBadge = ({ rank, showName = true, size = 'md' }) => {
  const rankImages = {
    Bronze: bronzeImg,
    Silver: silverImg,
    Gold: goldImg,
    Platinum: platinumImg,
    Patinum: platinumImg,
    Diamond: diamondImg,
    Conqueror: commanderImg,
    Commander: commanderImg,
    Master: commanderImg,
  };

  const rankColors = {
    Bronze: '#cd7f32',
    Silver: '#a8a8b3',
    Gold: '#f59e0b',
    Platinum: '#6ee7f7',
    Patinum: '#6ee7f7',
    Diamond: '#6366f1',
    Conqueror: '#00d2ff',
    Commander: '#00d2ff',
    Master: '#00d2ff',
  };

  const badgeSize = {
    xs: '22px',
    sm: '32px',
    md: '44px',
    lg: '64px',
    xl: '90px',
  };

  const rankName = String(rank || 'Bronze').trim() || 'Bronze';
  const displayRank = rankImages[rankName] || rankColors[rankName]
    ? rankName
    : rankName.charAt(0).toUpperCase() + rankName.slice(1).toLowerCase();
  const color = rankColors[displayRank] || '#cd7f32';
  const imgSize = badgeSize[size] || badgeSize.md;

  return (
    <div
      className={`rank-badge rank-${displayRank.toLowerCase()}`}
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
      <style>{`
        @keyframes rankSpin3D {
          0%   { transform: perspective(200px) rotateY(0deg); }
          40%  { transform: perspective(200px) rotateY(180deg); }
          50%  { transform: perspective(200px) rotateY(180deg); filter: brightness(1.6) drop-shadow(0 0 18px ${color}cc); }
          90%  { transform: perspective(200px) rotateY(360deg); }
          100% { transform: perspective(200px) rotateY(360deg); }
        }

        .rank-img-spin {
          transform-style: preserve-3d;
        }

        .rank-img-spin:hover {
          animation-duration: 0.8s;
          filter: drop-shadow(0 0 20px ${color}cc) brightness(1.4);
        }
      `}</style>

      <img
        src={rankImages[displayRank] || bronzeImg}
        alt={displayRank}
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
      {showName && <span className="rank-name">{displayRank}</span>}
    </div>
  );
};

export default RankBadge;
