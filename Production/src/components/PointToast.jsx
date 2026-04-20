import React, { useState, useEffect } from 'react';
import { FiZap } from 'react-icons/fi';

const PointToast = ({ points, label, onComplete }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onComplete, 500); // Final cleanup after fade out
    }, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div style={{
      position: 'fixed',
      bottom: '100px',
      right: '30px',
      zIndex: 9999,
      pointerEvents: 'none',
      transform: visible ? 'translateX(0)' : 'translateX(120%)',
      opacity: visible ? 1 : 0,
      transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    }}>
      <div style={{
        background: 'rgba(255, 87, 51, 0.95)',
        color: '#fff',
        padding: '12px 24px',
        borderRadius: '15px',
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        boxShadow: '0 10px 30px rgba(255, 87, 51, 0.4)',
        border: '1px solid rgba(255,255,255,0.2)',
        minWidth: '220px'
      }}>
        <div style={{ 
          width: '35px', 
          height: '35px', 
          background: 'rgba(255,255,255,0.2)', 
          borderRadius: '10px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          fontSize: '1.2rem',
          animation: 'pulseZap 1s infinite'
        }}>
          <FiZap />
        </div>
        <div>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)', fontWeight: 'bold' }}>{label.toUpperCase()}</div>
          <div style={{ fontSize: '1.1rem', fontWeight: '700' }}>+{points} POINTS!</div>
        </div>
      </div>
      <style>{`
        @keyframes pulseZap {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); filter: brightness(1.2); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default PointToast;
