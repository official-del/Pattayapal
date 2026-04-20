import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlay, FiSkipForward, FiArrowLeft, FiArrowRight, FiArrowUp } from 'react-icons/fi';
import musicFile from '../assets/Pattayapal Spacehome.mp3';
import '../css/PixelSplash.css';

// ── Level Data ──
const GROUND_H = 40;
const BLOCKS = [
  // พื้น 1
  { x: 0, y: 0, w: 800, h: GROUND_H },
  { x: 400, y: GROUND_H + 40, w: 60, h: 20, type: 'mystery' }, // บล็อกโหม่งได้

  // เหว 1
  { x: 900, y: 0, w: 400, h: GROUND_H },
  { x: 700, y: 120, w: 100, h: 20 }, // แท่นลอยฟ้า 1

  // เหว 2
  { x: 1450, y: 0, w: 600, h: GROUND_H },
  { x: 1100, y: 100, w: 80, h: 20 }, // แท่นกระโดด
  { x: 1300, y: 180, w: 80, h: 20 }, // แท่นกระโดด

  // ปลายทาง
  { x: 2200, y: 0, w: 1000, h: GROUND_H },
  { x: 1800, y: 100, w: 100, h: 20 },
  { x: 2000, y: 100, w: 100, h: 20 },

  // ท่อหรือกำแพงสิ่งกีดขวาง
  { x: 1600, y: GROUND_H, w: 40, h: 60 },
  { x: 2400, y: GROUND_H, w: 40, h: 100 },
];

const GOAL_X = 2800; // จุดเส้นชัย
const PLAYER_W = 32;
const PLAYER_H = 48;

