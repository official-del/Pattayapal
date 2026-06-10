import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FiActivity,
  FiArrowRight,
  FiBriefcase,
  FiLock,
  FiMail,
  FiPhone,
  FiShield,
  FiUser,
  FiZap,
  FiChevronDown,
  FiCheck,
} from 'react-icons/fi';
import PremiumLoader from '../components/PremiumLoader';
import { CONFIG } from '../utils/config';
import { walletAPI } from '../utils/api';
import pattayaPalLogo from '../assets/LOGO1.png';
import '../css/UserAuth.css';

const professionOptions = [
  'General',
  'Photographer',
  'Videographer',
  'Editor',
  'Director',
  'Production Design',
  'Creative Content',
  'Film Production',
  'Post Production',
  'Digital Artist',
  'AI Operations',
  'AI Artist',
  'AI Animator',
  'AI Sound Designer',
  'AI 3D Artist',
  'AI Director',
  'AI Producer',
  'KOL',
  'Influencer',
  'Content Creator',
  'Tutor',
];

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  profession: 'General',
  acceptedTerms: false,
};

function readSavedUser() {
  try {
    const raw = window.safeStorage?.getItem('userInfo');
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn('Could not read stored user info:', error);
    return null;
  }
}

function getToken() {
  try {
    return window.safeStorage?.getItem('userToken') || window.safeStorage?.getItem('token');
  } catch (error) {
    console.warn('Could not read stored token:', error);
    return null;
  }
}

