import React, { useState, useRef, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Stars, Float, Text, PerspectiveCamera, Environment, useTexture, Center, Trail, Float as FloatDrei } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../assets/LOGO1.png';
import musicFile from '../assets/Pattayapal Spacehome.mp3';

// ── ☄️ 3D Warp Starfield ──
function WarpStars({ isWarping }) {
  const starsRef = useRef();
  
  useFrame((state, delta) => {
    if (starsRef.current) {
      starsRef.current.rotation.z += delta * (isWarping ? 2 : 0.05);
      if (isWarping) {
        starsRef.current.scale.z += delta * 10;
        starsRef.current.position.z += delta * 20;
      }
    }
  });

  return <Stars ref={starsRef} radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />;
}

// ── 💎 3D Logo Module ──
function LogoCore() {
  const texture = useTexture(logo);
  const meshRef = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(t * 0.5) * 0.2;
      meshRef.current.position.y = Math.cos(t * 1.5) * 0.1;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <mesh ref={meshRef}>
        <planeGeometry args={[4, 4]} />
        <meshBasicMaterial map={texture} transparent={true} opacity={1} side={THREE.DoubleSide} />
      </mesh>
      {/* Glow Effect */}
      <mesh scale={[1.1, 1.1, 1]}>
        <planeGeometry args={[4.2, 4.2]} />
        <meshBasicMaterial color="#ff5733" transparent opacity={0.1} />
      </mesh>
    </Float>
  );
}

// ── 🏛️ Main 3D Component ──
export default function ThreeSplashScreen({ onComplete }) {
  const [isWarping, setIsWarping] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [showUI, setShowUI] = useState(false);
  const audioRef = useRef(new Audio(musicFile));

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
      setShowUI(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleEnter = () => {
    setIsWarping(true);
    audioRef.current.play().catch(e => console.log("Audio block", e));
    
    setTimeout(() => {
      onComplete();
    }, 2000);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 9999 }}>
      <Canvas dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={isWarping ? 120 : 50} />
        <AnimatePresence>
          {!isWarping && (
             <ambientLight intensity={0.5} />
          )}
        </AnimatePresence>
        
        <Suspense fallback={null}>
          <WarpStars isWarping={isWarping} />
          <LogoCore />
          <Environment preset="city" />
        </Suspense>
      </Canvas>

      {/* 🌌 UI Overlay */}
      <AnimatePresence>
        {showUI && !isWarping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 2 }}
            style={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', pointerEvents: 'none'
            }}
          >
            <div style={{ marginTop: '300px', pointerEvents: 'auto', textAlign: 'center' }}>
               <motion.div
                 initial={{ y: 20, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 style={{ color: 'var(--accent)', fontWeight: '700', letterSpacing: '8px', fontSize: '0.7rem', marginBottom: '20px', textTransform: 'uppercase' }}
               >
                 Establishing Uplink...
               </motion.div>
               
               <motion.button
                 whileHover={{ scale: 1.05, boxShadow: '0 0 30px var(--accent-glow)' }}
                 whileTap={{ scale: 0.95 }}
                 onClick={handleEnter}
                 style={{
                   padding: '20px 60px', borderRadius: '40px', background: 'var(--accent)', color: '#fff',
                   border: 'none', fontWeight: '700', fontSize: '1.1rem', letterSpacing: '4px', cursor: 'pointer',
                   boxShadow: '0 10px 20px rgba(0,0,0,0.3)', textTransform: 'uppercase'
                 }}
               >
                 เข้าสู่ระบบ / ENTER SYSTEM
               </motion.button>

               <div style={{ marginTop: '30px', color: '#444', fontSize: '0.6rem', fontWeight: '700', letterSpacing: '2px' }}>
                  NEO-CYBER PROTOCOL ACTIVE
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="vignette" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', boxShadow: 'inset 0 0 200px #000' }} />
    </div>
  );
}
