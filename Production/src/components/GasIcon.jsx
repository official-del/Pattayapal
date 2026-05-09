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

  // Define eruption animations based on gas level
  const getAnimationProps = () => {
    const isLow = gas <= 20;
    const glowColor = isLow ? '255, 69, 58' : '0, 150, 255';
    const mainColor = isLow ? 'rgba(255, 69, 58, 0.8)' : 'rgba(0, 150, 255, 0.8)';
    const peakColor = isLow ? 'rgba(255, 100, 100, 1)' : 'rgba(0, 255, 255, 1)';

    switch (level) {
      case 1: // Low gas - subtle breathing
        return {
          animate: { y: [0, -3, 0], scale: [1, 1.02, 1], filter: [`drop-shadow(0px 0px 5px rgba(${glowColor}, 0.2))`, `drop-shadow(0px 0px 10px rgba(${glowColor}, 0.4))`, `drop-shadow(0px 0px 5px rgba(${glowColor}, 0.2))`] },
          transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
        };
      case 2: // Medium gas - floating and glowing
        return {
          animate: { y: [0, -6, 0], scale: [1, 1.05, 1], filter: [`drop-shadow(0px 0px 10px rgba(${glowColor}, 0.4))`, `drop-shadow(0px 0px 20px rgba(${glowColor}, 0.6))`, `drop-shadow(0px 0px 10px rgba(${glowColor}, 0.4))`] },
          transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
        };
      case 3: // High gas - active wobbling
        return {
          animate: { y: [0, -10, 0], rotate: [-3, 3, -3], scale: [1, 1.08, 1], filter: [`drop-shadow(0px 0px 15px rgba(${glowColor}, 0.6))`, `drop-shadow(0px 0px 30px rgba(${glowColor}, 0.9))`, `drop-shadow(0px 0px 15px rgba(${glowColor}, 0.6))`] },
          transition: { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
        };
      case 4: // Full gas - intense eruption / shaking
      default:
        return {
          animate: { 
            y: [0, -12, 0, -8, 0], 
            x: [0, -2, 2, -2, 0],
            scale: [1, 1.15, 1.05, 1.1, 1], 
            filter: [`drop-shadow(0px 0px 20px ${mainColor})`, `drop-shadow(0px 0px 40px ${peakColor})`, `drop-shadow(0px 0px 20px ${mainColor})`] 
          },
          transition: { duration: 0.6, repeat: Infinity, ease: "easeInOut" }
        };
    }
  };

  const animProps = getAnimationProps();

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
        animate={animProps.animate}
        transition={animProps.transition}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle, rgba(0,150,255,0.2) 0%, transparent 70%)',
          borderRadius: '50%',
          zIndex: 0
        }}
      />
      
      <motion.img 
        src={icon} 
        alt={`Gas ${gas}%`} 
        animate={animProps.animate}
        transition={animProps.transition}
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
