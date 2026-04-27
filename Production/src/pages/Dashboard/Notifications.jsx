import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { notificationsAPI } from '../../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { getFullUrl } from '../../utils/mediaUtils';
import {
  FiBell, FiBriefcase, FiDollarSign, FiInfo, FiCheck, FiTrash2,
  FiCheckCircle, FiZap, FiMessageCircle, FiMessageSquare, FiCalendar
} from 'react-icons/fi';
import '../../css/Notifications.css';

const TABS = [
  { key: 'all', label: 'ทั้งหมด', icon: <FiBell /> },
  { key: 'job', label: 'งาน', icon: <FiBriefcase /> },
  { key: 'payment', label: 'การเงิน', icon: <FiDollarSign /> },
  { key: 'system', label: 'ระบบ', icon: <FiInfo /> },
];

const TYPE_MAP = {
  job: { color: '#6366f1', bg: 'rgba(99,102,241,0.08)', icon: <FiBriefcase size={16} /> },
  payment: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', icon: <FiDollarSign size={16} /> },
  system: { color: '#22c55e', bg: 'rgba(34,197,94,0.08)', icon: <FiInfo size={16} /> },
  friend: { color: '#ec4899', bg: 'rgba(236,72,153,0.08)', icon: <FiZap size={16} /> },
  message: { color: '#22c55e', bg: 'rgba(34,197,94,0.08)', icon: <FiMessageCircle size={16} /> },
  messenger: { color: '#22c55e', bg: 'rgba(34,197,94,0.08)', icon: <FiMessageCircle size={16} /> },
  comment: { color: '#22c55e', bg: 'rgba(34,197,94,0.08)', icon: <FiMessageSquare size={16} /> },
  reply: { color: '#22c55e', bg: 'rgba(34,197,94,0.08)', icon: <FiMessageSquare size={16} /> },
};

function Notifications() {
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  const currentToken = token || localStorage.getItem('userToken') || localStorage.getItem('token');

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  const fetchNotifications = async () => {
    if (!currentToken) return;
    try {
      setLoading(true);
      const data = await notificationsAPI.getMine();
      setNotifications(data);
    } catch (err) {
      console.error('Fetch notifications error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, [currentToken]);

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) { console.error(err); }
  };

  const handleMarkOne = async (e, id) => {
    e.stopPropagation();
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('ลบการแจ้งเตือนนี้?')) return;
    try {
      await notificationsAPI.delete(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (err) { console.error(err); }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('คุณต้องการลบการแจ้งเตือนทั้งหมดใช่หรือไม่?')) return;
    try {
      await notificationsAPI.deleteAll();
      setNotifications([]);
    } catch (err) { console.error(err); }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      try { await notificationsAPI.markAsRead(notif._id); } catch(e){}
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
    : notifications.filter(n => n.type === activeTab);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="notifications-container">
      {/* Header */}
      <header className="nt-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
            <FiZap color="var(--nt-accent)" size={18} />
            <span style={{ color: 'var(--nt-accent)', fontSize: '1rem', fontWeight: '900', letterSpacing: '2px' }}>Notifications Center</span>
          </div>
          <h1 className="nt-main-title">ศูนย์แจ้งเตือน</h1>
          <p style={{ color: '#444', marginTop: '20px', fontWeight: '700', fontSize: '1rem' }}>
            {unreadCount > 0 ? `มี ${unreadCount} รายการใหม่ที่กำลังรอคุณอยู่` : 'คุณจัดการข้อมูลทั้งหมดเรียบร้อยแล้ว'}
          </p>
        </div>

        <div className="nt-action-group">
          {unreadCount > 0 && (
            <motion.button whileHover={{ scale: 1.05 }} onClick={handleMarkAllRead} className="btn-header btn-read-all">
              <FiCheckCircle /> Read All
            </motion.button>
          )}
          {notifications.length > 0 && (
            <motion.button whileHover={{ scale: 1.05 }} onClick={handleDeleteAll} className="btn-header btn-delete-all">
              <FiTrash2 /> Clear All
            </motion.button>
          )}
        </div>
      </header>

      {/* Tabs */}
      <div className="nt-tabs">
        {TABS.map(tab => {
          const count = tab.key === 'all'
            ? notifications.length
            : notifications.filter(n => n.type === tab.key).length;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`nt-tab-btn ${isActive ? 'active' : ''}`}
            >
              {tab.icon} {tab.label}
              {count > 0 && <span className="nt-badge">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px' }}>
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}
            style={{ width: '50px', height: '50px', border: '3px solid var(--nt-accent)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 30px' }} />
          <p style={{ color: '#333', fontWeight: '800', letterSpacing: '5px', fontSize: '0.8rem' }}>FETCHING DATA...</p>
        </div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '120px 40px', background: 'rgba(255,255,255,0.01)', borderRadius: '50px', border: '1px dashed rgba(255,255,255,0.05)' }}>
          <FiBell size={60} color="#111" style={{ marginBottom: '30px' }} />
          <h3 style={{ margin: 0, fontSize: '2rem', fontWeight: '900', letterSpacing: '-1px' }}>SILENCE</h3>
          <p style={{ color: '#444', marginTop: '15px', fontWeight: '700' }}>ยังไม่มีรายการแจ้งเตือนในขณะนี้</p>
        </motion.div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <AnimatePresence>
            {filtered.map((notif) => {
              const typeStyle = TYPE_MAP[notif.type] || TYPE_MAP['system'];
              return (
                <motion.div
                  key={notif._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50, scale: 0.9 }}
                  className={`nt-card ${!notif.isRead ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notif)}
                >
                  {!notif.isRead && <div className="unread-indicator" />}

                  <div className="nt-media">
                    {notif.sender?.profileImage?.url ? (
                      <img src={getFullUrl(notif.sender.profileImage.url)} className="nt-avatar" alt="" />
                    ) : (
                      <div style={{ color: typeStyle.color }}>{typeStyle.icon}</div>
                    )}
                  </div>

                  <div className="nt-body">
                    <p className="nt-text">{notif.text}</p>
                    <div className="nt-meta">
                      <span className="nt-time">
                        <FiCalendar size={12} style={{ marginRight: '5px' }} />
                        {new Date(notif.createdAt).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                      <span className="nt-type-tag" style={{ background: typeStyle.bg, color: typeStyle.color }}>
                        {notif.type?.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="nt-actions">
                    {!notif.isRead && (
                      <button className="nt-btn nt-btn-check" onClick={(e) => handleMarkOne(e, notif._id)} title="Read">
                        <FiCheck />
                      </button>
                    )}
                    <button className="nt-btn nt-btn-delete" onClick={(e) => handleDelete(e, notif._id)} title="Delete">
                      <FiTrash2 />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}

export default Notifications;
