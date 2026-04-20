import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiZap, FiTarget, FiActivity, FiGlobe } from 'react-icons/fi';
import logo from '../assets/LOGO1.png';
import music from '../assets/Pattayapal Spacehome.mp3';

const bootLogs = [
  "INITIALIZING NEURAL LINK...",
  "STATUS: OPTIMIZING CORE ASSETS",
  "DECRYPTING SPACEHOME SIGNAL...",
  "ESTABLISHING SECURE PROTOCOL [P-77]",
  "SYNCING BIOMETRIC DATA...",
  "LOADING GALACTIC INTERFACE...",
  "READY FOR UPLINK."
];

export default function SplashScreen({ onComplete }) {
  const [logIndex, setLogIndex] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const audioRef = useRef(new Audio(music));

  useEffect(() => {
    if (logIndex < bootLogs.length - 1) {
      const timer = setTimeout(() => {
        setLogIndex(prev => prev + 1);
      }, 400 + Math.random() * 800);
      return () => clearTimeout(timer);
    } else {
      setIsReady(true);
    }
  }, [logIndex]);

  const handleEnter = () => {
    audioRef.current.play().catch(e => console.error("Audio block:", e));
    setIsExiting(true);
    setTimeout(() => {
      onComplete();
    }, 1500);
  };

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.5, filter: 'blur(20px)' }}
          transition={{ duration: 1, ease: "easeInOut" }}
          style={{
            position: 'fixed', inset: 0, background: '#000', zIndex: 9999,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', cursor: 'default'
          }}
        >
          {/* 🌌 Animated Starfield Background */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: Math.random() * window.innerWidth, 
                  y: Math.random() * window.innerHeight,
                  opacity: Math.random() 
                }}
                animate={{ 
                  opacity: [0.2, 0.8, 0.2],
                  scale: [1, 1.5, 1]
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 2 + Math.random() * 3,
                  delay: Math.random() * 2 
                }}
                style={{
                  position: 'absolute', width: '2px', height: '2px', background: '#fff', borderRadius: '50%'
                }}
              />
            ))}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.8) 100%)' }} />
            <div className="scanlines" />
          </div>

          {/* 🛸 Logo & Pulse */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 2, ease: "easeOut" }}
            style={{ position: 'relative', marginBottom: '60px', zIndex: 10 }}
          >
            <motion.div 
              animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
              transition={{ repeat: Infinity, duration: 4 }}
              style={{ position: 'absolute', inset: -40, background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)', filter: 'blur(30px)' }}
            />
            <img 
              src={logo} 
              alt="Pattayapal" 
              style={{ width: '180px', filter: 'drop-shadow(0 0 15px var(--accent))' }} 
            />
          </motion.div>

          {/* 📟 Terminal Logs */}
          <div style={{ minHeight: '100px', textAlign: 'center', zIndex: 10 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={logIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={{ fontFamily: 'monospace', color: 'var(--accent)', fontSize: '0.8rem', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: '700' }}
              >
                {bootLogs[logIndex]}
              </motion.div>
            </AnimatePresence>
            
            <div style={{ width: '200px', height: '2px', background: 'rgba(255,255,255,0.05)', margin: '20px auto', position: 'relative', overflow: 'hidden' }}>
              <motion.div 
                animate={{ left: ['-100%', '100%'] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                style={{ position: 'absolute', top: 0, width: '50px', height: '100%', background: 'var(--accent)', boxShadow: '0 0 10px var(--accent)' }}
              />
            </div>
          </div>

          {/* 🔘 Interaction Trigger */}
          <div style={{ height: '80px', marginTop: '40px', zIndex: 10 }}>
            {isReady && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05, boxShadow: '0 0 30px var(--accent-glow)' }}
                whileTap={{ scale: 0.95 }}
                onClick={handleEnter}
                style={{
                  padding: '20px 60px', borderRadius: '40px', background: 'var(--accent)', color: '#fff',
                  border: 'none', fontWeight: '700', fontSize: '1.1rem', letterSpacing: '4px', cursor: 'pointer',
                  boxShadow: '0 10px 20px rgba(0,0,0,0.3)', textTransform: 'uppercase', transition: '0.3s'
                }}
              >
                เข้าสู่ระบบ / ENTER SYSTEM
              </motion.button>
            )}
          </div>

          {/* 🏷️ Status Information */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.2 }}
            style={{ position: 'absolute', bottom: '40px', width: '100%', display: 'flex', justifyContent: 'center', gap: '40px', fontSize: '0.6rem', fontWeight: '700', letterSpacing: '2px', color: '#fff' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FiActivity /> NETWORK_LIVE</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FiGlobe /> SECTOR_77</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FiTarget /> UPLINK_STABLE</div>
          </motion.div>

          <style>{`
            .scanlines {
              position: absolute;
              inset: 0;
              background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%),
                          linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
              background-size: 100% 4px, 3px 100%;
              pointer-events: none;
              z-index: 5;
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