export default function PixelSplashIntro({ onComplete }) {
  const navigate = useNavigate();

  // ── States ──
  const [gameState, setGameState] = useState('menu'); // 'menu', 'playing', 'won'

  // ── Refs & DOM ──
  const playerRef = useRef({ x: 100, y: GROUND_H + 100, vx: 0, vy: 0, isJumping: true, faceRight: true });
  const keysRef = useRef({ left: false, right: false, jump: false });
  const audioRef = useRef(new Audio(musicFile));

  const playerNodeRef = useRef(null);
  const cameraNodeRef = useRef(null);
  const bgNodeRef = useRef(null);
  const reqRef = useRef(null);

  // ── Input Handling ──
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'ArrowRight' || e.code === 'KeyD') keysRef.current.right = true;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') keysRef.current.left = true;
      if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') keysRef.current.jump = true;
    };
    const handleKeyUp = (e) => {
      if (e.code === 'ArrowRight' || e.code === 'KeyD') keysRef.current.right = false;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') keysRef.current.left = false;
      if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') keysRef.current.jump = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // ── Game Loop (Physics & Collision) ──
  const gameLoop = () => {
    if (gameState !== 'playing') {
      reqRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    const p = playerRef.current;

    // Horizontal Movement
    const SPEED = 5;
    const GRAVITY = 0.6;
    const JUMP_FORCE = 12;

    if (keysRef.current.right) { p.vx = SPEED; p.faceRight = true; }
    else if (keysRef.current.left) { p.vx = -SPEED; p.faceRight = false; }
    else p.vx = 0;

    // Apply movement
    p.x += p.vx;

    // Boundary config (Don't run backwards too far)
    if (p.x < 0) p.x = 0;

    // Horizontal Collision
    let nextX = p.x;
    for (let b of BLOCKS) {
      if (p.x + PLAYER_W > b.x && p.x < b.x + b.w && p.y + PLAYER_H > b.y && p.y < b.y + b.h) {
        if (p.vx > 0) p.x = b.x - PLAYER_W; // Hit left of block
        if (p.vx < 0) p.x = b.x + b.w; // Hit right of block
      }
    }

    // Vertical Movement (Gravity & Jump)
    if (keysRef.current.jump && !p.isJumping) {
      p.vy = JUMP_FORCE;
      p.isJumping = true;
    }

    p.vy -= GRAVITY; // apply gravity (negative is down in our system)
    let nextY = p.y + p.vy;
    p.y = nextY;

    // Vertical Collision
    p.isJumping = true; // Assume jumping unless resting on block
    for (let b of BLOCKS) {
      // Basic AABB check
      if (p.x + PLAYER_W > b.x && p.x < b.x + b.w && p.y + PLAYER_H > b.y && p.y < b.y + b.h) {
        if (p.vy < 0) {
          // Falling onto a block
          p.y = b.y + b.h;
          p.vy = 0;
          p.isJumping = false;
        } else if (p.vy > 0) {
          // Hitting head on block
          p.y = b.y - PLAYER_H;
          p.vy = 0;
        }
      }
    }

    // Death via falling down a pit
    if (p.y < -200) {
      p.x = 100;
      p.y = GROUND_H + 100;
      p.vy = 0;
    }

    // Win condition check
    if (p.x >= GOAL_X) {
      setGameState('won');
      audioRef.current.volume = 0.3; // Lower volume for won screen
    }

    // ── Render Updates via Refs (Zero React Overhead) ──
    if (playerNodeRef.current && cameraNodeRef.current && bgNodeRef.current) {
      // 1. Update Player Node CSS
      playerNodeRef.current.style.transform = `translate(${p.x}px, -${p.y}px) ${p.faceRight ? 'scaleX(1)' : 'scaleX(-1)'}`;

      // Determine walking animation (apply CSS class directly)
      if (p.vx !== 0 && !p.isJumping) playerNodeRef.current.classList.add('p-running');
      else playerNodeRef.current.classList.remove('p-running');

      if (p.isJumping) playerNodeRef.current.classList.add('p-jumping');
      else playerNodeRef.current.classList.remove('p-jumping');

      // 2. Camera Update (Scroll level)
      // We want player to stay about 30% from the left edge
      let camX = -(p.x - window.innerWidth * 0.3);
      if (camX > 0) camX = 0; // Don't scroll past left edge

      cameraNodeRef.current.style.transform = `translateX(${camX}px)`;
      bgNodeRef.current.style.transform = `translateX(${camX * 0.2}px)`; // Parallax effect
    }

    reqRef.current = requestAnimationFrame(gameLoop);
  };

  useLayoutEffect(() => {
    reqRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(reqRef.current);
  }, [gameState]); // Rebind if state changes

  const startGame = () => {
    audioRef.current.loop = true;
    audioRef.current.play().catch(e => console.log('Audio error:', e));
    setGameState('playing');
  };

  const skipGame = () => {
    audioRef.current.pause();
    onComplete();
  };

  const handleAuthNav = (path, stateObj) => {
    audioRef.current.pause();
    onComplete();
    if (path) {
      if (stateObj) navigate(path, stateObj);
      else navigate(path);
    }
  };

  return (
    <div className="pixel-world">

      {/* ── Background & Parallax ── */}
      <div className="retro-skysky" />
      <div ref={bgNodeRef} className="retro-bg-parallax">
        <div className="pixel-cloud" style={{ left: 100, top: 100, width: 80, height: 30 }} />
        <div className="pixel-cloud" style={{ left: 500, top: 180, width: 120, height: 40 }} />
        <div className="pixel-cloud" style={{ left: 1200, top: 80, width: 90, height: 35 }} />
        <div className="pixel-cloud" style={{ left: 1800, top: 150, width: 150, height: 50 }} />
        <div className="pixel-cloud" style={{ left: 2400, top: 100, width: 80, height: 30 }} />
      </div>

      {/* ── Game World ── */}
      <div ref={cameraNodeRef} className="game-camera-container">

        {/* Draw Blocks */}
        {BLOCKS.map((b, i) => (
          <div
            key={i}
            className={`pixel-ground-block ${b.type === 'mystery' ? 'mystery-box' : ''}`}
            style={{
              position: 'absolute', left: b.x, bottom: b.y, width: b.w, height: b.h
            }}
          >
            {b.type === 'mystery' && <div className="q-mark">?</div>}
          </div>
        ))}

        {/* Goal Area */}
        <div className="goal-castle" style={{ position: 'absolute', left: GOAL_X, bottom: GROUND_H }}>
          <div className="castle-door"></div>
          <div className="castle-flag">★</div>
          <h3 className="goal-text">PATTAYAPAL SYS<br />ENTRY PORTAL</h3>
        </div>

        {/* Player Character */}
        <div ref={playerNodeRef} className="pixel-guy" style={{ position: 'absolute', left: 0, bottom: 0, transformOrigin: 'center bottom' }}>
          <div className="p-head"><div className="p-hair"></div><div className="p-glasses"></div></div>
          <div className="p-body"><div className="p-arm"></div></div>
          <div className="p-leg p-leg-l"></div>
          <div className="p-leg p-leg-r"></div>
        </div>
      </div>

      {/* ── Mobile Touch Controls ── */}
      {gameState === 'playing' && (
        <div className="mobile-controls">
          <div className="d-pad">
            <button onTouchStart={() => keysRef.current.left = true} onTouchEnd={() => keysRef.current.left = false} onMouseDown={() => keysRef.current.left = true} onMouseUp={() => keysRef.current.left = false}><FiArrowLeft /></button>
            <button onTouchStart={() => keysRef.current.right = true} onTouchEnd={() => keysRef.current.right = false} onMouseDown={() => keysRef.current.right = true} onMouseUp={() => keysRef.current.right = false}><FiArrowRight /></button>
          </div>
          <button className="jump-btn" onTouchStart={() => keysRef.current.jump = true} onTouchEnd={() => keysRef.current.jump = false} onMouseDown={() => keysRef.current.jump = true} onMouseUp={() => keysRef.current.jump = false}>JUMP</button>
        </div>
      )}

      {/* ── Overlays ── */}
      <AnimatePresence>
        {gameState === 'menu' && (
          <motion.div className="overlay-menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <h1 className="pixel-title huge-text">PATTAYAPAL WORLD</h1>
            <p style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '40px', fontWeight: '700', letterSpacing: '2px', textShadow: '2px 2px 0 #000' }}>เล่นมินิเกมเพื่อเข้าสู่ระบบ หรือกดข้ามได้เลย</p>
            <button onClick={startGame} className="pixel-btn play-btn" style={{ fontSize: '1.5rem', display: 'flex', gap: '15px' }}><FiPlay /> START GAME</button>
            <button onClick={skipGame} className="pixel-btn skip-btn" style={{ marginTop: '20px', display: 'flex', gap: '10px' }}><FiSkipForward /> SKIP TO WEB</button>
          </motion.div>
        )}

        {gameState === 'won' && (
          <motion.div className="overlay-menu won-menu" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
            <h1 className="pixel-title">LEVEL COMPLETE!</h1>
            <p style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '30px', fontWeight: '700', textShadow: '2px 2px 0 #000' }}>ยินดีต้อนรับเข้าสู่งาน พร้อมใช้งานเว็บไซต์แล้ว</p>
            <div style={{ display: 'flex', gap: '20px' }}>
              <button className="pixel-btn login-btn" onClick={() => handleAuthNav('/login')}>เข้าสู่ระบบ / LOGIN</button>
              <button className="pixel-btn reg-btn" onClick={() => handleAuthNav('/login', { state: { isRegister: true } })}>สมัครสมาชิก / REGISTER</button>
            </div>
            <button className="pixel-btn skip-btn" style={{ marginTop: '20px' }} onClick={() => handleAuthNav(null)}>เข้าใช้งานเว็บไซต์ (SKIP)</button>
          </motion.div>
        )}
      </AnimatePresence>

      {(gameState === 'playing' || gameState === 'won') && (
        <button onClick={skipGame} style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '20px', fontWeight: '700', cursor: 'pointer', zIndex: 100 }}>SKIP &gt;&gt;</button>
      )}
    </div>
  );
}
