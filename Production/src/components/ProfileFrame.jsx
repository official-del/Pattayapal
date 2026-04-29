import React, { useState, useLayoutEffect, useRef } from 'react';
import RankBadge from './RankBadge';

// ── XP Thresholds per Rank ─────────────────────────────────────────────────
const RANK_THRESHOLDS = {
  Bronze:    { min: 0,      max: 1000,   next: 'Silver'    },
  Silver:    { min: 1001,   max: 5000,   next: 'Gold'      },
  Gold:      { min: 5001,   max: 20000,  next: 'Platinum'  },
  Platinum:  { min: 20001,  max: 100000, next: 'Diamond'   },
  Diamond:   { min: 100001, max: 500000, next: 'Conqueror' },
  Conqueror: { min: 500001, max: 500001, next: null         },
};

const RANK_COLORS = {
  Bronze:    { ring: '#cd7f32', glow: '#cd7f3266', track: '#2a1800' },
  Silver:    { ring: '#bdc3c7', glow: '#bdc3c755', track: '#1a1a1a' },
  Gold:      { ring: '#f59e0b', glow: '#f59e0b77', track: '#2a1c00' },
  Platinum:  { ring: '#6ee7f7', glow: '#6ee7f766', track: '#001a20' },
  Diamond:   { ring: '#818cf8', glow: '#818cf888', track: '#0a0a20' },
  Conqueror: { ring: '#ef4444', glow: '#ef4444aa', track: '#200000' },
};

/**
 * ProfileFrame — Avatar with XP ring + Rank badge (RESPONSIVE)
 */
const ProfileFrame = ({
  children,
  rank = 'Bronze',
  points = 0,
  size = '100px', // Can now be responsive like 'clamp(80px, 20vw, 200px)'
  showBadge,
  showXpRing = true,
  isOnline = false,
}) => {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 100, height: 100 });

  // Update dimensions when size changes or screen resizes
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    
    const updateSize = () => {
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width > 0) {
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    window.addEventListener('resize', updateSize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, [size]);

  const sizeNum = dimensions.width;

  // Auto-hide elements on very small avatars
  const displayBadge = showBadge !== undefined ? showBadge : sizeNum >= 45;
  const displayRing  = showXpRing && sizeNum >= 35;

  const colors   = RANK_COLORS[rank]   || RANK_COLORS.Bronze;
  const thresh   = RANK_THRESHOLDS[rank] || RANK_THRESHOLDS.Bronze;
  const isMaxRank = !thresh.next;

  // XP progress 0 → 1
  const progress = isMaxRank
    ? 1
    : Math.min(1, Math.max(0, (points - thresh.min) / (thresh.max - thresh.min + 1)));

  // SVG ring math (Proportional to current size)
  const padding    = Math.max(2, sizeNum * 0.04); 
  const strokeW    = Math.max(2, sizeNum * 0.04); 
  const svgSize    = sizeNum + (padding * 2) + strokeW;
  const center     = svgSize / 2;
  const radius     = (sizeNum / 2) + (padding) + (strokeW / 2);
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  // Badge size scaling
  const badgeSize = sizeNum <= 55 ? 'xs' : sizeNum <= 85 ? 'sm' : sizeNum <= 160 ? 'md' : sizeNum <= 250 ? 'lg' : 'xl';
  const badgePx   = badgeSize === 'xs' ? 22 : badgeSize === 'sm' ? 32 : badgeSize === 'md' ? 44 : badgeSize === 'lg' ? 64 : 90;

  return (
    <div 
      ref={containerRef}
      style={{ 
        position: 'relative', 
        display: 'inline-flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        width: size,
        height: size,
        flexShrink: 0
      }}
    >

      {/* ── XP Ring (SVG) ── */}
      {displayRing && (
        <svg
          width={svgSize}
          height={svgSize}
          viewBox={`0 0 ${svgSize} ${svgSize}`}
          style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 2,
            overflow: 'visible'
          }}
        >
          <defs>
            <filter id={`glow-${rank}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation={sizeNum * 0.02} result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Track */}
          <circle
            cx={center} cy={center} r={radius}
            fill="none"
            stroke={colors.track}
            strokeWidth={strokeW}
          />

          {/* Progress */}
          <circle
            cx={center} cy={center} r={radius}
            fill="none"
            stroke={colors.ring}
            strokeWidth={strokeW}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${center} ${center})`}
            filter={`url(#glow-${rank})`}
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>
      )}

      {/* ── Avatar ── */}
      <div style={{
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        overflow: 'hidden',
        border: `${Math.max(1, sizeNum * 0.015)}px solid #000`,
        background: '#111',
        position: 'relative',
        zIndex: 3,
        boxShadow: displayRing ? `0 0 ${sizeNum * 0.15}px ${colors.glow}` : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {children}
      </div>

      {/* ── Online Status Dot ── */}
      {isOnline && (
        <div style={{
          position: 'absolute',
          bottom: '5%',
          right: '5%',
          width: '15%',
          height: '15%',
          minWidth: '8px',
          minHeight: '8px',
          background: '#10b981',
          borderRadius: '50%',
          border: '2px solid #000',
          boxShadow: '0 0 10px #10b981',
          zIndex: 11,
        }} />
      )}

      {/* ── Rank Badge (top-right) ── */}
      {displayBadge && (
        <div style={{
          position: 'absolute',
          top: '-5%',
          right: '-5%',
          zIndex: 12,
          background: 'transparent',
          lineHeight: 0,
          transform: 'translate(10%, -10%)'
        }}>
          <RankBadge rank={rank} showName={false} size={badgeSize} />
        </div>
      )}

      {/* ── XP Label (bottom) ── */}
      {displayRing && sizeNum >= 55 && (
        <div style={{
          position: 'absolute',
          bottom: '-10px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          background: '#000',
          border: `1px solid ${colors.ring}`,
          borderRadius: '20px',
          padding: sizeNum < 80 ? '2px 6px' : '4px 12px',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          boxShadow: `0 0 15px ${colors.glow}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <span style={{
            fontSize: sizeNum < 80 ? '8px' : `${Math.max(9, sizeNum * 0.09)}px`, 
            fontWeight: '800',
            color: colors.ring,
            letterSpacing: '0.5px',
          }}>
            {isMaxRank
              ? `MAX`
              : `${points.toLocaleString()} / ${thresh.max.toLocaleString()} XP`}
          </span>
        </div>
      )}
    </div>
  );
};

export default ProfileFrame;
