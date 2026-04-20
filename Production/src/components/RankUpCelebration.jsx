import React, { useState, useEffect } from 'react';
import RankBadge from './RankBadge';

const RankUpCelebration = ({ newRank, onComplete }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    // Auto close after 6 seconds
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onComplete, 800);
    }, 6000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0,0,0,0.95)',
      backdropFilter: 'blur(10px)',
      opacity: visible ? 1 : 0,
      pointerEvents: visible ? 'all' : 'none',
      transition: 'opacity 0.8s ease'
    }}>
      {/* 🎊 CSS Confetti Particles (Simplified) */}
      <div className="confetti-container">
        {[...Array(20)].map((_, i) => (
          <div key={i} className={`confetti piece-${i}`} />
        ))}
      </div>

      <div style={{
        textAlign: 'center',
        transform: visible ? 'scale(1) translateY(0)' : 'scale(0.5) translateY(50px)',
        transition: 'all 1s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        padding: '40px'
      }}>
        <div style={{ 
          fontSize: '1.2rem', 
          fontWeight: '700', 
          color: '#ff5733', 
          letterSpacing: '5px',
          marginBottom: '10px'
        }}>CONGRATULATIONS!</div>
        
        <h2 style={{ 
          fontSize: '3rem', 
          fontWeight: '700', 
          margin: '0 0 40px',
          background: 'linear-gradient(to right, #fff, #ffbd33, #fff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>RANK INCREASED</h2>

        <div style={{ 
          position: 'relative', 
          display: 'inline-block',
          animation: 'medalJump 2s ease-in-out infinite' 
        }}>
          <div style={{ position: 'absolute', inset: -40, background: 'radial-gradient(circle, rgba(255,87,51,0.3) 0%, transparent 70%)', filter: 'blur(30px)' }} />
          <RankBadge rank={newRank} size="xl" showName={false} />
        </div>

        <div style={{ marginTop: '40px' }}>
          <div style={{ fontSize: '0.9rem', color: '#555', fontWeight: 'bold' }}>NEW TIER UNLOCKED</div>
          <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#fff' }}>{newRank.toUpperCase()}</div>
        </div>

        <button 
          onClick={() => setVisible(false)}
          style={{
            marginTop: '50px',
            background: 'transparent',
            border: '2px solid rgba(255,255,255,0.1)',
            padding: '12px 40px',
            borderRadius: '40px',
            color: '#fff',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: '0.3s'
          }}
          onMouseOver={e => e.target.style.background = 'rgba(255,255,255,0.05)'}
          onMouseOut={e => e.target.style.background = 'transparent'}
        >
          CONTINUE TO HALL OF FAME
        </button>
      </div>

      <style>{`
        @keyframes medalJump {
          0%, 100% { transform: translateY(0) rotate(0); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        .confetti-container { position: absolute; inset: 0; pointer-events: none; }
        .confetti { position: absolute; width: 10px; height: 10px; background: #ff5733; top: -10px; border-radius: 2px; }
        ${[...Array(20)].map((_, i) => `
          .piece-${i} {
            left: ${Math.random() * 100}%;
            background: ${['#ff5733', '#ffbd33', '#3b82f6', '#fff'][i % 4]};
            animation: confettiFall-${i} ${3 + Math.random() * 3}s linear infinite;
            animation-delay: ${Math.random() * 3}s;
          }
          @keyframes confettiFall-${i} {
            0% { transform: translateY(0) rotate(0deg); opacity: 1; }
            100% { transform: translateY(100vh) rotate(${360 + Math.random() * 360}deg); opacity: 0; }
          }
        `).join('')}
      `}</style>
    </div>
  );
};

export default RankUpCelebration;
