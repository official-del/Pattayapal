import { useState, useEffect, useContext } from 'react';
import { jobsAPI } from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';
import { getFullUrl } from '../../utils/mediaUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBriefcase, FiCheckCircle, FiXCircle, FiTruck, FiMail, FiSend, FiCalendar, FiShield, FiActivity, FiZap, FiLayers, FiMapPin } from 'react-icons/fi';
import { CoinIcon, CoinBadge } from '../../components/CoinIcon';
import '../../css/ManageJobs.css';

const PROGRESS_STAGES = ['AWAITING_START', 'IN_PROGRESS', 'SUBMITTED', 'REVISING', 'COMPLETED'];
const STAGE_LABELS = {
  'AWAITING_START': 'รอเริ่มงาน',
  'IN_PROGRESS': 'กำลังดำเนินการ',
  'SUBMITTED': 'ส่งมอบงาน',
  'REVISING': 'แก้ไขงาน',
  'COMPLETED': 'เสร็จสิ้น'
};

const ProgressChecklist = ({ currentStage, onUpdate, isInteractive }) => {
  const currentIndex = PROGRESS_STAGES.indexOf(currentStage || 'AWAITING_START');

  return (
    <div className="milestones-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FiActivity color="var(--mj-accent)" size={14} />
          <span style={{ color: 'var(--mj-accent)', fontWeight: '800', letterSpacing: '4px', fontSize: '0.65rem' }}>ไทม์ไลน์ / MILESTONES</span>
        </div>
        <span style={{ color: '#22c55e', fontSize: '0.75rem', fontWeight: '800', background: 'rgba(34, 197, 94, 0.05)', padding: '6px 15px', borderRadius: '40px', border: '1px solid rgba(34,197,94,0.1)' }}>
          {Math.round((currentIndex / 4) * 100)}% COMPLETE
        </span>
      </div>

      <div className="job-progress-container" style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', padding: '0 10px' }}>
        <div style={{ position: 'absolute', top: '15px', left: '40px', right: '40px', height: '2px', background: 'rgba(255,255,255,0.03)' }}>
          <motion.div initial={{ width: 0 }} animate={{ width: `${(currentIndex / 4) * 100}%` }} transition={{ duration: 1 }} style={{ height: '100%', background: 'var(--mj-accent)', boxShadow: '0 0 10px var(--mj-accent)' }}></motion.div>
        </div>

        {PROGRESS_STAGES.map((stage, idx) => {
          const isCompleted = idx < currentIndex;
          const isActive = idx === currentIndex;

          return (
            <div
              key={stage}
              onClick={() => isInteractive && onUpdate(stage)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', cursor: isInteractive ? 'pointer' : 'default', zIndex: 2, width: '70px' }}
            >
              <motion.div
                whileHover={isInteractive ? { scale: 1.1 } : {}}
                style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: isCompleted ? 'var(--mj-accent)' : '#000',
                  border: `2px solid ${isActive || isCompleted ? 'var(--mj-accent)' : 'rgba(255,255,255,0.05)'}`,
                  color: isCompleted ? '#fff' : (isActive ? 'var(--mj-accent)' : '#222'),
                  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.3s'
                }}
              >
                {isCompleted ? <FiCheckCircle size={16} /> : (isActive ? <div style={{ width: '8px', height: '8px', background: 'var(--mj-accent)', borderRadius: '50%' }}></div> : <div style={{ width: '6px', height: '6px', background: '#222', borderRadius: '50%' }}></div>)}
              </motion.div>
              <span style={{ color: isActive ? '#fff' : (isCompleted ? '#666' : '#222'), fontWeight: isActive ? '800' : '500', fontSize: '0.6rem', textAlign: 'center', lineHeight: '1.4' }}>
                {STAGE_LABELS[stage] || stage}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

function ManageJobs() {
  const { user, token: contextToken } = useContext(AuthContext);
  const currentToken = contextToken || localStorage.getItem('userToken') || localStorage.getItem('token');
  const userInfo = user || JSON.parse(localStorage.getItem('userInfo'));
  const isGeneral = userInfo?.profession === 'General';

  const [sentJobs, setSentJobs] = useState([]);
  const [receivedJobs, setReceivedJobs] = useState([]);
  const [activeTab, setActiveTab] = useState(isGeneral ? 'sent' : 'received');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isGeneral) setActiveTab('sent');
  }, [isGeneral]);

  const fetchJobs = async () => {
    if (!currentToken) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [sent, received] = await Promise.all([
        jobsAPI.getMySentJobs(currentToken),
        jobsAPI.getMyReceivedJobs(currentToken)
      ]);
      setSentJobs(sent);
      setReceivedJobs(received);
    } catch (err) {
      console.error("Fetch jobs error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [currentToken]);

  const handleUpdateStatus = async (jobId, newStatus) => {
    try {
      await jobsAPI.updateStatus(jobId, newStatus, currentToken);
      fetchJobs();
    } catch (err) {
      console.error("Status update error:", err);
      const errMsg = err.response?.data?.message || 'Update failed';
      alert(`ไม่สามารถอัปเดตสถานะได้: ${errMsg}`);
    }
  };

  const handleUpdateProgress = async (jobId, newProgress) => {
    try {
      if (!window.confirm(`ยืนยันการตั้งค่าสถานะเป็น ${STAGE_LABELS[newProgress] || newProgress}?`)) return;
      await jobsAPI.updateProgress(jobId, newProgress, currentToken);
      fetchJobs();
    } catch (err) {
      console.error("Progress update error:", err);
      const errMsg = err.response?.data?.message || 'Failed to update progress';
      alert(`ไม่สามารถอัปเดตความคืบหน้าได้: ${errMsg}`);
    }
  };

  const StatusBadge = ({ status }) => {
    const colors = {
      pending: { bg: 'rgba(59, 130, 246, 0.05)', color: '#3b82f6', text: 'PENDING' },
      accepted: { bg: 'rgba(34, 197, 94, 0.05)', color: '#22c55e', text: 'IN PROCESS' },
      completed: { bg: 'rgba(168, 85, 247, 0.05)', color: '#a855f7', text: 'COMPLETED' },
      cancelled: { bg: 'rgba(239, 68, 68, 0.05)', color: '#ef4444', text: 'CANCELLED' }
    };
    const s = colors[status] || { bg: '#111', color: '#555', text: status?.replace(/_/g, ' ').toUpperCase() };
    return (
      <span style={{
        background: s.bg, color: s.color, padding: '6px 15px', borderRadius: '40px', fontSize: '0.7rem', fontWeight: '700', border: `1px solid ${s.color}22`, letterSpacing: '1px'
      }}>
        {s.text}
      </span>
    );
  };

  if (loading) return (
    <div style={{ padding: '150px 20px', textAlign: 'center', background: 'var(--mj-bg-dark)', minHeight: '100vh' }}>
      <motion.div 
        animate={{ rotate: 360, scale: [1, 1.2, 1] }} 
        transition={{ repeat: Infinity, duration: 2, ease: "linear" }} 
        style={{ width: '60px', height: '60px', border: '3px solid var(--mj-accent)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 30px', boxShadow: '0 0 30px var(--mj-accent-glow' }} 
      />
      <p style={{ color: 'var(--mj-accent)', fontWeight: '900', letterSpacing: '8px', fontSize: '0.9rem', textTransform: 'uppercase' }}>Synchronizing Manage Jobs...</p>
    </div>
  );

  const jobsToShow = activeTab === 'sent' ? sentJobs : receivedJobs;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="manage-jobs-container">

      {/* 🚀 Hyper Header Section */}
      <header className="mj-header">
        <motion.div 
          initial={{ opacity: 0, x: -30 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ delay: 0.2 }}
          className="mj-title-group"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
            <FiZap color="var(--mj-accent)" size={20} className="glow-icon" />
            <span style={{ color: 'var(--mj-accent)', fontSize: '0.9rem', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase' }}>Manage Jobs</span>
          </div>
          <h2 className="mj-main-title">จัดการโปรเจกต์</h2>
          <p style={{ color: '#555', marginTop: '25px', fontWeight: '700', fontSize: '1.1rem', maxWidth: '600px', lineHeight: '1.6' }}>
            บริหารจัดการภารกิจและติดตามความคืบหน้าของทุกโครงการในมือคุณผ่านระบบอัจฉริยะ
          </p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }} 
          className="budget-display"
        >
          <p style={{ margin: '0 0 15px', fontSize: '0.75rem', color: '#444', fontWeight: '900', letterSpacing: '4px' }}>AVAILABLE BALANCE</p>
          <CoinBadge amount={user?.coinBalance || userInfo?.coinBalance || 0} size="lg" />
        </motion.div>
      </header>

      {/* 🧬 Neo Tabs */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.4 }}
        className="mj-tabs"
      >
        {!isGeneral && (
          <button
            onClick={() => setActiveTab('received')}
            className={`mj-tab-btn ${activeTab === 'received' ? 'active' : ''}`}
          >
            งานที่ได้รับ ({receivedJobs.length})
          </button>
        )}
        <button
          onClick={() => setActiveTab('sent')}
          className={`mj-tab-btn ${activeTab === 'sent' ? 'active' : ''}`}
        >
          งานที่จ้างงาน ({sentJobs.length})
        </button>
      </motion.div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
        <AnimatePresence mode="wait">
          {jobsToShow.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              style={{ textAlign: 'center', padding: '140px 40px', background: 'rgba(255,255,255,0.01)', borderRadius: '60px', border: '1px dashed rgba(255,255,255,0.05)' }}
            >
              <FiBriefcase size={80} color="#111" style={{ marginBottom: '30px' }} />
              <h3 style={{ margin: 0, fontSize: '2.2rem', fontWeight: '900', letterSpacing: '-1px' }}>NO ACTIVE MISSIONS</h3>
              <p style={{ color: '#444', marginTop: '15px', fontWeight: '700', fontSize: '1.1rem' }}>ยังไม่มีรายการโครงการที่กำลังดำเนินการในขณะนี้</p>
            </motion.div>
          ) : (
            <motion.div 
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {jobsToShow.map((job, index) => (
                <motion.div 
                  initial={{ opacity: 0, y: 30 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  key={job._id} 
                  className="job-card"
                >
                  <div className="job-main-info">
                    <div className="mj-meta-row">
                      <StatusBadge status={job.status} />
                      <span className="job-id">#{job._id.slice(-8).toUpperCase()}</span>
                      <span className="job-date" style={{ color: '#444', fontSize: '0.8rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}><FiCalendar /> {new Date(job.createdAt).toLocaleDateString()}</span>
                    </div>

                    <h3 className="mj-title">{job.title}</h3>

                    <div className="mj-info-grid">
                      <div className="info-tile">
                        <span className="tile-label">SERVICE CATEGORY</span>
                        <div className="tile-value">{job.work?.category?.name || 'General Service'}</div>
                      </div>

                      <div className="info-tile">
                        <span className="tile-label">SECURITY & ESCROW</span>
                        <div className="payment-status" style={{ color: job.paymentStatus === 'released' ? '#22c55e' : '#f59e0b', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <FiShield size={18} />
                          <span style={{ fontWeight: '800', fontSize: '1rem' }}>{job.paymentStatus === 'escrow_held' ? 'Coins Held in Escrow' : 'Payment Released'}</span>
                        </div>
                      </div>
                    </div>

                    <p style={{ color: '#777', fontSize: '1.05rem', lineHeight: '1.8', marginBottom: '45px', fontWeight: '500', maxWidth: '850px' }}>{job.description}</p>

                    {job.location && job.location.address && (
                      <div className="mj-location-box">
                        <FiMapPin color="var(--mj-accent)" size={18} />
                        <span className="location-text">{job.location.address}</span>
                        {job.location.lat && job.location.lng && (
                          <a 
                            href={`https://www.google.com/maps?q=${job.location.lat},${job.location.lng}`} 
                            target="_blank" rel="noreferrer" className="map-link"
                          >
                            OPEN MAPS
                          </a>
                        )}
                      </div>
                    )}

                    {job.status === 'accepted' && (
                      <ProgressChecklist
                        currentStage={job.progressStage}
                        onUpdate={(val) => handleUpdateProgress(job._id, val)}
                        isInteractive={activeTab === 'received'}
                      />
                    )}

                    <div className="user-info-row">
                      <div className="user-avatar">
                        {activeTab === 'sent' ? (
                          job.freelancer?.profileImage?.url && <img src={getFullUrl(job.freelancer.profileImage.url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          job.employer?.profileImage?.url && <img src={getFullUrl(job.employer.profileImage.url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: '#444', fontWeight: '900', letterSpacing: '1px', marginBottom: '5px' }}>{activeTab === 'sent' ? 'ASSIGNED FREELANCER' : 'CLIENT COMMANDER'}</div>
                        <div style={{ fontWeight: '900', fontSize: '1.2rem', color: '#fff' }}>{activeTab === 'sent' ? job.freelancer?.name : job.employer?.name}</div>
                      </div>
                    </div>
                  </div>

                  <div className="action-panel">
                    <div className="budget-section">
                      <span className="budget-label">MISSION BUDGET</span>
                      <CoinBadge amount={job.budget} size="lg" />
                    </div>

                    <div className="mj-actions" style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%' }}>
                      {activeTab === 'received' && job.status === 'pending' && (
                        <>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleUpdateStatus(job._id, 'accepted')}
                            className="btn-primary"
                          >
                            <FiCheckCircle size={20} /> ACCEPT PROJECT
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleUpdateStatus(job._id, 'cancelled')}
                            className="btn-secondary"
                            style={{ background: 'rgba(239, 68, 68, 0.05)', color: '#ef4444', borderColor: 'rgba(239,68,68,0.1)' }}
                          >
                            REJECT REQUEST
                          </motion.button>
                        </>
                      )}

                      {job.status === 'accepted' && activeTab === 'received' && (
                        <div style={{ padding: '25px', borderRadius: '30px', background: 'rgba(255,255,255,0.02)', color: '#666', fontSize: '0.9rem', fontWeight: '800', textAlign: 'center', border: '1px solid rgba(255,255,255,0.03)', lineHeight: '1.6' }}>
                          MISSION IN PROGRESS <br />
                          <span style={{ fontSize: '0.7rem', color: '#444', letterSpacing: '1px' }}>KEEP UPDATING MILESTONES</span>
                        </div>
                      )}

                      {job.status === 'accepted' && activeTab === 'sent' && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="btn-primary"
                          onClick={() => {
                            if (window.confirm('คุณต้องการยืนยันการรับมอบงานและโอนเหรียญให้ฟรีแลนซ์ใช่หรือไม่?')) {
                              handleUpdateStatus(job._id, 'completed')
                            }
                          }}
                        >
                          <FiCheckCircle size={22} />
                          {job.progressStage === 'SUBMITTED' ? 'VERIFY & PAY' : 'MARK AS COMPLETED'}
                        </motion.button>
                      )}

                      {job.status === 'completed' && (
                        <div className="status-completed-pill">
                          <FiCheckCircle size={24} /> MISSION COMPLETED
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default ManageJobs;