export default function UserAuth() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(location.state?.isRegister ? false : true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [formData, setFormData] = useState(emptyForm);
  const [rolePickerOpen, setRolePickerOpen] = useState(false);
  const rolePickerRef = useRef(null);

  useEffect(() => {
    const token = getToken();
    const userInfo = readSavedUser();

    if (!token || !userInfo) return;

    if (userInfo.role?.toLowerCase() === 'admin') {
      navigate('/admin/dashboard');
    } else {
      navigate(`/profile/${userInfo._id || userInfo.id}`);
    }
  }, [navigate]);

  useEffect(() => {
    if (!rolePickerOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!rolePickerRef.current?.contains(event.target)) {
        setRolePickerOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setRolePickerOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [rolePickerOpen]);

  const switchMode = (nextMode) => {
    setIsLogin(nextMode === 'login');
    setErrorMsg('');
    setSuccessMsg('');
    setRolePickerOpen(false);
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const selectProfession = (profession) => {
    setFormData((current) => ({
      ...current,
      profession,
    }));
    setRolePickerOpen(false);
  };

  const calculateFallbackBalance = async (token) => {
    try {
      const txs = await walletAPI.getTransactions(token);
      if (!txs || txs.length === 0) return 0;

      return txs.reduce((acc, tx) => {
        const amount = Number(tx.amount) || 0;
        const isPositive = ['TOPUP', 'EARN_JOB', 'REFUND'].includes(tx.type);
        const isNegative = ['PAY_JOB', 'WITHDRAW'].includes(tx.type);

        if (isPositive) return acc + amount;
        if (isNegative) return acc - amount;
        return acc;
      }, 0);
    } catch (error) {
      console.warn('Could not calculate fallback balance on login:', error);
      return 0;
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (!isLogin && !formData.acceptedTerms) {
        setErrorMsg('กรุณายอมรับเงื่อนไขการใช้งานก่อนสมัครสมาชิก');
        setLoading(false);
        return;
      }

      if (isLogin) {
        const res = await axios.post(`${CONFIG.API_BASE_URL}/api/users/login`, {
          email: formData.email,
          password: formData.password,
        });

        let finalBalance = res.data.user.coinBalance ?? res.data.user.balance ?? res.data.user.coins ?? 0;

        if (finalBalance === 0) {
          finalBalance = await calculateFallbackBalance(res.data.token);
        }

        const userDataToSave = {
          ...res.data.user,
          coinBalance: finalBalance > 0 ? finalBalance : 0,
        };

        window.safeStorage.setItem('userToken', res.data.token);
        window.safeStorage.setItem('token', res.data.token);
        window.safeStorage.setItem('userInfo', JSON.stringify(userDataToSave));

        if (userDataToSave.role?.toLowerCase() === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate(`/profile/${userDataToSave._id || userDataToSave.id}`);
        }
      } else {
        const res = await axios.post(`${CONFIG.API_BASE_URL}/api/users/register`, formData);
        setIsLogin(true);
        setSuccessMsg(res.data.message || 'สมัครสมาชิกสำเร็จ กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชี');
        setFormData(emptyForm);
      }
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'ข้อมูลไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-shell">
      <section className="auth-layout" aria-label="PattayaPal account access">
        <motion.aside
          className="auth-brand-panel"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="auth-brand-top">
            <div className="auth-brand-logo">
              <img src={pattayaPalLogo} alt="PattayaPal" />
            </div>
            <div className="auth-brand-status" aria-label="PattayaPal community status">
              <span>Community hub</span>
              <strong>Creator access</strong>
            </div>
          </div>

          <div className="auth-brand-main">
            <p className="auth-kicker">Creator Gateway</p>
            <h1>PattayaPal Community</h1>
            <p className="auth-brand-copy">
              เข้าสู่ระบบเพื่อจัดการโปรไฟล์ งานจ้าง ผลงาน และ Coin flow ของคุณใน community เดียว.
            </p>
            <div className="auth-brand-meter" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          </div>

          <div className="auth-hud-grid" aria-label="Platform highlights">
            <div className="auth-hud-card">
              <FiShield />
              <span>Verified creator access</span>
            </div>
            <div className="auth-hud-card">
              <FiZap />
              <span>Quest and hire workflow</span>
            </div>
            <div className="auth-hud-card">
              <FiActivity />
              <span>Portfolio, rank, wallet</span>
            </div>
          </div>
        </motion.aside>

        <motion.section
          className="auth-form-panel"
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.48, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="auth-form-heading">
            <div>
              <p className="auth-kicker">{isLogin ? 'Welcome back' : 'Join the guild'}</p>
              <h2>{isLogin ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}</h2>
              <p>{isLogin ? 'เปิด dashboard และ community feed ของคุณ' : 'สร้างบัญชีสำหรับ creator หรือผู้จ้างงาน'}</p>
            </div>

            <div className="auth-mode-switch" role="tablist" aria-label="Authentication mode">
              <button
                type="button"
                className={isLogin ? 'is-active' : ''}
                onClick={() => switchMode('login')}
                aria-selected={isLogin}
              >
                Login
              </button>
              <button
                type="button"
                className={!isLogin ? 'is-active' : ''}
                onClick={() => switchMode('register')}
                aria-selected={!isLogin}
              >
                Register
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {(errorMsg || successMsg) && (
              <motion.div
                key={errorMsg ? 'error' : 'success'}
                className={`auth-alert ${errorMsg ? 'is-error' : 'is-success'}`}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                {errorMsg || successMsg}
              </motion.div>
            )}
          </AnimatePresence>

          <form className="auth-form" onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  className="auth-register-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                >
                  <label className="auth-field">
                    <span>Full name</span>
                    <div className="auth-input-shell">
                      <FiUser />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="ชื่อที่ใช้ใน PattayaPal"
                        required
                      />
                    </div>
                  </label>

                  <label className="auth-field">
                    <span>Phone number</span>
                    <div className="auth-input-shell">
                      <FiPhone />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="เบอร์โทร (ไม่บังคับ)"
                      />
                    </div>
                  </label>

                  <label className="auth-field">
                    <span>Professional role</span>
                    <div className="auth-role-picker-wrap" ref={rolePickerRef}>
                      <button
                        type="button"
                        className={`auth-input-shell auth-role-trigger ${rolePickerOpen ? 'is-open' : ''}`}
                        onClick={() => setRolePickerOpen((current) => !current)}
                        aria-haspopup="listbox"
                        aria-expanded={rolePickerOpen}
                      >
                        <FiBriefcase />
                        <span>{formData.profession === 'General' ? 'Client / General User' : formData.profession}</span>
                        <FiChevronDown className="auth-role-chevron" />
                      </button>

                      <AnimatePresence>
                        {rolePickerOpen && (
                          <motion.div
                            className="auth-role-menu"
                            role="listbox"
                            aria-label="Professional role"
                            initial={{ opacity: 0, y: -6, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.98 }}
                            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                          >
                            {professionOptions.map((profession) => {
                              const selected = formData.profession === profession;
                              const label = profession === 'General' ? 'Client / General User' : profession;

                              return (
                                <button
                                  type="button"
                                  key={profession}
                                  role="option"
                                  aria-selected={selected}
                                  className={`auth-role-option ${selected ? 'is-selected' : ''}`}
                                  onClick={() => selectProfession(profession)}
                                >
                                  <span>{label}</span>
                                  {selected && <FiCheck />}
                                </button>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </label>
                </motion.div>
              )}
            </AnimatePresence>

            <label className="auth-field">
              <span>Email address</span>
              <div className="auth-input-shell">
                <FiMail />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="contact@example.com"
                  required
                />
              </div>
            </label>

            <label className="auth-field">
              <span>Password</span>
              <div className="auth-input-shell">
                <FiLock />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                  minLength="6"
                  required
                />
              </div>
            </label>

            {!isLogin && (
              <label className="auth-terms-row">
                <input
                  type="checkbox"
                  id="acceptedTerms"
                  name="acceptedTerms"
                  checked={formData.acceptedTerms}
                  onChange={handleChange}
                />
                <span>
                  ฉันยอมรับ{' '}
                  <Link to="/terms" target="_blank" rel="noreferrer">
                    Terms
                  </Link>{' '}
                  และ{' '}
                  <Link to="/privacy" target="_blank" rel="noreferrer">
                    Privacy Policy
                  </Link>
                </span>
              </label>
            )}

            <motion.button
              type="submit"
              className="auth-submit"
              disabled={loading}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <PremiumLoader bare size="tiny" />
              ) : (
                <>
                  <span>{isLogin ? 'เข้าสู่ระบบ' : 'สร้างบัญชี'}</span>
                  <FiArrowRight />
                </>
              )}
            </motion.button>
          </form>

          <p className="auth-footer-note">
            {isLogin ? 'ยังไม่มีบัญชี?' : 'มีบัญชีอยู่แล้ว?'}
            <button type="button" onClick={() => switchMode(isLogin ? 'register' : 'login')}>
              {isLogin ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
            </button>
          </p>
        </motion.section>
      </section>
    </main>
  );
}
