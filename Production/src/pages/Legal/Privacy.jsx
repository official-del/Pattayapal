import React from 'react';
import { motion } from 'framer-motion';
import { FiEye, FiLock, FiDatabase, FiArrowLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

function Privacy() {
  const navigate = useNavigate();

  return (
    <div style={{ background: '#000', minHeight: '100vh', color: '#fff', padding: '150px 5% 100px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        <button 
          onClick={() => {
            if (window.history.state && window.history.state.idx > 0) {
              navigate(-1);
            } else {
              navigate('/');
            }
          }} 
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', cursor: 'pointer', padding: '12px 25px', borderRadius: '15px', display: "flex", alignItems: "center", gap: '10px', marginBottom: '40px', fontWeight: '700', fontSize: '0.8rem' }}
        >
          <FiArrowLeft /> BACK
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
            <FiEye color="var(--accent)" size={24} />
            <span style={{ color: 'var(--accent)', fontWeight: '700', letterSpacing: '5px', fontSize: '0.8rem' }}>DATA PROTECTION</span>
          </div>
          <h1 style={{ fontSize: '4rem', fontWeight: '700', margin: 0, letterSpacing: '-2px' }}>Privacy Policy</h1>
          <p style={{ color: '#444', marginTop: '15px', fontWeight: '700' }}>Last Updated: April 20, 2026</p>
        </motion.div>

        <div className="glass" style={{ marginTop: '60px', padding: '60px', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.03)', lineHeight: 1.8, color: '#888' }}>
          
          <section style={{ marginBottom: '50px' }}>
            <h3 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
               <FiDatabase color="var(--accent)" /> 1. Information Collection
            </h3>
            <p>We collect information you provide directly to us when you create an account, update your profile, or purchase a service. This includes your name, email, and any portfolio works uploaded.</p>
          </section>

          <section style={{ marginBottom: '50px' }}>
            <h3 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
               <FiLock color="var(--accent)" /> 2. Data Security
            </h3>
            <p>We implement a variety of security measures to maintain the safety of your personal information. Your sensitive data is encrypted via SSL technology and protected behind a firewall.</p>
          </section>

          <section style={{ marginBottom: '50px' }}>
            <h3 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
               <FiEye color="var(--accent)" /> 3. Cookies
            </h3>
            <p>Pattayapal uses cookies to understand and save your preferences for future visits and compile aggregate data about site traffic and site interaction.</p>
          </section>

        </div>
      </div>
    </div>
  );
}

export default Privacy;
