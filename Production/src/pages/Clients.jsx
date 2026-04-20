import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiGlobe, FiTarget, FiZap, FiActivity, FiArrowRight, FiShield, FiBriefcase } from 'react-icons/fi';
import { CONFIG } from '../utils/config';

const API_URL = CONFIG.API_BASE_URL;

const FALLBACK_CLIENTS = [
  { id: 1, name: 'SKL Group' },
  { id: 2, name: 'Pattaya City' },
  { id: 3, name: 'JWS Construction' },
  { id: 4, name: 'Baan Beyond' },
  { id: 5, name: 'Terminal 21' },
  { id: 6, name: 'Chonburi FC' },
  { id: 7, name: 'PTG Energy' },
  { id: 8, name: 'AXGAS' },
  { id: 9, name: 'Central Group' },
  { id: 10, name: 'True Corp' },
];

const nameToColor = (name) => {
  const palette = ['#1a1a2e','#16213e','#0f3460','#1b1b2f','#2d132c','#1c1c1c','#0d0d0d','#111122'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
};

const initials = (name) => name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

function ClientCard({ client }) {
  const [imgFailed, setImgFailed] = useState(!client.logo);
  const logoSrc = client.logo
    ? (client.logo.startsWith('http') ? client.logo : `${API_URL}/uploads/${client.logo.replace(/^\/+/, '').replace(/^uploads\//, '')}`)
    : null;

  return (
    <motion.div 
      whileHover={{ y: -10, scale: 1.05 }}
      className="glass"
      style={{ 
        width: '240px', height: '140px', borderRadius: '25px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.03)', background: 'rgba(255,255,255,0.01)', flexShrink: 0, padding: '20px', position: 'relative', overflow: 'hidden'
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(45deg, transparent, rgba(255,255,255,0.02), transparent)' }}></div>
      {!imgFailed && logoSrc ? (
        <img src={logoSrc} alt={client.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', opacity: 0.8 }} onError={() => setImgFailed(true)} />
      ) : (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: '700', color: nameToColor(client.name), letterSpacing: '2px', filter: 'brightness(1.5)' }}>{initials(client.name)}</div>
          <div style={{ fontSize: '0.65rem', color: '#333', fontWeight: '700', marginTop: '5px', textTransform: 'uppercase' }}>{client.name}</div>
        </div>
      )}
    </motion.div>
  );
}

function MarqueeRow({ clients, direction, speed = 40 }) {
  const doubled = [...clients, ...clients, ...clients];
  return (
    <div style={{ overflow: 'hidden', padding: '20px 0', width: '100%' }}>
      <motion.div 
        animate={{ x: direction === 'left' ? [0, -1000] : [-1000, 0] }}
        transition={{ duration: speed, repeat: Infinity, ease: 'linear' }}
        style={{ display: 'flex', gap: '30px', width: 'max-content' }}
      >
        {doubled.map((c, i) => (
          <ClientCard key={`${direction}-${i}`} client={c} />
        ))}
      </motion.div>
    </div>
  );
}

export default function Clients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState(FALLBACK_CLIENTS);
  const [count, setCount] = useState(0);

  useEffect(() => {
    fetch(`${API_URL}/api/clients`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && (data.clients || Array.isArray(data)) && (data.clients || data).length > 0) {
          setClients(data.clients || data);
          setCount((data.clients || data).length);
        } else {
          setCount(FALLBACK_CLIENTS.length);
        }
      })
      .catch(() => setCount(FALLBACK_CLIENTS.length));
  }, []);

  const half = Math.ceil(clients.length / 2);
  const row1 = clients.slice(0, half);
  const row2 = clients.slice(half);

  const [displayCount, setDisplayCount] = useState(0);
  useEffect(() => {
    if (!count) return;
    let start = 0;
    const step = Math.ceil(count / 40);
    const timer = setInterval(() => {
      start += step;
      if (start >= count) { setDisplayCount(count); clearInterval(timer); }
      else setDisplayCount(start);
    }, 30);
    return () => clearInterval(timer);
  }, [count]);

  return (
    <div style={{ background: '#000', minHeight: '100vh', color: '#fff', paddingBottom: '150px' }}>
      
      {/* 🚀 Futuristic Branding Section */}
      <section style={{ padding: '150px 5% 100px', textAlign: 'center' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', marginBottom: '15px' }}>
              <FiBriefcase color="var(--accent)" size={18} />
              <span style={{ color: 'var(--accent)', fontWeight: '700', letterSpacing: '5px', fontSize: '0.8rem' }}>CORPORATE_LOGISTICS</span>
           </div>
           <h1 style={{ fontSize: '5rem', fontWeight: '700', margin: 0, letterSpacing: '-3px', lineHeight: 1.1 }}>
             <span style={{ color: '#fff' }}>Strategic</span> <br/> 
             <span style={{ color: 'var(--accent)', filter: 'drop-shadow(0 0 15px var(--accent-glow))' }}>Partnerships</span>
           </h1>
           <p style={{ color: '#444', marginTop: '30px', fontSize: '1.2rem', fontWeight: '700', maxWidth: '800px', margin: '30px auto 0' }}>
             Trusted by global brands and industry leaders to deliver high-fidelity visual identities and innovative media solutions.
           </p>

           <div style={{ marginTop: '60px', display: 'flex', justifyContent: 'center', gap: '60px' }}>
              <div>
                <div style={{ fontSize: '3rem', fontWeight: '700', color: '#fff' }}>{displayCount || clients.length}+</div>
                <div style={{ fontSize: '0.75rem', color: '#222', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase' }}>Client Successes</div>
              </div>
              <div style={{ width: '1px', background: 'rgba(255,255,255,0.05)' }}></div>
              <div>
                <div style={{ fontSize: '3rem', fontWeight: '700', color: '#fff' }}>100%</div>
                <div style={{ fontSize: '0.75rem', color: '#222', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase' }}>Visual Integrity</div>
              </div>
           </div>
        </motion.div>
      </section>

      {/* 🧬 Sliding Partner Marquee */}
      <section style={{ marginBottom: '100px' }}>
        <MarqueeRow clients={row1.length ? row1 : clients} direction="left" speed={40} />
        <MarqueeRow clients={row2.length ? row2 : clients} direction="right" speed={50} />
      </section>

      {/* 🔮 Tactical CTA */}
      <section style={{ padding: '0 5%' }}>
         <motion.div 
           whileHover={{ scale: 1.01 }}
           className="glass" 
           style={{ maxWidth: '1200px', margin: '0 auto', padding: '100px 50px', borderRadius: '60px', border: '1px solid rgba(255,255,255,0.03)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}
         >
           <div style={{ position: 'absolute', bottom: '-50px', right: '-50px', width: '300px', height: '300px', background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)', opacity: 0.05 }}></div>
           
           <FiTarget size={60} color="#111" style={{ marginBottom: '30px' }} />
           <h2 style={{ fontSize: '3rem', fontWeight: '700', margin: 0, letterSpacing: '-1px' }}>Ready to shape the future <br/> with us?</h2>
           <p style={{ color: '#444', marginTop: '20px', fontWeight: '700', fontSize: '1.1rem' }}>Start your project today and elevate your brand to the global standard.</p>

           <motion.button 
             onClick={() => navigate('/contact')}
             whileHover={{ scale: 1.05, boxShadow: '0 0 40px var(--accent-glow)' }}
             style={{ 
               marginTop: '50px', background: 'var(--accent)', color: '#fff', border: 'none', padding: '22px 50px', borderRadius: '40px', fontWeight: '700', fontSize: '1.1rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '15px'
             }}
           >
             <span>GET IN TOUCH</span>
             <FiArrowRight size={20} />
           </motion.button>
         </motion.div>
      </section>

    </div>
  );
}