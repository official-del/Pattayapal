import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiActivity } from 'react-icons/fi';

const FALLBACK_CLIENTS = [
  "SKL GROUP", "PATTAYA CITY", "JWS CONSTRUCTION",
  "BAAN BEYOND", "TERMINAL 21", "CHONBURI FC",
  "PTG ENERGY", "AXGAS", "CENTRAL FESTIVAL", "D-STATION",
];

function Clientses() {
  const scrollRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    let scrollPos = 0;
    const scroll = () => {
      if (!isPaused && scrollRef.current) {
        scrollPos += 0.8;
        if (scrollPos >= scrollRef.current.scrollWidth / 2) scrollPos = 0;
        scrollRef.current.scrollLeft = scrollPos;
      }
      requestAnimationFrame(scroll);
    };
    const req = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(req);
  }, [isPaused]);

  const doubled = [...FALLBACK_CLIENTS, ...FALLBACK_CLIENTS];

  return (
    <section style={{ padding: '80px 0', overflow: 'hidden' }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 4%', marginBottom: '60px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
          <FiActivity color="var(--accent)" size={16} />
          <span style={{ color: 'var(--accent)', fontWeight: '700', letterSpacing: '4px', fontSize: '0.75rem' }}>TRUSTED PARTNERS</span>
        </div>
        <h2 style={{ fontSize: '3rem', fontWeight: '700', margin: 0, letterSpacing: '-2px' }}>พาร์ทเนอร์ที่ไว้วางใจเรา</h2>
      </div>

      <div
        style={{ position: 'relative', width: '100vw', marginLeft: 'calc(-50vw + 50%)', overflow: 'hidden' }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Cinematic Fades */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, #000 0%, transparent 15%, transparent 85%, #000 100%)', zIndex: 2, pointerEvents: 'none' }} />

        <div
          ref={scrollRef}
          style={{ display: 'flex', overflow: 'hidden', whiteSpace: 'nowrap', padding: '20px 0' }}
        >
          {doubled.map((name, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.05, color: '#fff' }}
              style={{
                flexShrink: 0, padding: '40px 60px', borderRadius: '25px', color: '#222',
                fontSize: '1.8rem', fontWeight: '700', letterSpacing: '2px', cursor: 'default',
                display: 'flex', alignItems: 'center', gap: '15px', position: 'relative'
              }}
            >
              <span style={{ fontSize: '0.7rem', color: 'var(--accent)', opacity: 0.3 }}>0{(i % FALLBACK_CLIENTS.length) + 1}</span>
              {name}
              <div style={{ height: '40px', width: '1px', background: 'rgba(255,255,255,0.03)', marginLeft: '40px' }} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Clientses;