import React, { useState, useContext, useEffect, useCallback } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FiTarget, FiCheckCircle, FiGift, FiPlus, FiEdit, FiTrash2, FiRefreshCw, FiAlertCircle, FiClock, FiLink, FiX, FiCheck } from 'react-icons/fi';
import { play8BitSuccess } from '../../utils/soundEffects';
import { questsAPI, questSubmissionsAPI, API } from '../../utils/api';
import CreateQuestModal from '../../components/CreateQuestModal';

// ─── Countdown helper ─────────────────────────────────────────────────────────
function useCountdown(expiresAt) {
  const calc = () => {
    if (!expiresAt) return null;
    const diff = new Date(expiresAt) - new Date();
    if (diff <= 0) return 'expired';
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    if (d > 0) return `${d}ว ${h}ช`;
    if (h > 0) return `${h}ช ${m}น`;
    return `${m}น ${s}ว`;
  };
  const [label, setLabel] = useState(calc);
  useEffect(() => {
    if (!expiresAt) return;
    const id = setInterval(() => setLabel(calc()), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  return label;
}

// ─── Helper: compute per-quest completion state from live user data ───────────
function computeCompletion(taskType, liveData, questId) {
  switch (taskType) {
    case 'PROFILE_FULL':
      return {
        checklist: [
          { label: 'เขียนข้อมูลแนะนำตัว (Bio)',   done: !!liveData.bio },
          { label: 'อัปโหลดรูปโปรไฟล์',            done: !!liveData.profileImageUrl },
          { label: 'อัปโหลดรูปหน้าปก',             done: !!liveData.coverImageUrl },
        ],
        isCompleted: !!(liveData.bio && liveData.profileImageUrl && liveData.coverImageUrl),
      };
    case 'POST_WORK':
      return {
        checklist: [{ label: `อัปโหลดผลงานอย่างน้อย 1 ชิ้น (มีอยู่ ${liveData.worksCount} ชิ้น)`, done: liveData.worksCount > 0 }],
        isCompleted: liveData.worksCount > 0,
      };
    case 'DAILY_LOGIN':
      return {
        checklist: [{ label: 'ล็อกอินเข้าสู่ระบบวันนี้', done: true }],
        isCompleted: true,
      };
    case 'PROOF_SUBMISSION':
      const sub = liveData.submissions?.find(s => s.questId === questId);
      return {
        checklist: [{ 
          label: sub ? (sub.status === 'PENDING' ? 'กำลังตรวจสอบหลักฐาน...' : sub.status === 'REJECTED' ? 'หลักฐานถูกปฏิเสธ (ลองส่งใหม่)' : 'หลักฐานผ่านการตรวจสอบ') : 'ยังไม่ได้ส่งหลักฐาน', 
          done: sub?.status === 'APPROVED' 
        }],
        isCompleted: sub?.status === 'APPROVED',
        submissionStatus: sub?.status || null
      };
    default: // MANUAL
      return { checklist: [], isCompleted: true };
  }
}

// ─── Proof Submission Modal ──────────────────────────────────────────────────
function ProofModal({ isOpen, onClose, quest, onSuccess }) {
  const [proofUrl, setProofUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!proofUrl.trim()) return setError('กรุณาระบุลิงก์หลักฐาน');
    try {
      setLoading(true);
      await questSubmissionsAPI.submit({ questId: quest._id, proofUrl });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาดในการส่งหลักฐาน');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)', padding: '20px' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ background: '#0a0a0a', width: '100%', maxWidth: '450px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', padding: '30px', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}><FiX size={24} /></button>
        <h2 style={{ margin: '0 0 10px 0', fontSize: '1.4rem', fontWeight: '800' }}>ส่งหลักฐานการทำเควส</h2>
        <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '20px' }}>{quest.title}</p>
        
        {error && <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '10px', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '15px', border: '1px solid rgba(239,68,68,0.2)' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', marginBottom: '8px', color: '#aaa', fontSize: '0.85rem', fontWeight: '700' }}>ลิงก์โพสต์ที่แชร์ หรือหลักฐานอื่นๆ</label>
          <input required type="url" value={proofUrl} onChange={e => setProofUrl(e.target.value)} placeholder="https://facebook.com/..." style={{ width: '100%', background: '#111', border: '1px solid #333', color: '#fff', padding: '12px', borderRadius: '12px', marginBottom: '20px', outline: 'none' }} />
          <button type="submit" disabled={loading} style={{ width: '100%', background: 'var(--accent, #f59e0b)', color: '#000', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', transition: '0.2s' }}>
            {loading ? 'กำลังส่ง...' : 'ยืนยันการส่งหลักฐาน'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Admin Review Section ────────────────────────────────────────────────────
function AdminReviewQueue({ onUpdate }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState(null);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const data = await questSubmissionsAPI.getAll('PENDING');
      setSubmissions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleReview = async (id, status) => {
    try {
      setReviewingId(id);
      await questSubmissionsAPI.review(id, { status });
      await fetchSubmissions();
      onUpdate();
    } catch (err) {
      alert(err.response?.data?.message || 'Error reviewing submission');
    } finally {
      setReviewingId(null);
    }
  };

  if (loading && submissions.length === 0) return null;
  if (!loading && submissions.length === 0) return null;

  return (
    <div style={{ marginBottom: '50px', background: 'rgba(245,158,11,0.03)', border: '1px dashed rgba(245,158,11,0.2)', borderRadius: '24px', padding: '25px' }}>
      <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <FiAlertCircle /> Pending Proof Reviews ({submissions.length})
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {submissions.map(sub => {
          const isReviewing = reviewingId === sub._id;
          return (
            <div key={sub._id} style={{ background: '#0a0a0a', border: '1px solid #222', borderRadius: '16px', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', opacity: isReviewing ? 0.6 : 1 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                  <img src={sub.userId?.profileImage?.url || 'https://via.placeholder.com/40'} style={{ width: '30px', height: '30px', borderRadius: '50%' }} />
                  <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>{sub.userId?.username}</span>
                  <span style={{ color: '#555' }}>→</span>
                  <span style={{ fontWeight: '700', fontSize: '0.9rem', color: '#fff' }}>{sub.questId?.title}</span>
                </div>
                <a href={sub.proofUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <FiLink size={12} /> View Proof Link
                </a>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button disabled={isReviewing} onClick={() => handleReview(sub._id, 'APPROVED')} style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e', padding: '8px 15px', borderRadius: '10px', cursor: isReviewing ? 'not-allowed' : 'pointer', fontSize: '0.8rem', fontWeight: '800' }}>{isReviewing ? '...' : 'Approve'}</button>
                <button disabled={isReviewing} onClick={() => handleReview(sub._id, 'REJECTED')} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '8px 15px', borderRadius: '10px', cursor: isReviewing ? 'not-allowed' : 'pointer', fontSize: '0.8rem', fontWeight: '800' }}>{isReviewing ? '...' : 'Reject'}</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
function Quests() {
  const { user, fetchProfile } = useContext(AuthContext);
  const userInfo = user || JSON.parse(localStorage.getItem('userInfo') || '{}');
  const isAdmin = userInfo?.role === 'admin';

  const [quests, setQuests]               = useState([]);
  const [liveData, setLiveData]           = useState({ bio: '', profileImageUrl: '', coverImageUrl: '', worksCount: 0, claimedQuests: [], submissions: [] });
  const [loadingQuests, setLoadingQuests] = useState(true);
  const [loadingLive, setLoadingLive]     = useState(true);
  const [claimingId, setClaimingId]       = useState(null);
  const [showModal, setShowModal]         = useState(false);
  const [editQuest, setEditQuest]         = useState(null);
  const [toast, setToast]                 = useState(null); // { type: 'success'|'error', msg }
  
  const [showProofModal, setShowProofModal] = useState(false);
  const [activeProofQuest, setActiveProofQuest] = useState(null);

  // ── Fetch live user data (bio, profile images, worksCount) ──────────────────
  const fetchLiveData = useCallback(async () => {
    try {
      setLoadingLive(true);
      const res = await API.get('/users/me/live-quest-data');
      setLiveData(res.data);
    } catch {
      // Fallback from context
      setLiveData({
        bio: userInfo?.bio || '',
        profileImageUrl: userInfo?.profileImage?.url || '',
        coverImageUrl: userInfo?.coverImage?.url || '',
        worksCount: userInfo?.worksCount || 0,
        claimedQuests: userInfo?.claimedQuests || [],
        submissions: [],
      });
    } finally {
      setLoadingLive(false);
    }
  }, []);

  // ── Fetch quests ─────────────────────────────────────────────────────────────
  const fetchQuests = useCallback(async () => {
    try {
      setLoadingQuests(true);
      const data = await questsAPI.getActive();
      setQuests(data);
    } catch (err) {
      console.error('fetchQuests error:', err);
    } finally {
      setLoadingQuests(false);
    }
  }, []);

  useEffect(() => {
    fetchQuests();
    fetchLiveData();
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const isQuestClaimed = (questId) => {
    const claimed = liveData.claimedQuests || [];
    if (!claimed.length) return false;
    return claimed.some(q => q.questId === questId.toString());
  };

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleClaim = async (quest) => {
    if (quest.taskType === 'PROOF_SUBMISSION' && !quest.isCompleted) {
      const sub = liveData.submissions?.find(s => s.questId === quest._id);
      if (!sub || sub.status === 'REJECTED') {
        setActiveProofQuest(quest);
        setShowProofModal(true);
        return;
      }
    }

    setClaimingId(quest._id);
    try {
      await questsAPI.claim(quest._id);
      play8BitSuccess();
      showToast('success', `🎉 รับรางวัล "${quest.title}" สำเร็จ!`);
      await Promise.all([fetchLiveData(), fetchProfile?.()]);
    } catch (err) {
      showToast('error', err.response?.data?.message || 'เกิดข้อผิดพลาดในการรับรางวัล');
    } finally {
      setClaimingId(null);
    }
  };

  const handleDelete = async (questId) => {
    if (!window.confirm('ต้องการลบเควสนี้หรือไม่?')) return;
    try {
      await questsAPI.delete(questId);
      showToast('success', 'ลบเควสสำเร็จ');
      fetchQuests();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'ลบเควสไม่สำเร็จ');
    }
  };

  const handleEdit = (quest) => {
    setEditQuest(quest);
    setShowModal(true);
  };

  const handleModalSuccess = () => {
    fetchQuests();
    setShowModal(false);
    setEditQuest(null);
  };

  // ── Derived data ─────────────────────────────────────────────────────────────
  const enrichedQuests = quests.map(q => {
    const { checklist, isCompleted, submissionStatus } = computeCompletion(q.taskType, liveData, q._id);
    return {
      ...q,
      checklist,
      isCompleted,
      submissionStatus,
      isClaimed: isQuestClaimed(q._id),
    };
  });

  const now = new Date();
  const activeQuests = enrichedQuests.filter(q => !q.expiresAt || new Date(q.expiresAt) > now);
  const coinQuests = activeQuests.filter(q => q.coinReward > 0);
  const xpQuests   = activeQuests.filter(q => q.xpReward > 0);

  const loading = loadingQuests || loadingLive;

  const handleAdminQueueUpdate = () => {
    fetchQuests();
    fetchLiveData();
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: '#000', minHeight: '100vh', padding: 'clamp(60px,10vw,100px) clamp(20px,5vw,40px)', color: '#fff' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px', gap: '20px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-1px', margin: 0 }}>
              Daily <span style={{ color: 'var(--accent, #f59e0b)' }}>Quests</span>
            </h1>
            <p style={{ color: '#666', fontSize: '0.95rem', marginTop: '6px', margin: '6px 0 0 0' }}>
              ทำภารกิจสะสมความสำเร็จเพื่อรับรางวัลพิเศษ
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={() => { fetchQuests(); fetchLiveData(); }}
              title="Refresh"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#aaa', padding: '10px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <FiRefreshCw size={16} />
            </button>

            {isAdmin && (
              <button
                onClick={() => { setEditQuest(null); setShowModal(true); }}
                style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#000', border: 'none', padding: '12px 22px', borderRadius: '14px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', boxShadow: '0 8px 20px rgba(245,158,11,0.25)', transition: 'transform 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <FiPlus size={18} /> New Quest
              </button>
            )}
          </div>
        </div>

        {/* Admin Review Queue */}
        {isAdmin && <AdminReviewQueue onUpdate={handleAdminQueueUpdate} />}

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              style={{ marginBottom: '20px', padding: '14px 20px', borderRadius: '14px', background: toast.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${toast.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`, color: toast.type === 'success' ? '#22c55e' : '#ef4444', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px', zIndex: 10001, position: 'relative' }}
            >
              {toast.type === 'success' ? <FiCheckCircle size={18} /> : <FiAlertCircle size={18} />}
              {toast.msg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#555' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid #333', borderTopColor: '#f59e0b', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 15px' }} />
            <p style={{ fontWeight: '600' }}>กำลังโหลด...</p>
          </div>
        )}

        {/* Quest Sections */}
        {!loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '35px' }}>

            {coinQuests.length > 0 && (
              <QuestSection title="Coin Quests" emoji="🪙" color="#f59e0b" borderColor="rgba(245,158,11,0.1)">
                {coinQuests.map((q, i) => (
                  <QuestCard key={q._id} quest={q} index={i} isAdmin={isAdmin}
                    claimingId={claimingId} onClaim={handleClaim}
                    onEdit={handleEdit} onDelete={handleDelete} />
                ))}
              </QuestSection>
            )}

            {xpQuests.length > 0 && (
              <QuestSection title="Experience Quests" emoji="⚡" color="#6366f1" borderColor="rgba(99,102,241,0.1)">
                {xpQuests.map((q, i) => (
                  <QuestCard key={q._id} quest={q} index={i} isAdmin={isAdmin}
                    claimingId={claimingId} onClaim={handleClaim}
                    onEdit={handleEdit} onDelete={handleDelete} />
                ))}
              </QuestSection>
            )}

            {coinQuests.length === 0 && xpQuests.length === 0 && (
              <div style={{ textAlign: 'center', padding: '100px 0', background: 'rgba(255,255,255,0.02)', borderRadius: '30px', border: '1px dashed rgba(255,255,255,0.08)' }}>
                <FiTarget size={40} color="#333" style={{ marginBottom: '15px' }} />
                <p style={{ color: '#555', fontWeight: '600' }}>ไม่มีเควสในขณะนี้</p>
                {isAdmin && <p style={{ color: '#444', fontSize: '0.85rem', marginTop: '6px' }}>กดปุ่ม "New Quest" เพื่อสร้างเควสแรก</p>}
              </div>
            )}

          </div>
        )}
      </div>

      {/* Modals */}
      <CreateQuestModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditQuest(null); }}
        onSuccess={handleModalSuccess}
        isAdmin={isAdmin}
        editData={editQuest}
      />

      <ProofModal 
        isOpen={showProofModal}
        onClose={() => { setShowProofModal(false); setActiveProofQuest(null); }}
        quest={activeProofQuest}
        onSuccess={() => { showToast('success', 'ส่งหลักฐานสำเร็จ! กรุณารอแอดมินตรวจสอบ'); fetchLiveData(); }}
      />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .quest-card-hover:hover { transform: translateY(-3px); border-color: rgba(255,255,255,0.1) !important; }
      `}</style>
    </div>
  );
}

// ─── Section Wrapper ──────────────────────────────────────────────────────────
function QuestSection({ title, emoji, color, borderColor, children }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
        <span style={{ fontSize: '1.1rem' }}>{emoji}</span>
        <h2 style={{ fontSize: '0.95rem', fontWeight: '800', margin: 0, color, textTransform: 'uppercase', letterSpacing: '2px' }}>{title}</h2>
        <div style={{ flex: 1, height: '1px', background: borderColor }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {children}
      </div>
    </div>
  );
}

// ─── Quest Card ───────────────────────────────────────────────────────────────
function QuestCard({ quest, index, isAdmin, claimingId, onClaim, onEdit, onDelete }) {
  const isClaiming = claimingId === quest._id;
  const color      = quest.coinReward > 0 ? '#f59e0b' : '#6366f1';
  const countdown  = useCountdown(quest.expiresAt);
  const isExpiringSoon = quest.expiresAt && (new Date(quest.expiresAt) - new Date()) < 3600000; // < 1 hour

  const buttonText = quest.isClaimed ? 'Claimed' : (quest.taskType === 'PROOF_SUBMISSION' && !quest.isCompleted) ? (quest.submissionStatus === 'PENDING' ? 'Pending Review' : 'Submit Proof') : 'Claim Reward';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className="quest-card-hover"
      style={{
        background: quest.isClaimed ? 'rgba(34,197,94,0.04)' : '#0a0a0a',
        border: `1px solid ${quest.isClaimed ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: '20px',
        padding: '24px 28px',
        display: 'flex',
        gap: '20px',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        transition: 'all 0.25s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Claimed badge */}
      {quest.isClaimed && (
        <div style={{ position: 'absolute', top: 0, right: 0, background: '#22c55e', color: '#000', padding: '4px 16px', borderBottomLeftRadius: '12px', fontSize: '0.65rem', fontWeight: '900', letterSpacing: '1px' }}>
          CLAIMED
        </div>
      )}

      {/* Icon */}
      <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${color}30`, flexShrink: 0 }}>
        <FiGift size={24} color={color} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: '220px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '800', margin: 0, color: '#fff' }}>{quest.title}</h3>
          {quest.taskType && quest.taskType !== 'MANUAL' && (
            <span style={{ background: `${color}15`, color, padding: '2px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: '800', border: `1px solid ${color}30` }}>
              {quest.taskType === 'PROFILE_FULL' ? 'PROFILE' : quest.taskType === 'POST_WORK' ? 'WORK' : quest.taskType === 'PROOF_SUBMISSION' ? 'SOCIAL' : quest.taskType}
            </span>
          )}
          {quest.requiredRank && quest.requiredRank !== 'All' && (
            <span style={{ background: 'rgba(255,255,255,0.05)', color: '#888', padding: '2px 8px', borderRadius: '6px', fontSize: '0.65rem' }}>
              {quest.requiredRank}+
            </span>
          )}
        </div>

        {/* Expiry countdown */}
        {countdown && countdown !== 'expired' && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', marginBottom: '8px', background: isExpiringSoon ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${isExpiringSoon ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)'}`, borderRadius: '8px', padding: '3px 10px', fontSize: '0.75rem', color: isExpiringSoon ? '#ef4444' : '#888', fontWeight: '700' }}>
            <FiClock size={11} />
            หมดอายุใน {countdown}
          </div>
        )}

        <p style={{ color: '#777', fontSize: '0.875rem', margin: '0 0 12px 0', lineHeight: 1.55 }}>{quest.description}</p>

        {/* Checklist */}
        {quest.checklist?.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {quest.checklist.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: item.done ? '#22c55e' : '#555' }}>
                <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: `1.5px solid ${item.done ? '#22c55e' : '#333'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: item.done ? 'rgba(34,197,94,0.12)' : 'transparent', flexShrink: 0 }}>
                  {item.done && <FiCheckCircle size={10} />}
                </div>
                <span style={{ fontWeight: item.done ? '700' : '400' }}>{item.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Column: reward + action */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px', minWidth: '110px' }}>
        {/* Rewards */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
          {quest.coinReward > 0 && (
            <div style={{ color: '#f59e0b', fontWeight: '900', fontSize: '1.1rem' }}>+{quest.coinReward} 🪙</div>
          )}
          {quest.xpReward > 0 && (
            <div style={{ color: '#6366f1', fontWeight: '900', fontSize: '0.9rem' }}>+{quest.xpReward} ⚡</div>
          )}
        </div>

        {/* Action */}
        {isAdmin ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
            <span style={{ color: '#555', fontSize: '0.7rem', fontWeight: '700', textAlign: 'center', padding: '6px', border: '1px solid #222', borderRadius: '8px' }}>Admin View</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => onEdit(quest)} title="Edit" style={{ flex: 1, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', color: '#3b82f6', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FiEdit size={13} />
              </button>
              <button onClick={() => onDelete(quest._id)} title="Delete" style={{ flex: 1, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FiTrash2 size={13} />
              </button>
            </div>
          </div>
        ) : quest.isClaimed ? (
          <button disabled style={{ background: 'transparent', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e', padding: '10px 18px', borderRadius: '10px', fontWeight: '800', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.7 }}>
            <FiCheckCircle size={14} /> Claimed
          </button>
        ) : (quest.isCompleted || (quest.taskType === 'PROOF_SUBMISSION' && quest.submissionStatus !== 'PENDING')) ? (
          <button
            onClick={() => onClaim(quest)}
            disabled={isClaiming || (quest.taskType === 'PROOF_SUBMISSION' && quest.submissionStatus === 'PENDING')}
            style={{ background: color, border: 'none', color: '#fff', padding: '10px 18px', borderRadius: '10px', fontWeight: '900', cursor: 'pointer', fontSize: '0.85rem', boxShadow: `0 4px 15px ${color}40`, transition: 'all 0.2s', opacity: (isClaiming || quest.submissionStatus === 'PENDING') ? 0.7 : 1 }}
          >
            {isClaiming ? 'รอสักครู่...' : buttonText}
          </button>
        ) : quest.submissionStatus === 'PENDING' ? (
           <button disabled style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid #222', color: '#666', padding: '10px 18px', borderRadius: '10px', fontWeight: '700', fontSize: '0.8rem', cursor: 'not-allowed' }}>
            Pending Review
          </button>
        ) : (
          <button disabled style={{ background: 'transparent', border: '1px solid #222', color: '#444', padding: '10px 18px', borderRadius: '10px', fontWeight: '700', fontSize: '0.8rem', cursor: 'not-allowed' }}>
            Incomplete
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default Quests;
