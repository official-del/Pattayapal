import React from 'react';
import { motion } from 'framer-motion';
import level1 from '../assets/Gas/1.png';
import level2 from '../assets/Gas/2.png';
import level3 from '../assets/Gas/3.png';
import level4 from '../assets/Gas/4.png';

const GasIcon = ({ gas = 100, size = '40px', style = {} }) => {
  let icon = level4;
  let level = 4;
  
  if (gas <= 25) {
    icon = level1;
    level = 1;
  } else if (gas <= 50) {
    icon = level2;
    level = 2;
  } else if (gas <= 75) {
    icon = level3;
    level = 3;
  }

  // Define animations
  const getIconAnimation = () => {
    const isLow = gas <= 20;
    const glowColor = isLow ? '255, 69, 58' : '0, 150, 255';
    const mainColor = isLow ? 'rgba(255, 69, 58, 0.8)' : 'rgba(0, 150, 255, 0.8)';
    const peakColor = isLow ? 'rgba(255, 100, 100, 1)' : 'rgba(0, 255, 255, 1)';

    return {
      animate: { 
        filter: [
          `drop-shadow(0px 0px ${level * 5}px rgba(${glowColor}, 0.4))`, 
          `drop-shadow(0px 0px ${level * 10}px rgba(${glowColor}, 0.8))`, 
          `drop-shadow(0px 0px ${level * 5}px rgba(${glowColor}, 0.4))`
        ] 
      },
      transition: { 
        duration: level === 4 ? 0.8 : (level === 3 ? 1.2 : 2), 
        repeat: Infinity, 
        ease: "easeInOut" 
      }
    };
  };

  const getAuraAnimation = () => {
    return {
      animate: { 
        scale: [1, 1.2, 1],
        opacity: [0.2, 0.5, 0.2]
      },
      transition: { 
        duration: 2, 
        repeat: Infinity, 
        ease: "easeInOut" 
      }
    };
  };

  const iconAnim = getIconAnimation();
  const auraAnim = getAuraAnimation();

  return (
    <div 
      style={{ 
        width: size, 
        height: size, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        flexShrink: 0,
        position: 'relative',
        ...style 
      }}
      title={`Gas Level: ${gas}%`}
    >
      {/* Background glow to simulate gas aura */}
      <motion.div 
        animate={auraAnim.animate}
        transition={auraAnim.transition}
        style={{
          position: 'absolute',
          inset: '-20%',
          background: `radial-gradient(circle, ${gas <= 20 ? 'rgba(255,69,58,0.4)' : 'rgba(0,150,255,0.4)'} 0%, transparent 70%)`,
          borderRadius: '50%',
          zIndex: 0
        }}
      />
      
      <motion.img 
        src={icon} 
        alt={`Gas ${gas}%`} 
        animate={iconAnim.animate}
        transition={iconAnim.transition}
        style={{ 
          width: '100%', 
          height: '100%', 
          objectFit: 'contain', 
          zIndex: 1,
          position: 'relative'
        }} 
      />
    </div>
  );
};

export default GasIcon;
