import { useState, useEffect, useContext } from 'react';
import { jobsAPI } from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';
import { getFullUrl } from '../../utils/mediaUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBriefcase, FiCheckCircle, FiXCircle, FiTruck, FiMail, FiSend, FiCalendar, FiShield, FiActivity, FiZap, FiLayers, FiMapPin } from 'react-icons/fi';
import { CoinIcon, CoinBadge } from '../../components/CoinIcon';

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
    <div className="glass" style={{ borderRadius: '30px', padding: '30px', border: '1px solid rgba(255,255,255,0.03)', display: 'flex', flexDirection: 'column', gap: '25px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FiActivity color="var(--accent)" size={14} />
          <span style={{ color: 'var(--accent)', fontWeight: '700', letterSpacing: '4px', fontSize: '0.65rem' }}>ไทม์ไลน์โครงการ / MILESTONES</span>
        </div>
        <span style={{ color: '#22c55e', fontSize: '0.75rem', fontWeight: '700', background: 'rgba(34, 197, 94, 0.05)', padding: '8px 16px', borderRadius: '40px', border: '1px solid rgba(34,197,94,0.1)' }}>{Math.round((currentIndex / 4) * 100)}% COMPLETE</span>
      </div>

      <div className="job-progress-container" style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', padding: '0 20px' }}>
        <div style={{ position: 'absolute', top: '15px', left: '60px', right: '60px', height: '2px' }}>
          <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.03)', borderRadius: '2px', position: 'absolute' }}></div>
          <motion.div initial={{ width: 0 }} animate={{ width: `${(currentIndex / 4) * 100}%` }} transition={{ duration: 1 }} style={{ height: '100%', background: 'var(--accent)', borderRadius: '2px', position: 'absolute', boxShadow: '0 0 10px var(--accent-glow)' }}></motion.div>
        </div>

        {PROGRESS_STAGES.map((stage, idx) => {
          const isCompleted = idx < currentIndex;
          const isActive = idx === currentIndex;

          return (
            <div
              key={stage}
              onClick={() => isInteractive && onUpdate(stage)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px',
                cursor: isInteractive ? 'pointer' : 'default',
                zIndex: 2,
                width: '80px'
              }}
            >
              <motion.div
                whileHover={isInteractive ? { scale: 1.2 } : {}}
                style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  border: `2px solid ${isActive ? 'var(--accent)' : (isCompleted ? 'var(--accent)' : 'rgba(255,255,255,0.05)')}`,
                  background: isCompleted ? 'var(--accent)' : 'rgba(0,0,0,0.8)',
                  color: isCompleted ? '#fff' : (isActive ? 'var(--accent)' : '#222'),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: '0.3s',
                  boxShadow: isActive ? '0 0 15px var(--accent-glow)' : 'none'
                }}
              >
                {isCompleted ? <FiCheckCircle size={16} /> : (isActive ? <div style={{ width: '8px', height: '8px', background: 'var(--accent)', borderRadius: '50%' }}></div> : <div style={{ width: '6px', height: '6px', background: '#222', borderRadius: '50%' }}></div>)}
              </motion.div>
              <span style={{
                color: isActive ? '#fff' : (isCompleted ? '#888' : '#222'),
                fontWeight: isActive ? '900' : '500',
                fontSize: '0.65rem',
                textAlign: 'center',
                lineHeight: '1.4',
                transition: '0.3s',
              }}>
                {STAGE_LABELS[stage] || stage.replace('_', ' ')}
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
      pending: { bg: 'rgba(59, 130, 246, 0.05)', color: '#3b82f6', text: 'รอการอนุมัติ / PENDING' },
      accepted: { bg: 'rgba(34, 197, 94, 0.05)', color: '#22c55e', text: 'กำลังดำเนินการ / IN PROGRESS' },
      completed: { bg: 'rgba(168, 85, 247, 0.05)', color: '#a855f7', text: 'เสร็จสิ้น / COMPLETED' },
      cancelled: { bg: 'rgba(239, 68, 68, 0.05)', color: '#ef4444', text: 'ยกเลิก / CANCELLED' }
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
    <div style={{ padding: '100px', textAlign: 'center' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} style={{ width: '40px', height: '40px', border: '3px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 20px' }} />
      <p style={{ color: '#444', fontWeight: '700', letterSpacing: '4px', fontSize: '0.8rem' }}>System Loading...</p>
    </div>
  );

  const jobsToShow = activeTab === 'sent' ? sentJobs : receivedJobs;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fadeIn">

      {/* 🚀 Header Section */}
      <header className="job-header" style={{ marginBottom: '60px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '30px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            <FiBriefcase color="var(--accent)" size={16} />
            <span style={{ color: 'var(--accent)', fontSize: '1rem', fontWeight: '700', letterSpacing: '4px' }}>บันทึกงาน / JOB LOGS</span>
            {/* <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#6366f1' }}>รอดำเนินการ / PENDING</span> */}
          </div>
          <h2 style={{ fontSize: '3.5rem', fontWeight: '700', margin: 0, letterSpacing: '-2px', lineHeight: 1 }}>Active Projects</h2>
          <p style={{ color: '#444', marginTop: '15px', fontWeight: '700', fontSize: '0.95rem' }}>ติดตามและบริหารจัดการโครงการทั้งหมดของคุณ</p>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} className="glass" style={{ padding: '20px 30px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.03)', textAlign: 'right' }}>
          <p style={{ margin: 0, fontSize: '0.65rem', color: '#333', fontWeight: '700', letterSpacing: '2px', marginBottom: '8px' }}>BALANCE</p>
          <CoinBadge amount={user?.coinBalance || userInfo?.coinBalance || 0} size="lg" />
        </motion.div>
      </header>

      {/* 🧬 Workspace Tabs */}
      <div style={{ display: 'flex', gap: '40px', marginBottom: '50px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
        {!isGeneral && (
          <button
            onClick={() => setActiveTab('received')}
            style={{
              background: 'none', border: 'none', padding: '20px 0', cursor: 'pointer',
              color: activeTab === 'received' ? '#fff' : '#444', fontWeight: '700',
              borderBottom: activeTab === 'received' ? '2px solid var(--accent)' : '2px solid transparent',
              transition: '0.3s', fontSize: '1rem', letterSpacing: '1px'
            }}
          >
            งานที่ได้รับ ({receivedJobs.length})
          </button>
        )}
        <button
          onClick={() => setActiveTab('sent')}
          style={{
            background: 'none', border: 'none', padding: '20px 0', cursor: 'pointer',
            color: activeTab === 'sent' ? '#fff' : '#444', fontWeight: '700',
            borderBottom: activeTab === 'sent' ? '2px solid var(--accent)' : '2px solid transparent',
            transition: '0.3s', fontSize: '1rem', letterSpacing: '1px'
          }}
        >
          งานที่จ้างงาน ({sentJobs.length})
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        {jobsToShow.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '120px 40px', background: 'rgba(255,255,255,0.01)', borderRadius: '50px', border: '1px dashed rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: '4rem', marginBottom: '25px', color: '#111' }}><FiBriefcase /></div>
            <h3 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '700' }}>NO ACTIVE PROJECTS</h3>
            <p style={{ color: '#444', marginTop: '10px', fontWeight: '700' }}>When a mission starts, it will appear here in your command center.</p>
          </div>
        ) : (
          jobsToShow.map((job) => (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} key={job._id} className="glass job-card-grid" style={{
              borderRadius: '40px', padding: '45px', border: '1px solid rgba(255,255,255,0.03)', alignItems: 'center'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '25px' }}>
                  <StatusBadge status={job.status} />
                  <span style={{ color: '#222', fontSize: '0.75rem', fontWeight: '700', letterSpacing: '1px' }}>#{job._id.slice(-8).toUpperCase()}</span>
                  <span style={{ color: '#333', fontSize: '0.75rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}><FiCalendar /> {new Date(job.createdAt).toLocaleDateString()}</span>
                </div>

                <h3 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '15px' }}>{job.title}</h3>

                <div style={{ display: 'flex', alignItems: 'center', gap: '25px', marginBottom: '30px' }}>
                  <div style={{ background: 'rgba(99, 102, 241, 0.03)', padding: '12px 22px', borderRadius: '20px', border: '1px solid rgba(99, 102, 241, 0.08)' }}>
                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#444', fontWeight: '700', letterSpacing: '2px', margin: '5px 0' }}>SERVICE CATEGORY</p>
                    <div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--accent)' }}>
                      {job.work?.category?.name || 'General Service'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: job.paymentStatus === 'released' ? '#22c55e' : (job.paymentStatus === 'escrow_held' ? '#f59e0b' : '#ef4444'), fontSize: '0.8rem', fontWeight: '700' }}>
                    <FiShield size={18} />
                    <span>{job.paymentStatus === 'escrow_held' ? 'Coins Held in Escrow' : (job.paymentStatus === 'released' ? 'Payment Released' : 'Refunded')}</span>
                  </div>
                </div>

                <p style={{ color: '#555', fontSize: '1.05rem', lineHeight: '1.7', marginBottom: '25px', maxWidth: '850px', fontWeight: '500' }}>{job.description}</p>

                {job.location && job.location.address && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '35px', background: 'rgba(255,255,255,0.02)', padding: '12px 20px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.05)', width: 'fit-content' }}>
                    <FiMapPin color="var(--accent)" />
                    <span style={{ fontSize: '0.85rem', color: '#888', maxWidth: '500px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.location.address}</span>
                    {job.location.lat && job.location.lng && (
                       <a 
                         href={`https://www.google.com/maps?q=${job.location.lat},${job.location.lng}`} 
                         target="_blank" 
                         rel="noreferrer"
                         style={{ color: 'var(--accent)', fontSize: '0.75rem', fontWeight: '700', textDecoration: 'none', marginLeft: '10px', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '10px' }}
                       >
                         OPEN MAPS
                       </a>
                    )}
                  </div>
                )}

                {job.status === 'accepted' && (
                  <div style={{ marginBottom: '40px' }}>
                    <ProgressChecklist
                      currentStage={job.progressStage}
                      onUpdate={(val) => handleUpdateProgress(job._id, val)}
                      isInteractive={activeTab === 'received'}
                    />
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: '#0a0a0a', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                    {activeTab === 'sent' ? (
                      job.freelancer?.profileImage?.url && <img src={getFullUrl(job.freelancer.profileImage.url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      job.employer?.profileImage?.url && <img src={getFullUrl(job.employer.profileImage.url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: '#222', fontWeight: '700', letterSpacing: '1px' }}>{activeTab === 'sent' ? 'FREELANCER' : 'CLIENT'}</div>
                    <div style={{ fontWeight: '700', fontSize: '1rem' }}>{activeTab === 'sent' ? job.freelancer?.name : job.employer?.name}</div>
                  </div>
                </div>
              </div>

              <div className="job-action-card" style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '30px', alignItems: 'flex-end' }}>
                <div>
                  <div style={{ color: '#222', fontSize: '0.75rem', fontWeight: '700', letterSpacing: '2px', marginBottom: '10px' }}>TOTAL BUDGET</div>
                  <CoinBadge amount={job.budget} size="lg" />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%' }}>
                  {activeTab === 'received' && job.status === 'pending' && (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        onClick={() => handleUpdateStatus(job._id, 'accepted')}
                        style={{ width: '100%', background: '#22c55e', color: '#fff', border: 'none', padding: '16px', borderRadius: '20px', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 5px 15px rgba(34,197,94,0.2)' }}
                      >
                        <FiCheckCircle /> ACCEPT PROJECT
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        onClick={() => handleUpdateStatus(job._id, 'cancelled')}
                        style={{ width: '100%', background: 'rgba(239, 68, 68, 0.05)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.1)', padding: '16px', borderRadius: '20px', cursor: 'pointer', fontWeight: '700' }}
                      >
                        REJECT REQUEST
                      </motion.button>
                    </>
                  )}

                  {job.status === 'accepted' && activeTab === 'received' && (
                    <div className="glass" style={{ padding: '20px', borderRadius: '20px', color: '#444', fontSize: '0.85rem', fontWeight: '700', textAlign: 'center', border: '1px solid rgba(255,255,255,0.02)' }}>
                      กำลังดำเนินการ... <br />คอยอัปเดตความคืบหน้าเสมอ
                    </div>
                  )}

                  {job.status === 'accepted' && activeTab === 'sent' && (
                    <motion.button
                      whileHover={{ scale: 1.05, boxShadow: job.progressStage === 'SUBMITTED' ? '0 0 30px #22c55e' : '0 10px 30px rgba(34, 197, 94, 0.3)' }}
                      animate={job.progressStage === 'SUBMITTED' ? { scale: [1, 1.03, 1] } : {}}
                      transition={job.progressStage === 'SUBMITTED' ? { repeat: Infinity, duration: 2 } : {}}
                      onClick={() => {
                        if (window.confirm('คุณต้องการยืนยันการรับมอบงานและโอนเหรียญให้ฟรีแลนซ์ใช่หรือไม่?')) {
                          handleUpdateStatus(job._id, 'completed')
                        }
                      }}
                      style={{
                        background: job.progressStage === 'SUBMITTED' ? '#22c55e' : 'rgba(34, 197, 94, 0.1)',
                        color: '#fff',
                        border: job.progressStage === 'SUBMITTED' ? 'none' : '1px solid #22c55e',
                        padding: '18px', borderRadius: '25px', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                      }}
                    >
                      <FiCheckCircle size={20} />
                      {job.progressStage === 'SUBMITTED' ? 'รับมอบงาน & จ่ายเงิน' : 'ยืนยันงานเสร็จสิ้น (กรณีตรวจรับแล้ว)'}
                    </motion.button>
                  )}

                  {job.status === 'completed' && (
                    <div className="glass" style={{ padding: '20px', borderRadius: '20px', color: '#a855f7', fontWeight: '700', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', border: '1px solid rgba(168,85,247,0.1)' }}>
                      <FiCheckCircle /> เสร็จสิ้นภารกิจ
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
      
      <style>{`
        .job-card-grid {
          display: grid; grid-template-columns: 1fr 320px; gap: 50px;
        }
        .job-action-card {
          border-left: 1px solid rgba(255,255,255,0.03); padding-left: 50px;
        }

        @media (max-width: 992px) {
          .job-card-grid { grid-template-columns: 1fr; gap: 30px; padding: 30px !important; }
          .job-action-card {
            border-left: none; padding-left: 0; text-align: left !important;
            align-items: flex-start !important; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 30px;
          }
          .job-progress-container { overflow-x: auto; padding-bottom: 20px !important; }
          .job-progress-container::-webkit-scrollbar { display: none; }
          .job-progress-container > div { flex-shrink: 0; }
          .job-header h2 { font-size: 2.5rem !important; }
        }
      `}</style>
    </motion.div>
  );
}

export default ManageJobs;
