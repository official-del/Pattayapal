import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { walletAPI } from '../../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { getFullUrl } from '../../utils/mediaUtils';
import { Link } from 'react-router-dom';
import {
  FiDollarSign, FiCheckCircle, FiXCircle, FiUser, FiClock, FiRefreshCw,
  FiChevronDown, FiDatabase, FiCreditCard,
  FiHome, FiActivity, FiAlertCircle, FiArrowLeft,
  FiTrendingUp, FiZap, FiSend, FiInbox, FiShield
} from 'react-icons/fi';
import { CoinIcon } from '../../components/CoinIcon';

// ── DESIGN TOKENS ──
const COLORS = {
  bg: '#050505',
  glass: 'rgba(255, 255, 255, 0.03)',
  glassBorder: 'rgba(255, 255, 255, 0.06)',
  accent: '#ff5733',
  accentGlow: 'rgba(255, 87, 51, 0.2)',
  success: '#22c55e',
  successGlow: 'rgba(34, 197, 94, 0.15)',
  danger: '#ef4444',
  dangerGlow: 'rgba(239, 68, 68, 0.15)',
  warning: '#f59e0b',
  textMuted: '#666',
  textDim: '#333'
};

const STATUS_CONFIG = {
  pending:   { color: COLORS.warning, label: 'PENDING',  icon: <FiClock /> },
  completed: { color: COLORS.success, label: 'APPROVED', icon: <FiCheckCircle /> },
  failed:    { color: COLORS.danger,  label: 'REJECTED', icon: <FiXCircle /> },
};

