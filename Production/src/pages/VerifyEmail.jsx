import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiXCircle, FiLoader, FiArrowRight } from 'react-icons/fi';
import { CONFIG } from '../utils/config';

export default function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
  const [message, setMessage] = useState('');

  const requestSent = React.useRef(false);

  useEffect(() => {
    if (!token || requestSent.current) return;
    requestSent.current = true;

    const verifyToken = async () => {
      try {
        const res = await axios.get(`${CONFIG.API_BASE_URL}/api/users/verify-email/${token}`);
        setStatus('success');
        setMessage(res.data.message);
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Verification failed. The token may be invalid or expired.');
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div style={{ background: '#000', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '50px 20px', position: 'relative', overflow: 'hidden' }}>
      {/* Background styling matching UserAuth */}
      <div style={{ position: 'absolute', top: '-100px', left: '-100px', width: '500px', height: '500px', background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)', opacity: 0.05, filter: 'blur(50px)' }}></div>
      <div style={{ position: 'absolute', bottom: '-100px', right: '-100px', width: '500px', height: '500px', background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)', opacity: 0.05, filter: 'blur(50px)' }}></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          maxWidth: '500px', width: '100%', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.03)', padding: '50px', position: 'relative', zIndex: 10, overflow: 'hidden', textAlign: 'center', background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(20px)'
        }}
      >
        <h1 style={{ color: '#fff', fontSize: '2rem', fontWeight: '900', marginBottom: '30px', letterSpacing: '1px' }}>
          PATTAYAPAL
        </h1>

        {status === 'loading' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <FiLoader size={50} className="spin" color="var(--accent)" />
            <p style={{ color: '#aaa', fontWeight: '600' }}>Verifying your email...</p>
          </div>
        )}

        {status === 'success' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <FiCheckCircle size={60} color="#22c55e" />
            <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>Email Verified!</h2>
            <p style={{ color: '#aaa', fontWeight: '500', lineHeight: '1.6' }}>{message}</p>
            <button
              onClick={() => navigate('/auth')}
              style={{ marginTop: '20px', width: '100%', background: 'var(--accent)', color: '#fff', border: 'none', padding: '18px', borderRadius: '20px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.3s ease' }}
            >
              PROCEED TO LOGIN <FiArrowRight />
            </button>
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <FiXCircle size={60} color="#ef4444" />
            <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>Verification Failed</h2>
            <p style={{ color: '#aaa', fontWeight: '500', lineHeight: '1.6' }}>{message}</p>
            <button
              onClick={() => navigate('/auth')}
              style={{ marginTop: '20px', width: '100%', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '18px', borderRadius: '20px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.3s ease' }}
            >
              BACK TO LOGIN
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
