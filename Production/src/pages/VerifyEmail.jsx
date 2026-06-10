import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FiArrowRight, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import PremiumLoader from '../components/PremiumLoader';
import { CONFIG } from '../utils/config';
import '../css/UserAuth.css';

export default function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const requestSent = React.useRef(false);

  useEffect(() => {
    if (!token || requestSent.current) return;
    requestSent.current = true;

    const verifyToken = async () => {
      try {
        const res = await axios.get(`${CONFIG.API_BASE_URL}/api/users/verify-email/${token}`);
        setStatus('success');
        setMessage(res.data.message || 'ยืนยันอีเมลสำเร็จ คุณสามารถเข้าสู่ระบบได้แล้ว');
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'ไม่สามารถยืนยันอีเมลได้ ลิงก์อาจหมดอายุหรือไม่ถูกต้อง');
      }
    };

    verifyToken();
  }, [token]);

  return (
    <main className="auth-shell auth-shell-compact">
      <motion.section
        className={`verify-card verify-card-${status}`}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        aria-live="polite"
      >
        <div className="verify-brand">PattayaPal</div>

        {status === 'loading' && (
          <div className="verify-state">
            <PremiumLoader fullScreen={false} size="small" text="VERIFYING EMAIL" subtext="Checking your creator access..." />
          </div>
        )}

        {status === 'success' && (
          <div className="verify-state">
            <FiCheckCircle className="verify-icon verify-icon-success" />
            <p className="auth-kicker">Access cleared</p>
            <h1>Email verified</h1>
            <p>{message}</p>
            <button type="button" className="auth-submit" onClick={() => navigate('/login')}>
              <span>ไปหน้าเข้าสู่ระบบ</span>
              <FiArrowRight />
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="verify-state">
            <FiXCircle className="verify-icon verify-icon-error" />
            <p className="auth-kicker">Verification issue</p>
            <h1>Verification failed</h1>
            <p>{message}</p>
            <button type="button" className="auth-submit auth-submit-muted" onClick={() => navigate('/login')}>
              <span>กลับไปเข้าสู่ระบบ</span>
            </button>
          </div>
        )}
      </motion.section>
    </main>
  );
}
