import React from 'react';
import { motion } from 'framer-motion';
import { FiShield, FiCheckCircle, FiInfo, FiArrowLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

function Terms() {
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
            <FiShield color="var(--accent)" size={24} />
            <span style={{ color: 'var(--accent)', fontWeight: '700', letterSpacing: '5px', fontSize: '0.8rem' }}>LEGAL PROTOCOL</span>
          </div>
          <h1 style={{ fontSize: '4rem', fontWeight: '700', margin: 0, letterSpacing: '-2px' }}>Terms of Service</h1>
          <p style={{ color: '#444', marginTop: '15px', fontWeight: '700' }}>Last Updated: April 20, 2026</p>
        </motion.div>

        <div className="glass" style={{ marginTop: '60px', padding: '60px', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.03)', lineHeight: 1.8, color: '#888' }}>
          
          <section style={{ marginBottom: '50px' }}>
            <h3 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
               <FiCheckCircle color="var(--accent)" /> 1. Overview
            </h3>
            <p>Welcome to Pattayapal. By accessing or using our platform, you agree to be bound by these terms. This platform serves as a community and workspace for freelance production professionals, designers, and clients.</p>
          </section>

          <section style={{ marginBottom: '50px' }}>
            <h3 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
               <FiCheckCircle color="var(--accent)" /> 2. User Accounts
            </h3>
            <p>Users are responsible for maintaining the security of their accounts and passwords. Pattayapal cannot and will not be liable for any loss or damage from your failure to comply with this security obligation.</p>
          </section>

          <section style={{ marginBottom: '50px' }}>
            <h3 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
               <FiCheckCircle color="var(--accent)" /> 3. Content Ownership
            </h3>
            <p>Creators retain all rights to their uploaded works. However, by uploading to Pattayapal, you grant the platform a non-exclusive license to display your works for promotional purposes within the community.</p>
          </section>

          <section style={{ marginBottom: '50px' }}>
            <h3 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
               <FiCheckCircle color="var(--accent)" /> 4. Payments & Transactions
            </h3>
            <p>All financial transactions within the Pattayapal Wallet system are subject to verification. Withdrawals are processed within 3-5 business days.</p>
          </section>

          <div style={{ background: 'rgba(255, 87, 51, 0.05)', padding: '30px', borderRadius: '20px', border: '1px solid rgba(255, 87, 51, 0.1)', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
            <FiInfo size={24} color="var(--accent)" style={{ flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#666', fontWeight: '500' }}>
              <strong>Notice:</strong> These terms are subject to change without prior notice. Continued use of the platform constitutes acceptance of those changes.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Terms;