function AdminWithdrawals() {
  const { token } = useContext(AuthContext);
  const currentToken = token || localStorage.getItem('userToken') || localStorage.getItem('token');

  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [processing, setProcessing] = useState(null);
  const [toast, setToast] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [proofFiles, setProofFiles] = useState({}); // { txId: File }
  const [auditLogs, setAuditLogs] = useState([]);

  const showToast = (msg, isSuccess = true) => {
    setToast({ msg, isSuccess });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const [wData, aData] = await Promise.all([
        walletAPI.getAdminWithdrawals(currentToken),
        walletAPI.getAuditLogs(currentToken).catch(() => [])
      ]);
      setWithdrawals(wData);
      setAuditLogs(aData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWithdrawals(); }, [currentToken]);

  const handleDecision = async (id, status) => {
    const label = status === 'completed' ? 'อนุมัติ' : 'ปฏิเสธ';
    
    // Check if proof is selected for approval
    const currentProof = proofFiles[id];

    if (status === 'completed' && !currentProof) {
      if (!window.confirm('🚨 SECURITY WARNING: No proof of transfer selected. Continue anyway?')) return;
    } else {
       if (!window.confirm(`GANTRIES ACTIVE: Confirm ${label} for this sector?`)) return;
    }

    try {
      setProcessing(id);
      
      let payload;
      if (status === 'completed' && currentProof) {
        payload = new FormData();
        payload.append('status', status);
        payload.append('proofImage', currentProof);
      } else {
        payload = { status };
      }

      await walletAPI.updateWithdrawalStatus(id, payload, currentToken);
      
      // Update local state
      setWithdrawals(prev => prev.map(w => w._id === id ? { ...w, status } : w));
      showToast(status === 'completed' ? 'MATCH CONFIRMED! ✅ Transaction approved' : 'DENIED! ❌ Transaction rejected', status === 'completed');
    } catch (err) {
      showToast('SYSTEM ERROR: ' + (err.response?.data?.message || err.message), false);
    } finally {
      setProcessing(null);
    }
  };

  const parseRef = (ref = '', user = {}) => {
    const parts = ref.replace('BANK:', '').split('|');
    if (parts.length >= 4) {
      return {
        bankName:    parts[0] || '-',
        accountNo:   parts[1] || '-',
        accountName: parts[2] || '-',
        thb:         parts[3]?.replace('THB:', '') || '-',
      };
    }
    return {
      bankName:    parts[0] || '-',
      accountNo:   parts[1] || '-',
      accountName: user?.bankAccount?.accountName || 'N/A',
      thb:         parts[2]?.replace('THB:', '') || '-',
    };
  };

  const filtered = filter === 'all' ? withdrawals : withdrawals.filter(w => w.status === filter);
  const pendingCount  = withdrawals.filter(w => w.status === 'pending').length;
  const totalPendingCoins = withdrawals.filter(w => w.status === 'pending').reduce((s, w) => s + (w.amount || 0), 0);

  /* ─────────── PREMIUM COMPONENTS ─────────── */

  const PageBackground = () => (
    <div style={{ position: 'fixed', inset: 0, zIndex: -1, background: COLORS.bg, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(255,87,51,0.05) 0%, transparent 70%)', borderRadius: '50%' }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '-5%', width: '30%', height: '30%', background: 'radial-gradient(circle, rgba(99,102,241,0.04) 0%, transparent 70%)', borderRadius: '50%' }} />
      <div style={{ position: 'absolute', top: '20%', right: '10%', width: '20%', height: '20%', background: 'radial-gradient(circle, rgba(34,197,94,0.03) 0%, transparent 70%)', borderRadius: '50%' }} />
    </div>
  );

  const StatCard = ({ icon, label, value, sub, color }) => (
    <motion.div
      whileHover={{ y: -5, background: 'rgba(255,255,255,0.04)' }}
      style={{
        background: COLORS.glass, border: `1px solid ${COLORS.glassBorder}`, borderRadius: '24px',
        padding: '30px', position: 'relative', overflow: 'hidden', backdropFilter: 'blur(10px)', transition: '0.3s'
      }}
    >
      <div style={{
        position: 'absolute', top: -30, right: -30, width: 100, height: 100,
        background: `radial-gradient(circle, ${color}15 0%, transparent 70%)`, borderRadius: '50%'
      }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 12, background: color + '15',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color, border: `1px solid ${color}30`
        }}>{icon}</div>
        <span style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '2px', color: COLORS.textMuted }}>{label}</span>
      </div>
      <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', letterSpacing: '-2px', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '0.75rem', color: COLORS.textDim, fontWeight: 900, marginTop: 12, letterSpacing: '0.5px' }}>{sub}</div>
    </motion.div>
  );

  /* ─────────── RENDER ─────────── */
  return (
    <div style={{ minHeight: '100vh', color: '#fff', fontFamily: "'Outfit', 'Inter', sans-serif", position: 'relative' }}>
      <PageBackground />

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: -20, x: '-50%' }}
            style={{
              position: 'fixed', top: 40, left: '50%', zIndex: 10000, padding: '16px 32px', borderRadius: 24,
              fontWeight: 900, fontSize: '0.85rem', color: toast.isSuccess ? COLORS.success : COLORS.danger,
              background: 'rgba(0,0,0,0.8)', border: `1px solid ${toast.isSuccess ? COLORS.success + '40' : COLORS.danger + '40'}`,
              backdropFilter: 'blur(30px)', boxShadow: '0 30px 60px rgba(0,0,0,0.8)', letterSpacing: '1px'
            }}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating Header ── */}
      <header style={{
        position: 'sticky', top: 20, zIndex: 100, margin: '0 20px',
        background: 'rgba(10,10,10,0.7)', backdropFilter: 'blur(25px)',
        border: `1px solid ${COLORS.glassBorder}`, borderRadius: 24,
        padding: '0 30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 74,
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Link to="/admin/dashboard" style={{
            display: 'flex', alignItems: 'center', gap: 8, color: '#fff', textDecoration: 'none',
            fontSize: '0.75rem', fontWeight: 900, padding: '10px 18px', borderRadius: 16,
            background: 'rgba(255,255,255,0.04)', border: `1px solid ${COLORS.glassBorder}`, transition: '0.2s'
          }}>
            <FiArrowLeft size={16} /> <span style={{ letterSpacing: '1px' }}>DASHBOARD</span>
          </Link>
          <div style={{ width: 1, height: 24, background: COLORS.glassBorder }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FiShield size={18} color={COLORS.accent} />
            <span style={{ fontSize: '0.75rem', fontWeight: 900, letterSpacing: '3.5px', color: COLORS.accent }}>SECURE SETTLEMENTS</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {pendingCount > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 20,
              background: COLORS.warning + '15', border: `1px solid ${COLORS.warning}30`,
              color: COLORS.warning, fontSize: '0.7rem', fontWeight: 900, letterSpacing: '1px'
            }}>
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }}><FiActivity size={14} /></motion.div>
              {pendingCount} PENDING REQUESTS
            </div>
          )}
          <motion.button
            whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.08)' }} whileTap={{ scale: 0.95 }}
            onClick={fetchWithdrawals}
            style={{
              background: 'rgba(255,255,255,0.04)', border: `1px solid ${COLORS.glassBorder}`,
              color: '#fff', padding: '10px 20px', borderRadius: 16, cursor: 'pointer', fontWeight: 900, fontSize: '0.75rem'
            }}
          ><FiRefreshCw size={14} /></motion.button>
        </div>
      </header>

      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '60px 40px 150px' }}>
        
        {/* ── Welcome Section ── */}
        <section style={{ marginBottom: 60 }}>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: COLORS.textMuted, fontWeight: 900, fontSize: '0.8rem', letterSpacing: '4px', marginBottom: 15 }}>
              <FiZap size={14} color={COLORS.accent} /> PLATFORM INTELLIGENCE
            </div>
            <h1 className="admin-title-text" style={{ fontSize: 'clamp(3rem, 6vw, 5rem)', fontWeight: 900, letterSpacing: '-4px', margin: 0, lineHeight: 0.9, textTransform: 'uppercase' }}>
              Withdrawal<br/><span style={{ color: COLORS.accent }}>Matrix</span>
            </h1>
          </motion.div>
        </section>

        {/* ── Stats ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, marginBottom: 70 }}>
          <StatCard icon={<FiClock />} label="ACTIVE QUEUE" value={pendingCount} sub="Transactions awaiting audit" color={COLORS.warning} />
          <StatCard icon={<FiTrendingUp />} label="OUTFLOW VOLUME" value={`฿${(totalPendingCoins * 10).toLocaleString()}`} sub={`${totalPendingCoins.toLocaleString()} Coins pending`} color={COLORS.accent} />
          <StatCard icon={<FiCheckCircle />} label="TOTAL SETTLED" value={withdrawals.filter(w=>w.status==='completed').length} sub="Lifetime approved requests" color={COLORS.success} />
          <StatCard icon={<FiInbox />} label="SYSTEM HEALTH" value="OPTIMAL" sub="Global node connection active" color="#6366f1" />
        </div>

        {/* ── Filter Controls ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40,
          background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: 24, border: `1px solid ${COLORS.glassBorder}`
        }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {['pending', 'completed', 'failed', 'all'].map(key => (
              <motion.button
                key={key}
                whileHover={{ background: filter === key ? COLORS.accent : 'rgba(255,255,255,0.05)' }}
                onClick={() => setFilter(key)}
                style={{
                  padding: '12px 24px', borderRadius: 18, border: 'none', cursor: 'pointer',
                  fontWeight: 900, fontSize: '0.75rem', letterSpacing: '1.5px', transition: '0.3s',
                  background: filter === key ? COLORS.accent : 'transparent',
                  color: filter === key ? '#fff' : COLORS.textMuted,
                  boxShadow: filter === key ? `0 10px 25px ${COLORS.accentGlow}` : 'none'
                }}
              >
                {key.toUpperCase()}
              </motion.button>
            ))}
          </div>
          <div style={{ paddingRight: 20, color: COLORS.textDim, fontSize: '0.75rem', fontWeight: 900, letterSpacing: '1px' }}>
            SHOWING {filtered.length} RESULTS
          </div>
        </div>

        {/* ── Data List ── */}
        {loading ? (
          <div style={{ height: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} style={{ width: 40, height: 40, border: '4px solid #333', borderTopColor: COLORS.accent, borderRadius: '50%', marginBottom: 20 }} />
            <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#333', letterSpacing: '5px' }}>SYNCING MATRIX...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px 0', border: `1px dashed ${COLORS.glassBorder}`, borderRadius: 40 }}>
            <FiInbox size={50} color="#151515" />
            <div style={{ marginTop: 20, fontSize: '1.2rem', fontWeight: 900, color: '#222' }}>NO DATA IN THIS SECTOR</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
            <AnimatePresence>
              {filtered.map((w, idx) => {
                const { bankName, accountNo, accountName, thb } = parseRef(w.reference, w.user);
                const isExpanded = expandedId === w._id;
                const status = STATUS_CONFIG[w.status];

                return (
                  <motion.div
                    key={w._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                    style={{
                      background: isExpanded ? 'rgba(255,255,255,0.03)' : COLORS.glass,
                      border: `1px solid ${isExpanded ? 'rgba(255,87,51,0.2)' : COLORS.glassBorder}`,
                      borderRadius: 28, overflow: 'hidden', backdropFilter: 'blur(15px)', transition: '0.4s'
                    }}
                  >
                    {/* Row Header */}
                    <div
                      onClick={() => setExpandedId(isExpanded ? null : w._id)}
                      className="admin-list-row"
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="admin-row-item-lg" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                        {w.user?.profileImage?.url ? (
                          <img src={getFullUrl(w.user.profileImage.url)} style={{ width: 50, height: 50, borderRadius: 18, objectFit: 'cover', border: `1px solid ${COLORS.glassBorder}` }} alt="" />
                        ) : (
                          <div style={{ width: 50, height: 50, borderRadius: 18, background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiUser color="#333" /></div>
                        )}
                        <div>
                          <div style={{ fontWeight: 900, fontSize: '1rem', letterSpacing: '-0.5px' }}>{w.user?.name || 'CITIZEN'}</div>
                          <div style={{ fontSize: '0.65rem', fontWeight: 900, color: COLORS.textDim, letterSpacing: '1px', marginTop: 4 }}>ID: {w._id.toUpperCase()}</div>
                        </div>
                      </div>

                      <div className="admin-row-item">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: COLORS.accent, fontWeight: 900, fontSize: '1.2rem' }}>
                          <CoinIcon size={16} /> {w.amount?.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 900, color: COLORS.textMuted, marginTop: 4 }}>฿{Number(thb).toLocaleString()} THB</div>
                      </div>

                      <div className="admin-row-item">
                        <div style={{ fontWeight: 900, fontSize: '0.9rem', color: '#ccc' }}>{bankName}</div>
                        <div style={{ fontSize: '0.75rem', color: COLORS.textDim, fontWeight: 700, marginTop: 4 }}>{accountNo.replace(/\d(?=\d{4})/g, "•")}</div>
                      </div>

                      <div className="admin-row-item-sm">
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 18px', borderRadius: 16, background: status.color + '10', border: `1px solid ${status.color}25`, color: status.color, fontSize: '0.7rem', fontWeight: 900, letterSpacing: '1.5px' }}>
                          {status.icon} {status.label}
                        </div>
                      </div>

                      <div className="admin-row-item-lg admin-actions-mobile" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10 }} onClick={e => e.stopPropagation()}>
                        {w.status === 'pending' ? (
                          <>
                            {/* 🧾 Custom File Selector for Proof */}
                            <div style={{ position: 'relative' }}>
                               <input 
                                 type="file" 
                                 onChange={(e) => setProofFiles({...proofFiles, [w._id]: e.target.files[0]})}
                                 style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer', zIndex: 5 }}
                                 accept="image/*"
                               />
                               <div style={{ 
                                 padding: '10px 15px', borderRadius: 14, background: proofFiles[w._id] ? COLORS.success + '20' : 'rgba(255,255,255,0.05)',
                                 border: `1px dashed ${proofFiles[w._id] ? COLORS.success : COLORS.glassBorder}`,
                                 color: proofFiles[w._id] ? COLORS.success : COLORS.textDim,
                                 fontSize: '0.65rem', fontWeight: 900, transition: '0.3s'
                               }}>
                                 {proofFiles[w._id] ? 'IMAGE READY' : 'ATTACH PROOF'}
                               </div>
                            </div>

                            <motion.button
                              whileHover={{ scale: 1.05, boxShadow: `0 10px 30px ${COLORS.successGlow}` }} whileTap={{ scale: 0.95 }}
                              onClick={() => handleDecision(w._id, 'completed')}
                              style={{ background: COLORS.success, color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 18, cursor: 'pointer', fontWeight: 900, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 8 }}
                            ><FiCheckCircle size={16}/> APPROVE</motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05, background: COLORS.danger + '15' }} whileTap={{ scale: 0.95 }}
                              onClick={() => handleDecision(w._id, 'failed')}
                              style={{ background: 'transparent', color: COLORS.danger, border: `1px solid ${COLORS.danger}30`, padding: '12px 18px', borderRadius: 18, cursor: 'pointer', fontWeight: 900 }}
                            ><FiXCircle size={16}/></motion.button>
                          </>
                        ) : (
                          <div style={{ color: COLORS.textDim, fontSize: '0.75rem', fontWeight: 900, letterSpacing: '1px' }}>PROCESSED</div>
                        )}
                      </div>

                      <div style={{ marginLeft: 20 }}>
                        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}><FiChevronDown color={isExpanded ? COLORS.accent : '#222'} /></motion.div>
                      </div>
                    </div>

                    {/* Detailed Section */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
                          <div className="admin-details-pad" style={{ borderTop: `1px solid ${COLORS.glassBorder}`, paddingTop: 30 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
                              <div style={{ padding: 25, borderRadius: 24, background: 'rgba(255,255,255,0.015)', border: `1px solid ${COLORS.glassBorder}` }}>
                                <div style={{ color: COLORS.textDim, fontWeight: 900, fontSize: '0.65rem', letterSpacing: '2px', marginBottom: 15 }}>SETTLEMENT DETAILS</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                                  <div>
                                    <div style={{ fontSize: '0.7rem', color: COLORS.textMuted, marginBottom: 5 }}>ACCOUNT NAME</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 900 }}>{accountName}</div>
                                  </div>
                                  <div>
                                    <div style={{ fontSize: '0.7rem', color: COLORS.textMuted, marginBottom: 5 }}>ACCOUNT NUMBER</div>
                                    <div style={{ fontSize: '1.3rem', fontWeight: 900, letterSpacing: '2px', color: COLORS.accent }}>{accountNo}</div>
                                  </div>
                                </div>
                              </div>

                              <div style={{ padding: 25, borderRadius: 24, background: 'rgba(255,255,255,0.015)', border: `1px solid ${COLORS.glassBorder}` }}>
                                <div style={{ color: COLORS.textDim, fontWeight: 900, fontSize: '0.65rem', letterSpacing: '2px', marginBottom: 15 }}>HOLDER INTELLIGENCE</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                                  <div>
                                    <div style={{ fontSize: '0.7rem', color: COLORS.textMuted, marginBottom: 5 }}>CURRENT WALLET BALANCE</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: COLORS.warning, display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <CoinIcon size={18} /> {(w.user?.coinBalance || 0).toLocaleString()} <span style={{ fontSize: '0.7rem' }}>COINS</span>
                                    </div>
                                  </div>
                                  <div>
                                    <div style={{ fontSize: '0.7rem', color: COLORS.textMuted, marginBottom: 5 }}>CONTACT EMAIL</div>
                                    <div style={{ fontSize: '1rem', fontWeight: 900 }}>{w.user?.email || 'N/A ELECTRONIC ID'}</div>
                                  </div>
                                </div>
                              </div>

                              <div style={{ padding: 25, borderRadius: 24, background: 'rgba(255,255,255,0.015)', border: `1px solid ${COLORS.glassBorder}` }}>
                                <div style={{ color: COLORS.textDim, fontWeight: 900, fontSize: '0.65rem', letterSpacing: '2px', marginBottom: 15 }}>NETWORK TIMELINE</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                                  <div>
                                    <div style={{ fontSize: '0.7rem', color: COLORS.textMuted, marginBottom: 5 }}>REQUEST INITIATED</div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 900 }}>{new Date(w.createdAt).toLocaleString('th-TH', { dateStyle: 'long', timeStyle: 'short' })}</div>
                                  </div>
                                  <div style={{ padding: 15, borderRadius: 14, background: '#000', border: `1px solid ${COLORS.glassBorder}` }}>
                                    <div style={{ fontSize: '0.6rem', color: COLORS.textDim, letterSpacing: '1px' }}>TRANSACTION HASH</div>
                                    <div style={{ fontSize: '0.65rem', color: '#444', wordBreak: 'break-all', marginTop: 5 }}>{w._id.toUpperCase()}</div>
                                  </div>
                                </div>
                              </div>

                              {/* 🛡️ USER SECURITY INTELLIGENCE (NEW) */}
                              <div style={{ padding: 25, borderRadius: 24, background: 'rgba(239,68,68,0.02)', border: '1px solid rgba(239,68,68,0.1)', gridColumn: 'span 3' }}>
                                <div style={{ color: COLORS.danger, fontWeight: 900, fontSize: '0.65rem', letterSpacing: '2px', marginBottom: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <FiAlertCircle /> SECURITY ANOMALY PULSE
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                  {auditLogs.filter(log => log.userId?._id === w.user?._id).length > 0 ? (
                                    auditLogs.filter(log => log.userId?._id === w.user?._id).slice(0, 3).map(log => (
                                      <div key={log._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 15px', background: 'rgba(0,0,0,0.2)', borderRadius: 12 }}>
                                        <div>
                                          <span style={{ fontSize: '0.7rem', fontWeight: 900, color: COLORS.danger }}>{log.action}</span>
                                          <span style={{ fontSize: '0.7rem', color: '#666', marginLeft: 10 }}>{log.details?.type || 'UNKNOWN ANOMALY'}</span>
                                        </div>
                                        <div style={{ fontSize: '0.6rem', color: '#444' }}>{new Date(log.createdAt).toLocaleDateString()}</div>
                                      </div>
                                    ))
                                  ) : (
                                    <div style={{ color: COLORS.textDim, fontSize: '0.8rem', fontStyle: 'italic' }}>Record clear. No anomalies detected for this citizen.</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100;400;700;900&display=swap');
        :root {
          --accent: #ff5733;
        }
        * { cursor: default; }
        button, a { cursor: pointer !important; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #000; }
        ::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #222; }

        .admin-list-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 35px;
        }
        .admin-row-item { flex: 1; }
        .admin-row-item-lg { flex: 1.5; }
        .admin-row-item-sm { flex: 0.8; }
        .admin-details-pad { padding: 0 35px 40px; }

        @media (max-width: 992px) {
          .admin-list-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 20px;
            padding: 20px 25px;
          }
          .admin-row-item, .admin-row-item-lg, .admin-row-item-sm {
            width: 100%;
          }
          .admin-actions-mobile {
            justify-content: flex-start !important;
            flex-wrap: wrap;
            margin-top: 10px;
            padding-top: 20px;
            border-top: 1px dashed rgba(255,255,255,0.1);
          }
          .admin-details-pad { padding: 0 25px 30px; }
        }

        @media (max-width: 768px) {
          .admin-title-text { font-size: 2.5rem !important; }
        }
      `}</style>
    </div>
  );
}

export default AdminWithdrawals;
