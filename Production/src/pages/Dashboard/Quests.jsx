import { customConfirm } from '../../utils/customConfirm';
import { toast as hotToast } from 'react-hot-toast';
import React, { useState, useContext, useEffect, useCallback } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiAlertCircle,
  FiCheck,
  FiCheckCircle,
  FiChevronDown,
  FiEdit,
  FiGift,
  FiImage,
  FiLink,
  FiPlus,
  FiRefreshCw,
  FiTarget,
  FiTrash2,
  FiUploadCloud,
  FiX,
  FiZap,
  FiClock,
} from 'react-icons/fi';
import { play8BitSuccess } from '../../utils/soundEffects';
import { questsAPI, questSubmissionsAPI, API } from '../../utils/api';
import CreateQuestModal from '../../components/CreateQuestModal';
import { CoinIcon } from '../../components/CoinIcon';
import PremiumLoader from '../../components/PremiumLoader';
import '../../css/Quests.css';

function useCountdown(expiresAt) {
  const calc = () => {
    if (!expiresAt) return null;
    const diff = new Date(expiresAt) - new Date();
    if (diff <= 0) return 'expired';
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m ${s}s`;
  };

  const [label, setLabel] = useState(calc);

  useEffect(() => {
    if (!expiresAt) return;
    const id = setInterval(() => setLabel(calc()), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return label;
}

function computeCompletion(taskType, liveData, questId) {
  switch (taskType) {
    case 'PROFILE_FULL':
      return {
        checklist: [
          { label: 'Add a profile bio', done: !!liveData.bio },
          { label: 'Upload a profile image', done: !!liveData.profileImageUrl },
          { label: 'Upload a cover image', done: !!liveData.coverImageUrl },
        ],
        isCompleted: !!(liveData.bio && liveData.profileImageUrl && liveData.coverImageUrl),
      };
    case 'POST_WORK':
      return {
        checklist: [{ label: `Upload at least 1 work item (${liveData.worksCount || 0} uploaded)`, done: liveData.worksCount > 0 }],
        isCompleted: liveData.worksCount > 0,
      };
    case 'DAILY_LOGIN':
      return {
        checklist: [{ label: 'Log in today', done: true }],
        isCompleted: true,
      };
    case 'PROOF_SUBMISSION': {
      const sub = liveData.submissions?.find((s) => s.questId === questId);
      const label = sub
        ? sub.status === 'PENDING'
          ? 'Proof is under review'
          : sub.status === 'REJECTED'
            ? 'Proof was rejected, submit again'
            : 'Proof approved'
        : 'Proof has not been submitted';

      return {
        checklist: [{ label, done: sub?.status === 'APPROVED' }],
        isCompleted: sub?.status === 'APPROVED',
        submissionStatus: sub?.status || null,
      };
    }
    default:
      return { checklist: [], isCompleted: true };
  }
}

function ProofModal({ isOpen, onClose, quest, onSuccess }) {
  const [proofUrl, setProofUrl] = useState('');
  const [proofImage, setProofImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !quest) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!proofUrl.trim() && !proofImage) {
      setError('Add a proof URL or upload a screenshot.');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('questId', quest._id);
      if (proofUrl.trim()) formData.append('proofUrl', proofUrl);
      if (proofImage) formData.append('image', proofImage);

      await questSubmissionsAPI.submit(formData);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to submit proof.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="quest-modal-layer">
      <motion.form
        onSubmit={handleSubmit}
        className="quest-proof-modal"
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
      >
        <button type="button" className="quest-modal-close" onClick={onClose} aria-label="Close proof modal">
          <FiX size={22} />
        </button>
        <div className="quest-panel-heading">
          <div className="quest-section-icon"><FiUploadCloud size={22} /></div>
          <div>
            <h2>Submit quest proof</h2>
            <p>{quest.title}</p>
          </div>
        </div>

        {error && <div className="quest-alert is-error"><FiAlertCircle size={17} /> {error}</div>}

        <label className="quest-field">
          <span>Proof URL</span>
          <input type="url" value={proofUrl} onChange={(e) => setProofUrl(e.target.value)} placeholder="https://..." />
        </label>

        <label className={`quest-upload ${proofImage ? 'has-file' : ''}`}>
          <input type="file" accept="image/*" hidden onChange={(e) => setProofImage(e.target.files[0])} />
          <FiImage size={28} />
          <strong>{proofImage ? proofImage.name : 'Upload screenshot'}</strong>
          <span>{proofImage ? 'Screenshot attached. Click to replace.' : 'Optional image proof for manual review.'}</span>
        </label>

        <button type="submit" className="quest-primary-btn" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit proof'}
        </button>
      </motion.form>
    </div>
  );
}

function AdminReviewQueue({ onUpdate }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState(null);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const data = await questSubmissionsAPI.getAll('PENDING');
      setSubmissions(data || []);
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
      hotToast.error(err.response?.data?.message || 'Error reviewing submission');
    } finally {
      setReviewingId(null);
    }
  };

  if ((loading && submissions.length === 0) || (!loading && submissions.length === 0)) return null;

  return (
    <section className="quest-review-panel">
      <div className="quest-section-title">
        <div className="quest-kicker"><FiAlertCircle size={15} /><span>Admin Review</span></div>
        <h2>Pending proof reviews</h2>
        <span>{submissions.length} pending</span>
      </div>
      <div className="quest-review-list">
        {submissions.map((sub) => {
          const isReviewing = reviewingId === sub._id;
          return (
            <article key={sub._id} className={`quest-review-row ${isReviewing ? 'is-loading' : ''}`}>
              <div className="quest-review-avatar">
                <img src={sub.userId?.profileImage?.url || 'https://via.placeholder.com/40'} alt={sub.userId?.username || 'Creator'} />
              </div>
              <div className="quest-review-copy">
                <strong>{sub.userId?.username || 'Unknown creator'}</strong>
                <span>{sub.questId?.title || 'Quest submission'}</span>
                <div className="quest-proof-links">
                  {sub.proofUrl && <a href={sub.proofUrl} target="_blank" rel="noopener noreferrer"><FiLink size={13} /> View link</a>}
                  {sub.proofImage && <a href={sub.proofImage} target="_blank" rel="noopener noreferrer"><FiImage size={13} /> View screenshot</a>}
                </div>
              </div>
              <div className="quest-review-actions">
                <button type="button" onClick={() => handleReview(sub._id, 'APPROVED')} disabled={isReviewing}>Approve</button>
                <button type="button" className="is-danger" onClick={() => handleReview(sub._id, 'REJECTED')} disabled={isReviewing}>Reject</button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Quests() {
  const { user, fetchProfile } = useContext(AuthContext);
  const userInfo = user || JSON.parse(window.safeStorage.getItem('userInfo') || '{}');
  const isAdmin = userInfo?.role === 'admin';

  const [quests, setQuests] = useState([]);
  const [liveData, setLiveData] = useState({ bio: '', profileImageUrl: '', coverImageUrl: '', worksCount: 0, claimedQuests: [], activeQuests: [], submissions: [] });
  const [loadingQuests, setLoadingQuests] = useState(true);
  const [loadingLive, setLoadingLive] = useState(true);
  const [claimingId, setClaimingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editQuest, setEditQuest] = useState(null);
  const [toast, setToast] = useState(null);
  const [showProofModal, setShowProofModal] = useState(false);
  const [activeProofQuest, setActiveProofQuest] = useState(null);

  const fetchLiveData = useCallback(async () => {
    try {
      setLoadingLive(true);
      const res = await API.get('/users/me/live-quest-data');
      setLiveData(res.data);
    } catch {
      setLiveData({
        bio: userInfo?.bio || '',
        profileImageUrl: userInfo?.profileImage?.url || '',
        coverImageUrl: userInfo?.coverImage?.url || '',
        worksCount: userInfo?.worksCount || 0,
        claimedQuests: userInfo?.claimedQuests || [],
        activeQuests: userInfo?.activeQuests || [],
        submissions: [],
      });
    } finally {
      setLoadingLive(false);
    }
  }, []);

  const fetchQuests = useCallback(async () => {
    try {
      setLoadingQuests(true);
      const data = await questsAPI.getActive();
      setQuests(data || []);
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

  const isQuestClaimed = (questId, taskType) => {
    const claimed = liveData.claimedQuests || [];
    if (!claimed.length) return false;
    if (taskType === 'DAILY_LOGIN') {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      return claimed.some((q) => q.questId === questId.toString() && new Date(q.claimedAt) >= todayStart);
    }
    return claimed.some((q) => q.questId === questId.toString());
  };

  const isQuestAccepted = (questId) => {
    const active = liveData.activeQuests || [];
    return active.some((q) => q.questId === questId.toString());
  };

  const getQuestDeadline = (questId) => {
    const active = liveData.activeQuests || [];
    const entry = active.find((q) => q.questId === questId.toString());
    return entry?.deadline;
  };

  const showToast = ({ type = 'success', title, text, rewards = [] }) => {
    setToast({ type, title, text, rewards });
    setTimeout(() => setToast(null), 3200);
  };

  const refreshAll = () => {
    fetchQuests();
    fetchLiveData();
  };

  const handleAccept = async (quest) => {
    setClaimingId(quest._id);
    try {
      await questsAPI.accept(quest._id);
      play8BitSuccess();
      showToast({
        type: 'success',
        title: 'Quest accepted',
        text: quest.title,
        rewards: [{ label: 'Now active', icon: <FiTarget size={14} /> }],
      });
      await fetchLiveData();
      if (fetchProfile) fetchProfile();
    } catch (err) {
      showToast({ type: 'error', title: 'Quest failed', text: err.response?.data?.message || 'Unable to accept quest.' });
    } finally {
      setClaimingId(null);
    }
  };

  const handleClaim = async (quest) => {
    if (quest.taskType === 'PROOF_SUBMISSION' && !quest.isCompleted) {
      const sub = liveData.submissions?.find((s) => s.questId === quest._id);
      if (!sub || sub.status === 'REJECTED') {
        setActiveProofQuest(quest);
        setShowProofModal(true);
      }
      return;
    }

    setClaimingId(quest._id);
    try {
      await questsAPI.claim(quest._id);
      play8BitSuccess();
      showToast({
        type: 'success',
        title: 'Reward claimed',
        text: quest.title,
        rewards: [
          ...(quest.coinReward > 0 ? [{ label: `+${quest.coinReward} Coins`, icon: <CoinIcon size={15} /> }] : []),
          ...(quest.xpReward > 0 ? [{ label: `+${quest.xpReward} XP`, icon: <FiZap size={14} /> }] : []),
        ],
      });
      await fetchLiveData();
      if (fetchProfile) fetchProfile();
    } catch (err) {
      showToast({ type: 'error', title: 'Claim failed', text: err.response?.data?.message || 'Unable to claim reward.' });
    } finally {
      setClaimingId(null);
    }
  };

  const handleDelete = async (questId) => {
    if (!await customConfirm('Delete this quest?')) return;
    try {
      await questsAPI.delete(questId);
      fetchQuests();
      showToast({ type: 'success', title: 'Quest deleted', text: 'The quest was removed from the board.' });
    } catch (err) {
      showToast({ type: 'error', title: 'Delete failed', text: err.response?.data?.message || 'Unable to delete quest.' });
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

  const handleAdminQueueUpdate = () => {
    fetchLiveData();
    fetchQuests();
  };

  const enrichedQuests = quests.map((q) => {
    const completion = computeCompletion(q.taskType, liveData, q._id);
    const isClaimed = isQuestClaimed(q._id, q.taskType);
    const isAccepted = isQuestAccepted(q._id);
    const deadline = getQuestDeadline(q._id);
    return { ...q, ...completion, isClaimed, isAccepted, deadline };
  });

  const now = new Date();
  const activeQuests = enrichedQuests.filter((q) => !q.expiresAt || new Date(q.expiresAt) > now);
  const coinQuests = activeQuests.filter((q) => q.coinReward > 0);
  const xpQuests = activeQuests.filter((q) => q.xpReward > 0);
  const loading = loadingQuests || loadingLive;
  const completedCount = activeQuests.filter((q) => q.isClaimed).length;
  const readyCount = activeQuests.filter((q) => q.isCompleted && !q.isClaimed).length;

  return (
    <main className="quests-page">
      <header className="quests-hero">
        <div className="quests-hero-copy">
          <div className="quest-kicker"><FiTarget size={16} /><span>Quest Board</span></div>
          <h1>Daily Quests</h1>
          <p>Complete creator tasks, submit proof when needed, and claim coin or XP rewards from one focused quest board.</p>
        </div>
        <div className="quests-hero-actions">
          <button type="button" className="quest-secondary-btn" onClick={refreshAll}><FiRefreshCw size={16} /> Refresh</button>
          {isAdmin && (
            <button type="button" className="quest-primary-btn" onClick={() => { setEditQuest(null); setShowModal(true); }}>
              <FiPlus size={17} /> New Quest
            </button>
          )}
        </div>
      </header>

      <section className="quests-stats-grid" aria-label="Quest summary">
        <div className="quest-stat-card"><span>Available</span><strong>{activeQuests.length}</strong></div>
        <div className="quest-stat-card"><span>Ready to claim</span><strong>{readyCount}</strong></div>
        <div className="quest-stat-card"><span>Completed</span><strong>{completedCount}</strong></div>
      </section>

      {isAdmin && <AdminReviewQueue onUpdate={handleAdminQueueUpdate} />}

      <AnimatePresence>
        {toast && (
          <motion.div
            className={`quest-toast is-${toast.type}`}
            initial={{ opacity: 0, x: 24, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 24, y: 8, scale: 0.96 }}
          >
            <div className="quest-toast-icon">
              {toast.type === 'success' ? <FiCheckCircle size={18} /> : <FiAlertCircle size={18} />}
            </div>
            <div className="quest-toast-copy">
              <strong>{toast.title}</strong>
              {toast.text && <span>{toast.text}</span>}
              {toast.rewards?.length > 0 && (
                <div className="quest-toast-rewards">
                  {toast.rewards.map((reward, index) => (
                    <em key={`${reward.label}-${index}`}>{reward.icon}{reward.label}</em>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="quests-loader">
          <PremiumLoader bare size="small" />
          <p>Loading quests...</p>
        </div>
      ) : (
        <div className="quests-stack">
          {coinQuests.length > 0 && (
            <QuestSection title="Coin Quests" icon={<CoinIcon size={20} />} tone="coin">
              {coinQuests.map((quest, index) => (
                <QuestCard key={quest._id} quest={quest} index={index} isAdmin={isAdmin} claimingId={claimingId} onClaim={handleClaim} onAccept={handleAccept} onEdit={handleEdit} onDelete={handleDelete} />
              ))}
            </QuestSection>
          )}

          {xpQuests.length > 0 && (
            <QuestSection title="Experience Quests" icon={<FiZap size={18} />} tone="xp">
              {xpQuests.map((quest, index) => (
                <QuestCard key={quest._id} quest={quest} index={index} isAdmin={isAdmin} claimingId={claimingId} onClaim={handleClaim} onAccept={handleAccept} onEdit={handleEdit} onDelete={handleDelete} />
              ))}
            </QuestSection>
          )}

          {coinQuests.length === 0 && xpQuests.length === 0 && (
            <div className="quests-empty">
              <FiTarget size={34} />
              <h2>No quests available</h2>
              <p>{isAdmin ? 'Create the first quest to populate the board.' : 'Check back later for new creator quests.'}</p>
            </div>
          )}
        </div>
      )}

      <CreateQuestModal isOpen={showModal} onClose={() => { setShowModal(false); setEditQuest(null); }} onSuccess={handleModalSuccess} isAdmin={isAdmin} editData={editQuest} />

      <AnimatePresence>
        {showProofModal && (
          <ProofModal
            isOpen={showProofModal}
            onClose={() => { setShowProofModal(false); setActiveProofQuest(null); }}
            quest={activeProofQuest}
            onSuccess={() => {
              showToast({
                type: 'success',
                title: 'Proof submitted',
                text: 'Waiting for admin review.',
                rewards: [{ label: 'Pending review', icon: <FiClock size={14} /> }],
              });
              fetchLiveData();
            }}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

function QuestSection({ title, icon, tone, children, defaultOpen = true }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className={`quest-section is-${tone}`}>
      <button type="button" className="quest-section-header" onClick={() => setIsOpen(!isOpen)}>
        <span className="quest-section-icon-small">{icon}</span>
        <strong>{title}</strong>
        <em>{React.Children.count(children)} quests</em>
        <motion.span animate={{ rotate: isOpen ? 180 : 0 }}><FiChevronDown size={19} /></motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div className="quest-section-list" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function QuestCard({ quest, index, isAdmin, claimingId, onClaim, onAccept, onEdit, onDelete }) {
  const isClaiming = claimingId === quest._id;
  const rewardTone = quest.coinReward > 0 ? 'coin' : 'xp';
  const expiryCountdown = useCountdown(quest.expiresAt);
  const deadlineCountdown = useCountdown(quest.deadline);
  const isExpiringSoon = quest.expiresAt && (new Date(quest.expiresAt) - new Date()) < 3600000;
  const isDeadlineSoon = quest.deadline && (new Date(quest.deadline) - new Date()) < 3600000;
  const requiresAcceptance = quest.maxParticipants > 0 || quest.durationDays > 0;
  const slotsLeft = quest.maxParticipants > 0 ? quest.maxParticipants - quest.participantCount : null;

  let buttonText = 'Claim Reward';
  if (quest.isClaimed) buttonText = 'Claimed';
  else if (!quest.isAccepted && requiresAcceptance) buttonText = 'Accept Quest';
  else if (quest.taskType === 'PROOF_SUBMISSION' && !quest.isCompleted) buttonText = quest.submissionStatus === 'PENDING' ? 'Pending Review' : 'Submit Proof';

  return (
    <motion.article
      className={`quest-card is-${rewardTone} ${quest.isClaimed ? 'is-claimed' : ''} ${quest.isAccepted ? 'is-accepted' : ''}`}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.035, duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="quest-card-icon"><FiGift size={22} /></div>

      <div className="quest-card-copy">
        <div className="quest-card-title-row">
          <h3>{quest.title}</h3>
          {quest.requiredRank && quest.requiredRank !== 'All' && <span>{quest.requiredRank}+</span>}
          {quest.isAccepted && !quest.isClaimed && <span className="is-active">Accepted</span>}
          {quest.isClaimed && <span>Claimed</span>}
        </div>

        <div className="quest-card-meta">
          {slotsLeft !== null && !quest.isClaimed && !quest.isAccepted && <span className={slotsLeft <= 3 ? 'is-danger' : ''}>{slotsLeft} slots left</span>}
          {expiryCountdown && expiryCountdown !== 'expired' && !quest.isAccepted && !quest.isClaimed && <span className={isExpiringSoon ? 'is-danger' : ''}><FiClock size={12} /> Expires in {expiryCountdown}</span>}
          {deadlineCountdown && deadlineCountdown !== 'expired' && quest.isAccepted && !quest.isClaimed && <span className={isDeadlineSoon ? 'is-danger' : 'is-warning'}><FiClock size={12} /> Due in {deadlineCountdown}</span>}
        </div>

        {quest.description && <p>{quest.description}</p>}

        {(quest.isAccepted || !requiresAcceptance) && quest.checklist?.length > 0 && (
          <div className="quest-checklist">
            {quest.checklist.map((item, idx) => (
              <div key={`${quest._id}-${idx}`} className={item.done ? 'is-done' : ''}>
                <i>{item.done && <FiCheck size={11} />}</i>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <aside className="quest-card-side">
        <div className="quest-rewards">
          {quest.coinReward > 0 && <strong className="is-coin">+{quest.coinReward} <CoinIcon size={20} /></strong>}
          {quest.xpReward > 0 && <strong className="is-xp">+{quest.xpReward} <FiZap size={16} /></strong>}
        </div>

        {isAdmin ? (
          <div className="quest-admin-actions">
            <span>Admin view</span>
            <div>
              <button type="button" onClick={() => onEdit(quest)} title="Edit"><FiEdit size={14} /></button>
              <button type="button" onClick={() => onDelete(quest._id)} title="Delete" className="is-danger"><FiTrash2 size={14} /></button>
            </div>
          </div>
        ) : quest.isClaimed ? (
          <button type="button" className="quest-action-btn is-disabled" disabled><FiCheckCircle size={14} /> Claimed</button>
        ) : (!quest.isAccepted && requiresAcceptance) ? (
          <button type="button" className="quest-action-btn" onClick={() => onAccept(quest)} disabled={isClaiming || (slotsLeft !== null && slotsLeft <= 0)}>
            {isClaiming ? 'Please wait...' : 'Accept Quest'}
          </button>
        ) : (quest.isCompleted || (quest.taskType === 'PROOF_SUBMISSION' && quest.submissionStatus !== 'PENDING')) ? (
          <button type="button" className="quest-action-btn" onClick={() => onClaim(quest)} disabled={isClaiming || quest.submissionStatus === 'PENDING'}>
            {isClaiming ? 'Please wait...' : buttonText}
          </button>
        ) : quest.submissionStatus === 'PENDING' ? (
          <button type="button" className="quest-action-btn is-disabled" disabled>Pending Review</button>
        ) : (
          <button type="button" className="quest-action-btn is-disabled" disabled>Incomplete</button>
        )}
      </aside>
    </motion.article>
  );
}

export default Quests;
