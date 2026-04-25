import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail, FiLock, FiUser, FiBriefcase, FiZap, FiArrowRight, FiShield, FiCpu, FiActivity } from 'react-icons/fi';
import { CONFIG } from '../utils/config';
import { walletAPI } from '../utils/api'; // 👈 Static import to prevent silent fallback failures

export default function UserAuth() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(location.state?.isRegister ? false : true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    profession: 'General',
    acceptedTerms: false
  });

  useEffect(() => {
    const token = localStorage.getItem('userToken') || localStorage.getItem('token');
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));

    if (token && userInfo) {
      if (userInfo.role?.toLowerCase() === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate(`/profile/${userInfo._id || userInfo.id}`);
      }
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (!isLogin && !formData.acceptedTerms) {
        setErrorMsg('กรุณายอมรับเงื่อนไขการใช้งานก่อนสมัครสมาชิก');
        setLoading(false);
        return;
      }
      if (isLogin) {
        const res = await axios.post(`${CONFIG.API_BASE_URL}/api/users/login`, {
          email: formData.email,
          password: formData.password
        });
        let finalBalance = res.data.user.coinBalance ?? res.data.user.balance ?? res.data.user.coins ?? 0;

        // 🔄 Fallback calculation since old users might not have coinBalance in DB yet
        if (finalBalance === 0) {
          try {
            const txs = await walletAPI.getTransactions(res.data.token);
            if (txs && txs.length > 0) {
              finalBalance = txs.reduce((acc, tx) => {
                const amt = Number(tx.amount) || 0;
                const isPositive = ['TOPUP', 'EARN_JOB', 'REFUND'].includes(tx.type);
                const isNegative = ['PAY_JOB', 'WITHDRAW'].includes(tx.type);
                return isPositive ? acc + amt : (isNegative ? acc - amt : acc);
              }, 0);
            }
          } catch (e) {
            console.warn("Could not calculate fallback balance on login:", e);
          }
        }

        const userDataToSave = {
          ...res.data.user,
          coinBalance: finalBalance > 0 ? finalBalance : 0
        };

        localStorage.setItem('userToken', res.data.token);
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('userInfo', JSON.stringify(userDataToSave));

        if (userDataToSave.role?.toLowerCase() === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate(`/profile/${userDataToSave._id || userDataToSave.id}`);
        }
      } else {
        await axios.post(`${CONFIG.API_BASE_URL}/api/users/register`, formData);
        setIsLogin(true);
        setFormData({ name: '', email: '', password: '', profession: 'General' });
      }
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#000', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '50px 20px', position: 'relative', overflow: 'hidden' }}>

      {/* 🚀 Background Cyber Signals */}
      <div style={{ position: 'absolute', top: '-100px', left: '-100px', width: '500px', height: '500px', background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)', opacity: 0.05, filter: 'blur(50px)' }}></div>
      <div style={{ position: 'absolute', bottom: '-100px', right: '-100px', width: '500px', height: '500px', background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)', opacity: 0.05, filter: 'blur(50px)' }}></div>

      {/* 🧬 Authentication Port Terminal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass auth-card"
        style={{
          maxWidth: '550px', width: '100%', borderRadius: 'clamp(30px, 5vw, 50px)', border: '1px solid rgba(255,255,255,0.03)', padding: 'clamp(30px, 8vw, 60px)', position: 'relative', zIndex: 10, overflow: 'hidden'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 'clamp(30px, 8vw, 50px)' }}>
          <h1 style={{ fontSize: 'clamp(1.8rem, 8vw, 3rem)', fontWeight: '700', margin: 0, letterSpacing: '-1.5px', color: '#fff', lineHeight: 1.1 }}>
            {isLogin ? 'เข้าสู่ระบบ / LOGIN' : 'สมัครสมาชิก / REGISTER'}
          </h1>
          <p style={{ color: '#444', marginTop: '15px', fontWeight: '700', letterSpacing: '0.5px', fontSize: 'clamp(0.85rem, 2vw, 1rem)' }}>
            {isLogin ? 'กรุณายืนยันตัวตนเพื่อเข้าสู่ระบบการทำงาน' : 'ลงทะเบียนเพื่อเริ่มต้นโปรเจกต์สร้างสรรค์ของคุณ'}
          </p>
        </div>

        {errorMsg && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'rgba(239, 68, 68, 0.05)', color: '#ef4444', padding: '15px 25px', borderRadius: '20px', border: '1px solid rgba(239,68,68,0.1)', marginBottom: '35px', fontSize: '0.85rem', fontWeight: '700', textAlign: 'center' }}>
            {errorMsg}
          </motion.div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <AnimatePresence>
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ overflow: 'hidden' }}>
                <div style={{ marginBottom: '25px' }}>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '700', color: '#222', marginBottom: '12px', letterSpacing: '2px' }}>ชื่อ - นามสกุล / FULL NAME</label>
                  <div style={{ position: 'relative' }}>
                    <FiUser size={20} style={{ position: 'absolute', left: '25px', top: '50%', transform: 'translateY(-50%)', color: '#222' }} />
                    <input type="text" name="name" required onChange={handleChange} value={formData.name} placeholder="กรอกชื่อและนามสกุล..." style={{ width: '100%', padding: '22px 22px 22px 65px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', color: '#fff', outline: 'none', fontWeight: '700' }} />
                  </div>
                </div>
                <div style={{ marginBottom: '25px' }}>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '700', color: '#222', marginBottom: '12px', letterSpacing: '2px' }}>สายงานที่เชี่ยวชาญ / SPECIALIZATION</label>

                  <div style={{ position: 'relative' }}>
                    <FiBriefcase size={20} style={{ position: 'absolute', left: '25px', top: '50%', transform: 'translateY(-50%)', color: '#222' }} />
                    <select name="profession" onChange={handleChange} value={formData.profession} style={{ width: '100%', padding: '22px 22px 22px 65px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', borderRadius: '20px', outline: 'none', fontWeight: '700', appearance: 'none' }}>
                      <option value="General">Client / General User</option>
                      <option value="Photographer">Photographer</option>
                      <option value="Videographer">Videographer</option>
                      <option value="Editor">Editor</option>
                      <option value="Director">Director</option>
                      <option value="AI Operations">AI Operations</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          )}

          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '700', color: '#222', marginBottom: '12px', letterSpacing: '2px' }}>อีเมล / EMAIL ADDRESS</label>
            <div style={{ position: 'relative' }}>
              <FiMail size={20} style={{ position: 'absolute', left: '25px', top: '50%', transform: 'translateY(-50%)', color: '#222' }} />
              <input type="email" name="email" required onChange={handleChange} value={formData.email} placeholder="ระบุอีเมลของคุณ / contact@example.com" style={{ width: '100%', padding: '22px 22px 22px 65px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', color: '#fff', outline: 'none', fontWeight: '700' }} />
            </div>
          </div>

          {!isLogin && (
            <div style={{ marginBottom: '35px', display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
              <input
                type="checkbox"
                id="acceptedTerms"
                name="acceptedTerms"
                checked={formData.acceptedTerms}
                onChange={handleChange}
                style={{ width: '20px', height: '20px', accentColor: 'var(--accent)', cursor: 'pointer', marginTop: '3px' }}
              />
              <label htmlFor="acceptedTerms" style={{ color: '#444', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', lineHeight: 1.5 }}>
                ฉันยอมรับ <Link to="/terms" target="_blank" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>ข้อกำหนดการใช้งาน</Link> และ <Link to="/privacy" target="_blank" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>นโยบายความเป็นส่วนตัว</Link>
              </label>
            </div>
          )}


          <div style={{ marginBottom: '40px' }}>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '700', color: '#222', marginBottom: '12px', letterSpacing: '2px' }}>รหัสผ่าน / ACCESS PASSWORD</label>
            <div style={{ position: 'relative' }}>
              <FiLock size={20} style={{ position: 'absolute', left: '25px', top: '50%', transform: 'translateY(-50%)', color: '#222' }} />
              <input type="password" name="password" required onChange={handleChange} value={formData.password} placeholder="••••••••" minLength="6" style={{ width: '100%', padding: '22px 22px 22px 65px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', color: '#fff', outline: 'none', fontWeight: '700' }} />
            </div>
          </div>


          <motion.button
            type="submit" disabled={loading}
            whileHover={{ scale: 1.02, boxShadow: '0 15px 40px var(--accent-glow)' }}
            whileTap={{ scale: 0.98 }}
            style={{ width: '100%', background: 'var(--accent)', color: '#fff', border: 'none', padding: '24px', borderRadius: '25px', fontWeight: '700', fontSize: '1.1rem', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}
          >
            {loading ? <FiCpu className="spin" /> : (isLogin ? 'เข้าสู่ระบบ / LOGIN' : 'สร้างบัญชี / CREATE ACCOUNT')}
            <FiArrowRight />
          </motion.button>
        </form>

        <div style={{ marginTop: '40px', textAlign: 'center' }}>
          <p style={{ color: '#333', fontSize: '0.85rem', fontWeight: '700' }}>
            {isLogin ? "ยังไม่มีบัญชีใช่ไหม? / No account?" : "มีบัญชีอยู่แล้ว? / Have an account?"}
            <span
              onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); }}
              style={{ color: 'var(--accent)', cursor: 'pointer', marginLeft: '10px', textDecoration: 'underline' }}
            >
              {isLogin ? 'สมัครสมาชิกที่นี่ / REGISTER' : 'เข้าสู่ระบบที่นี่ / LOGIN'}
            </span>
          </p>

        </div>
      </motion.div>

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}