import { customConfirm } from '../../utils/customConfirm';
import { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { notificationsAPI } from '../../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { getFullUrl } from '../../utils/mediaUtils';
import {
  FiBell,
  FiBriefcase,
  FiCheck,
  FiCheckCircle,
  FiDollarSign,
  FiInfo,
  FiMessageCircle,
  FiMessageSquare,
  FiTrash2,
  FiUsers,
  FiZap,
} from 'react-icons/fi';
import PremiumLoader from '../../components/PremiumLoader';
import '../../css/Notifications.css';

const TABS = [
  { key: 'all', label: 'All', icon: <FiBell /> },
  { key: 'job', label: 'Jobs', icon: <FiBriefcase /> },
  { key: 'payment', label: 'Payments', icon: <FiDollarSign /> },
  { key: 'system', label: 'System', icon: <FiInfo /> },
];

const TYPE_MAP = {
  job: { label: 'Job', tone: 'is-blue', icon: <FiBriefcase size={16} /> },
  payment: { label: 'Payment', tone: 'is-coin', icon: <FiDollarSign size={16} /> },
  wallet: { label: 'Wallet', tone: 'is-coin', icon: <FiDollarSign size={16} /> },
  system: { label: 'System', tone: 'is-green', icon: <FiInfo size={16} /> },
  friend: { label: 'Friend', tone: 'is-pink', icon: <FiUsers size={16} /> },
  message: { label: 'Message', tone: 'is-green', icon: <FiMessageCircle size={16} /> },
  messenger: { label: 'Message', tone: 'is-green', icon: <FiMessageCircle size={16} /> },
  comment: { label: 'Comment', tone: 'is-orange', icon: <FiMessageSquare size={16} /> },
  reply: { label: 'Reply', tone: 'is-orange', icon: <FiMessageSquare size={16} /> },
};

function getNotificationType(type) {
  const key = type?.toLowerCase?.() || 'system';
  return TYPE_MAP[key] || TYPE_MAP.system;
}

function formatTime(dateValue) {
  if (!dateValue) return 'Unknown time';
  return new Date(dateValue).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function Notifications() {
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  const { socket } = useSocket();
  const currentToken = token || window.safeStorage.getItem('userToken') || window.safeStorage.getItem('token');

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [newCount, setNewCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!currentToken) return;
    try {
      setLoading(true);
      const data = await notificationsAPI.getMine();
      setNotifications(data || []);
    } catch (err) {
      console.error('Fetch notifications error:', err);
    } finally {
      setLoading(false);
    }
  }, [currentToken]);

  useEffect(() => {
    if (!socket) return;
    const handleNew = (newNote) => {
      setNotifications((prev) => {
        if (prev.some((note) => note._id === newNote._id)) return prev;
        return [newNote, ...prev];
      });
      setNewCount((count) => count + 1);
    };
    socket.on('new_notification', handleNew);
    return () => socket.off('new_notification', handleNew);
  }, [socket]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications((prev) => prev.map((note) => ({ ...note, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkOne = async (e, id) => {
    e.stopPropagation();
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications((prev) => prev.map((note) => (note._id === id ? { ...note, isRead: true } : note)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!await customConfirm('Delete this notification?')) return;
    try {
      await notificationsAPI.delete(id);
      setNotifications((prev) => prev.filter((note) => note._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAll = async () => {
    if (!await customConfirm('Delete all notifications?')) return;
    try {
      await notificationsAPI.deleteAll();
      setNotifications([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      try {
        await notificationsAPI.markAsRead(notif._id);
        setNotifications((prev) => prev.map((note) => (note._id === notif._id ? { ...note, isRead: true } : note)));
      } catch (err) {
        console.error(err);
      }
    }

    const type = notif.type?.toLowerCase() || '';
    if (type.includes('message') || type.includes('messenger')) {
      const convId = notif.relatedId || (notif.link && notif.link.includes('messenger/') ? notif.link.split('/').pop() : null);
      navigate(convId ? `/messenger/${convId}` : '/messenger');
    } else if (type.includes('job')) {
      navigate('/dashboard/hiring');
    } else if (type.includes('comment') || type.includes('reply')) {
      if (notif.link) navigate(notif.link);
      else if (notif.relatedId) navigate(`/works/${notif.relatedId}`);
      else navigate('/works');
    } else if (type.includes('friend')) {
      navigate('/friends');
    } else if (type.includes('payment') || type.includes('wallet')) {
      navigate('/dashboard/wallet');
    }
  };

  const filtered = activeTab === 'all'
    ? notifications
    : notifications.filter((note) => note.type?.toLowerCase() === activeTab);

  const unreadCount = notifications.filter((note) => !note.isRead).length;
  const readCount = notifications.length - unreadCount;

  return (
    <motion.main initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="notifications-container">
      <header className="nt-header">
        <div className="nt-title-group">
          <div className="nt-kicker"><FiZap size={16} /><span>Signal Center</span></div>
          <h1>Notifications</h1>
          <p>{unreadCount > 0 ? `${unreadCount} unread updates need your attention.` : 'All updates are read. Your creator hub is clear.'}</p>
        </div>

        <div className="nt-action-group">
          {unreadCount > 0 && (
            <button type="button" onClick={handleMarkAllRead} className="nt-primary-btn">
              <FiCheckCircle size={16} /> Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button type="button" onClick={handleDeleteAll} className="nt-secondary-btn is-danger">
              <FiTrash2 size={16} /> Clear all
            </button>
          )}
        </div>
      </header>

      <section className="nt-stats-grid" aria-label="Notification summary">
        <div className="nt-stat-card"><span>Total</span><strong>{notifications.length}</strong></div>
        <div className="nt-stat-card is-orange"><span>Unread</span><strong>{unreadCount}</strong></div>
        <div className="nt-stat-card is-green"><span>Read</span><strong>{readCount}</strong></div>
        <div className="nt-stat-card is-blue"><span>Live signals</span><strong>{newCount}</strong></div>
      </section>

      <section className="nt-board">
        <div className="nt-board-header">
          <div>
            <div className="nt-kicker"><FiBell size={15} /><span>Inbox Board</span></div>
            <h2>Activity feed</h2>
          </div>
          <span>{filtered.length} showing</span>
        </div>

        <div className="nt-tabs" role="tablist" aria-label="Notification filters">
          {TABS.map((tab) => {
            const count = tab.key === 'all'
              ? notifications.length
              : notifications.filter((note) => note.type?.toLowerCase() === tab.key).length;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`nt-tab-btn ${isActive ? 'active' : ''}`}
              >
                {tab.icon}<span>{tab.label}</span>
                {count > 0 && <strong>{count}</strong>}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="nt-loader">
            <PremiumLoader bare size="small" />
            <p>Fetching notifications...</p>
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="nt-empty-state">
            <FiBell size={34} />
            <h2>No notifications here</h2>
            <p>This filter is clear. New updates will appear here when clients, jobs, payments, or system events arrive.</p>
          </motion.div>
        ) : (
          <div className="nt-list">
            <AnimatePresence>
              {filtered.map((notif, index) => {
                const typeStyle = getNotificationType(notif.type);
                return (
                  <motion.article
                    key={notif._id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 24, scale: 0.96 }}
                    transition={{ delay: index * 0.025, duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className={`nt-card ${!notif.isRead ? 'unread' : ''}`}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <div className={`nt-media ${typeStyle.tone}`}>
                      {notif.sender?.profileImage?.url ? (
                        <img src={getFullUrl(notif.sender.profileImage.url)} className="nt-avatar" alt={notif.sender?.username || 'Sender'} />
                      ) : (
                        typeStyle.icon
                      )}
                    </div>

                    <div className="nt-body">
                      <div className="nt-card-top">
                        <span className={`nt-type-tag ${typeStyle.tone}`}>{typeStyle.label}</span>
                        {!notif.isRead && <em>New</em>}
                      </div>
                      <p className="nt-text">{notif.text || 'You have a new update.'}</p>
                      <span className="nt-time">{formatTime(notif.createdAt)}</span>
                    </div>

                    <div className="nt-actions">
                      {!notif.isRead && (
                        <button type="button" className="nt-btn nt-btn-check" onClick={(e) => handleMarkOne(e, notif._id)} title="Mark as read">
                          <FiCheck size={15} />
                        </button>
                      )}
                      <button type="button" className="nt-btn nt-btn-delete" onClick={(e) => handleDelete(e, notif._id)} title="Delete">
                        <FiTrash2 size={15} />
                      </button>
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </section>
    </motion.main>
  );
}

export default Notifications;
