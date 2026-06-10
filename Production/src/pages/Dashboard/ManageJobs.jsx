import { customConfirm } from '../../utils/customConfirm';
import { toast } from 'react-hot-toast';
import { useState, useEffect, useContext } from 'react';
import { jobsAPI } from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';
import { getFullUrl } from '../../utils/mediaUtils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiActivity,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiMapPin,
  FiShield,
  FiZap,
} from 'react-icons/fi';
import { CoinBadge } from '../../components/CoinIcon';
import PremiumLoader from '../../components/PremiumLoader';
import '../../css/ManageJobs.css';

const PROGRESS_STAGES = ['AWAITING_START', 'IN_PROGRESS', 'SUBMITTED', 'REVISING', 'COMPLETED'];
const STAGE_LABELS = {
  AWAITING_START: 'Awaiting start',
  IN_PROGRESS: 'In progress',
  SUBMITTED: 'Submitted',
  REVISING: 'Revising',
  COMPLETED: 'Completed',
};

const STATUS_META = {
  pending: { tone: 'info', text: 'Pending' },
  accepted: { tone: 'success', text: 'In process' },
  completed: { tone: 'complete', text: 'Completed' },
  cancelled: { tone: 'danger', text: 'Cancelled' },
};

function ProgressChecklist({ currentStage, onUpdate, isInteractive }) {
  const currentIndex = Math.max(0, PROGRESS_STAGES.indexOf(currentStage || 'AWAITING_START'));
  const percent = Math.round((currentIndex / (PROGRESS_STAGES.length - 1)) * 100);

  return (
    <div className="milestones-card">
      <div className="milestones-header">
        <div className="milestones-kicker">
          <FiActivity size={14} />
          <span>Timeline / Milestones</span>
        </div>
        <span className="milestones-percent">{percent}% complete</span>
      </div>

      <div className="job-progress-wrapper">
        <div className="job-progress-container">
          <div className="progress-line">
            <motion.div
              className="progress-line-fill"
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>

          {PROGRESS_STAGES.map((stage, idx) => {
            const isCompleted = idx < currentIndex;
            const isActive = idx === currentIndex;

            return (
              <button
                key={stage}
                type="button"
                className={`progress-step ${isCompleted ? 'is-completed' : ''} ${isActive ? 'is-active' : ''}`}
                onClick={() => isInteractive && onUpdate(stage)}
                disabled={!isInteractive}
              >
                <motion.span whileHover={isInteractive ? { scale: 1.08 } : {}} className="progress-dot">
                  {isCompleted ? <FiCheckCircle size={15} /> : <span />}
                </motion.span>
                <span className="progress-label">{STAGE_LABELS[stage] || stage}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || { tone: 'neutral', text: status?.replace(/_/g, ' ') || 'Unknown' };

  return <span className={`mj-status-badge is-${meta.tone}`}>{meta.text}</span>;
}

function ManageJobs() {
  const { user, token: contextToken } = useContext(AuthContext);
  const currentToken = contextToken || window.safeStorage.getItem('userToken') || window.safeStorage.getItem('token');
  const userInfo = user || JSON.parse(window.safeStorage.getItem('userInfo') || '{}');
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
        jobsAPI.getMyReceivedJobs(currentToken),
      ]);
      setSentJobs(sent || []);
      setReceivedJobs(received || []);
    } catch (err) {
      console.error('Fetch jobs error:', err);
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
      console.error('Status update error:', err);
      const errMsg = err.response?.data?.message || 'Update failed';
      toast.error(`Unable to update job status: ${errMsg}`);
    }
  };

  const handleUpdateProgress = async (jobId, newProgress) => {
    try {
      if (!await customConfirm(`Confirm milestone update to ${STAGE_LABELS[newProgress] || newProgress}?`)) return;
      await jobsAPI.updateProgress(jobId, newProgress, currentToken);
      fetchJobs();
    } catch (err) {
      console.error('Progress update error:', err);
      const errMsg = err.response?.data?.message || 'Failed to update progress';
      toast.error(`Unable to update progress: ${errMsg}`);
    }
  };

  if (loading) {
    return <PremiumLoader text="Synchronizing Jobs..." subtext="Loading your job workspace..." />;
  }

  const jobsToShow = activeTab === 'sent' ? sentJobs : receivedJobs;
  const coinBalance = user?.coinBalance || userInfo?.coinBalance || 0;

  return (
    <motion.div
      className="manage-jobs-container"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
    >
      <header className="mj-header">
        <motion.div
          className="mj-title-group"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mj-kicker">
            <FiZap size={16} />
            <span>Manage Jobs</span>
          </div>
          <h2 className="mj-main-title">Job Command Center</h2>
          <p className="mj-subtitle">
            Track received and hired projects in one place, with escrow status, milestone progress, and the next action clearly surfaced.
          </p>
        </motion.div>

        <motion.div className="budget-display" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <span className="budget-display-label">Available balance</span>
          <CoinBadge amount={coinBalance} size="lg" />
        </motion.div>
      </header>

      <motion.div className="mj-tabs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        {!isGeneral && (
          <button
            type="button"
            onClick={() => setActiveTab('received')}
            className={`mj-tab-btn ${activeTab === 'received' ? 'active' : ''}`}
          >
            <span>Received jobs</span>
            <strong>{receivedJobs.length}</strong>
          </button>
        )}
        <button
          type="button"
          onClick={() => setActiveTab('sent')}
          className={`mj-tab-btn ${activeTab === 'sent' ? 'active' : ''}`}
        >
          <span>Hired jobs</span>
          <strong>{sentJobs.length}</strong>
        </button>
      </motion.div>

      <div className="mj-job-list">
        <AnimatePresence mode="wait">
          {jobsToShow.length === 0 ? (
            <motion.div
              key="empty"
              className="mj-empty-state"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <div className="mj-empty-icon"><FiBriefcase size={28} /></div>
              <h3>No active missions</h3>
              <p>No projects in this view yet. New jobs will appear here with status, budget, milestones, and the next action to take.</p>
            </motion.div>
          ) : (
            <motion.div key={activeTab} className="mj-list-stack" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {jobsToShow.map((job, index) => {
                const person = activeTab === 'sent' ? job.freelancer : job.employer;
                const personRole = activeTab === 'sent' ? 'Assigned freelancer' : 'Client commander';
                const avatarUrl = person?.profileImage?.url ? getFullUrl(person.profileImage.url) : null;

                return (
                  <motion.article
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.035, duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    key={job._id}
                    className="job-card"
                  >
                    <div className="job-main-info">
                      <div className="mj-meta-row">
                        <StatusBadge status={job.status} />
                        <span className="job-id">#{job._id.slice(-8).toUpperCase()}</span>
                        <span className="job-date"><FiCalendar size={14} /> {new Date(job.createdAt).toLocaleDateString()}</span>
                      </div>

                      <h3 className="mj-title">{job.title}</h3>

                      <div className="mj-info-grid">
                        <div className="info-tile">
                          <span className="tile-label">Service category</span>
                          <div className="tile-value">{job.work?.category?.name || 'General Service'}</div>
                        </div>

                        <div className="info-tile">
                          <span className="tile-label">Security & escrow</span>
                          <div className={`payment-status ${job.paymentStatus === 'released' ? 'is-released' : 'is-held'}`}>
                            <FiShield size={17} />
                            <span>{job.paymentStatus === 'escrow_held' ? 'Coins held in escrow' : 'Payment released'}</span>
                          </div>
                        </div>
                      </div>

                      {job.description && <p className="job-description">{job.description}</p>}

                      {job.location?.address && (
                        <div className="mj-location-box">
                          <FiMapPin size={17} />
                          <span className="location-text">{job.location.address}</span>
                          {job.location.lat && job.location.lng && (
                            <a
                              href={`https://www.google.com/maps?q=${job.location.lat},${job.location.lng}`}
                              target="_blank"
                              rel="noreferrer"
                              className="map-link"
                            >
                              Open maps
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
                          {avatarUrl ? <img src={avatarUrl} alt={person?.name || personRole} /> : <span>{person?.name?.slice(0, 2) || 'PP'}</span>}
                        </div>
                        <div className="user-copy">
                          <span>{personRole}</span>
                          <strong>{person?.name || 'Unknown creator'}</strong>
                        </div>
                      </div>
                    </div>

                    <aside className="action-panel">
                      <div className="budget-section">
                        <span className="budget-label">Mission budget</span>
                        <CoinBadge amount={job.budget} size="lg" />
                      </div>

                      <div className="mj-actions">
                        {activeTab === 'received' && job.status === 'pending' && (
                          <>
                            <motion.button
                              type="button"
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleUpdateStatus(job._id, 'accepted')}
                              className="btn-primary"
                            >
                              <FiCheckCircle size={19} /> Accept project
                            </motion.button>
                            <motion.button
                              type="button"
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleUpdateStatus(job._id, 'cancelled')}
                              className="btn-secondary is-danger"
                            >
                              Reject request
                            </motion.button>
                          </>
                        )}

                        {job.status === 'accepted' && activeTab === 'received' && (
                          <div className="job-action-note">
                            <strong>Mission in progress</strong>
                            <span>Keep updating milestones</span>
                          </div>
                        )}

                        {job.status === 'accepted' && activeTab === 'sent' && (
                          <motion.button
                            type="button"
                            whileTap={{ scale: 0.98 }}
                            className="btn-primary"
                            onClick={async () => {
                              if (await customConfirm('Confirm the delivered work and release coins to the freelancer?')) {
                                handleUpdateStatus(job._id, 'completed');
                              }
                            }}
                          >
                            <FiCheckCircle size={19} />
                            {job.progressStage === 'SUBMITTED' ? 'Verify & pay' : 'Mark as completed'}
                          </motion.button>
                        )}

                        {job.status === 'completed' && (
                          <div className="status-completed-pill">
                            <FiCheckCircle size={20} /> Mission completed
                          </div>
                        )}
                      </div>
                    </aside>
                  </motion.article>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default ManageJobs;
